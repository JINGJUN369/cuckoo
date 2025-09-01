import React, { useMemo } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress, getStageProgress } from '../../types/project';

const MainDashboard = () => {
  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { projects } = state;

  // 통계 계산
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => getProjectProgress(p) === 100).length;
    const activeProjects = totalProjects - completedProjects;
    
    // D-Day 계산
    const calculateDDay = (project) => {
      const massProductionDate = project.stage1?.massProductionDate;
      if (!massProductionDate) return null;
      const targetDate = new Date(massProductionDate);
      const today = new Date();
      return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    };

    const overdueProjects = projects.filter(p => {
      const dDay = calculateDDay(p);
      return dDay !== null && dDay < 0;
    }).length;

    const avgProgress = totalProjects > 0 
      ? Math.round(projects.reduce((sum, p) => sum + getProjectProgress(p), 0) / totalProjects)
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      avgProgress
    };
  }, [projects]);

  // 우선순위 프로젝트 (D-Day 기준)
  const priorityProjects = useMemo(() => {
    const calculateDDay = (project) => {
      const massProductionDate = project.stage1?.massProductionDate;
      if (!massProductionDate) return 999;
      const targetDate = new Date(massProductionDate);
      const today = new Date();
      return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    };

    return projects
      .filter(p => getProjectProgress(p) < 100)
      .sort((a, b) => calculateDDay(a) - calculateDDay(b))
      .slice(0, 5);
  }, [projects]);

  const StatCard = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`text-3xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
            <p className="text-gray-600">
              전체 프로젝트 현황과 중요 알림을 확인하세요
            </p>
          </div>
          
          <button 
            onClick={() => setCurrentView('list')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            📋 프로젝트 목록
          </button>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="총 프로젝트"
            value={stats.totalProjects}
            icon="📊"
            color="text-blue-600"
            description={`평균 진행률 ${stats.avgProgress}%`}
          />
          <StatCard 
            title="진행중"
            value={stats.activeProjects}
            icon="🔄"
            color="text-green-600"
            description="활성 프로젝트"
          />
          <StatCard 
            title="완료"
            value={stats.completedProjects}
            icon="✅"
            color="text-gray-600"
            description="완료된 프로젝트"
          />
          <StatCard 
            title="지연됨"
            value={stats.overdueProjects}
            icon="⚠️"
            color="text-red-600"
            description="D-Day 초과 프로젝트"
          />
        </div>

        {/* 우선순위 프로젝트 */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🎯 우선순위 프로젝트</h2>
            <p className="text-sm text-gray-600">D-Day 기준 상위 5개 프로젝트</p>
          </div>
          <div className="p-6">
            {priorityProjects.length > 0 ? (
              <div className="space-y-4">
                {priorityProjects.map((project) => {
                  const progress = getProjectProgress(project);
                  const stage1Progress = getStageProgress(project, 'stage1');
                  const stage2Progress = getStageProgress(project, 'stage2');
                  const stage3Progress = getStageProgress(project, 'stage3');
                  const dDay = project.stage1?.massProductionDate 
                    ? Math.ceil((new Date(project.stage1.massProductionDate) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div 
                      key={project.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedProject(project);
                        setCurrentView('detail');
                      }}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{project.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          {project.modelName && (
                            <p className="text-blue-600 font-medium">모델: {project.modelName}</p>
                          )}
                          <p>
                            {project.stage1?.productGroup} • {project.stage1?.manufacturer}
                          </p>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">전체 진행률</span>
                            <span className="text-xs text-gray-900 font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          
                          {/* 단계별 진척률 */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <span className="text-blue-400 opacity-60 text-xs">🔵</span>
                                <span className="text-xs text-gray-500">1단계</span>
                              </div>
                              <div className="bg-blue-50 rounded-full h-1">
                                <div 
                                  className="bg-blue-300 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${stage1Progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-blue-400 font-medium mt-1">{stage1Progress}%</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <span className="text-green-400 opacity-60 text-xs">🟢</span>
                                <span className="text-xs text-gray-500">2단계</span>
                              </div>
                              <div className="bg-green-50 rounded-full h-1">
                                <div 
                                  className="bg-green-300 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${stage2Progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-green-400 font-medium mt-1">{stage2Progress}%</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <span className="text-purple-400 opacity-60 text-xs">🟣</span>
                                <span className="text-xs text-gray-500">3단계</span>
                              </div>
                              <div className="bg-purple-50 rounded-full h-1">
                                <div 
                                  className="bg-purple-300 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${stage3Progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-purple-400 font-medium mt-1">{stage3Progress}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        {dDay !== null && (
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            dDay < 0 
                              ? 'bg-red-100 text-red-700'
                              : dDay < 30 
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {dDay < 0 ? `D+${Math.abs(dDay)}` : `D-${dDay}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p>우선순위 프로젝트가 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 진행률 분포 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📈 진행률 분포</h2>
            <p className="text-sm text-gray-600">프로젝트별 진행률 현황</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 단계별 평균 진행률 */}
              {['stage1', 'stage2', 'stage3'].map((stage, index) => {
                const stageProjects = projects.filter(p => p[stage]);
                const avgStageProgress = stageProjects.length > 0
                  ? Math.round(stageProjects.reduce((sum, p) => {
                      // 각 단계의 완료된 필드 수 계산
                      const stageData = p[stage];
                      if (!stageData) return sum;
                      
                      const fields = Object.keys(stageData);
                      const completedFields = fields.filter(field => {
                        const value = stageData[field];
                        return value && value !== '' && value !== false;
                      }).length;
                      
                      return sum + (completedFields / fields.length * 100);
                    }, 0) / stageProjects.length)
                  : 0;

                const stageNames = ['1단계 (기본정보)', '2단계 (생산준비)', '3단계 (양산준비)'];
                const stageColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];

                return (
                  <div key={stage} className="text-center">
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-gray-900">{avgStageProgress}%</div>
                      <div className="text-sm text-gray-600">{stageNames[index]}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${stageColors[index]} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${avgStageProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;