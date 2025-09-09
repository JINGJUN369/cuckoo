import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { createProject } from '../types/project';
import { getMockProjects } from '../utils/mockData';

// Debounced localStorage save
let saveTimeout = null;
const debouncedSave = (key, data) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, 300);
};

// Deep merge utility for nested objects
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

// Reducer
const projectReducer = (state, action) => {
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
      const projectsAfterUpdate = state.projects.map(project => 
        project.id === projectId ? deepMerge(project, updates) : project
      );
      debouncedSave('projects', projectsAfterUpdate);
      
      // 변경사항 로깅
      if (originalProject && action.payload.userId) {
        logProjectChanges(originalProject, updates, action.payload.userId);
      }
      
      // Update selected project if it's the one being updated
      const updatedSelectedProject = state.selectedProject?.id === projectId 
        ? deepMerge(state.selectedProject, updates)
        : state.selectedProject;
        
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
      console.log('🔥 Store: Setting current view to:', action.payload);
      console.log('🔥 Store: Previous state.ui:', state.ui);
      const newState = { ...state, ui: { ...state.ui, currentView: action.payload } };
      console.log('🔥 Store: New state.ui:', newState.ui);
      return newState;
      
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

    case ActionTypes.MOVE_TO_COMPLETED:
      const projectToComplete = state.projects.find(p => p.id === action.payload);
      if (projectToComplete) {
        const completedProject = {
          ...projectToComplete,
          completedAt: new Date().toISOString(),
          status: 'completed'
        };
        const newProjects = state.projects.filter(p => p.id !== action.payload);
        const newCompletedProjects = [...state.completedProjects, completedProject];
        
        debouncedSave('projects', newProjects);
        debouncedSave('completedProjects', newCompletedProjects);
        
        return {
          ...state,
          projects: newProjects,
          completedProjects: newCompletedProjects
        };
      }
      return state;

    case ActionTypes.RESTORE_PROJECT:
      const projectToRestore = state.completedProjects.find(p => p.id === action.payload);
      if (projectToRestore) {
        const restoredProject = {
          ...projectToRestore,
          completedAt: null,
          status: 'active'
        };
        const newCompletedProjects = state.completedProjects.filter(p => p.id !== action.payload);
        const newProjects = [...state.projects, restoredProject];
        
        debouncedSave('projects', newProjects);
        debouncedSave('completedProjects', newCompletedProjects);
        
        return {
          ...state,
          projects: newProjects,
          completedProjects: newCompletedProjects
        };
      }
      return state;
      
    default:
      return state;
  }
};

// Context
const ProjectContext = createContext();

// Provider component
export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      // Load projects
      const savedProjects = localStorage.getItem('projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: projects });
      } else {
        // Load mock data if no saved projects
        const mockProjects = getMockProjects();
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: mockProjects });
        localStorage.setItem('projects', JSON.stringify(mockProjects));
      }

      // Load completed projects
      const savedCompleted = localStorage.getItem('completedProjects');
      if (savedCompleted) {
        const completedProjects = JSON.parse(savedCompleted);
        dispatch({ type: ActionTypes.SET_COMPLETED_PROJECTS, payload: completedProjects });
      }

      // Load opinions
      const savedOpinions = localStorage.getItem('opinions');
      if (savedOpinions) {
        const opinions = JSON.parse(savedOpinions);
        dispatch({ type: ActionTypes.SET_OPINIONS, payload: opinions });
      }

      // Load login state
      const savedLoginState = localStorage.getItem('loginState');
      if (savedLoginState) {
        const isLoggedIn = JSON.parse(savedLoginState);
        dispatch({ type: ActionTypes.SET_LOGIN_STATE, payload: isLoggedIn });
      }

      // Check lockout
      const savedLockout = localStorage.getItem('lockoutUntil');
      if (savedLockout) {
        const lockoutUntil = parseInt(savedLockout);
        if (lockoutUntil > Date.now()) {
          dispatch({ type: ActionTypes.SET_LOCKOUT, payload: lockoutUntil });
        } else {
          localStorage.removeItem('lockoutUntil');
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load saved data' });
    }
  }, []);

  // Memoize helper methods to prevent unnecessary re-renders
  const addProject = useCallback(
    (projectData) => dispatch({ type: ActionTypes.ADD_PROJECT, payload: projectData }),
    [dispatch]
  );
  
  const updateProject = useCallback(
    (projectId, updates, userId) => dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { projectId, updates, userId } }),
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
    (project) => dispatch({ type: ActionTypes.SET_SELECTED_PROJECT, payload: project }),
    [dispatch]
  );
  
  const setCurrentStage = useCallback(
    (stage) => dispatch({ type: ActionTypes.SET_CURRENT_STAGE, payload: stage }),
    [dispatch]
  );
  
  const setCurrentView = useCallback(
    (view) => {
      console.log('setCurrentView called with:', view);
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
    (projectId) => dispatch({ type: ActionTypes.MOVE_TO_COMPLETED, payload: projectId }),
    [dispatch]
  );
  
  const restoreProject = useCallback(
    (projectId) => dispatch({ type: ActionTypes.RESTORE_PROJECT, payload: projectId }),
    [dispatch]
  );

  // Memoize the context value to prevent unnecessary re-renders
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

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// Hook to use the context
export const useProjectStore = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectStore must be used within a ProjectProvider');
  }
  return context;
};

