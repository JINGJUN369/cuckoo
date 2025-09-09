import React, { useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';
import Stage1Form from './components/Stage1Form';
import Stage2Form from './components/Stage2Form';
import Stage3Form from './components/Stage3Form';
import ProjectProgress from './components/ProjectProgress';
import OpinionForm from './components/OpinionForm';
import OpinionList from './components/OpinionList';

const ProjectDetail = () => {
  const { state, setCurrentView, updateProject, addOpinion, updateOpinion, moveToCompleted } = useProjectStore();
  
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
  const { selectedProject, opinions } = state;
  
  console.log('ProjectDetail rendered with selectedProject:', selectedProject?.name || 'None');
  
  const [currentStage, setCurrentStage] = useState(1);
  const [activeTab, setActiveTab] = useState('form'); // 'form', 'opinions'
  const [showOpinionForm, setShowOpinionForm] = useState(false);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            프로젝트를 찾을 수 없습니다
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
    console.log('Field updated:', { stage, field, value });
  };

  const overallProgress = getProjectProgress(selectedProject);

  // 프로젝트 관련 의견들 필터링
  const projectOpinions = opinions.filter(opinion => opinion.projectId === selectedProject.id);

  const handleOpinionSubmit = (opinion) => {
    addOpinion(opinion);
    setShowOpinionForm(false);
  };

  const handleOpinionStatusUpdate = (opinionId, newStatus) => {
    updateOpinion(opinionId, { status: newStatus });
  };

  const handleOpinionReply = (opinion) => {
    // 간단한 답변 예시
    const reply = window.prompt('답변을 입력하세요:');
    if (reply && reply.trim()) {
      updateOpinion(opinion.id, {
        reply: {
          content: reply.trim(),
          createdAt: new Date().toISOString(),
          author: '관리자'
        }
      });
    }
  };

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
              onClick={() => setCurrentView('list')}
              className="text-sm"
            >
              ← 목록
            </Button>
            <span className="text-sm text-gray-500">프로젝트 관리</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h1>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-gray-600">
            {selectedProject.modelName && (
              <span className="text-blue-600 font-medium">모델: {selectedProject.modelName}</span>
            )}
            <span>ID: {selectedProject.id}</span>
            <span>전체 진행률: {overallProgress}%</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('project-dashboard')}
          >
            대시보드 보기
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: 프로젝트 저장 로직
              alert('프로젝트가 저장되었습니다!');
            }}
          >
            저장
          </Button>
          <Button 
            variant="primary"
            onClick={handleCompleteProject}
          >
            ✅ 프로젝트 완료
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <ProjectProgress project={selectedProject} />

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'form', name: '프로젝트 입력', icon: '📝' },
              { id: 'opinions', name: `의견 (${projectOpinions.length})`, icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'form' && (
        <>
          {/* Stage Navigation */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-center space-x-1">
              {[1, 2, 3].map((stage) => (
                <React.Fragment key={stage}>
                  <button
                    onClick={() => setCurrentStage(stage)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      currentStage === stage
                        ? stage === 1
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : stage === 2
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    {stage}차 단계
                    {stage === 1 && (
                      <div className="text-xs mt-1">기본 정보</div>
                    )}
                    {stage === 2 && (
                      <div className="text-xs mt-1">생산 준비</div>
                    )}
                    {stage === 3 && (
                      <div className="text-xs mt-1">양산 준비</div>
                    )}
                  </button>
                  {stage < 3 && (
                    <div className="w-8 h-0.5 bg-gray-300"></div>
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
        </>
      )}

      {activeTab === 'opinions' && (
        <div className="space-y-6">
          {/* Opinion Form Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">프로젝트 의견</h2>
              <p className="text-gray-600 text-sm mt-1">
                프로젝트에 대한 의견이나 피드백을 남겨주세요
              </p>
            </div>
            <Button
              onClick={() => setShowOpinionForm(!showOpinionForm)}
              variant={showOpinionForm ? "outline" : "primary"}
            >
              {showOpinionForm ? '의견 작성 취소' : '💬 의견 남기기'}
            </Button>
          </div>

          {/* Opinion Form */}
          {showOpinionForm && (
            <OpinionForm
              projectId={selectedProject.id}
              stage={`stage${currentStage}`}
              onSubmit={handleOpinionSubmit}
              onClose={() => setShowOpinionForm(false)}
            />
          )}

          {/* Opinion List */}
          <OpinionList
            opinions={projectOpinions}
            onUpdateStatus={handleOpinionStatusUpdate}
            onReply={handleOpinionReply}
          />
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setCurrentView('list')}
            >
              목록으로
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
              onClick={() => {
                if (window.confirm('변경사항이 저장되지 않을 수 있습니다. 계속하시겠습니까?')) {
                  setCurrentView('list');
                }
              }}
            >
              취소
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                alert('프로젝트가 저장되었습니다!');
                setCurrentView('list');
              }}
            >
              저장 후 목록
            </Button>
            <Button
              variant="primary"
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

export default ProjectDetail;