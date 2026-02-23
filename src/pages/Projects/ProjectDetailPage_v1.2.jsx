import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getProjectProgress } from '../../types/project';
// import ProjectDetail_v11 from './ProjectDetail_v1.1'; // v1.2에서는 직접 구현
import OpinionForm_v1_2 from './components/OpinionForm_v1.2';
import OpinionList_v1_2 from './components/OpinionList_v1.2';
import Stage1Form_v11 from './components/Stage1Form_v1.1';
import Stage2Form_v11 from './components/Stage2Form_v1.1';
import Stage3Form_v11 from './components/Stage3Form_v1.1';

/**
 * ProjectDetailPage v1.2 - 완전한 프로젝트 상세 페이지
 * 
 * 주요 기능:
 * - 프로젝트 기본 정보 표시
 * - 의견 작성 및 관리 시스템
 * - 실시간 의견 카운트 업데이트
 * - Stage별 진행률 표시
 */
const ProjectDetailPage_v1_2 = () => {
  const { id: projectId } = useParams();
  const location = useLocation();
  const { user: profile } = useSupabaseAuth();
  const { projects, completedProjects, selectedProject, setSelectedProject, opinions } = useSupabaseProjectStore();

  // URL 쿼리 파라미터에서 초기 탭 설정
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'overview';

  // 상태 관리
  const [activeTab, setActiveTab] = useState(initialTab);
  const [opinionRefreshKey, setOpinionRefreshKey] = useState(0);

  // 완료된 프로젝트인지 확인
  const isCompletedProject = useMemo(() => {
    if (!projectId) return false;
    return completedProjects.some(p => p.id === projectId);
  }, [projectId, completedProjects]);

  console.log('📋 [v1.2] ProjectDetailPage rendered for project:', projectId);

  // 공개 보고서 생성 함수
  const handleCreatePublicReport = () => {
    if (!selectedProject || !profile) {
      alert('프로젝트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reportData = {
      id: reportId,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      modelName: selectedProject.model_name || selectedProject.modelName,
      createdBy: profile.name,
      createdAt: new Date().toISOString(),
      projectData: JSON.parse(JSON.stringify(selectedProject)),
      isActive: true
    };

    // localStorage에 공개 보고서 저장
    const existingReports = JSON.parse(localStorage.getItem('publicReports') || '[]');
    existingReports.push(reportData);
    localStorage.setItem('publicReports', JSON.stringify(existingReports));

    // 공개 URL 생성
    const publicUrl = `${window.location.origin}/public-report/${reportId}`;
    
    // 성공 메시지와 함께 URL 표시
    alert(`보고서가 생성되었습니다!\n\n공개 URL:\n${publicUrl}\n\n이 URL을 통해 로그인 없이 프로젝트 정보를 확인할 수 있습니다.`);
    
    // URL을 클립보드에 복사
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl).then(() => {
        console.log('📋 공개 보고서 URL이 클립보드에 복사되었습니다:', publicUrl);
      });
    }
  };

  // 프로젝트 진행률 계산
  const projectProgress = useMemo(() => {
    return selectedProject ? getProjectProgress(selectedProject) : { overall: 0, stage1: 0, stage2: 0, stage3: 0 };
  }, [selectedProject]);

  // 프로젝트별 의견 카운트
  const opinionCount = useMemo(() => {
    if (!selectedProject) return 0;
    return opinions.filter(opinion =>
      opinion.project_id === selectedProject.id
    ).length;
  }, [opinions, selectedProject]);

  // 의견 업데이트 핸들러
  const handleOpinionUpdate = () => {
    setOpinionRefreshKey(prev => prev + 1);
  };

  // URL 파라미터의 프로젝트 ID로 프로젝트 찾기 및 선택
  useEffect(() => {
    if (projectId) {
      // 활성 프로젝트에서 먼저 찾기
      let project = projects.find(p => p.id === projectId);
      
      // 활성 프로젝트에 없으면 완료된 프로젝트에서 찾기
      if (!project) {
        project = completedProjects.find(p => p.id === projectId);
        if (project) {
          console.log('✅ [v1.2] Found project in completed projects:', project.name);
        }
      }
      
      if (project && (!selectedProject || selectedProject.id !== projectId)) {
        console.log('✅ [v1.2] Setting selected project:', project.name);
        setSelectedProject(project);
      }
    }
  }, [projectId, projects, completedProjects, selectedProject, setSelectedProject]);

  // 프로젝트가 없는 경우
  if (projectId && (projects.length > 0 || completedProjects.length > 0)) {
    const project = projects.find(p => p.id === projectId) || completedProjects.find(p => p.id === projectId);
    if (!project) {
      return (
        <div className="min-h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              프로젝트를 찾을 수 없습니다
            </h1>
            <p className="text-gray-600 mb-8">
              요청하신 프로젝트(ID: {projectId})가 존재하지 않습니다.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              프로젝트 목록으로 돌아가기
            </Link>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-full pb-8">
      {/* 브레드크럼 네비게이션 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                📊 대시보드
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link 
                  to="/projects" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  📁 프로젝트
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500">
                  {selectedProject?.name || `프로젝트 ${projectId}`}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* 프로젝트 정보 및 액션 버튼들 */}
        {selectedProject && (
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
                {isCompletedProject && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    ✅ 완료된 프로젝트
                  </span>
                )}
              </div>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                <span>전체 진행률: {projectProgress.overall}%</span>
                <span>•</span>
                <span>의견: {opinionCount}개</span>
                <span>•</span>
                <span>모델명: {selectedProject.model_name || selectedProject.modelName || selectedProject.stage1?.modelName || 'N/A'}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/projects/${projectId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ✏️ 편집
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                📅 일정 보기
              </Link>
              <button
                onClick={() => handleCreatePublicReport()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                📊 보고서 제출
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 탭 네비게이션 - 개선된 버튼 스타일 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="flex space-x-1 mt-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-t-lg font-medium text-sm transition-all duration-200 border-b-2 ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            📊 프로젝트 정보
          </button>
          <button
            onClick={() => setActiveTab('opinions')}
            className={`px-6 py-3 rounded-t-lg font-medium text-sm transition-all duration-200 border-b-2 ${
              activeTab === 'opinions'
                ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            💬 의견 ({opinionCount})
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 진행률 요약 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">진행률 요약</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{projectProgress.overall}%</div>
                  <div className="text-sm text-gray-600">전체</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${projectProgress.overall}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{projectProgress.stage1}%</div>
                  <div className="text-sm text-gray-600 font-medium">1단계 기본정보</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectProgress.stage1}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{projectProgress.stage2}%</div>
                  <div className="text-sm text-gray-600 font-medium">2단계 생산준비</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectProgress.stage2}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{projectProgress.stage3}%</div>
                  <div className="text-sm text-gray-600 font-medium">3단계 서비스준비</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectProgress.stage3}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stage별 상세 정보 */}
            {selectedProject && (
              <div className="space-y-8">
                <Stage1Form_v11 
                  project={selectedProject}
                  mode="view"
                />
                <Stage2Form_v11 
                  project={selectedProject}
                  mode="view"
                />
                <Stage3Form_v11 
                  project={selectedProject}
                  mode="view"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'opinions' && selectedProject && (
          <div className="space-y-8">
            {/* 의견 작성 폼 */}
            <OpinionForm_v1_2
              project={selectedProject}
              onOpinionAdded={handleOpinionUpdate}
            />

            {/* 의견 목록 */}
            <OpinionList_v1_2
              project={selectedProject}
              onOpinionUpdate={handleOpinionUpdate}
              key={opinionRefreshKey}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage_v1_2;