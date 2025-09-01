import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';
import Stage1Form_v11 from './components/Stage1Form_v1.1';
import Stage2Form_v11 from './components/Stage2Form_v1.1';
import Stage3Form_v11 from './components/Stage3Form_v1.1';
import ProjectProgress from './components/ProjectProgress';

/**
 * v1.1 ProjectEdit - 편집 전용 페이지 (완전 재구축)
 * 
 * 주요 개선사항:
 * - v1.1 상태 관리 시스템 사용
 * - 편집 전용으로 역할 명확화
 * - 실시간 변경사항 추적
 * - 향상된 저장/취소 기능
 * - 단계별 유효성 검사
 * - 자동 저장 기능
 */
const ProjectEdit_v11 = () => {
  const { state, setCurrentView, updateProject, moveToCompleted } = useProjectStore();
  
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
  const { selectedProject } = state;
  
  console.log(`📝 [v1.1] ProjectEdit rendered with selectedProject: ${selectedProject?.name || 'None'}`);
  
  // 편집 상태 관리
  const [currentStage, setCurrentStage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);

  // 프로젝트 없음 처리
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            편집할 프로젝트를 찾을 수 없습니다
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

  // 변경 이력을 localStorage에 저장하는 함수
  const saveChangeHistory = useCallback((projectId, changeRecord) => {
    try {
      const allChanges = JSON.parse(localStorage.getItem('projectChangeHistory') || '{}');
      
      if (!allChanges[projectId]) {
        allChanges[projectId] = [];
      }
      
      // 새로운 변경사항을 맨 앞에 추가
      allChanges[projectId].unshift(changeRecord);
      
      // 각 프로젝트당 최대 100개의 변경사항만 보관
      if (allChanges[projectId].length > 100) {
        allChanges[projectId] = allChanges[projectId].slice(0, 100);
      }
      
      localStorage.setItem('projectChangeHistory', JSON.stringify(allChanges));
    } catch (error) {
      console.error('❌ [v1.1] Error saving change history:', error);
    }
  }, []);

  // 변경 이력 불러오기
  const getChangeHistory = useCallback((projectId) => {
    try {
      const allChanges = JSON.parse(localStorage.getItem('projectChangeHistory') || '{}');
      return allChanges[projectId] || [];
    } catch (error) {
      console.error('❌ [v1.1] Error getting change history:', error);
      return [];
    }
  }, []);

  // 필드 업데이트 핸들러 (v1.1 개선)
  const handleUpdate = useCallback((stage, field, value) => {
    console.log(`📝 [v1.1] ProjectEdit update: ${stage}.${field} = ${value}`);
    
    const currentTime = new Date();
    const previousValue = selectedProject[stage]?.[field];
    
    // 값이 실제로 변경된 경우에만 이력 추가
    if (previousValue !== value) {
      // 변경 이력 생성
      const changeRecord = {
        id: `${currentTime.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        stage,
        field,
        previousValue,
        newValue: value,
        timestamp: currentTime.toISOString(),
        date: currentTime.toLocaleDateString('ko-KR'),
        time: currentTime.toLocaleTimeString('ko-KR'),
        user: {
          id: user?.id || 'unknown',
          name: user?.name || '익명',
          team: user?.team || '알 수 없음'
        },
        changeType: previousValue ? 'update' : 'create',
        description: `${stage} 단계의 ${field} 필드가 ${previousValue ? '수정' : '생성'}되었습니다.`
      };
      
      // 변경 이력을 localStorage에 저장
      saveChangeHistory(selectedProject.id, changeRecord);
      
      // 상태 업데이트 (UI용 - 최근 10개만)
      setChangeHistory(prev => {
        const updated = [changeRecord, ...prev];
        return updated.slice(0, 10);
      });
    }
    
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
    setLastSaved(null);
    
    // 자동 저장 (3초 후)
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
      handleAutoSave();
    }, 3000);
    
    console.log(`✅ [v1.1] Field updated: ${stage}.${field} = ${value}`);
  }, [selectedProject, updateProject, user]);

  // 자동 저장 함수
  const handleAutoSave = useCallback(() => {
    if (!hasUnsavedChanges) return;
    
    setIsAutoSaving(true);
    console.log(`💾 [v1.1] Auto-saving project: ${selectedProject.name}`);
    
    // 실제로는 이미 updateProject로 저장되었으므로 상태만 업데이트
    setTimeout(() => {
      setIsAutoSaving(false);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      console.log(`✅ [v1.1] Auto-save completed: ${selectedProject.name}`);
    }, 500);
  }, [hasUnsavedChanges, selectedProject?.name]);

  // 수동 저장 함수
  const handleSave = useCallback(() => {
    console.log(`💾 [v1.1] Manual save: ${selectedProject.name}`);
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
    
    // 성공 알림 (3초 후 사라짐)
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = '✅ 프로젝트가 저장되었습니다!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }, [selectedProject?.name]);

  // 취소 함수
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?\n\n변경사항은 자동으로 저장되었지만, 확인을 위해 물어봅니다.')) {
        setCurrentView('project-dashboard');
      }
    } else {
      setCurrentView('project-dashboard');
    }
  }, [hasUnsavedChanges, setCurrentView]);

  // 프로젝트 완료 처리
  const handleCompleteProject = useCallback(() => {
    const overallProgress = getProjectProgress(selectedProject);
    
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
  }, [selectedProject, moveToCompleted, setCurrentView]);

  // 진행률 계산
  const overallProgress = useMemo(() => getProjectProgress(selectedProject), [selectedProject]);
  
  // 단계별 이동 확인
  const handleStageChange = useCallback((newStage) => {
    if (hasUnsavedChanges) {
      if (window.confirm('현재 단계에 저장되지 않은 변경사항이 있습니다. 다른 단계로 이동하시겠습니까?\n\n변경사항은 자동으로 저장되었습니다.')) {
        setCurrentStage(newStage);
      }
    } else {
      setCurrentStage(newStage);
    }
  }, [hasUnsavedChanges]);

  // 컴포넌트 마운트 시 변경 이력 로드
  useEffect(() => {
    if (selectedProject?.id) {
      const history = getChangeHistory(selectedProject.id);
      setChangeHistory(history.slice(0, 10)); // 최근 10개만 표시
    }
  }, [selectedProject?.id, getChangeHistory]);

  // 컴포넌트 언마운트 시 자동 저장 타이머 정리
  useEffect(() => {
    return () => {
      clearTimeout(window.autoSaveTimeout);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="text-sm hover:bg-gray-100"
            >
              ← 돌아가기
            </Button>
            <span className="text-sm text-gray-500">프로젝트 편집</span>
            {isAutoSaving && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                💾 자동 저장 중...
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            📝 {selectedProject.name} <span className="text-blue-600">편집</span>
          </h1>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-gray-600">
            {selectedProject.modelName && (
              <span className="text-blue-600 font-medium">모델: {selectedProject.modelName}</span>
            )}
            <span>ID: {selectedProject.id}</span>
            <span className="flex items-center">
              전체 진행률: 
              <span className="ml-1 font-bold text-lg text-blue-600">{overallProgress}%</span>
            </span>
            {hasUnsavedChanges && (
              <span className="text-orange-600 font-medium flex items-center">
                ⚠️ 저장되지 않은 변경사항
              </span>
            )}
            {lastSaved && (
              <span className="text-green-600 text-xs">
                ✅ 저장됨: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            onClick={handleCancel}
            className="hover:bg-red-50 hover:border-red-200"
          >
            취소
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentView('detail')}
            className="hover:bg-blue-50 hover:border-blue-200"
          >
            👁️ 보기 모드
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave}
            className={`${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : 'bg-gray-400 cursor-default'}`}
            disabled={!hasUnsavedChanges}
          >
            {hasUnsavedChanges ? '💾 저장' : '✅ 저장됨'}
          </Button>
          <Button 
            variant="secondary"
            onClick={handleCompleteProject}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            🎯 프로젝트 완료
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <ProjectProgress project={selectedProject} showDetailed={true} />
      </div>

      {/* Stage Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-2">
          {[1, 2, 3].map((stage, index) => (
            <React.Fragment key={stage}>
              <button
                onClick={() => handleStageChange(stage)}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                  currentStage === stage
                    ? stage === 1
                      ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-300'
                      : stage === 2
                      ? 'bg-green-500 text-white shadow-lg border-2 border-green-300'
                      : 'bg-purple-500 text-white shadow-lg border-2 border-purple-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
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
          <Stage1Form_v11 
            project={selectedProject}
            onUpdate={handleUpdate}
            mode="edit"
          />
        )}
        {currentStage === 2 && (
          <Stage2Form_v11 
            project={selectedProject}
            onUpdate={handleUpdate}
            mode="edit"
          />
        )}
        {currentStage === 3 && (
          <Stage3Form_v11 
            project={selectedProject}
            onUpdate={handleUpdate}
            mode="edit"
          />
        )}
      </div>

      {/* Recent Changes (변경 이력) */}
      {changeHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900">📋 최근 변경사항</h3>
            <span className="text-xs text-gray-500">최근 {changeHistory.length}개 항목</span>
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {changeHistory.slice(0, 5).map((change, index) => (
              <div key={change.id || index} className="border-l-4 border-blue-200 bg-gray-50 p-3 rounded-r-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {change.stage} 단계
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{change.field}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        change.changeType === 'create' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {change.changeType === 'create' ? '생성' : '수정'}
                      </span>
                    </div>
                    
                    {change.previousValue && (
                      <div className="text-xs text-gray-500 mb-1">
                        이전: <span className="line-through">{change.previousValue}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-blue-700 font-medium">
                      새 값: {change.newValue || '(비어있음)'}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="text-xs text-gray-600 font-medium">
                      {change.user?.name} ({change.user?.team})
                    </div>
                    <div className="text-xs text-gray-400">
                      {change.date} {change.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {changeHistory.length > 5 && (
              <div className="text-center pt-2">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => {
                    const allHistory = getChangeHistory(selectedProject.id);
                    setChangeHistory(allHistory.slice(0, 20)); // 더 많이 보기
                  }}
                >
                  더 보기 ({changeHistory.length - 5}개 더)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="hover:bg-red-50 hover:border-red-200"
            >
              취소
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentView('project-dashboard')}
              className="hover:bg-blue-50 hover:border-blue-200"
            >
              대시보드 보기
            </Button>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setCurrentView('detail')}
              className="hover:bg-blue-50 hover:border-blue-200"
            >
              👁️ 보기 모드
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className={`${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-default'}`}
              disabled={!hasUnsavedChanges}
            >
              {hasUnsavedChanges ? '💾 저장' : '✅ 저장됨'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCompleteProject}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              🎯 프로젝트 완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEdit_v11;