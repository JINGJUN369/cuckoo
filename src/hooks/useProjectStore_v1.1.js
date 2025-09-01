import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { createProject } from '../types/project';
import { getMockProjects } from '../utils/mockData';

/**
 * v1.1 useProjectStore - 최적화된 상태 관리
 * 
 * 주요 개선사항:
 * - Context 렌더링 문제 해결
 * - 깊은 객체 업데이트 수정
 * - 상태 변경 감지 최적화
 * - 디버깅 개선
 */

// Debounced localStorage save
let saveTimeout = null;
const debouncedSave = (key, data) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, 300);
};

// Deep merge utility for nested objects - v1.1 개선
const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

// Activity logging function
const logProjectChanges = (originalProject, updates, userId) => {
  if (!userId) return;
  
  const changes = [];
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], prefix + key + '.'));
      } else {
        flattened[prefix + key] = obj[key];
      }
    }
    return flattened;
  };

  const originalFlat = flattenObject(originalProject);
  const updatesFlat = flattenObject(updates);

  for (const key in updatesFlat) {
    if (originalFlat[key] !== updatesFlat[key]) {
      changes.push({
        field: key,
        oldValue: originalFlat[key],
        newValue: updatesFlat[key]
      });
    }
  }

  if (changes.length > 0) {
    // 사용자 이름 가져오기
    let userName = 'Unknown User';
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        userName = user.name || user.id || 'Unknown User';
      }
    } catch (error) {
      console.warn('Failed to get user name for activity log');
    }

    const activityLog = {
      id: Date.now().toString(),
      userId,
      userName, // 사용자 이름 추가
      projectId: originalProject.id,
      projectName: originalProject.name,
      action: 'update',
      changes,
      timestamp: new Date().toISOString()
    };

    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const updatedLogs = [activityLog, ...existingLogs].slice(0, 1000);
    localStorage.setItem('activityLogs', JSON.stringify(updatedLogs));
  }
};

// Initial state
const initialState = {
  projects: [],
  selectedProject: null,
  currentStage: 1,
  completedProjects: [],
  opinions: [],
  user: {
    isLoggedIn: false,
    loginAttempts: 0,
    lockoutUntil: null
  },
  ui: {
    currentView: 'list',
    loading: false,
    error: null
  }
};

// Action types
export const ActionTypes = {
  // Project actions
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  COMPLETE_PROJECT: 'COMPLETE_PROJECT',
  
  // Selection actions
  SET_SELECTED_PROJECT: 'SET_SELECTED_PROJECT',
  SET_CURRENT_STAGE: 'SET_CURRENT_STAGE',
  
  // User actions
  SET_LOGIN_STATE: 'SET_LOGIN_STATE',
  SET_LOGIN_ATTEMPTS: 'SET_LOGIN_ATTEMPTS',
  SET_LOCKOUT: 'SET_LOCKOUT',
  
  // UI actions
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  
  // Opinion actions
  ADD_OPINION: 'ADD_OPINION',
  UPDATE_OPINION: 'UPDATE_OPINION',
  SET_OPINIONS: 'SET_OPINIONS',
  
  // Completed projects
  SET_COMPLETED_PROJECTS: 'SET_COMPLETED_PROJECTS',
  MOVE_TO_COMPLETED: 'MOVE_TO_COMPLETED',
  RESTORE_PROJECT: 'RESTORE_PROJECT'
};

// v1.1 개선된 Reducer
const projectReducer = (state, action) => {
  console.log(`🔄 [v1.1] Reducer action:`, action.type, action.payload);
  
  switch (action.type) {
    case ActionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload };
      
    case ActionTypes.ADD_PROJECT:
      const newProject = createProject(action.payload);
      const updatedProjects = [...state.projects, newProject];
      debouncedSave('projects', updatedProjects);
      return { ...state, projects: updatedProjects };
      
    case ActionTypes.UPDATE_PROJECT:
      const { projectId, updates } = action.payload;
      const originalProject = state.projects.find(p => p.id === projectId);
      
      // v1.1: deepMerge 사용으로 중첩 객체 업데이트 개선
      const projectsAfterUpdate = state.projects.map(project => 
        project.id === projectId ? deepMerge(project, updates) : project
      );
      debouncedSave('projects', projectsAfterUpdate);
      
      // 변경사항 로깅
      if (originalProject && action.payload.userId) {
        logProjectChanges(originalProject, updates, action.payload.userId);
      }
      
      // v1.1: selectedProject도 deepMerge로 업데이트
      const updatedSelectedProject = state.selectedProject?.id === projectId 
        ? deepMerge(state.selectedProject, updates)
        : state.selectedProject;
        
      console.log(`✅ [v1.1] Project updated:`, projectId, updates);
        
      return { 
        ...state, 
        projects: projectsAfterUpdate,
        selectedProject: updatedSelectedProject
      };
      
    case ActionTypes.DELETE_PROJECT:
      const projectsAfterDelete = state.projects.filter(p => p.id !== action.payload);
      debouncedSave('projects', projectsAfterDelete);
      return { 
        ...state, 
        projects: projectsAfterDelete,
        selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject
      };
      
    case ActionTypes.COMPLETE_PROJECT:
      const completedProject = state.projects.find(p => p.id === action.payload);
      if (completedProject) {
        const activeProjects = state.projects.filter(p => p.id !== action.payload);
        const completedProjects = [...state.completedProjects, { ...completedProject, completed: true, completedAt: new Date().toISOString() }];
        
        debouncedSave('projects', activeProjects);
        debouncedSave('completedProjects', completedProjects);
        
        return {
          ...state,
          projects: activeProjects,
          completedProjects: completedProjects,
          selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject
        };
      }
      return state;
      
    case ActionTypes.SET_SELECTED_PROJECT:
      console.log(`🎯 [v1.1] Selected project:`, action.payload?.name || 'None');
      return { ...state, selectedProject: action.payload };
      
    case ActionTypes.SET_CURRENT_STAGE:
      return { ...state, currentStage: action.payload };
      
    case ActionTypes.SET_LOGIN_STATE:
      localStorage.setItem('loginState', JSON.stringify(action.payload));
      return { ...state, user: { ...state.user, isLoggedIn: action.payload } };
      
    case ActionTypes.SET_LOGIN_ATTEMPTS:
      return { ...state, user: { ...state.user, loginAttempts: action.payload } };
      
    case ActionTypes.SET_LOCKOUT:
      if (action.payload) {
        localStorage.setItem('lockoutUntil', action.payload.toString());
      } else {
        localStorage.removeItem('lockoutUntil');
      }
      return { ...state, user: { ...state.user, lockoutUntil: action.payload } };
      
    case ActionTypes.SET_CURRENT_VIEW:
      console.log(`🚀 [v1.1] View changing to:`, action.payload);
      const newUIState = { ...state.ui, currentView: action.payload };
      console.log(`✅ [v1.1] New UI state:`, newUIState);
      return { ...state, ui: newUIState };
      
    case ActionTypes.SET_LOADING:
      return { ...state, ui: { ...state.ui, loading: action.payload } };
      
    case ActionTypes.SET_ERROR:
      return { ...state, ui: { ...state.ui, error: action.payload } };
      
    case ActionTypes.ADD_OPINION:
      const newOpinions = [...state.opinions, action.payload];
      debouncedSave('opinions', newOpinions);
      return { ...state, opinions: newOpinions };

    case ActionTypes.UPDATE_OPINION:
      const { opinionId, updates: opinionUpdates } = action.payload;
      const updatedOpinions = state.opinions.map(opinion =>
        opinion.id === opinionId ? { ...opinion, ...opinionUpdates } : opinion
      );
      debouncedSave('opinions', updatedOpinions);
      return { ...state, opinions: updatedOpinions };
      
    case ActionTypes.SET_OPINIONS:
      return { ...state, opinions: action.payload };
      
    case ActionTypes.SET_COMPLETED_PROJECTS:
      return { ...state, completedProjects: action.payload };

    case ActionTypes.MOVE_TO_COMPLETED: {
      const { projectId, completionData } = action.payload;
      const projectToComplete = state.projects.find(p => p.id === projectId);
      if (projectToComplete) {
        const remainingProjects = state.projects.filter(p => p.id !== projectId);
        const newCompletedProjects = [...state.completedProjects, { 
          ...projectToComplete, 
          completed: true, 
          completedAt: new Date().toISOString(),
          ...completionData
        }];
        
        debouncedSave('projects', remainingProjects);
        debouncedSave('completedProjects', newCompletedProjects);
        
        return {
          ...state,
          projects: remainingProjects,
          completedProjects: newCompletedProjects,
          selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject
        };
      }
      return state;
    }

    case ActionTypes.RESTORE_PROJECT: {
      const { projectId: restoreId, restorationData } = action.payload;
      const projectToRestore = state.completedProjects.find(p => p.id === restoreId);
      if (projectToRestore) {
        const { completed, completedAt, completedBy, completedByName, archiveReason, finalProgress, finalDDays, finalState, archivedAt, ...restoredProject } = projectToRestore;
        const updatedCompletedProjects = state.completedProjects.filter(p => p.id !== restoreId);
        const updatedActiveProjects = [...state.projects, { 
          ...restoredProject,
          ...restorationData
        }];
        
        debouncedSave('projects', updatedActiveProjects);
        debouncedSave('completedProjects', updatedCompletedProjects);
        
        return {
          ...state,
          projects: updatedActiveProjects,
          completedProjects: updatedCompletedProjects
        };
      }
      return state;
    }

    default:
      console.warn(`⚠️ [v1.1] Unknown action type:`, action.type);
      return state;
  }
};

// Context creation
const ProjectContext = createContext(null);

// v1.1 Provider 컴포넌트
export const ProjectProvider = ({ children }) => {
  console.log(`🏗️ [v1.1] ProjectProvider initializing...`);
  
  const [state, dispatch] = useReducer(projectReducer, initialState, (initial) => {
    const saved = localStorage.getItem('projects');
    return {
      ...initial,
      projects: saved ? JSON.parse(saved) : getMockProjects(),
    };
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedOpinions = localStorage.getItem('opinions');
    const savedCompleted = localStorage.getItem('completedProjects');
    
    if (savedOpinions) {
      dispatch({ type: ActionTypes.SET_OPINIONS, payload: JSON.parse(savedOpinions) });
    }
    
    if (savedCompleted) {
      dispatch({ type: ActionTypes.SET_COMPLETED_PROJECTS, payload: JSON.parse(savedCompleted) });
    }
  }, []);

  // Action creators with useCallback for optimization
  const addProject = useCallback(
    (projectData) => dispatch({ type: ActionTypes.ADD_PROJECT, payload: projectData }),
    [dispatch]
  );
  
  const updateProject = useCallback(
    (projectId, updates, userId) => {
      console.log(`📝 [v1.1] Updating project:`, projectId, updates);
      dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { projectId, updates, userId } });
    },
    [dispatch]
  );
  
  const deleteProject = useCallback(
    (projectId) => dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId }),
    [dispatch]
  );
  
  const completeProject = useCallback(
    (projectId) => dispatch({ type: ActionTypes.COMPLETE_PROJECT, payload: projectId }),
    [dispatch]
  );
  
  const setSelectedProject = useCallback(
    (project) => {
      console.log(`🎯 [v1.1] Setting selected project:`, project?.name || 'None');
      dispatch({ type: ActionTypes.SET_SELECTED_PROJECT, payload: project });
    },
    [dispatch]
  );
  
  const setCurrentStage = useCallback(
    (stage) => dispatch({ type: ActionTypes.SET_CURRENT_STAGE, payload: stage }),
    [dispatch]
  );
  
  const setCurrentView = useCallback(
    (view) => {
      console.log(`🚀 [v1.1] setCurrentView called with:`, view);
      dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
    },
    [dispatch]
  );
  
  const setLoading = useCallback(
    (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    [dispatch]
  );
  
  const setError = useCallback(
    (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    [dispatch]
  );
  
  const addOpinion = useCallback(
    (opinion) => dispatch({ type: ActionTypes.ADD_OPINION, payload: opinion }),
    [dispatch]
  );
  
  const updateOpinion = useCallback(
    (opinionId, updates) => dispatch({ type: ActionTypes.UPDATE_OPINION, payload: { opinionId, updates } }),
    [dispatch]
  );
  
  const moveToCompleted = useCallback(
    (projectId, completionData = {}) => dispatch({ 
      type: ActionTypes.MOVE_TO_COMPLETED, 
      payload: { projectId, completionData }
    }),
    [dispatch]
  );
  
  const restoreProject = useCallback(
    (projectId, restorationData = {}) => dispatch({ 
      type: ActionTypes.RESTORE_PROJECT, 
      payload: { projectId, restorationData }
    }),
    [dispatch]
  );

  // v1.1: Context value 최적화 - 불필요한 리렌더링 방지
  const value = useMemo(() => ({
    state,
    dispatch,
    // Helper methods
    addProject,
    updateProject,
    deleteProject,
    completeProject,
    setSelectedProject,
    setCurrentStage,
    setCurrentView,
    setLoading,
    setError,
    addOpinion,
    updateOpinion,
    moveToCompleted,
    restoreProject,
  }), [
    state,
    dispatch,
    addProject,
    updateProject,
    deleteProject,
    completeProject,
    setSelectedProject,
    setCurrentStage,
    setCurrentView,
    setLoading,
    setError,
    addOpinion,
    updateOpinion,
    moveToCompleted,
    restoreProject
  ]);

  console.log(`✅ [v1.1] ProjectProvider context value created`);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// v1.1 Hook to use the context
export const useProjectStore = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectStore must be used within a ProjectProvider');
  }
  return context;
};

// Export context for direct access if needed
export { ProjectContext };