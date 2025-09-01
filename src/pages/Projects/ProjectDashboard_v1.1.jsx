import React, { useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { getProjectProgress, getStageProgress } from '../../types/project';
import { Button } from '../../components/ui';

/**
 * v1.1 ProjectDashboard - 통합된 프로젝트 대시보드 시스템
 * 
 * 주요 개선사항:
 * - 실시간 데이터 업데이트
 * - 향상된 차트 및 통계 시각화
 * - 성능 최적화 (메모이제이션)
 * - 모바일 반응형 개선
 * - 개별 프로젝트와 전체 프로젝트 대시보드 통합
 * - 인터랙티브 차트 구현
 */
const ProjectDashboard_v11 = ({ type = 'project' }) => {
  console.log('📊 [v1.1] ProjectDashboard rendering', { type });

  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { projects, selectedProject, ui } = state;
  const [activeTab, setActiveTab] = useState('overview');

  // 메인 대시보드 (전체 프로젝트) vs 개별 프로젝트 대시보드 구분
  const isMainDashboard = type === 'main';
  const targetProject = isMainDashboard ? null : selectedProject;

  // 전체 프로젝트 통계 계산 (메모이제이션)
  const overallStats = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalProjects: 0,
        completedProjects: 0,
        inProgressProjects: 0,
        overdueProjects: 0,
        averageProgress: 0,
        urgentTasks: 0
      };
    }

    const today = new Date();
    let totalProgress = 0;
    let urgentCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;

    projects.forEach(project => {
      const progress = getProjectProgress(project);
      totalProgress += progress;

      if (progress === 100) {
        completedCount++;
      } else if (progress > 0) {
        inProgressCount++;
      }

      // D-Day 계산
      const massProductionDate = project.stage1?.massProductionDate;
      if (massProductionDate) {
        const targetDate = new Date(massProductionDate);
        const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) overdueCount++;
        else if (daysUntil <= 7) urgentCount++;
      }
    });

    return {
      totalProjects: projects.length,
      completedProjects: completedCount,
      inProgressProjects: inProgressCount,
      overdueProjects: overdueCount,
      averageProgress: Math.round(totalProgress / projects.length),
      urgentTasks: urgentCount
    };
  }, [projects]);

  // 개별 프로젝트 통계 계산 (메모이제이션) - 강제 재계산 포함
  const projectStats = useMemo(() => {
    if (!targetProject) return null;

    // 진행률 계산 및 강제 클램핑 적용
    const rawOverallProgress = getProjectProgress(targetProject);
    const rawStage1Progress = getStageProgress(targetProject, 'stage1');
    const rawStage2Progress = getStageProgress(targetProject, 'stage2');
    const rawStage3Progress = getStageProgress(targetProject, 'stage3');
    
    // 명시적 클램핑 (0-100% 범위 강제)
    const clampProgress = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));
    
    const overallProgress = clampProgress(rawOverallProgress);
    const stage1Progress = clampProgress(rawStage1Progress);
    const stage2Progress = clampProgress(rawStage2Progress);
    const stage3Progress = clampProgress(rawStage3Progress);
    
    console.log(`🔄 [ProjectDashboard] ${targetProject?.name} 진행률 (클램핑 전/후):`, {
      raw: { overall: rawOverallProgress, stage1: rawStage1Progress, stage2: rawStage2Progress, stage3: rawStage3Progress },
      clamped: { overall: overallProgress, stage1: stage1Progress, stage2: stage2Progress, stage3: stage3Progress }
    });

    // D-Day 계산
    let dDay = null;
    const massProductionDate = targetProject.stage1?.massProductionDate;
    if (massProductionDate) {
      const targetDate = new Date(massProductionDate);
      const today = new Date();
      dDay = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    }

    // 프로젝트 상태 계산
    let status = { text: '시작단계', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
    if (overallProgress === 100) status = { text: '완료', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    else if (overallProgress >= 70) status = { text: '진행중 (고)', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
    else if (overallProgress >= 30) status = { text: '진행중 (중)', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' };

    return {
      overallProgress,
      stage1Progress,
      stage2Progress,
      stage3Progress,
      dDay,
      status
    };
  }, [targetProject, targetProject?.updatedAt, targetProject?.id]);

  // 임박한 일정들 계산 (메모이제이션)
  const upcomingTasks = useMemo(() => {
    if (isMainDashboard) {
      // 전체 프로젝트의 임박한 일정
      const allTasks = [];
      const today = new Date();

      projects.forEach(project => {
        // 각 프로젝트의 모든 일정 수집
        const projectTasks = [];
        
        if (project.stage1?.launchDate && !project.stage1?.launchDateExecuted) {
          const date = new Date(project.stage1.launchDate);
          const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
          projectTasks.push({
            title: '출시예정일',
            date: project.stage1.launchDate,
            daysUntil,
            stage: 'Stage 1',
            color: 'bg-blue-500',
            projectName: project.name,
            projectId: project.id
          });
        }

        if (project.stage1?.massProductionDate && !project.stage1?.massProductionDateExecuted) {
          const date = new Date(project.stage1.massProductionDate);
          const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
          projectTasks.push({
            title: '양산예정일',
            date: project.stage1.massProductionDate,
            daysUntil,
            stage: 'Stage 1',
            color: 'bg-red-500',
            projectName: project.name,
            projectId: project.id
          });
        }

        // Stage 2, 3 일정들도 추가...
        allTasks.push(...projectTasks);
      });

      return allTasks.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 8);
    } else {
      // 개별 프로젝트 일정
      if (!targetProject) return [];
      
      const tasks = [];
      const today = new Date();

      // Stage1 일정들
      if (targetProject.stage1?.launchDate && !targetProject.stage1?.launchDateExecuted) {
        const date = new Date(targetProject.stage1.launchDate);
        const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        tasks.push({
          title: '출시예정일',
          date: targetProject.stage1.launchDate,
          daysUntil,
          stage: 'Stage 1',
          color: 'bg-blue-500'
        });
      }

      if (targetProject.stage1?.massProductionDate && !targetProject.stage1?.massProductionDateExecuted) {
        const date = new Date(targetProject.stage1.massProductionDate);
        const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        tasks.push({
          title: '양산예정일',
          date: targetProject.stage1.massProductionDate,
          daysUntil,
          stage: 'Stage 1',
          color: 'bg-red-500'
        });
      }

      // Stage 2, 3 일정들 추가...
      if (targetProject.stage2?.pilotProductionDate && !targetProject.stage2?.pilotProductionDateExecuted) {
        const date = new Date(targetProject.stage2.pilotProductionDate);
        const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        tasks.push({
          title: '파일럿생산',
          date: targetProject.stage2.pilotProductionDate,
          daysUntil,
          stage: 'Stage 2',
          color: 'bg-green-500'
        });
      }

      return tasks.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
    }
  }, [isMainDashboard, projects, targetProject]);

  // 차트 컴포넌트 (최적화)
  const ProgressChart = useCallback(({ data, labels, colors, showAnimation = true }) => {
    return (
      <div className="space-y-4">
        {data.map((value, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm font-medium text-gray-700">
              {labels[index]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-7 relative overflow-hidden">
              <div
                className={`h-full rounded-full flex items-center justify-end pr-3 ${
                  showAnimation ? 'transition-all duration-1000 ease-out' : ''
                }`}
                style={{
                  width: `${Math.max(value, 8)}%`,
                  backgroundColor: colors[index]
                }}
              >
                <span className="text-xs font-medium text-white">
                  {value}%
                </span>
              </div>
              {value < 8 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs font-medium text-gray-600">{value}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, []);

  // 통계 카드 컴포넌트
  const StatCard = useCallback(({ title, value, subtitle, color = 'bg-blue-500', icon, trend, onClick }) => (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
        onClick ? 'hover:shadow-md cursor-pointer' : 'hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                trend > 0 ? 'bg-green-100 text-green-700' :
                trend < 0 ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  ), []);

  // 프로젝트 선택 핸들러
  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project);
    setCurrentView('detail');
  }, [setSelectedProject, setCurrentView]);

  // 편집 버튼 핸들러
  const handleEdit = useCallback(() => {
    if (targetProject) {
      setSelectedProject(targetProject);
      setCurrentView('edit');
    }
  }, [targetProject, setSelectedProject, setCurrentView]);

  // 로딩 상태
  if (ui?.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 개별 프로젝트 대시보드이지만 선택된 프로젝트가 없는 경우
  if (!isMainDashboard && !targetProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            프로젝트를 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-6">
            선택된 프로젝트가 없거나 삭제되었습니다
          </p>
          <Button onClick={() => setCurrentView('list')} variant="primary">
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 메인 대시보드 렌더링
  if (isMainDashboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 프로젝트 대시보드</h1>
                <p className="text-gray-600">
                  전체 프로젝트 현황과 통계를 한눈에 확인하세요
                </p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setCurrentView('list')} variant="outline">
                  📋 프로젝트 목록
                </Button>
                <Button onClick={() => setCurrentView('calendar')} variant="outline">
                  📅 달력 보기
                </Button>
              </div>
            </div>
          </div>

          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <StatCard 
              title="전체 프로젝트"
              value={overallStats.totalProjects}
              subtitle="진행 중인 프로젝트"
              color="bg-blue-500"
              icon="📂"
              onClick={() => setCurrentView('list')}
            />
            <StatCard 
              title="완료된 프로젝트"
              value={overallStats.completedProjects}
              subtitle={`전체의 ${overallStats.totalProjects > 0 ? Math.round((overallStats.completedProjects / overallStats.totalProjects) * 100) : 0}%`}
              color="bg-green-500"
              icon="✅"
              onClick={() => setCurrentView('completed')}
            />
            <StatCard 
              title="진행 중"
              value={overallStats.inProgressProjects}
              color="bg-yellow-500"
              icon="⚡"
            />
            <StatCard 
              title="지연된 프로젝트"
              value={overallStats.overdueProjects}
              color="bg-red-500"
              icon="⚠️"
            />
            <StatCard 
              title="긴급 작업"
              value={overallStats.urgentTasks}
              subtitle="7일 이내 마감"
              color="bg-orange-500"
              icon="🔥"
            />
            <StatCard 
              title="평균 진행률"
              value={`${overallStats.averageProgress}%`}
              color="bg-purple-500"
              icon="📈"
            />
          </div>

          {/* 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 프로젝트 현황 차트 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 프로젝트 현황</h3>
              <div className="space-y-4">
                <ProgressChart
                  data={[
                    overallStats.totalProjects > 0 ? Math.round((overallStats.completedProjects / overallStats.totalProjects) * 100) : 0,
                    overallStats.totalProjects > 0 ? Math.round((overallStats.inProgressProjects / overallStats.totalProjects) * 100) : 0,
                    overallStats.totalProjects > 0 ? Math.round((overallStats.overdueProjects / overallStats.totalProjects) * 100) : 0
                  ]}
                  labels={['완료', '진행중', '지연']}
                  colors={['#10B981', '#F59E0B', '#EF4444']}
                />
              </div>
            </div>

            {/* 임박한 일정 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🔔 임박한 일정</h3>
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {upcomingTasks.map((task, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        const project = projects.find(p => p.id === task.projectId);
                        if (project) handleProjectSelect(project);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-600">{task.projectName}</div>
                          <div className="text-xs text-gray-500">{task.stage}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          task.daysUntil <= 0 ? 'text-red-600' :
                          task.daysUntil <= 7 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {task.daysUntil <= 0 ? '지연됨' : 
                           task.daysUntil === 1 ? '내일' :
                           `${task.daysUntil}일 후`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(task.date).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>예정된 일정이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 최근 프로젝트 목록 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">📋 최근 프로젝트</h3>
                <Button onClick={() => setCurrentView('list')} variant="outline" size="sm">
                  전체 보기
                </Button>
              </div>
            </div>
            <div className="p-6">
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 6).map(project => {
                    const progress = getProjectProgress(project);
                    const massProductionDate = project.stage1?.massProductionDate;
                    let dDay = null;
                    if (massProductionDate) {
                      const targetDate = new Date(massProductionDate);
                      const today = new Date();
                      dDay = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
                    }

                    return (
                      <div 
                        key={project.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
                        onClick={() => handleProjectSelect(project)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 truncate">
                            {project.name}
                          </h4>
                          {dDay !== null && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              dDay < 0 ? 'bg-red-100 text-red-700' :
                              dDay <= 7 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {dDay < 0 ? `D+${Math.abs(dDay)}` : dDay === 0 ? 'D-Day' : `D-${dDay}`}
                            </span>
                          )}
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">진행률</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress === 100 ? 'bg-green-500' :
                                progress >= 70 ? 'bg-blue-500' :
                                progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {project.stage1?.manufacturer || '제조사 미정'} • {project.stage1?.productGroup || '제품군 미정'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📂</div>
                  <p>프로젝트가 없습니다</p>
                  <Button 
                    onClick={() => setCurrentView('list')} 
                    variant="primary" 
                    className="mt-4"
                  >
                    첫 프로젝트 만들기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 개별 프로젝트 대시보드 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentView('list')}
                  size="sm"
                >
                  ← 목록
                </Button>
                <span className="text-sm text-gray-500">프로젝트 대시보드</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{targetProject.name}</h1>
              <div className="flex items-center flex-wrap gap-4 mt-3">
                {targetProject.modelName && (
                  <span className="text-blue-600 font-medium">모델: {targetProject.modelName}</span>
                )}
                <span className="text-gray-600">ID: {targetProject.id}</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${projectStats.status.bgColor} ${projectStats.status.textColor}`}>
                  {projectStats.status.text}
                </div>
                {projectStats.dDay !== null && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    projectStats.dDay > 30 ? 'bg-green-100 text-green-700' :
                    projectStats.dDay > 7 ? 'bg-yellow-100 text-yellow-700' :
                    projectStats.dDay > 0 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {projectStats.dDay > 0 ? `D-${projectStats.dDay}` : 
                     projectStats.dDay === 0 ? 'D-Day' : 
                     `D+${Math.abs(projectStats.dDay)}`}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleEdit}>
                📝 편집
              </Button>
              <Button variant="outline" onClick={() => setCurrentView('calendar')}>
                📅 달력보기
              </Button>
              <Button variant="primary">
                📊 보고서 생성
              </Button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 개요
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📈 진행률
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📅 일정
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 상세정보
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 프로젝트 개요 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="전체 진행률"
                value={`${projectStats.overallProgress}%`}
                subtitle="3개 단계 평균"
                color="bg-blue-500"
                icon="📈"
                trend={projectStats.overallProgress >= 50 ? 15 : projectStats.overallProgress >= 25 ? 5 : -2}
              />
              <StatCard 
                title="1단계 진행률"
                value={`${projectStats.stage1Progress}%`}
                subtitle="기본정보"
                color="bg-blue-400"
                icon="1️⃣"
              />
              <StatCard 
                title="2단계 진행률"
                value={`${projectStats.stage2Progress}%`}
                subtitle="생산준비"
                color="bg-green-500"
                icon="2️⃣"
              />
              <StatCard 
                title="3단계 진행률"
                value={`${projectStats.stage3Progress}%`}
                subtitle="양산준비"
                color="bg-purple-500"
                icon="3️⃣"
              />
            </div>

            {/* 단계별 진행률 차트 */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">📊 단계별 진행률</h2>
                <div className="text-sm text-gray-500">
                  업데이트: {new Date(targetProject.updatedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <ProgressChart
                data={[projectStats.stage1Progress, projectStats.stage2Progress, projectStats.stage3Progress, projectStats.overallProgress]}
                labels={['1단계 (기본정보)', '2단계 (생산준비)', '3단계 (양산준비)', '전체 평균']}
                colors={['#3B82F6', '#10B981', '#8B5CF6', '#6366F1']}
              />
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">📈 상세 진행률 분석</h2>
            <ProgressChart
              data={[projectStats.stage1Progress, projectStats.stage2Progress, projectStats.stage3Progress]}
              labels={['1단계 (기본정보)', '2단계 (생산준비)', '3단계 (양산준비)']}
              colors={['#3B82F6', '#10B981', '#8B5CF6']}
            />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 임박한 일정 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 임박한 일정</h3>
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-600">{task.stage}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          task.daysUntil <= 0 ? 'text-red-600' :
                          task.daysUntil <= 7 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {task.daysUntil <= 0 ? '지연됨' : 
                           task.daysUntil === 1 ? '내일' :
                           `${task.daysUntil}일 후`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(task.date).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>예정된 일정이 없습니다</p>
                </div>
              )}
            </div>

            {/* 프로젝트 메타 정보 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 프로젝트 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">생성일</label>
                  <p className="text-gray-900">
                    {new Date(targetProject.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">최종 수정일</label>
                  <p className="text-gray-900">
                    {new Date(targetProject.updatedAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">생성자</label>
                  <p className="text-gray-900">{targetProject.createdBy || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">프로젝트 상태</label>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${projectStats.status.bgColor} ${projectStats.status.textColor}`}>
                    {projectStats.status.text}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">📋 프로젝트 상세 정보</h2>
            
            <div className="space-y-8">
              {/* Stage 1 요약 */}
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-4">1단계: 기본 정보 ({projectStats.stage1Progress}%)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">제품군:</span>
                    <p className="font-medium">{targetProject.stage1?.productGroup || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">제조사:</span>
                    <p className="font-medium">{targetProject.stage1?.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">담당 연구원:</span>
                    <p className="font-medium">{targetProject.stage1?.researcher1 || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stage 2 요약 */}
              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-lg font-semibold text-green-600 mb-4">2단계: 생산 준비 ({projectStats.stage2Progress}%)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">파일럿생산일:</span>
                    <p className="font-medium">
                      {targetProject.stage2?.pilotProductionDate ? 
                        new Date(targetProject.stage2.pilotProductionDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">기술이전일:</span>
                    <p className="font-medium">
                      {targetProject.stage2?.techTransferDate ? 
                        new Date(targetProject.stage2.techTransferDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">설치 주체:</span>
                    <p className="font-medium">{targetProject.stage2?.installationEntity || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stage 3 요약 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-purple-600 mb-4">3단계: 양산 준비 ({projectStats.stage3Progress}%)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">최초양산일:</span>
                    <p className="font-medium">
                      {targetProject.stage3?.initialProductionDate ? 
                        new Date(targetProject.stage3.initialProductionDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">BOM 담당자:</span>
                    <p className="font-medium">{targetProject.stage3?.bomManager || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">단가 담당자:</span>
                    <p className="font-medium">{targetProject.stage3?.priceManager || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard_v11;