// 프로젝트 변경사항 로깅 함수
const logProjectChanges = (originalProject, updates, userId) => {
  try {
    const changes = [];
    
    // 필드 이름 매핑 (한국어)
    const fieldNames = {
      // 1단계
      'productGroup': '제품군',
      'manufacturer': '제조사',
      'vendor': '벤더사',
      'derivativeModel': '파생모델',
      'launchDate': '출시예정일',
      'launchDateExecuted': '출시예정일 실행완료',
      'productManager': '상품개발담당자',
      'mechanicalEngineer': '연구소 담당자(기구)',
      'circuitEngineer': '연구소 담당자(회로)',
      'massProductionDate': '양산예정일',
      'massProductionDateExecuted': '양산예정일 실행완료',
      'notes': '비고',
      
      // 2단계
      'pilotProductionDate': '파일럿 생산 예정일',
      'pilotProductionDateExecuted': '파일럿 생산 예정일 실행완료',
      'pilotQuantity': '고객만족팀 파일럿 수량',
      'pilotReceiveDate': '파일럿 수령 예정일',
      'pilotReceiveDateExecuted': '파일럿 수령 예정일 실행완료',
      'techTransferDate': '기술이전 예정일',
      'techTransferDateExecuted': '기술이전 예정일 실행완료',
      'installationEntity': '설치 주체',
      'serviceEntity': '서비스 주체',
      'trainingDate': '교육 예정일',
      'trainingDateExecuted': '교육 예정일 실행완료',
      'manualUploadDate': '사용설명서 업로드 예정일',
      'manualUploadDateExecuted': '사용설명서 업로드 예정일 실행완료',
      'techGuideUploadDate': '기술교본 업로드 예정일',
      'techGuideUploadDateExecuted': '기술교본 업로드 예정일 실행완료',
      
      // 3단계
      'initialProductionDate': '최초양산 예정일',
      'initialProductionDateExecuted': '최초양산 예정일 실행완료',
      'firstOrderDate': '1차 부품 발주 예정일',
      'firstOrderDateExecuted': '1차 부품 발주 예정일 실행완료',
      'bomManager': 'BOM 구성 담당자',
      'bomTargetDate': 'BOM 구성 목표 예정일',
      'bomTargetDateExecuted': 'BOM 구성 목표 예정일 실행완료',
      'priceManager': '단가등록 담당자',
      'priceTargetDate': '단가등록 목표 예정일자',
      'priceTargetDateExecuted': '단가등록 목표 예정일자 실행완료',
      'partsDeliveryDate': '부품 입고 예정일',
      'partsDeliveryDateExecuted': '부품 입고 예정일 실행완료'
    };
    
    // 각 단계별로 변경사항 확인
    Object.keys(updates).forEach(stage => {
      if (typeof updates[stage] === 'object' && updates[stage] !== null) {
        const originalStage = originalProject[stage] || {};
        const updatedStage = updates[stage];
        
        Object.keys(updatedStage).forEach(field => {
          const oldValue = originalStage[field];
          const newValue = updatedStage[field];
          
          // 값이 실제로 변경된 경우만 로그
          if (oldValue !== newValue) {
            const fieldDisplayName = fieldNames[field] || field;
            const stageDisplayName = 
              stage === 'stage1' ? '1단계' :
              stage === 'stage2' ? '2단계' :
              stage === 'stage3' ? '3단계' : stage;
            
            changes.push({
              stage: stageDisplayName,
              field: fieldDisplayName,
              oldValue: oldValue || '(비어있음)',
              newValue: newValue || '(비어있음)'
            });
          }
        });
      }
    });
    
    // 변경사항이 있는 경우에만 로그 기록
    if (changes.length > 0) {
      const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      
      changes.forEach(change => {
        const description = `[${originalProject.name}] ${change.stage} > ${change.field}: "${change.oldValue}" → "${change.newValue}"`;
        
        const newLog = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId,
          action: 'PROJECT_UPDATE',
          description,
          projectId: originalProject.id,
          projectName: originalProject.name,
          stage: change.stage,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          timestamp: new Date().toISOString(),
          ip: 'localhost',
          userAgent: navigator.userAgent
        };

        activityLogs.push(newLog);
      });
      
      // 최대 1000개의 로그만 보관
      if (activityLogs.length > 1000) {
        activityLogs.splice(0, activityLogs.length - 1000);
      }
      
      localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
    }
  } catch (error) {
    console.error('Project change logging error:', error);
  }
};