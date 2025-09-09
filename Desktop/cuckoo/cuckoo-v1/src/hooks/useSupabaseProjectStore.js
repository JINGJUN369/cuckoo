import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

// UUID 생성 함수
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

/**
 * Supabase 기반 프로젝트 스토어
 * localStorage 대신 Supabase를 직접 사용하는 상태 관리
 */

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
  RESTORE_PROJECT: 'RESTORE_PROJECT',
  SET_COMPLETED_PROJECTS: 'SET_COMPLETED_PROJECTS',
  SET_OPINIONS: 'SET_OPINIONS',
  ADD_OPINION: 'ADD_OPINION',
  UPDATE_OPINION: 'UPDATE_OPINION',
  DELETE_OPINION: 'DELETE_OPINION',
  SET_SELECTED_PROJECT: 'SET_SELECTED_PROJECT',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_SHOW_NEW_PROJECT_MODAL: 'SET_SHOW_NEW_PROJECT_MODAL',
  SET_FILTER_STATUS: 'SET_FILTER_STATUS'
};

// 리듀서
function projectReducer(state, action) {
  console.log(`🔄 [SupabaseProjectStore] Action: ${action.type}`, action.payload);
  
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload, loading: false, error: null };
    
    case actionTypes.ADD_PROJECT:
      return { 
        ...state, 
        projects: [...state.projects, action.payload],
        loading: false,
        error: null
      };
    
    case actionTypes.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        selectedProject: state.selectedProject?.id === action.payload.id 
          ? action.payload 
          : state.selectedProject,
        loading: false,
        error: null
      };
    
    case actionTypes.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload 
          ? null 
          : state.selectedProject,
        loading: false,
        error: null
      };
    
    case actionTypes.COMPLETE_PROJECT:
      const projectToComplete = state.projects.find(p => p.id === action.payload);
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        completedProjects: projectToComplete 
          ? [...state.completedProjects, { ...projectToComplete, completedAt: new Date().toISOString() }]
          : state.completedProjects,
        loading: false,
        error: null
      };
    
    case actionTypes.RESTORE_PROJECT:
      const { projectId: completedId, restoredProject } = action.payload;
      return {
        ...state,
        projects: [...state.projects, restoredProject],
        completedProjects: state.completedProjects.filter(p => p.id !== completedId),
        loading: false,
        error: null
      };
    
    case actionTypes.SET_COMPLETED_PROJECTS:
      return { ...state, completedProjects: action.payload };
    
    case actionTypes.SET_OPINIONS:
      return { ...state, opinions: action.payload };
    
    case actionTypes.ADD_OPINION:
      return { ...state, opinions: [...state.opinions, action.payload] };
    
    case actionTypes.UPDATE_OPINION:
      return {
        ...state,
        opinions: state.opinions.map(o => 
          o.id === action.payload.id ? action.payload : o
        )
      };
    
    case actionTypes.DELETE_OPINION:
      return {
        ...state,
        opinions: state.opinions.filter(o => o.id !== action.payload)
      };
    
    case actionTypes.SET_SELECTED_PROJECT:
      return { ...state, selectedProject: action.payload };
    
    case actionTypes.SET_CURRENT_VIEW:
      return { 
        ...state, 
        ui: { ...state.ui, currentView: action.payload }
      };
    
    case actionTypes.SET_SHOW_NEW_PROJECT_MODAL:
      return { 
        ...state, 
        ui: { ...state.ui, showNewProjectModal: action.payload }
      };
    
    case actionTypes.SET_FILTER_STATUS:
      return { 
        ...state, 
        ui: { ...state.ui, filterStatus: action.payload }
      };
    
    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}

// Context 생성
const ProjectContext = createContext(null);

