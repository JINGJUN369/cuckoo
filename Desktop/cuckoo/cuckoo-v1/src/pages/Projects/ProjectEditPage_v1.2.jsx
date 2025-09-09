import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getProjectProgress } from '../../types/project';
import { Button, Input } from '../../components/ui';
import Stage1Form_v11 from './components/Stage1Form_v1.1';
import Stage2Form_v11 from './components/Stage2Form_v1.1';
import Stage3Form_v11 from './components/Stage3Form_v1.1';

/**
 * ProjectEditPage v1.2 - 완전한 프로젝트 편집 페이지 
 * 
 * 주요 기능:
 * - URL 파라미터 기반 프로젝트 로딩
 * - Stage별 개별 저장 기능
 * - 실시간 진행률 업데이트
 * - 유효성 검사 및 에러 처리
 * - 자동 저장 및 변경 이력
 * - 저장 후 상세 페이지로 리다이렉트
 */
const ProjectEditPage_v1_2 = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user: profile } = useSupabaseAuth();
  const { projects, selectedProject, setSelectedProject, updateProject } = useSupabaseProjectStore();

  // 편집 상태 관리
  const [currentStage, setCurrentStage] = useState('basic'); // 'basic', 1, 2, 3
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // 수동저장을 위한 임시 변경사항 추적
  const [pendingChanges, setPendingChanges] = useState({});
  
  // 기본 정보 편집 상태
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    modelName: '',
    description: ''
  });

  console.log('✏️ [v1.2] ProjectEditPage rendered for project:', projectId);

  // URL 파라미터의 프로젝트 ID로 프로젝트 찾기 및 선택
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project && (!selectedProject || selectedProject.id !== projectId)) {
        console.log('✅ [v1.2] Setting selected project for edit:', project.name);
        setSelectedProject(project);
      }
    }
  }, [projectId, projects, selectedProject, setSelectedProject]);

  // 선택된 프로젝트가 변경될 때 기본 정보 초기화
  useEffect(() => {
    if (selectedProject) {
      setBasicInfo({
        name: selectedProject.name || '',
        modelName: selectedProject.modelName || '',
        description: selectedProject.description || ''
      });
    }
  }, [selectedProject]);

  // 프로젝트 진행률 계산
  const projectProgress = useMemo(() => {
    return selectedProject ? getProjectProgress(selectedProject) : { overall: 0, stage1: 0, stage2: 0, stage3: 0 };
  }, [selectedProject]);

  // 수동저장 함수 - 완료 버튼 클릭시에만 실행
  const handleSaveAllChanges = useCallback(async () => {
    if (!selectedProject || !profile) return false;
    if (Object.keys(pendingChanges).length === 0 && !hasUnsavedChanges) return true;

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log('💾 [v1.2] Manual save - all pending changes:', pendingChanges);
      console.log('💾 [v1.2] Basic info changes:', basicInfo);
      
      // 기본정보 + 모든 대기중인 변경사항을 합쳐서 저장
      const allUpdates = {
        ...pendingChanges,
        name: basicInfo.name,
        modelName: basicInfo.modelName,
        description: basicInfo.description
      };
      
      console.log('💾 [v1.2] Final updates to save:', allUpdates);
      
      // 프로젝트 업데이트
      const result = await updateProject(selectedProject.id, allUpdates);
      
      if (result) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setPendingChanges({});
        console.log('✅ [v1.2] All changes saved successfully');
        return true;
      } else {
        throw new Error('프로젝트 업데이트에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('❌ [v1.2] Error saving project:', error);
      setSaveError(error.message || '저장 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [selectedProject, profile, updateProject, pendingChanges, hasUnsavedChanges, basicInfo]);

  // Stage별 변경사항 추적 - 즉시 저장하지 않고 pendingChanges에 누적
  const handleStageUpdate = useCallback((stageNumber, stageData) => {
    console.log(`🔄 [v1.2] handleStageUpdate called - Stage ${stageNumber}`, stageData);
    const stageKey = `stage${stageNumber}`;
    
    // pendingChanges에 변경사항 누적
    setPendingChanges(prev => ({
      ...prev,
      [stageKey]: stageData
    }));
    
    // Stage 1에서 modelName이 변경되었을 때 기본정보도 업데이트
    if (stageNumber === 1 && stageData.modelName !== selectedProject?.modelName) {
      console.log(`🏷️ [v1.2] Model name will be updated: ${stageData.modelName}`);
      
      setBasicInfo(prev => ({
        ...prev,
        modelName: stageData.modelName
      }));
      
      // pendingChanges에 모델명 변경도 추가
      setPendingChanges(prev => ({
        ...prev,
        modelName: stageData.modelName
      }));
    }
    
    setHasUnsavedChanges(true);
    console.log('📝 [v1.2] Changes added to pending - will save on completion');
  }, [selectedProject?.modelName]);

  // 기본 정보 업데이트 핸들러 - 즉시 저장하지 않고 상태만 변경
  const handleBasicInfoUpdate = useCallback((field, value) => {
    setBasicInfo(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
    console.log(`📝 [v1.2] Basic info ${field} changed to:`, value, '(will save on completion)');
  }, []);

  // 완료 버튼 핸들러 - 저장 후 이동
  const handleComplete = useCallback(async () => {
    if (!selectedProject) return;
    
    // 변경사항이 있으면 저장
    if (hasUnsavedChanges || Object.keys(pendingChanges).length > 0) {
      const saveSuccess = await handleSaveAllChanges();
      if (!saveSuccess) {
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
    }
    
    navigate(`/projects/${selectedProject.id}`);
  }, [selectedProject, navigate, hasUnsavedChanges, pendingChanges, handleSaveAllChanges]);

  // 취소 버튼 핸들러
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges || Object.keys(pendingChanges).length > 0) {
      const confirmed = window.confirm('저장하지 않은 변경사항이 있습니다. 저장하지 않고 취소하시겠습니까?');
      if (!confirmed) return;
    }
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}`);
    } else {
      navigate('/projects');
    }
  }, [selectedProject, hasUnsavedChanges, pendingChanges, navigate]);

  // 페이지 이동 전 저장 확인
  const handlePageLeave = useCallback((targetPath) => {
    if (hasUnsavedChanges || Object.keys(pendingChanges).length > 0) {
      const shouldSave = window.confirm('저장하지 않은 변경사항이 있습니다. 저장하시겠습니까?');
      if (shouldSave) {
        handleSaveAllChanges().then((success) => {
          if (success) {
            navigate(targetPath);
          }
        });
      } else {
        const confirmLeave = window.confirm('정말로 저장하지 않고 이동하시겠습니까?');
        if (confirmLeave) {
          navigate(targetPath);
        }
      }
    } else {
      navigate(targetPath);
    }
  }, [hasUnsavedChanges, pendingChanges, handleSaveAllChanges, navigate]);

  // 프로젝트가 없는 경우
  if (projectId && projects.length > 0) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return (
        <div className="min-h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              프로젝트를 찾을 수 없습니다
            </h1>
            <p className="text-gray-600 mb-8">
              편집하려는 프로젝트(ID: {projectId})가 존재하지 않습니다.
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

  // 선택된 프로젝트가 없는 경우
  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            편집할 프로젝트를 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            선택된 프로젝트가 없거나 로딩 중입니다
          </p>
          <Button 
            onClick={() => navigate('/projects')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-8">
      {/* 브레드크럼 네비게이션 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button 
                onClick={() => handlePageLeave('/dashboard')} 
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                📊 대시보드
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <button 
                  onClick={() => handlePageLeave('/projects')} 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  📁 프로젝트
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <button 
                  onClick={() => handlePageLeave(`/projects/${projectId}`)}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  {basicInfo.name || selectedProject?.name || `프로젝트 ${projectId}`}
                </button>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500">편집</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* 프로젝트 정보 및 액션 버튼 */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{basicInfo.name || selectedProject.name}</h1>
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
              <span>전체 진행률: {projectProgress.overall}%</span>
              {lastSaved && (
                <span>마지막 저장: {lastSaved.toLocaleTimeString()}</span>
              )}
              {isSaving && (
                <span className="text-blue-600">저장 중...</span>
              )}
              {(hasUnsavedChanges || Object.keys(pendingChanges).length > 0) && (
                <span className="text-orange-600 font-medium">저장되지 않은 변경사항</span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
            >
              취소
            </Button>
            <button
              onClick={() => handlePageLeave(`/projects/${projectId}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSaving}
            >
              👁️ 보기 모드
            </button>
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장 및 완료'}
            </Button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {saveError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}
      </div>

      {/* Stage 탭 네비게이션 */}
      <div className="bg-gray-50 border-b border-gray-200">
        <nav className="px-4 sm:px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentStage('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentStage === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 기본 정보
            </button>
            {[1, 2, 3].map((stage) => (
              <button
                key={stage}
                onClick={() => setCurrentStage(stage)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentStage === stage
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {stage === 1 && '1단계 기본정보'}
                {stage === 2 && '2단계 생산준비'}
                {stage === 3 && '3단계 서비스준비'}
                <span className="ml-2 text-xs">
                  ({projectProgress[`stage${stage}`]}%)
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Stage별 폼 컨테이너 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {currentStage === 'basic' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h3 className="text-xl font-semibold text-blue-600">프로젝트 기본 정보</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Input
                  label="프로젝트 이름"
                  value={basicInfo.name}
                  onChange={(e) => handleBasicInfoUpdate('name', e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  required
                  className="focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Input
                  label="모델명"
                  value={basicInfo.modelName}
                  onChange={(e) => handleBasicInfoUpdate('modelName', e.target.value)}
                  placeholder="제품 모델명을 입력하세요"
                  required
                  className="focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  모델명은 프로젝트 ID 생성에 사용됩니다.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 설명
                </label>
                <textarea
                  value={basicInfo.description}
                  onChange={(e) => handleBasicInfoUpdate('description', e.target.value)}
                  rows={4}
                  placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                <p className="mb-2">💡 <strong>팁:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• 프로젝트 이름은 명확하고 구체적으로 작성하세요</li>
                  <li>• 모델명은 고유하게 설정하여 다른 프로젝트와 구분하세요</li>
                  <li>• 변경사항은 완료 버튼 클릭시에 저장됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {currentStage === 1 && (
          <Stage1Form_v11 
            project={selectedProject}
            onUpdate={(data) => handleStageUpdate(1, data)}
            mode="edit"
          />
        )}
        {currentStage === 2 && (
          <Stage2Form_v11 
            project={selectedProject}
            onUpdate={(data) => handleStageUpdate(2, data)}
            mode="edit"
          />
        )}
        {currentStage === 3 && (
          <Stage3Form_v11 
            project={selectedProject}
            onUpdate={(data) => handleStageUpdate(3, data)}
            mode="edit"
          />
        )}
      </div>
    </div>
  );
};

export default ProjectEditPage_v1_2;