import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { Button } from '../../components/ui';
import { getProjectProgress } from '../../types/project';

/**
 * v1.1 AdminDashboard - 향상된 관리자 대시보드
 * 
 * 주요 기능:
 * - 시스템 전체 현황 모니터링
 * - 사용자 활동 분석
 * - 프로젝트 성과 지표
 * - 보안 상태 모니터링
 * - 시스템 설정 관리
 * - 실시간 알림 및 경고
 * - 데이터 백업 및 관리
 * - 감사 로그 분석
 */
const AdminDashboard_v11 = () => {
  console.log('👑 [v1.1] AdminDashboard rendering');

  const { user, hasPermission, PERMISSIONS } = useAuth();
  const { state } = useProjectStore();
  const { projects = [], completedProjects = [] } = state;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'projects', 'security', 'system'
  const [timeRange, setTimeRange] = useState('7d'); // '1d', '7d', '30d', '90d'
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30초
  const [alerts, setAlerts] = useState([]);

  // 권한 확인
  if (!hasPermission(PERMISSIONS.ADMIN_ACCESS)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자 권한이 필요한 페이지입니다.</p>
        </div>
      </div>
    );
  }

  // 사용자 통계 계산
  const userStats = useMemo(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const now = new Date();
    const timeRangeMs = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[timeRange];

    const cutoffDate = new Date(now.getTime() - timeRangeMs);

    const stats = {
      total: users.length,
      active: 0,
      pending: 0,
      locked: 0,
      recentLogins: 0,
      newRegistrations: 0,
      byRole: { admin: 0, manager: 0, user: 0, viewer: 0 },
      byDepartment: {},
      avgSessionTime: 0
    };

    users.forEach(user => {
      // 상태별 통계
      if (user.status === 'approved') stats.active++;
      if (user.status === 'pending') stats.pending++;
      if (user.isLocked) stats.locked++;

      // 역할별 통계
      stats.byRole[user.role || 'user']++;

      // 부서별 통계
      const dept = user.department || '미분류';
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;

      // 기간별 활동
      if (user.lastLogin && new Date(user.lastLogin) > cutoffDate) {
        stats.recentLogins++;
      }

      if (user.createdAt && new Date(user.createdAt) > cutoffDate) {
        stats.newRegistrations++;
      }
    });

    return stats;
  }, [timeRange]);

  // 프로젝트 통계 계산
  const projectStats = useMemo(() => {
    const allProjects = [...projects, ...completedProjects];
    const now = new Date();
    const timeRangeMs = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[timeRange];

    const cutoffDate = new Date(now.getTime() - timeRangeMs);

    const stats = {
      total: allProjects.length,
      active: projects.length,
      completed: completedProjects.length,
      recentlyCreated: 0,
      recentlyCompleted: 0,
      overdue: 0,
      highProgress: 0,
      averageProgress: 0,
      byStage: { stage1: 0, stage2: 0, stage3: 0 },
      byManufacturer: {},
      completionRate: 0
    };

    let totalProgress = 0;

    allProjects.forEach(project => {
      const progress = getProjectProgress(project);
      totalProgress += progress;

      // 고진행률 프로젝트 (80% 이상)
      if (progress >= 80) stats.highProgress++;

      // 단계별 분류
      if (progress === 100) {
        stats.byStage.stage3++;
      } else if (progress >= 67) {
        stats.byStage.stage2++;
      } else {
        stats.byStage.stage1++;
      }

      // 제조사별 통계
      const manufacturer = project.stage1?.manufacturer || '미분류';
      stats.byManufacturer[manufacturer] = (stats.byManufacturer[manufacturer] || 0) + 1;

      // 기간별 활동
      if (project.createdAt && new Date(project.createdAt) > cutoffDate) {
        stats.recentlyCreated++;
      }

      if (project.completedAt && new Date(project.completedAt) > cutoffDate) {
        stats.recentlyCompleted++;
      }

      // 지연된 프로젝트 (양산예정일 기준)
      if (!project.completed && project.stage1?.massProductionDate) {
        const dueDate = new Date(project.stage1.massProductionDate);
        if (dueDate < now && !project.stage1.massProductionDateExecuted) {
          stats.overdue++;
        }
      }
    });

    stats.averageProgress = allProjects.length > 0 ? Math.round(totalProgress / allProjects.length) : 0;
    stats.completionRate = allProjects.length > 0 ? Math.round((completedProjects.length / allProjects.length) * 100) : 0;

    return stats;
  }, [projects, completedProjects, timeRange]);

  // 시스템 상태 모니터링
  const systemStats = useMemo(() => {
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentLogs = activityLogs.filter(log => 
      new Date(log.timestamp) > new Date(now.getTime() - oneHour)
    );

    const todayLogs = activityLogs.filter(log => 
      new Date(log.timestamp) > new Date(now.getTime() - oneDay)
    );

    const errorLogs = todayLogs.filter(log => 
      log.severity === 'HIGH' || log.action.includes('ERROR')
    );

    const stats = {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      totalProjects: projectStats.total,
      recentActivity: recentLogs.length,
      todayActivity: todayLogs.length,
      errorCount: errorLogs.length,
      storageUsed: calculateStorageUsage(),
      uptime: calculateUptime(),
      performance: {
        avgResponseTime: Math.random() * 200 + 50, // Mock 데이터
        memoryUsage: Math.random() * 30 + 20,
        cpuUsage: Math.random() * 40 + 10
      }
    };

    return stats;
  }, [userStats, projectStats]);

  // 저장소 사용량 계산
  const calculateStorageUsage = () => {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      return Math.round(totalSize / 1024); // KB 단위
    } catch (error) {
      return 0;
    }
  };

  // 시스템 가동시간 계산 (세션 기반 Mock)
  const calculateUptime = () => {
    const startTime = sessionStorage.getItem('systemStartTime');
    if (!startTime) {
      sessionStorage.setItem('systemStartTime', Date.now().toString());
      return '0시간 0분';
    }
    
    const elapsed = Date.now() - parseInt(startTime);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}시간 ${minutes}분`;
  };

  // 시스템 알림 생성
  const generateAlerts = useCallback(() => {
    const newAlerts = [];

    // 보안 알림
    if (userStats.pending > 5) {
      newAlerts.push({
        id: 'pending-users',
        type: 'warning',
        title: '승인 대기 사용자',
        message: `${userStats.pending}명의 사용자가 승인을 대기하고 있습니다.`,
        action: () => setActiveTab('users')
      });
    }

    if (userStats.locked > 0) {
      newAlerts.push({
        id: 'locked-users',
        type: 'error',
        title: '잠긴 계정',
        message: `${userStats.locked}개의 계정이 잠겨있습니다.`,
        action: () => setActiveTab('users')
      });
    }

    // 프로젝트 알림
    if (projectStats.overdue > 0) {
      newAlerts.push({
        id: 'overdue-projects',
        type: 'warning',
        title: '지연된 프로젝트',
        message: `${projectStats.overdue}개의 프로젝트가 일정을 초과했습니다.`,
        action: () => setActiveTab('projects')
      });
    }

    // 시스템 알림
    if (systemStats.errorCount > 10) {
      newAlerts.push({
        id: 'system-errors',
        type: 'error',
        title: '시스템 오류',
        message: `오늘 ${systemStats.errorCount}개의 오류가 발생했습니다.`,
        action: () => setActiveTab('system')
      });
    }

    if (systemStats.storageUsed > 5000) { // 5MB 이상
      newAlerts.push({
        id: 'storage-warning',
        type: 'info',
        title: '저장소 사용량',
        message: `로컬 저장소 사용량이 ${systemStats.storageUsed}KB입니다.`,
        action: () => setActiveTab('system')
      });
    }

    setAlerts(newAlerts);
  }, [userStats, projectStats, systemStats]);

  // 실시간 업데이트
  useEffect(() => {
    generateAlerts();
    
    const interval = setInterval(() => {
      generateAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [generateAlerts, refreshInterval]);

  // 데이터 백업
  const createBackup = useCallback(() => {
    const backupData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      users: JSON.parse(localStorage.getItem('users') || '[]'),
      projects: JSON.parse(localStorage.getItem('projects') || '[]'),
      completedProjects: JSON.parse(localStorage.getItem('completedProjects') || '[]'),
      opinions: JSON.parse(localStorage.getItem('opinions') || '[]'),
      activityLogs: JSON.parse(localStorage.getItem('activityLogs') || '[]')
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }, []);

  // 시스템 정리
  const cleanupSystem = useCallback(() => {
    if (window.confirm('시스템 정리를 수행하시겠습니까? 오래된 로그와 임시 데이터가 삭제됩니다.')) {
      // 30일 이상 된 활동 로그 삭제
      const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const filteredLogs = activityLogs.filter(log => 
        new Date(log.timestamp) > thirtyDaysAgo
      );
      localStorage.setItem('activityLogs', JSON.stringify(filteredLogs));

      // 세션 저장소 정리
      sessionStorage.clear();
      sessionStorage.setItem('systemStartTime', Date.now().toString());

      alert('시스템 정리가 완료되었습니다.');
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-600 mt-1">시스템 전체 현황 및 관리</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1d">최근 1일</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
          </select>
          
          <Button variant="outline" onClick={createBackup}>
            💾 시스템 백업
          </Button>
          
          <Button variant="outline" onClick={cleanupSystem}>
            🧹 시스템 정리
          </Button>
        </div>
      </div>

      {/* 알림 영역 */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition-colors ${
                alert.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                'bg-blue-50 border-blue-400 text-blue-700'
              }`}
              onClick={alert.action}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm">{alert.message}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlerts(alerts.filter(a => a.id !== alert.id));
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 사용자</p>
              <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
              <p className="text-xs text-gray-500">활성: {userStats.active}명</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 프로젝트</p>
              <p className="text-3xl font-bold text-green-600">{projectStats.total}</p>
              <p className="text-xs text-gray-500">완료율: {projectStats.completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">오늘 활동</p>
              <p className="text-3xl font-bold text-purple-600">{systemStats.todayActivity}</p>
              <p className="text-xs text-gray-500">최근 1시간: {systemStats.recentActivity}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">시스템 가동시간</p>
              <p className="text-lg font-bold text-orange-600">{systemStats.uptime}</p>
              <p className="text-xs text-gray-500">저장소: {systemStats.storageUsed}KB</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🖥️</span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: '전체 현황', icon: '📈' },
              { id: 'users', name: '사용자 관리', icon: '👥' },
              { id: 'projects', name: '프로젝트 현황', icon: '📊' },
              { id: 'security', name: '보안 현황', icon: '🔒' },
              { id: 'system', name: '시스템 관리', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 내용 */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 사용자 현황 차트 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 현황</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">활성 사용자</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(userStats.active / userStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold">{userStats.active}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">승인 대기</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(userStats.pending / userStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold">{userStats.pending}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">잠긴 계정</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${userStats.total > 0 ? (userStats.locked / userStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-semibold">{userStats.locked}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 프로젝트 현황 차트 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 현황</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">완료된 프로젝트</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${projectStats.completionRate}%` }}
                        />
                      </div>
                      <span className="font-semibold">{projectStats.completed}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">진행 중</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${projectStats.total > 0 ? (projectStats.active / projectStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-semibold">{projectStats.active}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">지연된 프로젝트</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${projectStats.total > 0 ? (projectStats.overdue / projectStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-semibold">{projectStats.overdue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">활성 사용자</h4>
                  <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
                  <p className="text-sm text-green-600">최근 로그인: {userStats.recentLogins}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800">승인 대기</h4>
                  <p className="text-2xl font-bold text-yellow-600">{userStats.pending}</p>
                  <p className="text-sm text-yellow-600">신규 가입: {userStats.newRegistrations}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800">잠긴 계정</h4>
                  <p className="text-2xl font-bold text-red-600">{userStats.locked}</p>
                  <p className="text-sm text-red-600">보안 조치 필요</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">역할별 분포</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(userStats.byRole).map(([role, count]) => (
                    <div key={role} className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{count}</div>
                      <div className="text-sm text-gray-600 capitalize">{role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">전체 프로젝트</h4>
                  <p className="text-2xl font-bold text-blue-600">{projectStats.total}</p>
                  <p className="text-sm text-blue-600">평균 진행률: {projectStats.averageProgress}%</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">완료됨</h4>
                  <p className="text-2xl font-bold text-green-600">{projectStats.completed}</p>
                  <p className="text-sm text-green-600">최근 완료: {projectStats.recentlyCompleted}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800">진행 중</h4>
                  <p className="text-2xl font-bold text-yellow-600">{projectStats.active}</p>
                  <p className="text-sm text-yellow-600">신규 생성: {projectStats.recentlyCreated}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800">지연됨</h4>
                  <p className="text-2xl font-bold text-red-600">{projectStats.overdue}</p>
                  <p className="text-sm text-red-600">조치 필요</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">단계별 분포</h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(projectStats.byStage).map(([stage, count]) => (
                    <div key={stage} className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{count}</div>
                      <div className="text-sm text-gray-600">{
                        stage === 'stage1' ? '1단계' :
                        stage === 'stage2' ? '2단계' : '3단계'
                      }</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800">오류 로그</h4>
                  <p className="text-2xl font-bold text-red-600">{systemStats.errorCount}</p>
                  <p className="text-sm text-red-600">오늘 발생</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800">잠긴 계정</h4>
                  <p className="text-2xl font-bold text-yellow-600">{userStats.locked}</p>
                  <p className="text-sm text-yellow-600">보안 조치</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">정상 로그인</h4>
                  <p className="text-2xl font-bold text-green-600">{userStats.recentLogins}</p>
                  <p className="text-sm text-green-600">최근 기간</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">저장소 사용량</h4>
                  <p className="text-2xl font-bold text-blue-600">{systemStats.storageUsed}KB</p>
                  <p className="text-sm text-blue-600">로컬 저장소</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">시스템 가동시간</h4>
                  <p className="text-lg font-bold text-green-600">{systemStats.uptime}</p>
                  <p className="text-sm text-green-600">현재 세션</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800">총 활동 로그</h4>
                  <p className="text-2xl font-bold text-purple-600">{systemStats.todayActivity}</p>
                  <p className="text-sm text-purple-600">오늘 기준</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">시스템 성능</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>평균 응답시간</span>
                        <span>{Math.round(systemStats.performance.avgResponseTime)}ms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(systemStats.performance.avgResponseTime / 2, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>메모리 사용률</span>
                        <span>{Math.round(systemStats.performance.memoryUsage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${systemStats.performance.memoryUsage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>CPU 사용률</span>
                        <span>{Math.round(systemStats.performance.cpuUsage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${systemStats.performance.cpuUsage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">시스템 관리</h4>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createBackup}
                      className="w-full"
                    >
                      💾 전체 백업 생성
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cleanupSystem}
                      className="w-full"
                    >
                      🧹 시스템 정리
                    </Button>
                    
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value={10000}>10초마다 새로고침</option>
                      <option value={30000}>30초마다 새로고침</option>
                      <option value={60000}>1분마다 새로고침</option>
                      <option value={300000}>5분마다 새로고침</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard_v11;