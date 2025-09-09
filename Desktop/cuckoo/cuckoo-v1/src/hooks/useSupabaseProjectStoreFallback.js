import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';

/**
 * LocalStorage 기반 프로젝트 스토어 (Supabase 대체)
 * 로딩 문제 해결을 위한 fallback
 */

// UUID 생성 함수
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

// 초기 상태
const initialState = {
  projects: [],
  completedProjects: [],
  opinions: [],
  loading: false,
  error: null,
  selectedProject: null,
  ui: {
    currentView: 'list',
    showNewProjectModal: false,
    selectedProjectId: null,
    filterStatus: 'all'
  }
};

// 액션 타입
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  COMPLETE_PROJECT: 'COMPLETE_PROJECT',
  SET_COMPLETED_PROJECTS: 'SET_COMPLETED_PROJECTS',
  SET_OPINIONS: 'SET_OPINIONS',
  ADD_OPINION: 'ADD_OPINION',
  UPDATE_OPINION: 'UPDATE_OPINION',
  DELETE_OPINION: 'DELETE_OPINION',
  SET_SELECTED_PROJECT: 'SET_SELECTED_PROJECT',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_SHOW_NEW_PROJECT_MODAL: 'SET_SHOW_NEW_PROJECT_MODAL'
};

// 리듀서
const projectReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case actionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload };
    
    case actionTypes.ADD_PROJECT:
      const newProjects = [...state.projects, action.payload];
      localStorage.setItem('projects_fallback', JSON.stringify(newProjects));
      return { ...state, projects: newProjects };
    
    case actionTypes.UPDATE_PROJECT:
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.id ? { ...project, ...action.payload } : project
      );
      localStorage.setItem('projects_fallback', JSON.stringify(updatedProjects));
      return { ...state, projects: updatedProjects };
    
    case actionTypes.DELETE_PROJECT:
      const filteredProjects = state.projects.filter(project => project.id !== action.payload);
      localStorage.setItem('projects_fallback', JSON.stringify(filteredProjects));
      return { ...state, projects: filteredProjects };
    
    case actionTypes.SET_OPINIONS:
      return { ...state, opinions: action.payload };
    
    case actionTypes.ADD_OPINION:
      const newOpinions = [...state.opinions, action.payload];
      localStorage.setItem('opinions_fallback', JSON.stringify(newOpinions));
      return { ...state, opinions: newOpinions };
    
    case actionTypes.SET_SELECTED_PROJECT:
      return { ...state, selectedProject: action.payload };
    
    case actionTypes.SET_CURRENT_VIEW:
      return { ...state, ui: { ...state.ui, currentView: action.payload } };
    
    case actionTypes.SET_SHOW_NEW_PROJECT_MODAL:
      return { ...state, ui: { ...state.ui, showNewProjectModal: action.payload } };
    
    default:
      return state;
  }
};

// Context
const ProjectContext = createContext();

// Provider
export const SupabaseProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // 초기 데이터 로드
  useEffect(() => {
    console.log('📦 [Fallback] 프로젝트 데이터 로딩...');
    
    try {
      // 로컬스토리지에서 프로젝트 로드
      const savedProjects = localStorage.getItem('projects_fallback');
      const savedOpinions = localStorage.getItem('opinions_fallback');
      
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        console.log('✅ [Fallback] 저장된 프로젝트 로드:', projects.length, '개');
        dispatch({ type: actionTypes.SET_PROJECTS, payload: projects });
      } else {
        console.log('📋 [Fallback] 저장된 프로젝트 없음. 빈 배열로 시작.');
        dispatch({ type: actionTypes.SET_PROJECTS, payload: [] });
      }
      
      if (savedOpinions) {
        const opinions = JSON.parse(savedOpinions);
        dispatch({ type: actionTypes.SET_OPINIONS, payload: opinions });
      } else {
        dispatch({ type: actionTypes.SET_OPINIONS, payload: [] });
      }
      
    } catch (error) {
      console.error('❌ [Fallback] 데이터 로딩 실패:', error);
      dispatch({ type: actionTypes.SET_PROJECTS, payload: [] });
      dispatch({ type: actionTypes.SET_OPINIONS, payload: [] });
    }
  }, []);

  // 프로젝트 생성
  const createProject = useCallback((projectData) => {
    console.log('➕ [Fallback] 새 프로젝트 생성:', projectData);
    
    try {
      const newProject = {
        id: projectData.id || `${projectData.modelName}_${Date.now()}`,
        name: projectData.name,
        modelName: projectData.modelName,
        description: projectData.description || '',
        stage1: projectData.stage1 || {},
        stage2: projectData.stage2 || {},
        stage3: projectData.stage3 || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current_user',
        updated_by: 'current_user',
        completed: false
      };
      
      console.log('✅ [Fallback] 프로젝트 생성 완료:', newProject.id);
      dispatch({ type: actionTypes.ADD_PROJECT, payload: newProject });
      
      return newProject;
    } catch (error) {
      console.error('❌ [Fallback] 프로젝트 생성 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // 프로젝트 업데이트
  const updateProject = useCallback((projectId, updates) => {
    console.log('💾 [Fallback] 프로젝트 업데이트:', projectId, updates);
    
    try {
      const updatedProject = {
        id: projectId,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user'
      };
      
      console.log('✅ [Fallback] 프로젝트 업데이트 완료:', projectId);
      dispatch({ type: actionTypes.UPDATE_PROJECT, payload: updatedProject });
      
      return updatedProject;
    } catch (error) {
      console.error('❌ [Fallback] 프로젝트 업데이트 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // 프로젝트 삭제
  const deleteProject = useCallback((projectId) => {
    console.log('🗑️ [Fallback] 프로젝트 삭제:', projectId);
    dispatch({ type: actionTypes.DELETE_PROJECT, payload: projectId });
  }, []);

  // 의견 추가
  const addOpinion = useCallback((opinionData) => {
    console.log('💬 [Fallback] 의견 추가:', opinionData);
    
    const newOpinion = {
      id: generateUUID(),
      ...opinionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'open'
    };
    
    dispatch({ type: actionTypes.ADD_OPINION, payload: newOpinion });
    return newOpinion;
  }, []);

  // UI 액션들
  const setSelectedProject = useCallback((project) => {
    console.log('🎯 [Fallback] 프로젝트 선택:', project?.name || 'null');
    dispatch({ type: actionTypes.SET_SELECTED_PROJECT, payload: project });
  }, []);

  const setCurrentView = useCallback((view) => {
    dispatch({ type: actionTypes.SET_CURRENT_VIEW, payload: view });
  }, []);

  const setShowNewProjectModal = useCallback((show) => {
    dispatch({ type: actionTypes.SET_SHOW_NEW_PROJECT_MODAL, payload: show });
  }, []);

  // Context 값
  const contextValue = useMemo(() => ({
    ...state,
    
    // 프로젝트 관련 액션
    createProject,
    updateProject,
    deleteProject,
    
    // 의견 관련 액션
    addOpinion,
    
    // UI 관련 액션
    setCurrentView,
    setSelectedProject,
    setShowNewProjectModal,
    
    // 계산된 값들
    projectCount: state.projects.length,
    completedCount: state.completedProjects.length,
    
    // 로딩 상태 관리
    resetLoadingState: () => {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      dispatch({ type: actionTypes.SET_ERROR, payload: null });
    }
  }), [
    state,
    createProject,
    updateProject,
    deleteProject,
    addOpinion,
    setCurrentView,
    setSelectedProject,
    setShowNewProjectModal
  ]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Hook
export const useSupabaseProjectStore = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useSupabaseProjectStore must be used within a SupabaseProjectProvider');
  }
  return context;
};