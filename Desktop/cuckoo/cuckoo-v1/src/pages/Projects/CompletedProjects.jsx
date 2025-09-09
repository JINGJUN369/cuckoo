import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';

const CompletedProjects = () => {
  const { state, setCurrentView, setSelectedProject, moveToCompleted, restoreProject } = useProjectStore();
  const { projects, completedProjects } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('completedDate'); // 'completedDate', 'name', 'progress'
  // const [viewMode, setViewMode] = useState('all'); // 'all', 'archived', 'active' - 현재 미사용
  
  // 완료 가능한 프로젝트들 (진행률 100% 또는 주요 마일스톤 완료)
  const completableProjects = projects.filter(project => {
    const progress = getProjectProgress(project);
    const hasCompletedMassProduction = project.stage1?.massProductionDateExecuted;
    return progress === 100 || hasCompletedMassProduction;
  });

  // 검색 및 정렬된 완료 프로젝트
  const filteredAndSortedProjects = useMemo(() => {
    // 모든 완료된 프로젝트들
    const allCompletedProjects = [
      ...completedProjects,
      ...projects.filter(project => getProjectProgress(project) === 100)
    ];
    
    let filtered = allCompletedProjects;

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.id.toLowerCase().includes(searchLower) ||
        (project.stage1?.researcher1 && project.stage1.researcher1.toLowerCase().includes(searchLower))
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return getProjectProgress(b) - getProjectProgress(a);
        case 'completedDate':
        default:
          const aDate = a.completedAt || a.stage1?.massProductionDate || a.createdAt;
          const bDate = b.completedAt || b.stage1?.massProductionDate || b.createdAt;
          return new Date(bDate) - new Date(aDate);
      }
    });

    return filtered;
  }, [completedProjects, projects, searchTerm, sortBy]);

  const handleCompleteProject = async (project) => {
    if (window.confirm(`"${project.name}" 프로젝트를 완료 처리하시겠습니까?`)) {
      try {
        moveToCompleted(project.id);
        alert('프로젝트가 완료 처리되었습니다.');
      } catch (error) {
        alert('프로젝트 완료 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRestoreProject = async (project) => {
    if (window.confirm(`"${project.name}" 프로젝트를 활성 프로젝트로 복원하시겠습니까?`)) {
      try {
        restoreProject(project.id);
        alert('프로젝트가 복원되었습니다.');
      } catch (error) {
        alert('프로젝트 복원 중 오류가 발생했습니다.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectDuration = (project) => {
    const startDate = new Date(project.createdAt);
    const endDate = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays}일`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}개월`;
    } else {
      return `${Math.floor(diffDays / 365)}년 ${Math.floor((diffDays % 365) / 30)}개월`;
    }
  };

  const ProjectCard = ({ project, isCompleted = true }) => {
    const progress = getProjectProgress(project);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                {progress === 100 && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    ✓ 완료
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>ID: {project.id}</p>
                <p>담당자: {project.stage1?.researcher1 || '-'}</p>
                <p>제조사: {project.stage1?.manufacturer || '-'}</p>
                <p>진행률: {progress}%</p>
                {isCompleted && (
                  <p>완료일: {formatDate(project.completedAt || project.stage1?.massProductionDate)}</p>
                )}
                <p>소요기간: {getProjectDuration(project)}</p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProject(project);
                  setCurrentView('project-dashboard');
                }}
              >
                상세보기
              </Button>
              
              {isCompleted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreProject(project)}
                >
                  복원
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCompleteProject(project)}
                >
                  완료처리
                </Button>
              )}
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
              className="text-sm"
            >
              ← 대시보드
            </Button>
            <span className="text-sm text-gray-500">프로젝트 관리</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">완료된 프로젝트</h1>
          <p className="text-gray-600 mt-1">
            완료된 프로젝트 관리 및 보관소
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('list')}
          >
            활성 프로젝트
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료된 프로젝트</p>
              <p className="text-3xl font-bold text-green-600">{filteredAndSortedProjects.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료 가능</p>
              <p className="text-3xl font-bold text-blue-600">{completableProjects.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏁</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 완료</p>
              <p className="text-3xl font-bold text-purple-600">
                {filteredAndSortedProjects.filter(p => {
                  const completedDate = new Date(p.completedAt || p.stage1?.massProductionDate || '1900-01-01');
                  const now = new Date();
                  return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 소요기간</p>
              <p className="text-3xl font-bold text-orange-600">
                {filteredAndSortedProjects.length > 0 
                  ? Math.round(
                      filteredAndSortedProjects.reduce((acc, project) => {
                        const start = new Date(project.createdAt);
                        const end = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
                        return acc + Math.abs(end - start) / (1000 * 60 * 60 * 24);
                      }, 0) / filteredAndSortedProjects.length
                    )
                  : 0
                }일
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

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
              <ProjectCard key={project.id} project={project} isCompleted={false} />
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
            <h2 className="text-xl font-semibold text-gray-900">완료된 프로젝트 목록</h2>
            <p className="text-gray-600 text-sm mt-1">
              총 {filteredAndSortedProjects.length}개의 완료된 프로젝트
            </p>
          </div>

          {/* 검색 및 정렬 */}
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="completedDate">완료일순</option>
              <option value="name">이름순</option>
              <option value="progress">진행률순</option>
            </select>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '완료된 프로젝트가 없습니다'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? '다른 검색어를 시도해보세요' : '프로젝트를 완료하면 여기에 표시됩니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProjects.map(project => (
              <ProjectCard key={project.id} project={project} isCompleted={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedProjects;