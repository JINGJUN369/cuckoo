import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';
import { getHybridMode, setHybridMode, HYBRID_MODE } from '../../lib/supabase';
import { hybridDataSync, startRealtimeSync } from '../../utils/hybridDataSync';
import { DataMigration } from '../../utils/dataMigration';

/**
 * AdminDashboardPage v1.2 - 완전한 관리자 대시보드
 * 
 * 주요 기능:
 * - 시스템 전체 통계 및 관리
 * - 사용자 승인 요청 알림
 * - 활동 로그 모니터링
 * - 시스템 보안 설정
 * - 데이터 내보내기 및 백업
 */
const AdminDashboardPage_v1_2 = () => {
  const { user: profile } = useSupabaseAuth();
  const { projects, completedProjects, opinions, syncAllProjects } = useSupabaseProjectStore();

  // 하이브리드 모드 관리 상태
  const [currentMode, setCurrentMode] = useState(getHybridMode());
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  
  // 데이터 마이그레이션 상태
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState(DataMigration.getMigrationReport());
  const [showMigrationDetails, setShowMigrationDetails] = useState(false);

  console.log('⚙️ [v1.2] AdminDashboardPage rendered');

  // 시스템 통계 계산
  const systemStats = useMemo(() => {
    // 사용자 통계 (localStorage에서 가져오기)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const activeUsers = users.filter(u => u.status === 'active').length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;

    // 프로젝트 통계
    const totalProjects = projects.length + completedProjects.length;
    const activeProjects = projects.length;
    const completed = completedProjects.length;

    // 진행률 통계
    const progressData = projects.map(p => getProjectProgress(p).overall);
    const avgProgress = progressData.length > 0 
      ? Math.round(progressData.reduce((a, b) => a + b, 0) / progressData.length)
      : 0;

    // 의견 통계
    const totalOpinions = opinions.length;
    const openOpinions = opinions.filter(o => o.status === 'open').length;
    const criticalOpinions = opinions.filter(o => o.priority === 'critical' && o.status === 'open').length;

    // 오늘 통계
    const today = new Date().toDateString();
    const todayProjects = projects.filter(p => {
      const created = new Date(p.createdAt);
      return created.toDateString() === today;
    }).length;

    const todayOpinions = opinions.filter(o => {
      const created = new Date(o.createdAt || o.created_at);
      return created.toDateString() === today;
    }).length;

    // 활동 로그
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const todayLogs = activityLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today;
    }).length;

    return {
      users: {
        total: users.length,
        active: activeUsers,
        pending: pendingUsers,
        admin: adminUsers
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed,
        avgProgress
      },
      opinions: {
        total: totalOpinions,
        open: openOpinions,
        critical: criticalOpinions
      },
      today: {
        projects: todayProjects,
        opinions: todayOpinions,
        activities: todayLogs
      }
    };
  }, [projects, completedProjects, opinions]);

  // 최근 활동 (활동 로그에서)
  const recentActivities = useMemo(() => {
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    return activityLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }, []);

  // 시스템 알림 계산
  const systemAlerts = useMemo(() => {
    const alerts = [];

    // 승인 대기 사용자
    if (systemStats.users.pending > 0) {
      alerts.push({
        type: 'warning',
        title: '사용자 승인 대기',
        message: `${systemStats.users.pending}명의 사용자가 승인을 기다리고 있습니다.`,
        action: '/admin/users'
      });
    }

    // 긴급 의견
    if (systemStats.opinions.critical > 0) {
      alerts.push({
        type: 'error',
        title: '긴급 의견 처리 필요',
        message: `${systemStats.opinions.critical}개의 긴급 의견이 처리를 기다리고 있습니다.`,
        action: '/dashboard'
      });
    }

    // 미해결 의견이 많은 경우
    if (systemStats.opinions.open > 20) {
      alerts.push({
        type: 'warning',
        title: '많은 미해결 의견',
        message: `${systemStats.opinions.open}개의 의견이 아직 해결되지 않았습니다.`,
        action: '/dashboard'
      });
    }

    // 오늘 활동이 적은 경우
    if (systemStats.today.activities < 5) {
      alerts.push({
        type: 'info',
        title: '낮은 시스템 활동',
        message: '오늘 시스템 활동이 평소보다 낮습니다.',
        action: '/admin/logs'
      });
    }

    return alerts;
  }, [systemStats]);

  // 하이브리드 모드 관리 핸들러
  const handleModeChange = async (newMode) => {
    try {
      setHybridMode(newMode);
      setCurrentMode(newMode);
      
      // 모드별 초기화 작업
      if (newMode === HYBRID_MODE.ENABLED) {
        startRealtimeSync();
        await performFullSync();
      }
      
      alert(`하이브리드 모드가 ${getModeDisplayName(newMode)}로 변경되었습니다.`);
    } catch (error) {
      console.error('Mode change error:', error);
      alert('모드 변경 중 오류가 발생했습니다.');
    }
  };

  // 전체 동기화 실행
  const performFullSync = async () => {
    setIsFullSyncing(true);
    try {
      console.log('🚀 Starting full system sync from admin panel...');
      
      const result = await syncAllProjects();
      
      if (result.success) {
        alert('전체 동기화가 완료되었습니다.');
      } else {
        alert(`동기화 실패: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Full sync error:', error);
      alert('전체 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsFullSyncing(false);
    }
  };

  // 모드 표시명
  const getModeDisplayName = (mode) => {
    switch (mode) {
      case HYBRID_MODE.DISABLED: return 'LocalStorage만 사용';
      case HYBRID_MODE.ENABLED: return 'LocalStorage + Supabase 동기화';
      case HYBRID_MODE.SUPABASE_ONLY: return 'Supabase만 사용';
      default: return '알 수 없음';
    }
  };

  // 데이터 마이그레이션 실행
  const executeDataMigration = async () => {
    if (isMigrating) return;
    
    const confirmed = window.confirm(
      '기존 LocalStorage 데이터를 Supabase로 마이그레이션합니다.\n' +
      '이 작업은 시간이 걸릴 수 있으며, 중간에 중단할 수 없습니다.\n' +
      '계속하시겠습니까?'
    );
    
    if (!confirmed) return;

    setIsMigrating(true);
    try {
      console.log('🚀 관리자 패널에서 데이터 마이그레이션 시작...');
      
      const report = await DataMigration.migrateAll();
      setMigrationReport(report);
      
      if (report.summary && report.summary.migrationRate > 0) {
        alert(`마이그레이션 완료!\n성공률: ${report.summary.migrationRate}%\n` +
              `총 ${report.summary.totalMigratedItems}개 항목이 마이그레이션되었습니다.`);
      } else {
        alert('마이그레이션이 완료되었지만 일부 문제가 발생했습니다.\n결과를 확인해 주세요.');
      }
      
    } catch (error) {
      console.error('❌ 마이그레이션 실행 오류:', error);
      alert(`마이그레이션 중 오류가 발생했습니다:\n${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  // LocalStorage 데이터 분석
  const analyzeLocalData = () => {
    try {
      const analysis = DataMigration.analyzeLocalStorage();
      
      let message = '📊 LocalStorage 데이터 분석 결과:\n\n';
      message += `📁 프로젝트: ${analysis.projects.count}개\n`;
      message += `✅ 완료 프로젝트: ${analysis.completedProjects.count}개\n`;
      message += `💬 의견: ${analysis.opinions.count}개\n`;
      message += `👥 사용자: ${analysis.users.count}명\n`;
      message += `📝 활동 로그: ${analysis.activityLogs.count}개\n\n`;
      message += `📦 총 데이터 크기: ${analysis.summary.totalSizeFormatted}\n`;
      message += `🔢 총 항목 수: ${analysis.summary.totalItems}개`;
      
      alert(message);
      console.log('📊 LocalStorage 분석 결과:', analysis);
      
    } catch (error) {
      console.error('❌ 데이터 분석 오류:', error);
      alert(`데이터 분석 중 오류가 발생했습니다:\n${error.message}`);
    }
  };

  // 관리자 권한 확인 (모든 hooks 실행 후)
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            접근 권한이 없습니다
          </h1>
          <p className="text-gray-600 mb-8">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* 관리자 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-sm text-gray-600 mt-1">
              시스템 전체를 관리하고 모니터링하세요
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📊 메인 대시보드
            </Link>
            <Link
              to="/admin/users"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              👥 사용자 관리
            </Link>
            <Link
              to="/admin/logs"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              📋 활동 로그
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 시스템 알림 */}
        {systemAlerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {systemAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-400' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-medium ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      alert.type === 'error' ? 'text-red-700' :
                      alert.type === 'warning' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                  <Link
                    to={alert.action}
                    className={`text-sm font-medium underline ${
                      alert.type === 'error' ? 'text-red-800 hover:text-red-900' :
                      alert.type === 'warning' ? 'text-yellow-800 hover:text-yellow-900' :
                      'text-blue-800 hover:text-blue-900'
                    }`}
                  >
                    조치하기 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하이브리드 시스템 관리 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🔄 하이브리드 시스템 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              LocalStorage와 Supabase 간의 동기화 모드를 관리합니다
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 현재 모드 상태 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">현재 시스템 모드</h3>
                <div className={`p-4 rounded-lg border-2 ${
                  currentMode === HYBRID_MODE.DISABLED ? 'border-gray-300 bg-gray-50' :
                  currentMode === HYBRID_MODE.ENABLED ? 'border-blue-300 bg-blue-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {getModeDisplayName(currentMode)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentMode === HYBRID_MODE.DISABLED ? 'bg-gray-200 text-gray-800' :
                      currentMode === HYBRID_MODE.ENABLED ? 'bg-blue-200 text-blue-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {currentMode === HYBRID_MODE.DISABLED ? '단일 모드' :
                       currentMode === HYBRID_MODE.ENABLED ? '하이브리드' : '클라우드'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentMode === HYBRID_MODE.DISABLED ? 
                      '로컬 브라우저 저장소만 사용합니다. 데이터가 클라우드에 백업되지 않습니다.' :
                     currentMode === HYBRID_MODE.ENABLED ? 
                      '로컬 저장소와 Supabase가 동기화됩니다. 가장 안전한 모드입니다.' :
                      '모든 데이터가 Supabase 클라우드에서 관리됩니다. 실시간 동기화가 활성화됩니다.'
                    }
                  </p>
                </div>
              </div>
              
              {/* 모드 전환 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">모드 전환</h3>
                <div className="space-y-2">
                  {Object.values(HYBRID_MODE).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      disabled={currentMode === mode || isFullSyncing}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        currentMode === mode 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-default' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="font-medium">{getModeDisplayName(mode)}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {mode === HYBRID_MODE.DISABLED ? 
                          '단일 브라우저 모드 - 가장 빠름' :
                         mode === HYBRID_MODE.ENABLED ? 
                          '이중 백업 모드 - 권장' :
                          '클라우드 전용 모드 - 실시간 협업'
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 동기화 동작 */}
            {currentMode !== HYBRID_MODE.DISABLED && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">동기화 관리</h3>
                    <p className="text-sm text-gray-600">데이터 동기화 및 백업을 관리합니다</p>
                  </div>
                  <button
                    onClick={performFullSync}
                    disabled={isFullSyncing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFullSyncing ? '동기화 중...' : '🔄 전체 동기화 실행'}
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">프로젝트</div>
                    <div className="text-gray-600">{projects.length}개</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">완료됨</div>
                    <div className="text-gray-600">{completedProjects.length}개</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">의견</div>
                    <div className="text-gray-600">{opinions.length}개</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 데이터 마이그레이션 관리 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🔄 데이터 마이그레이션</h2>
            <p className="text-sm text-gray-600 mt-1">
              LocalStorage 데이터를 Supabase로 일괄 마이그레이션합니다
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 마이그레이션 상태 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">마이그레이션 상태</h3>
                <div className={`p-4 rounded-lg border-2 ${
                  DataMigration.isMigrated() ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {DataMigration.isMigrated() ? '마이그레이션 완료' : '마이그레이션 필요'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      DataMigration.isMigrated() ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
                    }`}>
                      {DataMigration.isMigrated() ? '완료됨' : '대기 중'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {DataMigration.isMigrated() ? 
                      '모든 LocalStorage 데이터가 Supabase로 마이그레이션되었습니다.' :
                      'LocalStorage 데이터가 아직 Supabase로 마이그레이션되지 않았습니다.'
                    }
                  </p>
                  
                  {migrationReport && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        <div>마지막 마이그레이션: {new Date(migrationReport.timestamp).toLocaleString()}</div>
                        {migrationReport.summary && (
                          <div className="mt-1">
                            성공률: {migrationReport.summary.migrationRate}% 
                            ({migrationReport.summary.totalMigratedItems}/{migrationReport.summary.totalOriginalItems})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowMigrationDetails(!showMigrationDetails)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        {showMigrationDetails ? '상세 정보 숨기기' : '상세 정보 보기'} →
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 마이그레이션 작업 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">마이그레이션 작업</h3>
                <div className="space-y-3">
                  <button
                    onClick={analyzeLocalData}
                    disabled={isMigrating}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium">📊 데이터 분석</div>
                    <div className="text-sm text-gray-500 mt-1">
                      LocalStorage에 저장된 데이터를 분석합니다
                    </div>
                  </button>
                  
                  <button
                    onClick={executeDataMigration}
                    disabled={isMigrating}
                    className="w-full text-left px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-blue-800">
                      {isMigrating ? '🔄 마이그레이션 진행 중...' : '🚀 전체 마이그레이션 실행'}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {isMigrating ? 
                        '데이터를 Supabase로 이전하고 있습니다' :
                        'LocalStorage → Supabase 일괄 마이그레이션'
                      }
                    </div>
                  </button>
                  
                  {DataMigration.isMigrated() && (
                    <button
                      onClick={() => alert('마이그레이션 재실행은 데이터 중복을 유발할 수 있습니다.\n개발자에게 문의하세요.')}
                      disabled={isMigrating}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    >
                      <div className="font-medium">⚠️ 재마이그레이션</div>
                      <div className="text-sm mt-1">
                        이미 마이그레이션된 상태입니다
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 마이그레이션 상세 결과 */}
            {showMigrationDetails && migrationReport && migrationReport.summary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-3">마이그레이션 상세 결과</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(migrationReport.summary.dataTypes).map(([type, data]) => (
                    <div key={type} className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-medium text-gray-900 capitalize">{type}</div>
                      <div className="text-gray-600">{data.successful}/{data.attempted}</div>
                      <div className="text-xs text-gray-500">{data.successRate}% 성공</div>
                    </div>
                  ))}
                </div>
                
                {migrationReport.verification && migrationReport.verification.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm font-medium text-yellow-800 mb-2">
                      ⚠️ {migrationReport.verification.issues.length}개 이슈 발견
                    </div>
                    <div className="text-xs text-yellow-700 space-y-1">
                      {migrationReport.verification.issues.slice(0, 3).map((issue, index) => (
                        <div key={index}>• {issue.dataType}: {issue.type}</div>
                      ))}
                      {migrationReport.verification.issues.length > 3 && (
                        <div>... 및 {migrationReport.verification.issues.length - 3}개 추가</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 주요 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats.users.total}명
                </p>
                <p className="text-xs text-gray-500">
                  활성: {systemStats.users.active}명 | 대기: {systemStats.users.pending}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 프로젝트</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats.projects.total}개
                </p>
                <p className="text-xs text-gray-500">
                  진행중: {systemStats.projects.active}개 | 완료: {systemStats.projects.completed}개
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 의견</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats.opinions.total}개
                </p>
                <p className="text-xs text-gray-500">
                  미해결: {systemStats.opinions.open}개 | 긴급: {systemStats.opinions.critical}개
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 진행률</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats.projects.avgProgress}%
                </p>
                <p className="text-xs text-gray-500">
                  활성 프로젝트 기준
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘의 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 활동</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">새 프로젝트</span>
                <span className="text-2xl font-bold text-blue-600">
                  {systemStats.today.projects}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">새 의견</span>
                <span className="text-2xl font-bold text-green-600">
                  {systemStats.today.opinions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">시스템 활동</span>
                <span className="text-2xl font-bold text-purple-600">
                  {systemStats.today.activities}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
              <Link
                to="/admin/logs"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-gray-500 text-sm">최근 활동이 없습니다.</p>
              ) : (
                recentActivities.slice(0, 6).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-gray-900">{activity.action}</span>
                      <span className="text-gray-600 ml-2">by {activity.userId}</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 관리 도구 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/users"
            className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자 관리</h3>
              <p className="text-sm text-gray-600">
                사용자 승인, 권한 관리, 계정 설정
              </p>
              <div className="mt-4 text-blue-600 text-sm">
                {systemStats.users.pending > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {systemStats.users.pending}개 대기중
                  </span>
                )}
              </div>
            </div>
          </Link>

          <Link
            to="/admin/logs"
            className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">활동 로그</h3>
              <p className="text-sm text-gray-600">
                시스템 활동 추적, 보안 모니터링
              </p>
              <div className="mt-4 text-green-600 text-sm">
                오늘 {systemStats.today.activities}개 활동
              </div>
            </div>
          </Link>

          <Link
            to="/admin/security"
            className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">보안 설정</h3>
              <p className="text-sm text-gray-600">
                시스템 보안, 접근 제어, 백업
              </p>
              <div className="mt-4 text-yellow-600 text-sm">
                설정 관리
              </div>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 내보내기</h3>
              <p className="text-sm text-gray-600 mb-4">
                전체 데이터를 백업하거나 내보내기
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    // 전체 데이터 백업
                    const backupData = {
                      projects: [...projects, ...completedProjects],
                      opinions,
                      users: JSON.parse(localStorage.getItem('users') || '[]'),
                      activityLogs: JSON.parse(localStorage.getItem('activityLogs') || '[]'),
                      exportedAt: new Date().toISOString()
                    };
                    
                    const blob = new Blob([JSON.stringify(backupData, null, 2)], 
                      { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  전체 백업
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage_v1_2;