// Provider 컴포넌트
export const SupabaseProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user, isInitialized } = useSupabaseAuth();

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ 프로젝트 로드 성공:', data?.length || 0);
      dispatch({ type: actionTypes.SET_PROJECTS, payload: data || [] });
      
      // 의견도 함께 로드 (대시보드에서 사용)
      try {
        const { data: opinionsData, error: opinionsError } = await supabase
          .from('opinions')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!opinionsError && opinionsData) {
          console.log('✅ 의견 로드 성공:', opinionsData.length);
          dispatch({ type: actionTypes.SET_OPINIONS, payload: opinionsData });
        }
      } catch (opinionsError) {
        console.log('⚠️ 의견 로드 실패 (테이블 없음):', opinionsError.message);
        // 의견 테이블이 없어도 프로젝트는 정상 로드
      }
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      console.error('❌ 프로젝트 로드 실패:', error);
      
      // 데이터베이스 테이블이 없는 경우 사용자에게 안내
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: '데이터베이스 테이블이 설정되지 않았습니다. SUPABASE_SETUP_GUIDE.md 파일을 참조하여 데이터베이스를 설정해주세요.' 
        });
      } else {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // 프로젝트 생성
  const createProject = useCallback(async (projectData) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return null;
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const newProject = {
        id: generateUUID(),
        name: projectData.name,
        model_name: projectData.modelName,
        stage1: projectData.stage1 || {},
        stage2: projectData.stage2 || {},
        stage3: projectData.stage3 || {},
        created_at: new Date().toISOString(),
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 프로젝트 생성 성공:', data);
      dispatch({ type: actionTypes.ADD_PROJECT, payload: data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return data;
    } catch (error) {
      console.error('❌ 프로젝트 생성 실패:', error);
      
      // 데이터베이스 테이블이 없는 경우 사용자에게 안내
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: '데이터베이스 테이블이 설정되지 않았습니다. SUPABASE_SETUP_GUIDE.md 파일을 참조하여 데이터베이스를 설정해주세요.' 
        });
      } else {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return null;
    }
  }, [user]);

  // 프로젝트 업데이트
  const updateProject = useCallback(async (projectId, updates) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return null;
    }

    console.log("🐛 [Debug] updateProject called with:", { projectId, updates, userId: user.id, userEmail: user.email });
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error("🐛 [Debug] Supabase update error:", error);
        throw error;
      }
      if (error) throw error;

      console.log('✅ 프로젝트 업데이트 성공:', data);
      dispatch({ type: actionTypes.UPDATE_PROJECT, payload: data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return data;
    } catch (error) {
      console.error('❌ 프로젝트 업데이트 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return null;
    }
  }, [user]);

  // 프로젝트 삭제
  const deleteProject = useCallback(async (projectId) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return false;
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      console.log('✅ 프로젝트 삭제 성공:', projectId);
      dispatch({ type: actionTypes.DELETE_PROJECT, payload: projectId });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return true;
    } catch (error) {
      console.error('❌ 프로젝트 삭제 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return false;
    }
  }, [user]);

  // 프로젝트 완료 처리
  const completeProject = useCallback(async (projectId) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return false;
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // 1. 프로젝트 데이터 조회
      const { data: projectData, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      if (!projectData) throw new Error('프로젝트를 찾을 수 없습니다');

      // 2. completed_projects 테이블에 추가 (original_id 제거 - 테이블에 컬럼이 없음)
      const completedProject = {
        ...projectData,
        id: `completed_${projectData.id}_${Date.now()}`, // 새로운 ID 생성
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        status: 'completed'
      };

      const { error: insertError } = await supabase
        .from('completed_projects')
        .insert([completedProject]);

      if (insertError) throw insertError;

      // 3. 원본 projects 테이블에서 삭제
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      console.log('✅ 프로젝트 완료 처리 성공:', projectId);
      dispatch({ type: actionTypes.COMPLETE_PROJECT, payload: projectId });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return true;
    } catch (error) {
      console.error('❌ 프로젝트 완료 처리 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return false;
    }
  }, [user]);

  // 프로젝트 복원 처리 (완료된 프로젝트를 다시 진행 중으로)
  const restoreProject = useCallback(async (projectId) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return false;
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // 1. completed_projects 테이블에서 프로젝트 데이터 조회
      const { data: completedProjectData, error: fetchError } = await supabase
        .from('completed_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      if (!completedProjectData) throw new Error('완료된 프로젝트를 찾을 수 없습니다');

      // 2. 복원을 위해 완료 관련 필드 제거
      const { completed_at, completed_by, status, ...restoreData } = completedProjectData;
      
      // 원본 ID 생성 (고유한 새 ID 생성)
      let originalId;
      if (restoreData.id.startsWith('completed_')) {
        // completed_xxx_timestamp 형식에서 원본 ID 추출
        const parts = restoreData.id.split('_');
        if (parts.length >= 3) {
          originalId = parts.slice(1, -1).join('_'); // 마지막 타임스탬프 부분 제거
        } else {
          originalId = `restored_${Date.now()}`; // fallback
        }
      } else {
        // completed_ 접두사가 없는 경우 (기존 완료 프로젝트)
        originalId = `restored_${restoreData.id.split('_')[0]}_${Date.now()}`;
      }

      const restoredProject = {
        ...restoreData,
        id: originalId,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      // 3. projects 테이블에 다시 추가
      const { error: insertError } = await supabase
        .from('projects')
        .insert([restoredProject]);

      if (insertError) throw insertError;

      // 4. completed_projects 테이블에서 삭제
      const { error: deleteError } = await supabase
        .from('completed_projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      console.log('✅ 프로젝트 복원 성공:', originalId);
      dispatch({ type: actionTypes.RESTORE_PROJECT, payload: { projectId, restoredProject } });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return true;
    } catch (error) {
      console.error('❌ 프로젝트 복원 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return false;
    }
  }, [user]);

  // 의견 관련 함수들
  const loadOpinions = useCallback(async (projectId) => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('opinions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ 의견 로드 성공:', data?.length || 0);
      dispatch({ type: actionTypes.SET_OPINIONS, payload: data || [] });
    } catch (error) {
      console.error('❌ 의견 로드 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // 모든 의견 불러오기 (대시보드용)
  const loadAllOpinions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('opinions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ 전체 의견 로드 성공:', data?.length || 0);
      dispatch({ type: actionTypes.SET_OPINIONS, payload: data || [] });
    } catch (error) {
      console.error('❌ 전체 의견 로드 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  const addOpinion = useCallback(async (opinionData) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return null;
    }

    try {
      // stage 값을 숫자로 변환
      let stageNumber = opinionData.stage;
      if (typeof stageNumber === 'string') {
        if (stageNumber.includes('1') || stageNumber === 'stage1') stageNumber = 1;
        else if (stageNumber.includes('2') || stageNumber === 'stage2') stageNumber = 2;
        else if (stageNumber.includes('3') || stageNumber === 'stage3') stageNumber = 3;
        else stageNumber = parseInt(stageNumber) || 1;
      }

      const newOpinion = {
        ...opinionData,
        stage: stageNumber,
        created_at: new Date().toISOString(),
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('opinions')
        .insert([newOpinion])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 의견 생성 성공:', data);
      dispatch({ type: actionTypes.ADD_OPINION, payload: data });
      return data;
    } catch (error) {
      console.error('❌ 의견 생성 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [user]);

  const updateOpinion = useCallback(async (opinionId, updates) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return null;
    }

    try {
      // stage 값이 있으면 숫자로 변환
      let updatedData = { ...updates };
      if (updatedData.stage && typeof updatedData.stage === 'string') {
        let stageNumber = updatedData.stage;
        if (stageNumber.includes('1') || stageNumber === 'stage1') stageNumber = 1;
        else if (stageNumber.includes('2') || stageNumber === 'stage2') stageNumber = 2;
        else if (stageNumber.includes('3') || stageNumber === 'stage3') stageNumber = 3;
        else stageNumber = parseInt(stageNumber) || 1;
        updatedData.stage = stageNumber;
      }

      const { data, error } = await supabase
        .from('opinions')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', opinionId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 의견 업데이트 성공:', data);
      dispatch({ type: actionTypes.UPDATE_OPINION, payload: data });
      return data;
    } catch (error) {
      console.error('❌ 의견 업데이트 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [user]);

  const deleteOpinion = useCallback(async (opinionId) => {
    if (!user) {
      dispatch({ type: actionTypes.SET_ERROR, payload: '로그인이 필요합니다' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('opinions')
        .delete()
        .eq('id', opinionId);

      if (error) throw error;

      console.log('✅ 의견 삭제 성공:', opinionId);
      dispatch({ type: actionTypes.DELETE_OPINION, payload: opinionId });
      return true;
    } catch (error) {
      console.error('❌ 의견 삭제 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return false;
    }
  }, [user]);

  // UI 액션들
  const setCurrentView = useCallback((view) => {
    dispatch({ type: actionTypes.SET_CURRENT_VIEW, payload: view });
  }, []);

  const setSelectedProject = useCallback((project) => {
    dispatch({ type: actionTypes.SET_SELECTED_PROJECT, payload: project });
  }, []);

  const setShowNewProjectModal = useCallback((show) => {
    dispatch({ type: actionTypes.SET_SHOW_NEW_PROJECT_MODAL, payload: show });
  }, []);

  const setFilterStatus = useCallback((status) => {
    dispatch({ type: actionTypes.SET_FILTER_STATUS, payload: status });
  }, []);

  // 로딩 상태 강제 초기화 (오류 복구용)
  const resetLoadingState = useCallback(() => {
    console.log('🔄 [SupabaseProjectStore] 로딩 상태 강제 초기화');
    dispatch({ type: actionTypes.SET_LOADING, payload: false });
    dispatch({ type: actionTypes.SET_ERROR, payload: null });
  }, []);

  // 완료된 프로젝트 로드
  const loadCompletedProjects = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const { data, error } = await supabase
        .from('completed_projects')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      console.log('✅ 완료된 프로젝트 로드 성공:', data?.length || 0);
      dispatch({ type: actionTypes.SET_COMPLETED_PROJECTS, payload: data || [] });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      console.error('❌ 완료된 프로젝트 로드 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // 초기 데이터 로드
    console.log("🐛 [Debug] useEffect triggered - user:", !!user, "isInitialized:", isInitialized);
  useEffect(() => {
    if (user || isInitialized) {
      loadProjects();
    } else {
      // 사용자가 없을 때도 로딩 상태 종료
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      dispatch({ type: actionTypes.SET_PROJECTS, payload: [] });
    }
  }, [user, loadProjects]);

  // Context 값
  const contextValue = useMemo(() => ({
    // 상태
    ...state,
    
    // 프로젝트 관련 액션
    loadProjects,
    loadCompletedProjects,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    restoreProject,
    
    // 의견 관련 액션
    loadOpinions,
    loadAllOpinions,
    addOpinion,
    updateOpinion,
    deleteOpinion,
    
    // UI 관련 액션
    setCurrentView,
    setSelectedProject,
    setShowNewProjectModal,
    setFilterStatus,
    resetLoadingState,
    
    // 계산된 값들
    projectCount: state.projects.length,
    completedCount: state.completedProjects.length,
    
    // 유틸리티 함수들
    getProjectById: (id) => state.projects.find(p => p.id === id),
    getProjectsByStatus: (status) => {
      if (status === 'all') return state.projects;
      // 상태별 필터링 로직 추가 가능
      return state.projects;
    }
  }), [
    state,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    restoreProject,
    loadOpinions,
    loadAllOpinions,
    addOpinion,
    updateOpinion,
    deleteOpinion,
    setCurrentView,
    setSelectedProject,
    setShowNewProjectModal,
    setFilterStatus,
    resetLoadingState
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
  if (!context) {
    throw new Error('useSupabaseProjectStore must be used within a SupabaseProjectProvider');
  }
  return context;
};

export default useSupabaseProjectStore;