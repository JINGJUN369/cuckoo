import React, { useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';
import ProjectCard_v11 from '../../components/ui/ProjectCard_v1.1';
import { calculateProjectDDays } from '../../utils/dDayCalculator_v1.1';
import { exportToCsv, exportToIcal } from '../../utils/calendarExport_v1.1';

/**
 * v1.1 CompletedProjects - 완료된 프로젝트 & 아카이브 시스템
 * 
 * 주요 개선사항:
 * - 아카이브 관리 기능 강화
 * - 완료 프로젝트 통계 및 분석
 * - 고급 검색 및 필터링
 * - 프로젝트 복원 기능
 * - 완료 데이터 내보내기
 * - 성과 분석 대시보드
 * - 아카이브 백업 및 복구
 */
const CompletedProjects_v11 = () => {
  console.log('📦 [v1.1] CompletedProjects rendering');

  const { state, setCurrentView, setSelectedProject, completeProject, deleteProject } = useProjectStore();
  const { user } = useSupabaseAuth();
  const { projects = [], completedProjects = [] } = state || {};

  // 로컬 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('completedDate');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'recent', 'archived'
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all', 'thisYear', 'thisMonth', 'lastYear'
  const [filters, setFilters] = useState({
    stages: ['stage1', 'stage2', 'stage3'],
    departments: 'all',
    manufacturers: 'all',
    progressRange: [0, 100]
  });
  const [showStats, setShowStats] = useState(true);

  // 완료 가능한 프로젝트들
  const completableProjects = useMemo(() => {
    return projects.filter(project => {
      const progress = getProjectProgress(project);
      const hasCompletedMassProduction = project.stage1?.massProductionDateExecuted;
      const hasAllStagesCompleted = progress === 100;
      
      return hasCompletedMassProduction || hasAllStagesCompleted;
    });
  }, [projects]);

  // 완료된 프로젝트 필터링 및 정렬
  const filteredCompletedProjects = useMemo(() => {
    let filtered = [...completedProjects];

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchLower) ||
        project.modelName?.toLowerCase().includes(searchLower) ||
        project.id?.toLowerCase().includes(searchLower) ||
        project.stage1?.researcher1?.toLowerCase().includes(searchLower) ||
        project.stage1?.manufacturer?.toLowerCase().includes(searchLower)
      );
    }

    // 기간 필터
    if (selectedPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter(project => {
        const completedDate = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
        
        switch (selectedPeriod) {
          case 'thisYear':
            return completedDate.getFullYear() === now.getFullYear();
          case 'thisMonth':
            return completedDate.getFullYear() === now.getFullYear() && 
                   completedDate.getMonth() === now.getMonth();
          case 'lastYear':
            return completedDate.getFullYear() === now.getFullYear() - 1;
          default:
            return true;
        }
      });
    }

    // 제조사 필터
    if (filters.manufacturers !== 'all') {
      filtered = filtered.filter(project => 
        project.stage1?.manufacturer === filters.manufacturers
      );
    }

    // 진행률 범위 필터
    filtered = filtered.filter(project => {
      const progress = getProjectProgress(project);
      return progress >= filters.progressRange[0] && progress <= filters.progressRange[1];
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return getProjectProgress(b) - getProjectProgress(a);
        case 'duration':
          const aDuration = getDuration(a);
          const bDuration = getDuration(b);
          return bDuration - aDuration;
        case 'completedDate':
        default:
          const aDate = a.completedAt || a.stage1?.massProductionDate || a.createdAt;
          const bDate = b.completedAt || b.stage1?.massProductionDate || b.createdAt;
          return new Date(bDate) - new Date(aDate);
      }
    });

    return filtered;
  }, [completedProjects, searchTerm, selectedPeriod, filters, sortBy]);

  // 완료 프로젝트 통계
  const completedStats = useMemo(() => {
    const stats = {
      total: completedProjects.length,
      thisMonth: 0,
      thisYear: 0,
      averageDuration: 0,
      byStage: { stage1: 0, stage2: 0, stage3: 0 },
      byManufacturer: {},
      byDepartment: {},
      successRate: 0,
      totalValue: 0
    };

    const now = new Date();
    let totalDuration = 0;

    completedProjects.forEach(project => {
      const completedDate = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
      
      // 기간별 통계
      if (completedDate.getFullYear() === now.getFullYear()) {
        stats.thisYear++;
        if (completedDate.getMonth() === now.getMonth()) {
          stats.thisMonth++;
        }
      }

      // 소요기간 계산
      const duration = getDuration(project);
      totalDuration += duration;

      // 단계별 통계 (가장 높은 완료 단계)
      const progress = getProjectProgress(project);
      if (progress === 100) stats.byStage.stage3++;
      else if (project.stage2 && Object.values(project.stage2).some(v => v)) stats.byStage.stage2++;
      else stats.byStage.stage1++;

      // 제조사별 통계
      const manufacturer = project.stage1?.manufacturer || '기타';
      stats.byManufacturer[manufacturer] = (stats.byManufacturer[manufacturer] || 0) + 1;

      // 부서별 통계
      const department = project.stage1?.department || '기타';
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;
    });

    stats.averageDuration = completedProjects.length > 0 ? Math.round(totalDuration / completedProjects.length) : 0;
    stats.successRate = projects.length > 0 ? Math.round((completedProjects.length / (projects.length + completedProjects.length)) * 100) : 0;

    return stats;
  }, [completedProjects, projects.length]);

  // 프로젝트 소요기간 계산
  const getDuration = useCallback((project) => {
    const startDate = new Date(project.createdAt);
    const endDate = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // 소요기간 포맷팅
  const formatDuration = useCallback((days) => {
    if (days < 30) {
      return `${days}일`;
    } else if (days < 365) {
      return `${Math.floor(days / 30)}개월`;
    } else {
      return `${Math.floor(days / 365)}년 ${Math.floor((days % 365) / 30)}개월`;
    }
  }, []);

  // 프로젝트 완료 처리
  const handleCompleteProject = useCallback(async (project) => {
    if (!window.confirm(`"${project.name}" 프로젝트를 완료 처리하시겠습니까?`)) {
      return;
    }

    try {
      await completeProject(project.id);
      
      console.log('✅ [v1.1] Project completed successfully');
    } catch (error) {
      console.error('❌ [v1.1] Error completing project:', error);
      alert('프로젝트 완료 처리 중 오류가 발생했습니다.');
    }
  }, [completeProject, user]);

  // 프로젝트 복원
  const handleRestoreProject = useCallback(async (project) => {
    if (!window.confirm(`"${project.name}" 프로젝트를 활성 프로젝트로 복원하시겠습니까?`)) {
      return;
    }

    try {
      // TODO: 복원 기능은 추후 구현 예정
      alert('프로젝트 복원 기능은 현재 개발 중입니다.');
      console.log('✅ [v1.1] Project restore requested (not implemented yet)');
    } catch (error) {
      console.error('❌ [v1.1] Error restoring project:', error);
      alert('프로젝트 복원 중 오류가 발생했습니다.');
    }
  }, [user]);

  // 완료 데이터 내보내기
  const handleExportCompleted = useCallback((format = 'csv') => {
    const exportData = filteredCompletedProjects.map(project => ({
      projectName: project.name,
      modelName: project.modelName,
      id: project.id,
      researcher: project.stage1?.researcher1 || '',
      manufacturer: project.stage1?.manufacturer || '',
      department: project.stage1?.department || '',
      progress: getProjectProgress(project),
      startDate: project.createdAt,
      completedDate: project.completedAt || project.stage1?.massProductionDate,
      duration: formatDuration(getDuration(project)),
      completedBy: project.completedByName || ''
    }));

    if (format === 'csv') {
      const csvHeaders = [
        '프로젝트명', '모델명', 'ID', '담당자', '제조사', '부서', 
        '진행률(%)', '시작일', '완료일', '소요기간', '완료처리자'
      ];

      const csvData = exportData.map(row => [
        row.projectName, row.modelName, row.id, row.researcher, 
        row.manufacturer, row.department, row.progress,
        row.startDate?.split('T')[0] || '', 
        row.completedDate?.split('T')[0] || '',
        row.duration, row.completedBy
      ]);

      const csvContent = '\uFEFF' + [csvHeaders, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `완료된_프로젝트_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }, [filteredCompletedProjects, getDuration, formatDuration]);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView('main-dashboard')}
              className="text-sm"
            >
              ← 대시보드
            </Button>
            <span className="text-sm text-gray-500">프로젝트 관리</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">완료된 프로젝트 & 아카이브</h1>
          <p className="text-gray-600 mt-1">
            완료된 프로젝트 관리, 통계 분석 및 아카이브 시스템
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('list')}
          >
            활성 프로젝트
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExportCompleted('csv')}
          >
            📊 데이터 내보내기
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? '📈 통계 숨기기' : '📈 통계 보기'}
          </Button>
        </div>
      </div>

      {/* 통계 대시보드 */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완료된 프로젝트</p>
                <p className="text-3xl font-bold text-green-600">{completedStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  성공률: {completedStats.successRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">이번 달 완료</p>
                <p className="text-3xl font-bold text-blue-600">{completedStats.thisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">
                  올해 총: {completedStats.thisYear}개
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 소요기간</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatDuration(completedStats.averageDuration)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ({completedStats.averageDuration}일)
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완료 가능</p>
                <p className="text-3xl font-bold text-orange-600">{completableProjects.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  완료 처리 대기 중
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏁</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 완료 가능한 프로젝트들 */}
      {completableProjects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">완료 처리 가능한 프로젝트</h2>
              <p className="text-gray-600 text-sm mt-1">
                진행률이 100%이거나 양산이 완료된 프로젝트들입니다
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completableProjects.slice(0, 6).map(project => (
              <div key={project.id} className="relative">
                <ProjectCard_v11 
                  project={project} 
                  mode="compact"
                  showProgress={true}
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentView('project-dashboard');
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteProject(project);
                    }}
                  >
                    완료처리
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {completableProjects.length > 6 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                총 {completableProjects.length}개 중 6개 표시됨
              </p>
            </div>
          )}
        </div>
      )}

      {/* 완료된 프로젝트 목록 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">완료된 프로젝트 아카이브</h2>
            <p className="text-gray-600 text-sm mt-1">
              총 {filteredCompletedProjects.length}개의 완료된 프로젝트
            </p>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체 기간</option>
              <option value="thisMonth">이번 달</option>
              <option value="thisYear">올해</option>
              <option value="lastYear">작년</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="completedDate">완료일순</option>
              <option value="name">이름순</option>
              <option value="progress">진행률순</option>
              <option value="duration">소요기간순</option>
            </select>
          </div>
        </div>

        {/* 고급 필터 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">제조사</label>
              <select
                value={filters.manufacturers}
                onChange={(e) => updateFilters({ manufacturers: e.target.value })}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                {Object.keys(completedStats.byManufacturer).map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer} ({completedStats.byManufacturer[manufacturer]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">진행률 범위</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.progressRange[0]}
                  onChange={(e) => updateFilters({ 
                    progressRange: [parseInt(e.target.value), filters.progressRange[1]]
                  })}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">
                  {filters.progressRange[0]}% - {filters.progressRange[1]}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.progressRange[1]}
                  onChange={(e) => updateFilters({ 
                    progressRange: [filters.progressRange[0], parseInt(e.target.value)]
                  })}
                  className="w-20"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedPeriod('all');
                updateFilters({
                  stages: ['stage1', 'stage2', 'stage3'],
                  departments: 'all',
                  manufacturers: 'all',
                  progressRange: [0, 100]
                });
              }}
            >
              필터 초기화
            </Button>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {filteredCompletedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedPeriod !== 'all' ? '검색 결과가 없습니다' : '완료된 프로젝트가 없습니다'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedPeriod !== 'all' ? '필터 조건을 조정해보세요' : '프로젝트를 완료하면 여기에 표시됩니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCompletedProjects.map(project => (
              <div key={project.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        ✓ 완료됨
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {getProjectProgress(project)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">모델명:</span> {project.modelName || '-'}
                      </div>
                      <div>
                        <span className="font-medium">담당자:</span> {project.stage1?.researcher1 || '-'}
                      </div>
                      <div>
                        <span className="font-medium">제조사:</span> {project.stage1?.manufacturer || '-'}
                      </div>
                      <div>
                        <span className="font-medium">소요기간:</span> {formatDuration(getDuration(project))}
                      </div>
                      <div>
                        <span className="font-medium">시작일:</span> {project.createdAt?.split('T')[0] || '-'}
                      </div>
                      <div>
                        <span className="font-medium">완료일:</span> {
                          (project.completedAt || project.stage1?.massProductionDate)?.split('T')[0] || '-'
                        }
                      </div>
                      <div>
                        <span className="font-medium">완료처리자:</span> {project.completedByName || '-'}
                      </div>
                      <div>
                        <span className="font-medium">아카이브 사유:</span> {
                          project.archiveReason === 'normal_completion' ? '정상 완료' : '기타'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project);
                        setCurrentView('project-dashboard');
                      }}
                    >
                      📊 상세보기
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreProject(project)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      🔄 복원
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 통계 요약 */}
      {showStats && filteredCompletedProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 단계별 완료 통계 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">단계별 완료 현황</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600">1단계 완료</span>
                <span className="font-semibold">{completedStats.byStage.stage1}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">2단계 완료</span>
                <span className="font-semibold">{completedStats.byStage.stage2}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">3단계 완료</span>
                <span className="font-semibold">{completedStats.byStage.stage3}개</span>
              </div>
            </div>
          </div>

          {/* 제조사별 완료 통계 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">제조사별 완료 현황</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(completedStats.byManufacturer)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([manufacturer, count]) => (
                  <div key={manufacturer} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">{manufacturer}</span>
                    <span className="font-semibold">{count}개</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedProjects_v11;