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
  SET_COMPLETED_PROJECTS: 'SET_COMPLETED_PROJECTS',
  SET_OPINIONS: 'SET_OPINIONS',
  ADD_OPINION: 'ADD_OPINION',
  UPDATE_OPINION: 'UPDATE_OPINION',
  DELETE_OPINION: 'DELETE_OPINION',
  SET_SELECTED_PROJECT: 'SET_SELECTED_PROJECT',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_SHOW_NEW_PROJECT_MODAL: 'SET_SHOW_NEW_PROJECT_MODAL',
  SET_FILTER_STATUS: 'SET_FILTER_STATUS',
  RESTORE_PROJECT: 'RESTORE_PROJECT'
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
      const restoredProject = state.completedProjects.find(p => p.id === action.payload);
      return {
        ...state,
        completedProjects: state.completedProjects.filter(p => p.id !== action.payload),
        projects: restoredProject
          ? [...state.projects, { ...restoredProject, completed: false, completed_at: null, completed_by: null, status: 'active' }]
          : state.projects,
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
export const SupabaseProjectProvider = React.memo(({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user, isInitialized } = useSupabaseAuth();

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      console.log('📋 [loadProjects] 현재 로그인된 사용자:', user?.email);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('💥 [loadProjects] 프로젝트 쿼리 오류:', error);
        throw error;
      }

      console.log('✅ [loadProjects] 프로젝트 로드 성공:', data?.length || 0, '개');
      if (data && data.length > 0) {
        console.log('📄 [loadProjects] 프로젝트 목록 미리보기:', data.map(p => ({ id: p.id, name: p.name, created_by: p.created_by })));
      }
      dispatch({ type: actionTypes.SET_PROJECTS, payload: data || [] });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      console.error('❌ 프로젝트 로드 실패:', error);
      
      // Supabase 전용 에러 처리
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: 'Supabase 데이터베이스 테이블이 설정되지 않았습니다. 관리자에게 문의하세요.' 
        });
      } else if (error.message.includes('RLS') || error.message.includes('policy')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: '데이터 접근 권한이 없습니다. 관리자 승인을 확인해주세요.' 
        });
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: '네트워크 연결을 확인하고 다시 시도해주세요.' 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: `프로젝트 로드 중 오류가 발생했습니다: ${error.message}` 
        });
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
        model_name: projectData.modelName || projectData.model_name,
        description: projectData.description || '',
        stage1: projectData.stage1 || {},
        stage2: projectData.stage2 || {},
        stage3: projectData.stage3 || {},
        status: 'active',
        completed: false,
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
      
      // Supabase 전용 에러 처리
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: 'Supabase 데이터베이스 테이블이 설정되지 않았습니다. 관리자에게 문의하세요.' 
        });
      } else if (error.message.includes('RLS') || error.message.includes('policy')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: '데이터 접근 권한이 없습니다. 관리자 승인을 확인해주세요.' 
        });
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: '네트워크 연결을 확인하고 다시 시도해주세요.' 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_ERROR, 
          payload: `프로젝트 로드 중 오류가 발생했습니다: ${error.message}` 
        });
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
      const { data, error } = await supabase
        .from('projects')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: user.id
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 프로젝트 완료 처리 성공:', data);
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

  // 프로젝트를 completed_projects 테이블로 이동
  const moveToCompleted = useCallback(async (projectId, completionData) => {
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // 1. 기존 프로젝트 데이터 가져오기
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

      console.log('📋 Moving project to completed_projects:', project.name);

      // 2. completed_projects 테이블에 데이터 추가 (기본 필드만 사용)
      const completedProject = {
        id: project.id,
        name: project.name,
        model_name: project.model_name,
        description: project.description,
        stage1: project.stage1,
        stage2: project.stage2,
        stage3: project.stage3,
        status: 'completed',
        created_at: project.created_at,
        updated_at: new Date().toISOString(),
        created_by: project.created_by,
        updated_by: user.id,
        completed: true,
        completed_at: completionData?.completedAt || new Date().toISOString(),
        completed_by: user.id
      };

      const { error: insertError } = await supabase
        .from('completed_projects')
        .insert([completedProject]);

      if (insertError) throw insertError;

      // 3. 기존 projects 테이블에서 삭제
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      console.log('✅ 프로젝트 완료 처리 성공:', project.name);
      
      // 4. 로컬 상태 업데이트
      dispatch({ type: actionTypes.COMPLETE_PROJECT, payload: projectId });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      
      return { success: true };
    } catch (error) {
      console.error('❌ 프로젝트 완료 처리 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return { success: false, error: error.message };
    }
  }, [user]);

  // 완료된 프로젝트 로드
  const loadCompletedProjects = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      console.log('📋 완료된 프로젝트 로드 시작');
      
      const { data, error } = await supabase
        .from('completed_projects')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      console.log('✅ 완료된 프로젝트 로드 성공:', data?.length || 0, '개');
      dispatch({ type: actionTypes.SET_COMPLETED_PROJECTS, payload: data || [] });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      console.error('❌ 완료된 프로젝트 로드 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // 완료된 프로젝트 복원 (completed_projects → projects)
  const restoreProject = useCallback(async (projectId) => {
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });

    try {
      // 1. completed_projects에서 프로젝트 데이터 가져오기
      const { data: project, error: fetchError } = await supabase
        .from('completed_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      if (!project) throw new Error('완료된 프로젝트를 찾을 수 없습니다');

      console.log('📋 Restoring project from completed_projects:', project.name);

      // 2. projects 테이블에 데이터 추가
      const restoredProject = {
        id: project.id,
        name: project.name,
        model_name: project.model_name,
        description: project.description,
        stage1: project.stage1,
        stage2: project.stage2,
        stage3: project.stage3,
        status: 'active',
        completed: false,
        created_at: project.created_at,
        updated_at: new Date().toISOString(),
        created_by: project.created_by,
        updated_by: user.id,
        completed_at: null,
        completed_by: null
      };

      const { error: insertError } = await supabase
        .from('projects')
        .insert([restoredProject]);

      if (insertError) throw insertError;

      // 3. completed_projects에서 삭제
      const { error: deleteError } = await supabase
        .from('completed_projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      console.log('✅ 프로젝트 복원 성공:', project.name);

      // 4. 로컬 상태 업데이트
      dispatch({ type: actionTypes.RESTORE_PROJECT, payload: projectId });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });

      return { success: true };
    } catch (error) {
      console.error('❌ 프로젝트 복원 실패:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return { success: false, error: error.message };
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

  // 초기 데이터 로드 (user가 변경될 때만 실행)
  useEffect(() => {
    console.log('🔍 [SupabaseProjectStore] useEffect 실행:', { 
      isInitialized, 
      hasUser: !!user, 
      userEmail: user?.email,
      timestamp: new Date().toISOString() 
    });

    const loadData = async () => {
      // 인증 초기화가 완료된 후에만 실행
      if (!isInitialized) {
        console.log('⏳ [SupabaseProjectStore] 인증 초기화 대기 중...');
        return;
      }
      
      // 인증 상태와 관계없이 프로젝트 데이터 로드 (public 테이블이므로)
      console.log('🔄 [SupabaseProjectStore] 프로젝트 로드 시작');
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      try {
        if (user) {
          console.log('👤 [SupabaseProjectStore] 로그인된 사용자:', { userId: user?.id, email: user?.email, role: user?.role });
        } else {
          console.log('🚪 [SupabaseProjectStore] 비로그인 상태로 공개 데이터 접근');
        }
        
        // Supabase 연결 테스트
        console.log('🔗 [SupabaseProjectStore] Supabase URL:', supabase.supabaseUrl);
        const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
        console.log('🧪 [SupabaseProjectStore] 연결 테스트:', testError ? `오류: ${testError.message}` : '성공');
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

          if (error) {
            console.error('💥 [SupabaseProjectStore] 프로젝트 쿼리 오류:', error);
            throw error;
          }

          console.log('✅ 프로젝트 로드 성공:', data?.length || 0, '개');
          if (data && data.length > 0) {
            console.log('📄 첫 번째 프로젝트 샘플:', data[0]);
          }
          dispatch({ type: actionTypes.SET_PROJECTS, payload: data || [] });
        } catch (error) {
          console.error('❌ 프로젝트 로드 실패:', error);
          if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
            dispatch({ 
              type: actionTypes.SET_ERROR, 
              payload: '데이터베이스 테이블이 설정되지 않았습니다. SUPABASE_SETUP_GUIDE.md 파일을 참조하여 데이터베이스를 설정해주세요.' 
            });
          } else {
            dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
          }
        } finally {
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
    };
    
    loadData();
  }, [user?.id, isInitialized]); // user.id가 변경되거나 초기화가 완료될 때 실행

  // Context 값
  const contextValue = useMemo(() => ({
    // 상태
    ...state,
    
    // 프로젝트 관련 액션
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    moveToCompleted,
    loadCompletedProjects,
    restoreProject,

    // 의견 관련 액션
    loadOpinions,
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
    moveToCompleted,
    loadCompletedProjects,
    restoreProject,
    loadOpinions,
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
});

// Hook
export const useSupabaseProjectStore = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useSupabaseProjectStore must be used within a SupabaseProjectProvider');
  }
  return context;
};

export default useSupabaseProjectStore;