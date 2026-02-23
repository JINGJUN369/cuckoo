import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import WorkFilterBar from '../../components/workstatus/WorkFilterBar';

/**
 * CompletedWorksPage - 완료된 업무 관리 페이지
 * 
 * 기능:
 * - 종료된 업무 목록 조회
 * - 완료된 세부업무 상태 확인
 * - 업무 완료 통계 및 분석
 * - 필터링 기능
 */
const CompletedWorksPage = () => {
  const { user, profile } = useSupabaseAuth();
  const {
    allAdditionalWorks,
    loading,
    error,
    fetchAdditionalWorks,
    setupRealtimeSubscriptions,
    clearError,
    setFilter,
    getAllAuthors
  } = useWorkStatusStore();

  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month', 'quarter'

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchAdditionalWorks();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // 에러 클리어
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 필터 변경 핸들러
  const handleFilterChange = (filterConfig) => {
    const currentUser = profile?.name || user?.name || user?.email || '';
    setFilter({
      ...filterConfig,
      currentUser: currentUser
    });
  };

  // 완료된 업무만 필터링
  const completedWorks = allAdditionalWorks.filter(work => work.status === '종료');

  // 시간 필터 적용
  const getFilteredByTime = (works) => {
    if (timeFilter === 'all') return works;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return works;
    }

    return works.filter(work => {
      const updatedDate = new Date(work.updated_at);
      return updatedDate >= filterDate;
    });
  };

  const filteredCompletedWorks = getFilteredByTime(completedWorks);

  // 통계 계산
  const stats = React.useMemo(() => {
    const allTasks = filteredCompletedWorks.flatMap(work => work.detail_tasks || []);
    const completedTasks = allTasks.filter(task => task.status === '완료').length;
    
    return {
      totalWorks: filteredCompletedWorks.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks,
      completionRate: allTasks.length > 0 ? (completedTasks / allTasks.length * 100).toFixed(1) : 0
    };
  }, [filteredCompletedWorks]);

  // 완료일 기준 정렬
  const sortedWorks = [...filteredCompletedWorks].sort((a, b) => 
    new Date(b.updated_at) - new Date(a.updated_at)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">완료된 업무를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">✅ 완료된 업무</h1>
            <p className="text-gray-600 mt-2">종료된 업무들의 성과와 결과를 확인합니다.</p>
          </div>
          
          {/* 시간 필터 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">기간:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">전체</option>
              <option value="week">최근 1주일</option>
              <option value="month">최근 1개월</option>
              <option value="quarter">최근 3개월</option>
            </select>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <WorkFilterBar
        onFilterChange={handleFilterChange}
        totalCount={completedWorks.length}
        filteredCount={filteredCompletedWorks.length}
        allUsers={getAllAuthors()}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-red-500 mr-2">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 완료 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">완료된 업무</p>
              <p className="text-2xl font-semibold text-green-600">{stats.totalWorks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">총 세부업무</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.totalTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">완료된 세부업무</p>
              <p className="text-2xl font-semibold text-green-600">{stats.completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">완료율</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 완료된 업무 목록 */}
      <div className="space-y-6">
        {sortedWorks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <span className="text-6xl mb-4 block">🎉</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {timeFilter === 'all' ? '완료된 업무가 없습니다' : `${timeFilter === 'week' ? '최근 1주일' : timeFilter === 'month' ? '최근 1개월' : '최근 3개월'} 완료된 업무가 없습니다`}
            </h3>
            <p className="text-gray-500">업무를 완료하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          sortedWorks.map((work) => (
            <div key={work.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 업무 헤더 */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold">{work.work_name}</h3>
                      <span className="ml-3 px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full">
                        ✅ 종료
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-green-100">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <span>{work.work_owner}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🏢</span>
                        <span>{work.department}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>{work.start_date} ~ {work.end_date}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🏁</span>
                        <span>완료: {new Date(work.updated_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {work.description && (
                  <p className="mt-3 text-green-100">{work.description}</p>
                )}
              </div>

              {/* 세부업무 목록 */}
              <div className="p-6">
                {work.detail_tasks && work.detail_tasks.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="mr-2">📝</span>
                      세부업무 ({work.detail_tasks.length}개)
                    </h4>
                    
                    {work.detail_tasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{task.task_name}</h5>
                            {task.assigned_to && (
                              <p className="text-sm text-gray-600 mt-1">담당자: {task.assigned_to}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.status === '완료' 
                                ? 'bg-green-100 text-green-800' 
                                : task.status === '진행'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* 진행현황 */}
                        {task.progress_content && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              최종 진행현황
                            </label>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-gray-900 whitespace-pre-wrap">{task.progress_content}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* 완료 정보 */}
                        <div className="mt-3 text-xs text-gray-500 flex justify-between">
                          <span>생성: {new Date(task.created_at).toLocaleString('ko-KR')}</span>
                          {task.updated_at !== task.created_at && (
                            <span>완료: {new Date(task.updated_at).toLocaleString('ko-KR')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <span className="text-2xl block mb-2">📝</span>
                    <p>세부업무가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompletedWorksPage;