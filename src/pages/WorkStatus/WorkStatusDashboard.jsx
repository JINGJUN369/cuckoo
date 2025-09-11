import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * WorkStatusDashboard - 업무현황 대시보드
 * 
 * 기능:
 * - 전체 업무 현황 요약
 * - 팀별/부서별 진행률 분석
 * - 마감일 임박 알림
 * - 실시간 업무 활동 모니터링
 */
const WorkStatusDashboard = () => {
  const { user, profile } = useSupabaseAuth();
  const {
    additionalWorks,
    activityLogs,
    users,
    loading,
    error,
    ui,
    fetchAdditionalWorks,
    fetchActivityLogs,
    fetchUsers,
    setSelectedUserId,
    setupRealtimeSubscriptions
  } = useWorkStatusStore();

  const [timeFilter, setTimeFilter] = useState('week'); // 'today', 'week', 'month'

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchUsers();
    fetchAdditionalWorks();
    // fetchActivityLogs(); // activity_logs 테이블이 없으므로 제거
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // 사용자 필터 변경 핸들러
  const handleUserFilterChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  // 현재 선택된 사용자 이름 가져오기
  const getSelectedUserName = () => {
    const { selectedUserId } = ui;
    if (selectedUserId === 'current_user') {
      return profile?.name || user?.email || '현재 사용자';
    } else if (selectedUserId === 'all_users') {
      return '전체 사용자';
    } else {
      const selectedUser = users.find(u => u.id === selectedUserId);
      return selectedUser ? selectedUser.name : '선택된 사용자';
    }
  };

  // 통계 계산
  const stats = React.useMemo(() => {
    const allTasks = additionalWorks.flatMap(work => work.detail_tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === '완료').length;
    const inProgressTasks = allTasks.filter(task => task.status === '진행').length;
    const pendingTasks = allTasks.filter(task => task.status === '대기').length;
    const onHoldTasks = allTasks.filter(task => task.status === '보류').length;
    
    // 담당자별 통계
    const ownerStats = additionalWorks.reduce((acc, work) => {
      const owner = work.work_owner || '미할당';
      if (!acc[owner]) {
        acc[owner] = {
          totalWorks: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          completedWorks: 0
        };
      }
      acc[owner].totalWorks++;
      if (work.status === '종결') {
        acc[owner].completedWorks++;
      }
      const workTasks = work.detail_tasks || [];
      acc[owner].totalTasks += workTasks.length;
      acc[owner].completedTasks += workTasks.filter(t => t.status === '완료').length;
      acc[owner].inProgressTasks += workTasks.filter(t => t.status === '진행').length;
      return acc;
    }, {});

    // 진행률 계산
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalWorks: additionalWorks.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      onHoldTasks,
      overallProgress,
      ownerStats
    };
  }, [additionalWorks]);

  // 마감일 임박 업무 계산
  const urgentWorks = React.useMemo(() => {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    return additionalWorks.filter(work => {
      const endDate = new Date(work.end_date);
      return endDate <= threeDaysLater && endDate >= today;
    }).sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  }, [additionalWorks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 업무현황</h1>
            <p className="text-gray-600 mt-2">전체 업무 진행 상황을 실시간으로 모니터링합니다.</p>
          </div>
          
          {/* 사용자 필터 드롭다운 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">👤 사용자 필터:</span>
              <select
                value={ui.selectedUserId}
                onChange={handleUserFilterChange}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="current_user">내 업무만</option>
                <option value="all_users">전체 사용자</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              현재 보기: <span className="font-medium text-gray-700">{getSelectedUserName()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-red-500 mr-2">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">전체 업무</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWorks}</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">전체 태스크</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
            <span className="text-4xl">📝</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">완료율</p>
              <p className="text-3xl font-bold text-green-600">{stats.overallProgress}%</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">진행 중</p>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgressTasks}</p>
            </div>
            <span className="text-4xl">🔄</span>
          </div>
        </div>
      </div>

      {/* 상태별 분포 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">태스크 상태 분포</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">완료</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.completedTasks}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">진행</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.inProgressTasks}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">대기</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                  <div 
                    className="h-2 bg-gray-500 rounded-full"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.pendingTasks}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">보류</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                  <div 
                    className="h-2 bg-yellow-500 rounded-full"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.onHoldTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.onHoldTasks}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">👤</span>
            담당자별 현황
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.ownerStats)
              .sort(([,a], [,b]) => b.totalWorks - a.totalWorks) // 업무 수 기준으로 정렬
              .map(([owner, data]) => {
              const workProgress = data.totalWorks > 0 ? Math.round((data.completedWorks / data.totalWorks) * 100) : 0;
              const taskProgress = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;
              return (
                <div key={owner} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{owner}</span>
                    <span className="text-xs text-gray-500">{workProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${workProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>업무: {data.totalWorks}개 (완료: {data.completedWorks}개)</span>
                    <span>세부업무: {data.completedTasks}/{data.totalTasks}</span>
                  </div>
                  {data.totalTasks > 0 && (
                    <div className="mt-1">
                      <div className="w-full h-1 bg-gray-100 rounded-full">
                        <div 
                          className="h-1 bg-green-400 rounded-full transition-all duration-500"
                          style={{ width: `${taskProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {Object.keys(stats.ownerStats).length === 0 && (
            <p className="text-gray-500 text-center py-4">등록된 업무가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 마감일 임박 알림 */}
      {urgentWorks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            마감일 임박 업무 ({urgentWorks.length}개)
          </h3>
          <div className="space-y-3">
            {urgentWorks.map(work => {
              const daysLeft = Math.ceil((new Date(work.end_date) - new Date()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysLeft < 0;
              const isToday = daysLeft === 0;
              
              return (
                <div key={work.id} className="bg-white rounded p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{work.work_name}</h4>
                      <p className="text-sm text-gray-600">{work.work_owner} | {work.department}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isOverdue 
                          ? 'bg-red-100 text-red-800' 
                          : isToday 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isOverdue ? '지연' : isToday ? '오늘 마감' : `${daysLeft}일 남음`}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{work.end_date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 최근 활동 로그 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1 text-xs rounded ${
                timeFilter === 'today' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 text-xs rounded ${
                timeFilter === 'week' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              이번 주
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 text-xs rounded ${
                timeFilter === 'month' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              이번 달
            </button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activityLogs.length > 0 ? (
            activityLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs">
                    {log.action_type === 'create' ? '➕' : 
                     log.action_type === 'update' ? '📝' : '🗑️'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{log.profiles?.name || '사용자'}</span>
                    <span className="text-gray-600">
                      {log.action_type === 'create' ? '가 새 업무를 생성했습니다' :
                       log.action_type === 'update' ? '가 업무를 수정했습니다' :
                       '가 업무를 삭제했습니다'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-3xl block mb-2">📊</span>
              <p>최근 활동이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkStatusDashboard;