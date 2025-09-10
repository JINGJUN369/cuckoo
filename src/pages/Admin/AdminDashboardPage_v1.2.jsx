import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';

/**
 * AdminDashboardPage v1.2 - Supabase 전용 관리자 대시보드
 * 
 * 주요 기능:
 * - 시스템 전체 통계 및 관리
 * - 프로젝트 관리 통계
 * - 사용자 관리 기능
 * - 시스템 설정 관리
 */
const AdminDashboardPage = () => {
  const { user, profile } = useSupabaseAuth();
  const { 
    projects, 
    completedProjects, 
    loading, 
    error 
  } = useSupabaseProjectStore();
  
  const { 
    additionalWorks,
    loading: workStatusLoading
  } = useWorkStatusStore();

  // 통계 데이터 계산
  const stats = useMemo(() => {
    if (loading || !projects || !Array.isArray(projects)) return null;

    const totalProjects = projects.length;
    const totalCompleted = completedProjects?.length || 0;
    
    // 유효한 프로젝트만 필터링하여 진행률 계산
    const validProjects = projects.filter(project => project && typeof project === 'object');
    const progressStats = validProjects.map(project => {
      try {
        return getProjectProgress(project);
      } catch (error) {
        console.warn('프로젝트 진행률 계산 오류:', error, project);
        return { overall: 0, stages: { stage1: 0, stage2: 0, stage3: 0 } };
      }
    });
    
    const avgProgress = progressStats.length > 0 
      ? Math.round(progressStats.reduce((sum, p) => sum + (p?.overall || 0), 0) / progressStats.length)
      : 0;

    // 업무현황 통계 계산
    const workStats = additionalWorks ? {
      totalWorks: additionalWorks.length,
      completedWorks: additionalWorks.filter(work => work.status === '종결').length,
      inProgressWorks: additionalWorks.filter(work => work.status === '진행중').length,
      onHoldWorks: additionalWorks.filter(work => work.status === '보류').length,
      highPriorityWorks: additionalWorks.filter(work => work.priority === '높음').length,
      totalTasks: additionalWorks.reduce((sum, work) => 
        sum + (work.detail_tasks?.length || 0), 0),
      completedTasks: additionalWorks.reduce((sum, work) => 
        sum + (work.detail_tasks?.filter(task => task.status === '완료').length || 0), 0),
    } : {
      totalWorks: 0,
      completedWorks: 0,
      inProgressWorks: 0,
      onHoldWorks: 0,
      highPriorityWorks: 0,
      totalTasks: 0,
      completedTasks: 0,
    };

    return {
      totalProjects,
      totalCompleted,
      activeProjects: totalProjects - totalCompleted,
      avgProgress,
      stage1Complete: progressStats.filter(p => p?.stages?.stage1 === 100).length,
      stage2Complete: progressStats.filter(p => p?.stages?.stage2 === 100).length,
      stage3Complete: progressStats.filter(p => p?.stages?.stage3 === 100).length,
      ...workStats,
    };
  }, [projects, completedProjects, loading, additionalWorks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <h3 className="text-lg font-medium text-red-800">데이터 로드 오류</h3>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="mt-2 text-sm text-gray-600">
            Supabase 전용 시스템 - 전체 프로젝트 및 사용자 관리
          </p>
          <p className="text-xs text-blue-600 mt-1">
            현재 사용자: {profile?.name || user?.email} ({profile?.role})
          </p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <>
            {/* 프로젝트 통계 */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📊 프로젝트 현황</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        전체 프로젝트
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        완료된 프로젝트
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalCompleted}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">🔄</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        진행 중
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.activeProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">📈</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        평균 진행률
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.avgProgress}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </div>

            {/* 업무현황 통계 */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📋 업무현황 관리</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">📝</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            전체 업무
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.totalWorks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">✅</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            종결된 업무
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.completedWorks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">🔄</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            진행중인 업무
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.inProgressWorks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">🚨</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            높은 우선순위
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.highPriorityWorks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">📋</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            전체 세부업무
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.totalTasks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-teal-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">✅</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            완료된 세부업무
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.completedTasks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">⏸️</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            보류 중인 업무
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.onHoldWorks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">📊</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            업무 완료율
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.totalWorks > 0 ? Math.round((stats.completedWorks / stats.totalWorks) * 100) : 0}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/users"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">사용자 관리</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    사용자 승인, 역할 관리, 계정 설정
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/logs"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">활동 로그</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    시스템 활동 기록 및 감사 로그
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/security"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">보안 설정</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    시스템 보안 정책 및 설정 관리
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 시스템 정보 */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">시스템 정보</h3>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">시스템 모드</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Supabase 전용
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">데이터 저장소</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Supabase PostgreSQL
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">실시간 동기화</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    활성화
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">백업 시스템</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Supabase 자동 백업
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;