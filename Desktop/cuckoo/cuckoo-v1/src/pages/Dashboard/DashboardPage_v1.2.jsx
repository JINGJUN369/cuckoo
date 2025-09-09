import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getProjectProgress } from '../../types/project';
import { calculateDDay } from '../../utils/dDayCalculator_v1.1';
import NotificationSystem_v1_2 from '../../components/ui/NotificationSystem_v1.2';

/**
 * DashboardPage v1.2 - 메인 대시보드 페이지
 * 
 * 주요 기능:
 * - 전체 프로젝트 진행률 요약
 * - 마감일 임박 프로젝트 알림
 * - 최근 활동 피드
 * - 빠른 작업 버튼
 * - 중요 의견 및 알림
 */
const DashboardPage_v1_2 = () => {
  const navigate = useNavigate();
  const { user, profile } = useSupabaseAuth();
  const { projects, opinions, loadProjects, loading } = useSupabaseProjectStore();

  const isAdmin = profile?.role === 'admin';
  console.log('📊 [v1.2] DashboardPage rendered with Supabase');
  console.log('📊 [v1.2] Auth 상태:', { 
    hasProfile: !!profile, 
    profileRole: profile?.role, 
    isAdmin: isAdmin,
    profileName: profile?.name
  });
  console.log('📊 [v1.2] 데이터 상태:', { 
    projectsCount: projects?.length || 0,
    opinionsCount: opinions?.length || 0,
    projectsArray: projects,
    opinionsArray: opinions
  });

  // 대시보드 통계 계산
  const dashboardStats = useMemo(() => {
    if (!projects.length) {
      return {
        totalProjects: 0,
        completedProjects: 0,
        inProgressProjects: 0,
        overdue: 0,
        avgProgress: 0,
        urgentProjects: [],
        recentProjects: []
      };
    }

    const totalProjects = projects.length;
    const projectsWithProgress = projects.map(project => {
      // 가장 가까운 마감일 찾기 (양산예정일 우선)
      let dDay = null;
      if (project.stage1?.massProductionDate) {
        dDay = calculateDDay(project.stage1.massProductionDate);
      } else if (project.stage1?.launchDate) {
        dDay = calculateDDay(project.stage1.launchDate);
      } else if (project.stage2?.pilotProductionDate) {
        dDay = calculateDDay(project.stage2.pilotProductionDate);
      }
      
      return {
        ...project,
        progress: getProjectProgress(project).overall,
        dDay: dDay || 999 // 날짜가 없으면 매우 낮은 우선순위
      };
    });

    const completedProjects = projectsWithProgress.filter(p => p.progress === 100).length;
    const inProgressProjects = totalProjects - completedProjects;
    const overdue = projectsWithProgress.filter(p => p.dDay < 0).length;
    
    const avgProgress = totalProjects > 0 
      ? Math.round(projectsWithProgress.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
      : 0;

    // 긴급 프로젝트: 날짜가 임박했지만 실행되지 않은 항목들 찾기
    const urgentProjects = [];
    
    projectsWithProgress.forEach(project => {
      const today = new Date();
      const urgentItems = [];
      
      // 각 단계별 날짜 필드들 확인
      const dateFields = [
        // Stage 1
        { field: 'launchDate', executed: 'launchExecuted', stage: '1단계', label: '출시예정일', value: project.stage1?.launchDate },
        { field: 'massProductionDate', executed: 'massProductionExecuted', stage: '1단계', label: '양산예정일', value: project.stage1?.massProductionDate },
        
        // Stage 2  
        { field: 'pilotProductionDate', executed: 'pilotProductionExecuted', stage: '2단계', label: '파일럿생산', value: project.stage2?.pilotProductionDate },
        { field: 'techTransferDate', executed: 'techTransferExecuted', stage: '2단계', label: '기술이전', value: project.stage2?.techTransferDate },
        { field: 'installationDate', executed: 'installationExecuted', stage: '2단계', label: '설치일정', value: project.stage2?.installationDate },
        { field: 'serviceDate', executed: 'serviceExecuted', stage: '2단계', label: '서비스일정', value: project.stage2?.serviceDate },
        
        // Stage 3
        { field: 'initialProductionDate', executed: 'initialProductionExecuted', stage: '3단계', label: '최초양산', value: project.stage3?.initialProductionDate },
        { field: 'bomDate', executed: 'bomExecuted', stage: '3단계', label: 'BOM구성', value: project.stage3?.bomDate },
        { field: 'unitPriceDate', executed: 'unitPriceExecuted', stage: '3단계', label: '단가등록', value: project.stage3?.unitPriceDate },
        { field: 'partReceiptDate', executed: 'partReceiptExecuted', stage: '3단계', label: '부품입고', value: project.stage3?.partReceiptDate },
      ];
      
      dateFields.forEach(({ field, executed, stage, label, value }) => {
        if (value) {
          const targetDate = new Date(value);
          const daysToTarget = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
          
          // 날짜가 임박(7일 이내)하고 아직 실행되지 않은 경우
          const stageData = stage === '1단계' ? project.stage1 : stage === '2단계' ? project.stage2 : project.stage3;
          const isExecuted = stageData?.[executed] === true;
          
          if (daysToTarget >= -1 && daysToTarget <= 7 && !isExecuted) {
            urgentItems.push({
              projectId: project.id,
              projectName: project.name,
              stage,
              label,
              date: value,
              daysToTarget,
              isOverdue: daysToTarget < 0
            });
          }
        }
      });
      
      if (urgentItems.length > 0) {
        urgentProjects.push({
          ...project,
          urgentItems: urgentItems.sort((a, b) => a.daysToTarget - b.daysToTarget)
        });
      }
    });
    
    // 가장 긴급한 항목 순으로 정렬
    urgentProjects.sort((a, b) => {
      const aMinDays = Math.min(...a.urgentItems.map(item => item.daysToTarget));
      const bMinDays = Math.min(...b.urgentItems.map(item => item.daysToTarget));
      return aMinDays - bMinDays;
    });

    const recentProjects = projectsWithProgress
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      overdue,
      avgProgress,
      urgentProjects,
      recentProjects
    };
  }, [projects]);

  // 의견 통계 계산
  const opinionStats = useMemo(() => {
    const totalOpinions = opinions.length;
    const openOpinions = opinions.filter(o => o.status === 'open').length;
    const resolvedOpinions = opinions.filter(o => o.status === 'resolved').length;
    const criticalOpinions = opinions.filter(o => o.priority === 'critical' && o.status === 'open').length;
    const highPriorityOpinions = opinions.filter(o => o.priority === 'high' && o.status === 'open').length;
    
    // 단계별 의견 분포
    const stageDistribution = {
      general: opinions.filter(o => o.stage === 'general').length,
      stage1: opinions.filter(o => o.stage === 'stage1').length,
      stage2: opinions.filter(o => o.stage === 'stage2').length,
      stage3: opinions.filter(o => o.stage === 'stage3').length
    };

    return {
      totalOpinions,
      openOpinions,
      resolvedOpinions,
      criticalOpinions,
      highPriorityOpinions,
      stageDistribution
    };
  }, [opinions]);

  // 최근 의견 (5개)
  const recentOpinions = useMemo(() => {
    return opinions
      .filter(o => o.status !== 'deleted')
      .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
      .slice(0, 5);
  }, [opinions]);

  // 로딩 상태 처리는 제거 (현재 v1.2에서는 사용하지 않음)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          안녕하세요, {profile?.name || '사용자'}님!
          {isAdmin && <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">관리자</span>}
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin ? '시스템 관리 및 전체 프로젝트 현황을 확인하세요.' : '오늘도 프로젝트 관리에 힘써주세요.'}
        </p>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 프로젝트</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalProjects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료된 프로젝트</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.completedProjects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">지연된 프로젝트</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.overdue}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 진행률</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.avgProgress}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">미해결 의견</p>
              <p className="text-2xl font-bold text-gray-900">
                {opinionStats.openOpinions}
              </p>
              {opinionStats.criticalOpinions > 0 && (
                <p className="text-xs text-red-600">
                  긴급: {opinionStats.criticalOpinions}개
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 긴급한 프로젝트 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                🚨 긴급한 프로젝트
              </h2>
              <Link 
                to="/projects" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                전체 보기 →
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {dashboardStats.urgentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                날짜가 임박한 미실행 작업이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {dashboardStats.urgentProjects.map(project => (
                  <div key={project.id} className="border rounded-lg bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-red-50 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {project.name}
                        </h3>
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          상세보기 →
                        </Link>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 space-y-2">
                      {project.urgentItems.map((item, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${
                          item.isOverdue ? 'bg-red-100 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                                {item.stage}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              예정일: {new Date(item.date).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.isOverdue 
                                ? 'bg-red-100 text-red-800' 
                                : item.daysToTarget <= 1
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.isOverdue 
                                ? `${Math.abs(item.daysToTarget)}일 지연` 
                                : item.daysToTarget === 0
                                ? '오늘 마감'
                                : `D-${item.daysToTarget}`
                              }
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.isOverdue ? '🔴 지연됨' : '⚠️ 임박'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                🔄 최근 활동
              </h2>
              <Link 
                to="/projects" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                전체 보기 →
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {dashboardStats.recentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                최근 활동이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {dashboardStats.recentProjects.map(project => (
                  <div key={project.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">📁</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        업데이트: {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      보기
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 의견 알림 시스템 */}
        <NotificationSystem_v1_2 className="lg:col-span-1" maxItems={8} />

        {/* 최근 의견 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                💬 최근 의견
              </h2>
              <div className="text-sm text-gray-500">
                총 {opinionStats.totalOpinions}개 | 해결됨 {opinionStats.resolvedOpinions}개
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {recentOpinions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                최근 의견이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {recentOpinions.map(opinion => {
                  const project = projects.find(p => p.id === (opinion.projectId || opinion.project_id));
                  return (
                    <div key={opinion.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {opinion.message || opinion.content}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              opinion.stage === 'stage1' ? 'text-blue-600 bg-blue-100' :
                              opinion.stage === 'stage2' ? 'text-green-600 bg-green-100' :
                              opinion.stage === 'stage3' ? 'text-purple-600 bg-purple-100' :
                              'text-gray-600 bg-gray-100'
                            }`}>
                              {opinion.stage === 'general' ? '일반' : 
                               opinion.stage === 'stage1' ? 'Stage 1' :
                               opinion.stage === 'stage2' ? 'Stage 2' :
                               opinion.stage === 'stage3' ? 'Stage 3' : opinion.stage}
                            </span>
                            {opinion.priority && opinion.priority !== 'normal' && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                opinion.priority === 'critical' ? 'text-red-600 bg-red-100' :
                                opinion.priority === 'high' ? 'text-orange-600 bg-orange-100' :
                                'text-gray-600 bg-gray-100'
                              }`}>
                                {opinion.priority === 'critical' ? '긴급' :
                                 opinion.priority === 'high' ? '높음' :
                                 opinion.priority === 'low' ? '낮음' : opinion.priority}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              opinion.status === 'open' ? 'text-yellow-600 bg-yellow-100' :
                              opinion.status === 'resolved' ? 'text-green-600 bg-green-100' :
                              'text-gray-600 bg-gray-100'
                            }`}>
                              {opinion.status === 'open' ? '진행중' :
                               opinion.status === 'resolved' ? '해결됨' : opinion.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>
                          <span>{project?.name || '프로젝트 없음'}</span>
                          <span className="mx-1">•</span>
                          <span>{opinion.createdByName || opinion.createdBy}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(opinion.createdAt || opinion.created_at).toLocaleDateString()}</span>
                        </div>
                        <Link
                          to={`/projects/${opinion.projectId || opinion.project_id}?tab=opinions`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          확인하기
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stage별 의견 분포 */}
          {opinionStats.totalOpinions > 0 && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3 pt-4">단계별 의견 분포</h4>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{opinionStats.stageDistribution.general}</div>
                  <div className="text-gray-500">일반</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{opinionStats.stageDistribution.stage1}</div>
                  <div className="text-gray-500">1단계</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{opinionStats.stageDistribution.stage2}</div>
                  <div className="text-gray-500">2단계</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{opinionStats.stageDistribution.stage3}</div>
                  <div className="text-gray-500">3단계</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 빠른 작업 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              ⚡ 빠른 작업
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">📁</div>
                <div className="text-sm font-medium text-gray-900">프로젝트 보기</div>
              </button>
              
              <button
                onClick={() => navigate('/calendar')}
                className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="text-sm font-medium text-gray-900">달력 보기</div>
              </button>
              
              <button
                onClick={() => navigate('/completed')}
                className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-gray-900">완료 프로젝트</div>
              </button>
              
              {profile?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="p-4 text-center bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="text-sm font-medium text-gray-900">관리자</div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage_v1_2;