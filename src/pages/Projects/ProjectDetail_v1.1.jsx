import React, { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';
import Stage1Form_v11 from './components/Stage1Form_v1.1';
import Stage2Form_v11 from './components/Stage2Form_v1.1';
import Stage3Form_v11 from './components/Stage3Form_v1.1';
import ProjectProgress from './components/ProjectProgress';
import OpinionForm from './components/OpinionForm';
import OpinionList from './components/OpinionList';

/**
 * v1.1 ProjectDetail - 보기 전용 페이지 (완전 재구축)
 * 
 * 주요 개선사항:
 * - v1.1 상태 관리 시스템 사용
 * - 보기 전용으로 역할 명확화 (읽기 모드)
 * - 의견 시스템 통합
 * - 프로젝트 진행 현황 상세 표시
 * - 편집 모드로의 명확한 전환
 */
const ProjectDetail_v11 = () => {
  const { state, setCurrentView, addOpinion, updateOpinion, moveToCompleted } = useProjectStore();
  
  // 현재 사용자 정보 (v1.1 개선)
  const getCurrentUser = useCallback(() => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      console.error('❌ [v1.1] Error getting current user:', error);
      return null;
    }
  }, []);
  
  const user = getCurrentUser();
  const { selectedProject, opinions } = state;
  
  console.log(`👁️ [v1.1] ProjectDetail rendered with selectedProject: ${selectedProject?.name || 'None'}`);
  
  // 상태 관리
  const [currentStage, setCurrentStage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'stages', 'opinions'
  const [showOpinionForm, setShowOpinionForm] = useState(false);

  // 프로젝트 없음 처리
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">👁️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            조회할 프로젝트를 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            선택된 프로젝트가 없거나 삭제되었습니다
          </p>
          <Button 
            onClick={() => setCurrentView('list')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 진행률 계산
  const overallProgress = useMemo(() => getProjectProgress(selectedProject), [selectedProject]);

  // 프로젝트 관련 의견들 필터링
  const projectOpinions = useMemo(() => 
    opinions.filter(opinion => opinion.projectId === selectedProject.id), 
    [opinions, selectedProject.id]
  );

  // 의견 제출 핸들러
  const handleOpinionSubmit = useCallback((opinion) => {
    addOpinion(opinion);
    setShowOpinionForm(false);
    
    // 성공 알림
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = '💬 의견이 등록되었습니다!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }, [addOpinion]);

  // 의견 상태 업데이트 핸들러
  const handleOpinionStatusUpdate = useCallback((opinionId, newStatus) => {
    updateOpinion(opinionId, { status: newStatus });
  }, [updateOpinion]);

  // 의견 답글 핸들러
  const handleOpinionReply = useCallback((opinion) => {
    const reply = window.prompt('답변을 입력하세요:');
    if (reply && reply.trim()) {
      updateOpinion(opinion.id, {
        reply: {
          content: reply.trim(),
          createdAt: new Date().toISOString(),
          author: user?.name || '관리자'
        }
      });
    }
  }, [updateOpinion, user]);

  // 프로젝트 완료 처리
  const handleCompleteProject = useCallback(() => {
    if (overallProgress < 80) {
      if (!window.confirm(`프로젝트 진행률이 ${overallProgress}%입니다. 정말 완료 처리하시겠습니까?`)) {
        return;
      }
    }
    
    if (window.confirm(`"${selectedProject.name}" 프로젝트를 완료 처리하시겠습니까?\n\n완료된 프로젝트는 "완료된 프로젝트" 페이지에서 관리됩니다.`)) {
      try {
        moveToCompleted(selectedProject.id);
        
        // 성공 알림
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = '🎉 프로젝트가 완료 처리되었습니다!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
          setCurrentView('completed');
        }, 2000);
      } catch (error) {
        console.error('❌ [v1.1] Error completing project:', error);
        alert('프로젝트 완료 처리 중 오류가 발생했습니다.');
      }
    }
  }, [selectedProject, overallProgress, moveToCompleted, setCurrentView]);

  // D-Day 계산
  const dDay = useMemo(() => {
    const massProductionDate = selectedProject.stage1?.massProductionDate;
    if (!massProductionDate) return null;
    
    const today = new Date();
    const targetDate = new Date(massProductionDate);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [selectedProject.stage1?.massProductionDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView('list')}
              className="text-sm hover:bg-gray-100"
            >
              ← 목록
            </Button>
            <span className="text-sm text-gray-500">프로젝트 상세보기</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            👁️ {selectedProject.name}
            {overallProgress === 100 && <span className="text-green-500 text-2xl">🎯</span>}
          </h1>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-gray-600">
            {selectedProject.modelName && (
              <span className="text-blue-600 font-medium">모델: {selectedProject.modelName}</span>
            )}
            <span>ID: {selectedProject.id}</span>
            <span className="flex items-center">
              전체 진행률: 
              <span className={`ml-1 font-bold text-lg ${
                overallProgress === 100 ? 'text-green-600' :
                overallProgress >= 70 ? 'text-blue-600' :
                overallProgress >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {overallProgress}%
              </span>
            </span>
            {dDay !== null && (
              <span className={`font-medium ${
                dDay < 0 ? 'text-red-600' : 
                dDay <= 7 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {dDay < 0 ? `D+${Math.abs(dDay)}` : dDay === 0 ? 'D-Day' : `D-${dDay}`}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            onClick={() => setCurrentView('project-dashboard')}
            className="hover:bg-blue-50 hover:border-blue-200"
          >
            📊 대시보드
          </Button>
          <Button 
            variant="primary"
            onClick={() => setCurrentView('edit')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ✏️ 편집하기
          </Button>
          <Button 
            variant="secondary"
            onClick={handleCompleteProject}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ✅ 프로젝트 완료
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <ProjectProgress project={selectedProject} showDetailed={true} />
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: '📋 개요', icon: '📋' },
              { id: 'stages', name: '📝 단계별 상세', icon: '📝' },
              { id: 'opinions', name: `💬 의견 (${projectOpinions.length})`, icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Project Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(((selectedProject.stage1 ? Object.values(selectedProject.stage1).filter(v => v && v !== '').length : 0) / 9) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">1단계 (기본정보)</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(((selectedProject.stage2 ? Object.values(selectedProject.stage2).filter(v => v && v !== '').length : 0) / 10) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">2단계 (생산준비)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(((selectedProject.stage3 ? Object.values(selectedProject.stage3).filter(v => v && v !== '').length : 0) / 12) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">3단계 (양산준비)</div>
              </div>
            </div>
          </div>

          {/* Key Dates */}
          {selectedProject.stage1 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 일정</h3>
              <div className="space-y-3">
                {selectedProject.stage1.launchDate && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">출시 예정일</span>
                    <span className="text-blue-600">{new Date(selectedProject.stage1.launchDate).toLocaleDateString('ko-KR')}</span>
                  </div>
                )}
                {selectedProject.stage1.massProductionDate && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">양산 예정일</span>
                    <div className="text-right">
                      <span className="text-green-600">{new Date(selectedProject.stage1.massProductionDate).toLocaleDateString('ko-KR')}</span>
                      {dDay !== null && (
                        <div className={`text-sm font-bold ${
                          dDay < 0 ? 'text-red-600' : 
                          dDay <= 7 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {dDay < 0 ? `D+${Math.abs(dDay)}` : dDay === 0 ? 'D-Day' : `D-${dDay}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stages' && (
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

          {/* Stage Forms (Read-only mode) */}
          <div className="min-h-96">
            {currentStage === 1 && (
              <Stage1Form_v11 
                project={selectedProject}
                onUpdate={() => {}} // No-op for read-only
                mode="view"
              />
            )}
            {currentStage === 2 && (
              <Stage2Form_v11 
                project={selectedProject}
                onUpdate={() => {}} // No-op for read-only
                mode="view"
              />
            )}
            {currentStage === 3 && (
              <Stage3Form_v11 
                project={selectedProject}
                onUpdate={() => {}} // No-op for read-only
                mode="view"
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

      {/* Bottom Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setCurrentView('list')}
              className="hover:bg-gray-100"
            >
              목록으로
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentView('project-dashboard')}
              className="hover:bg-blue-50 hover:border-blue-200"
            >
              📊 대시보드 보기
            </Button>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={() => setCurrentView('edit')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ✏️ 편집하기
            </Button>
            <Button
              variant="secondary"
              onClick={handleCompleteProject}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ✅ 프로젝트 완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail_v11;