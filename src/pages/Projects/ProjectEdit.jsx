import React, { useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';
import Stage1Form from './components/Stage1Form';
import Stage2Form from './components/Stage2Form';
import Stage3Form from './components/Stage3Form';
import ProjectProgress from './components/ProjectProgress';

const ProjectEdit = () => {
  const { state, setCurrentView, updateProject, moveToCompleted } = useProjectStore();
  
  // 임시로 localStorage에서 직접 사용자 정보 가져오기
  const getCurrentUser = () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };
  
  const user = getCurrentUser();
  const { selectedProject } = state;
  
  console.log('ProjectEdit rendered with selectedProject:', selectedProject?.name || 'None');
  
  const [currentStage, setCurrentStage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            편집할 프로젝트를 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            선택된 프로젝트가 없거나 삭제되었습니다
          </p>
          <Button onClick={() => setCurrentView('list')}>
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdate = (stage, field, value) => {
    // Create updates object with only the changed values
    const updates = {
      [stage]: {
        ...selectedProject[stage],
        [field]: value
      }
    };
    
    // Update via store - store will automatically update selectedProject
    updateProject(selectedProject.id, updates, user?.id);
    setHasUnsavedChanges(true);
    console.log('Field updated:', { stage, field, value });
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    alert('프로젝트가 저장되었습니다!');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('변경사항이 저장되지 않을 수 있습니다. 계속하시겠습니까?')) {
        setCurrentView('project-dashboard');
      }
    } else {
      setCurrentView('project-dashboard');
    }
  };

  const overallProgress = getProjectProgress(selectedProject);

  const handleCompleteProject = () => {
    if (window.confirm(`"${selectedProject.name}" 프로젝트를 완료 처리하시겠습니까?\n\n완료된 프로젝트는 "완료된 프로젝트" 페이지에서 관리됩니다.`)) {
      try {
        moveToCompleted(selectedProject.id);
        alert('프로젝트가 완료 처리되었습니다!');
        setCurrentView('completed');
      } catch (error) {
        alert('프로젝트 완료 처리 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="text-sm"
            >
              ← 돌아가기
            </Button>
            <span className="text-sm text-gray-500">프로젝트 편집</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name} 편집</h1>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-gray-600">
            {selectedProject.modelName && (
              <span className="text-blue-600 font-medium">모델: {selectedProject.modelName}</span>
            )}
            <span>ID: {selectedProject.id}</span>
            <span>전체 진행률: {overallProgress}%</span>
            {hasUnsavedChanges && (
              <span className="text-orange-600 font-medium">● 저장되지 않은 변경사항</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave}
            className={hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {hasUnsavedChanges ? '💾 저장' : '저장됨'}
          </Button>
          <Button 
            variant="secondary"
            onClick={handleCompleteProject}
          >
            ✅ 프로젝트 완료
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <ProjectProgress project={selectedProject} />

      {/* Stage Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-2">
          {[1, 2, 3].map((stage, index) => (
            <React.Fragment key={stage}>
              <button
                onClick={() => setCurrentStage(stage)}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                  currentStage === stage
                    ? stage === 1
                      ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-300'
                      : stage === 2
                      ? 'bg-green-500 text-white shadow-lg border-2 border-green-300'
                      : 'bg-purple-500 text-white shadow-lg border-2 border-purple-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{stage}단계</span>
                  <span className="text-sm mt-1">
                    {stage === 1 && '기본 정보'}
                    {stage === 2 && '생산 준비'}
                    {stage === 3 && '양산 준비'}
                  </span>
                </div>
              </button>
              {index < 2 && (
                <div className="w-12 h-1 bg-gray-300 rounded"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stage Forms */}
      <div className="min-h-96">
        {currentStage === 1 && (
          <Stage1Form 
            project={selectedProject}
            onUpdate={handleUpdate}
          />
        )}
        {currentStage === 2 && (
          <Stage2Form 
            project={selectedProject}
            onUpdate={handleUpdate}
          />
        )}
        {currentStage === 3 && (
          <Stage3Form 
            project={selectedProject}
            onUpdate={handleUpdate}
          />
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentView('project-dashboard')}
            >
              대시보드 보기
            </Button>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setCurrentView('detail')}
            >
              상세보기 모드
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className={hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {hasUnsavedChanges ? '💾 저장' : '저장됨'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCompleteProject}
            >
              ✅ 프로젝트 완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEdit;