import React, { useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { getProjectProgress } from '../../types/project';
import { LoadingSpinner } from '../../components/ui';
import ProjectCard_v11 from '../../components/ui/ProjectCard_v1.1';
import NewProjectModal_v11 from './components/NewProjectModal_v1.1';
import { exportProjectsToExcel } from '../../utils/excelExport';

/**
 * v1.1 ProjectList - 통합된 프로젝트 목록 시스템
 * 
 * 주요 개선사항:
 * - ProjectCard_v1.1 통합 사용
 * - 성능 최적화 (메모이제이션)
 * - 향상된 검색 및 필터링
 * - 모바일 반응형 개선
 * - 실시간 상태 업데이트
 */
const ProjectList_v11 = () => {
  console.log('🗂️ [v1.1] ProjectList rendering');

  const { state, setCurrentView, setSelectedProject, addProject } = useProjectStore();
  const { projects, ui, opinions } = state;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dday');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'list', 'grid', 'compact'
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // D-Day 계산 함수 (메모이제이션)
  const calculateDDay = useMemo(() => {
    return (project) => {
      const massProductionDate = project.stage1?.massProductionDate;
      if (!massProductionDate) return 999;
      
      const targetDate = new Date(massProductionDate);
      const today = new Date();
      return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    };
  }, []);

  // 검색어 최적화
  const searchLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);

  // 프로젝트 필터링 및 정렬 (최적화)
  const filteredAndSortedProjects = useMemo(() => {
    console.log('🔄 [v1.1] ProjectList: Filtering and sorting projects');
    
    let filtered = projects || [];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchLower) ||
        project.modelName?.toLowerCase().includes(searchLower) ||
        project.stage1?.productGroup?.toLowerCase().includes(searchLower) ||
        project.stage1?.manufacturer?.toLowerCase().includes(searchLower) ||
        project.stage1?.researcher1?.toLowerCase().includes(searchLower) ||
        project.stage1?.researcher2?.toLowerCase().includes(searchLower)
      );
    }

    // 상태 필터 (향상된 필터링)
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => {
        const progress = getProjectProgress(project);
        const dDay = calculateDDay(project);
        
        switch (filterStatus) {
          case 'high-progress':
            return progress >= 70;
          case 'medium-progress':
            return progress >= 30 && progress < 70;
          case 'low-progress':
            return progress < 30;
          case 'overdue':
            return dDay < 0;
          case 'urgent':
            return dDay >= 0 && dDay <= 7;
          case 'completed':
            return progress === 100;
          default:
            return true;
        }
      });
    }

    // 정렬 로직 (최적화)
    if (sortBy === 'dday' || sortBy === 'progress') {
      const projectsWithCache = filtered.map(project => ({
        project,
        dDay: sortBy === 'dday' ? calculateDDay(project) : 0,
        progress: sortBy === 'progress' ? getProjectProgress(project) : 0
      }));
      
      projectsWithCache.sort((a, b) => {
        switch (sortBy) {
          case 'dday':
            return a.dDay - b.dDay;
          case 'progress':
            return b.progress - a.progress;
          default:
            return 0;
        }
      });
      
      return projectsWithCache.map(item => item.project);
    } else {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'created':
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          case 'model':
            return (a.modelName || '').localeCompare(b.modelName || '');
          default:
            return 0;
        }
      });
      
      return filtered;
    }
  }, [projects, searchLower, searchTerm, sortBy, filterStatus, calculateDDay]);

  // 새 프로젝트 생성 핸들러
  const handleNewProject = useCallback((newProject) => {
    console.log('➕ [v1.1] ProjectList: Creating new project', newProject);
    
    addProject(newProject);
    setShowNewProjectModal(false);
    
    // 새 프로젝트를 선택하고 상세 페이지로 이동
    setSelectedProject(newProject);
    setCurrentView('detail');
  }, [addProject, setSelectedProject, setCurrentView]);

  // 프로젝트 선택 핸들러
  const handleProjectSelect = useCallback((project) => {
    console.log('👆 [v1.1] ProjectList: Project selected', project.name);
    
    setSelectedProject(project);
    setCurrentView('detail');
  }, [setSelectedProject, setCurrentView]);

  // 프로젝트 편집 핸들러
  const handleProjectEdit = useCallback((project) => {
    console.log('✏️ [v1.1] ProjectList: Project edit', project.name);
    
    setSelectedProject(project);
    setCurrentView('edit');
  }, [setSelectedProject, setCurrentView]);

  // 프로젝트 보기 핸들러
  const handleProjectView = useCallback((project) => {
    console.log('👁️ [v1.1] ProjectList: Project view', project.name);
    
    setSelectedProject(project);
    setCurrentView('detail');
  }, [setSelectedProject, setCurrentView]);

  // 로딩 상태
  if (ui?.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트</h1>
              <p className="text-gray-600">
                진행중인 모든 프로젝트를 관리하고 추적하세요 • {filteredAndSortedProjects.length}개 프로젝트
              </p>
            </div>
            
            {/* 뷰 모드 전환 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-md text-sm ${
                  viewMode === 'compact'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                title="컴팩트 보기"
              >
                📋
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md text-sm ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                title="리스트 보기"
              >
                📝
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md text-sm ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                title="그리드 보기"
              >
                🔲
              </button>
            </div>
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-3">
            <button 
              onClick={() => setCurrentView('calendar')}
              className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              📅 달력 보기
            </button>
            <button 
              onClick={() => setCurrentView('project-dashboard')}
              className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              📊 대시보드
            </button>
            <button 
              onClick={() => setCurrentView('completed')}
              className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              📁 완료된 프로젝트
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => exportProjectsToExcel(filteredAndSortedProjects, 'project_list')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              title="현재 필터링된 프로젝트 목록을 엑셀(CSV)로 내보내기"
            >
              📊 엑셀 추출
            </button>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ➕ 새 프로젝트
            </button>
          </div>
        </div>
        
        {/* 검색 및 필터 (향상된 버전) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="프로젝트명, 모델명, 제품군, 제조사, 담당자로 검색..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="dday">D-Day 순</option>
                <option value="progress">진행률 순</option>
                <option value="name">이름 순</option>
                <option value="model">모델명 순</option>
                <option value="created">생성일 순</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">전체 상태</option>
                <option value="completed">완료됨</option>
                <option value="high-progress">높은 진행률 (70%+)</option>
                <option value="medium-progress">보통 진행률 (30~70%)</option>
                <option value="low-progress">낮은 진행률 (30% 미만)</option>
                <option value="urgent">긴급 (D-7 이내)</option>
                <option value="overdue">지연됨</option>
              </select>
            </div>
          </div>
          
          {/* 필터 요약 */}
          {(searchTerm || filterStatus !== 'all') && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">필터링 결과:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                    검색: "{searchTerm}"
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                    상태: {
                      filterStatus === 'completed' ? '완료됨' :
                      filterStatus === 'high-progress' ? '높은 진행률' :
                      filterStatus === 'medium-progress' ? '보통 진행률' :
                      filterStatus === 'low-progress' ? '낮은 진행률' :
                      filterStatus === 'urgent' ? '긴급' :
                      filterStatus === 'overdue' ? '지연됨' : filterStatus
                    }
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                >
                  ✕ 초기화
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 에러 상태 */}
        {ui?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="text-red-800">{ui.error}</div>
          </div>
        )}

        {/* 프로젝트 목록 */}
        {filteredAndSortedProjects.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
              : viewMode === 'compact'
                ? "space-y-2"
                : "space-y-4"
          }>
            {filteredAndSortedProjects.map(project => (
              <ProjectCard_v11
                key={project.id}
                project={project}
                onClick={handleProjectSelect}
                onEdit={handleProjectEdit}
                onView={handleProjectView}
                mode={viewMode}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? '다른 검색어나 필터를 시도해보세요' 
                : '첫 번째 프로젝트를 생성하여 시작하세요'
              }
            </p>
            {(!searchTerm && filterStatus === 'all') && (
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                ➕ 첫 프로젝트 만들기
              </button>
            )}
          </div>
        )}

        {/* 최근 의견 게시판 (간소화) */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">최근 프로젝트 의견</h2>
            <p className="text-gray-600">
              모든 프로젝트의 의견과 피드백을 한눈에 확인하세요
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200">
            {opinions && opinions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {opinions.slice(0, 3).map((opinion) => (
                  <div key={opinion.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {opinion.author?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {opinion.author || '익명'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {opinion.department || '부서 미상'} • {
                              projects.find(p => p.id === opinion.projectId)?.name || '알 수 없는 프로젝트'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          opinion.status === 'resolved' 
                            ? 'bg-green-100 text-green-700'
                            : opinion.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-700'  
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {opinion.status === 'resolved' ? '완료' : 
                           opinion.status === 'reviewed' ? '검토됨' : '대기중'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(opinion.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {opinion.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {opinion.content}
                    </p>
                    
                    {opinion.replies && opinion.replies.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        💬 {opinion.replies.length}개 답변
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  등록된 의견이 없습니다
                </h3>
                <p className="text-gray-600">
                  프로젝트 상세 페이지에서 의견을 등록해보세요
                </p>
              </div>
            )}
            
            {opinions && opinions.length > 3 && (
              <div className="border-t border-gray-200 p-4 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  더 많은 의견 보기 ({opinions.length - 3}개 더)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 새 프로젝트 모달 */}
      <NewProjectModal_v11
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleNewProject}
      />
    </div>
  );
};

export default ProjectList_v11;