// 실시간 프로젝트 상태 업데이트 훅
import { useCallback, useEffect, useState, useRef } from 'react';
import { useHybridAuth } from './useHybridAuth';
import { useHybridProjectStore } from './useHybridProjectStore';
import { supabase, executeSupabaseQuery, getHybridMode, HYBRID_MODE } from '../lib/supabase';

/**
 * 실시간 프로젝트 상태 업데이트 훅
 * - 다중 사용자 동시 편집 지원
 * - 실시간 프로젝트 상태 동기화
 * - 편집 중인 사용자 표시
 * - 충돌 감지 및 해결
 */
export const useRealtimeProject = (projectId) => {
  const { user } = useHybridAuth();
  const hybridProjectStore = useHybridProjectStore();
  
  // 실시간 상태 관리
  const [realtimeProject, setRealtimeProject] = useState(null);
  const [editingUsers, setEditingUsers] = useState([]); // 편집 중인 사용자들
  const [fieldLocks, setFieldLocks] = useState({}); // 필드별 잠금 상태
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // 채널 및 구독 관리
  const channelRef = useRef(null);
  const editTimeoutRef = useRef({});
  const lockTimeoutRef = useRef({});
  
  // 실시간 연결 초기화
  useEffect(() => {
    if (!projectId || getHybridMode() === HYBRID_MODE.DISABLED || !user) {
      return;
    }

    console.log(`🔄 [RealtimeProject] Initializing for project: ${projectId}`);
    initializeRealtimeConnection();

    return () => {
      cleanup();
    };
  }, [projectId, user?.id]);

  // 실시간 연결 초기화
  const initializeRealtimeConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      cleanup();
      
      const channelName = `project_${projectId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: user.id }
        }
      });

      // 프로젝트 변경 구독
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      }, handleProjectUpdate);

      // 사용자 편집 상태 구독 (Presence)
      channel.on('presence', { event: 'sync' }, handlePresenceSync);
      channel.on('presence', { event: 'join' }, handlePresenceJoin);
      channel.on('presence', { event: 'leave' }, handlePresenceLeave);

      // 필드 편집 시작/종료 브로드캐스트 구독
      channel.on('broadcast', { event: 'field_edit_start' }, handleFieldEditStart);
      channel.on('broadcast', { event: 'field_edit_end' }, handleFieldEditEnd);
      channel.on('broadcast', { event: 'field_lock' }, handleFieldLock);
      channel.on('broadcast', { event: 'field_unlock' }, handleFieldUnlock);

      // 채널 구독
      await channel.subscribe(async (status) => {
        console.log(`🔄 [RealtimeProject] Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          
          // 자신의 presence 정보 전송
          await channel.track({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            project_id: projectId,
            editing_fields: [],
            joined_at: new Date().toISOString()
          });
          
          console.log('✅ [RealtimeProject] Successfully connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
      
    } catch (error) {
      console.error('❌ [RealtimeProject] Initialization error:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [projectId, user]);

  // 프로젝트 업데이트 핸들러
  const handleProjectUpdate = useCallback((payload) => {
    console.log('🔄 [RealtimeProject] Project update received:', payload);
    
    const { new: newRecord } = payload;
    
    // 자신이 업데이트한 경우 무시 (중복 방지)
    if (newRecord.updated_by === user.id) {
      return;
    }

    // Supabase → LocalStorage 형식 변환
    const updatedProject = convertSupabaseToLocal(newRecord);
    
    // 실시간 프로젝트 상태 업데이트
    setRealtimeProject(updatedProject);
    setLastUpdate({
      timestamp: new Date(),
      updatedBy: newRecord.updated_by,
      fields: getChangedFields(realtimeProject, updatedProject)
    });

    // 로컬 스토리지 업데이트 (하이브리드 모드)
    if (getHybridMode() === HYBRID_MODE.ENABLED) {
      updateLocalStorageProject(updatedProject);
    }

    // 알림 표시
    showRealtimeNotification('프로젝트 업데이트', 
      `프로젝트가 다른 사용자에 의해 업데이트되었습니다`, 'update');
    
    console.log('✅ [RealtimeProject] Project updated:', updatedProject.id);
  }, [user, realtimeProject]);

  // Presence 핸들러들
  const handlePresenceSync = useCallback(() => {
    const state = channelRef.current?.presenceState() || {};
    const users = [];

    Object.keys(state).forEach(presenceId => {
      const presence = state[presenceId][0];
      if (presence && presence.user_id !== user.id) {
        users.push({
          id: presence.user_id,
          name: presence.user_name,
          role: presence.user_role,
          editingFields: presence.editing_fields || [],
          joinedAt: presence.joined_at
        });
      }
    });

    setEditingUsers(users);
    console.log('👥 [RealtimeProject] Editing users updated:', users.length);
  }, [user]);

  const handlePresenceJoin = useCallback((payload) => {
    const { newPresences } = payload;
    if (newPresences && newPresences.length > 0) {
      const newUser = newPresences[0];
      if (newUser.user_id !== user.id) {
        showRealtimeNotification('사용자 참여', 
          `${newUser.user_name}님이 프로젝트를 편집하고 있습니다`, 'join');
      }
    }
  }, [user]);

  const handlePresenceLeave = useCallback((payload) => {
    const { leftPresences } = payload;
    if (leftPresences && leftPresences.length > 0) {
      const leftUser = leftPresences[0];
      if (leftUser.user_id !== user.id) {
        // 해당 사용자의 모든 필드 잠금 해제
        setFieldLocks(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(field => {
            if (updated[field].userId === leftUser.user_id) {
              delete updated[field];
            }
          });
          return updated;
        });
      }
    }
  }, [user]);

  // 필드 편집 시작/종료 핸들러들
  const handleFieldEditStart = useCallback((payload) => {
    const { user_id, user_name, field_path } = payload.payload;
    
    if (user_id !== user.id) {
      setFieldLocks(prev => ({
        ...prev,
        [field_path]: {
          userId: user_id,
          userName: user_name,
          startTime: new Date(),
          type: 'editing'
        }
      }));
      
      console.log(`🔒 [RealtimeProject] Field locked by ${user_name}: ${field_path}`);
    }
  }, [user]);

  const handleFieldEditEnd = useCallback((payload) => {
    const { user_id, field_path } = payload.payload;
    
    if (user_id !== user.id) {
      setFieldLocks(prev => {
        const updated = { ...prev };
        delete updated[field_path];
        return updated;
      });
      
      console.log(`🔓 [RealtimeProject] Field unlocked: ${field_path}`);
    }
  }, [user]);

  const handleFieldLock = useCallback((payload) => {
    const { user_id, user_name, field_path } = payload.payload;
    
    if (user_id !== user.id) {
      setFieldLocks(prev => ({
        ...prev,
        [field_path]: {
          userId: user_id,
          userName: user_name,
          startTime: new Date(),
          type: 'locked'
        }
      }));
    }
  }, [user]);

  const handleFieldUnlock = useCallback((payload) => {
    const { field_path } = payload.payload;
    
    setFieldLocks(prev => {
      const updated = { ...prev };
      delete updated[field_path];
      return updated;
    });
  }, []);

  // 필드 편집 시작 알림
  const broadcastFieldEditStart = useCallback((fieldPath) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'field_edit_start',
        payload: {
          user_id: user.id,
          user_name: user.name,
          field_path: fieldPath,
          timestamp: new Date().toISOString()
        }
      });

      // 30초 후 자동 해제 타이머 설정
      if (lockTimeoutRef.current[fieldPath]) {
        clearTimeout(lockTimeoutRef.current[fieldPath]);
      }
      
      lockTimeoutRef.current[fieldPath] = setTimeout(() => {
        broadcastFieldEditEnd(fieldPath);
      }, 30000);
    }
  }, [isConnected, user]);

  // 필드 편집 종료 알림
  const broadcastFieldEditEnd = useCallback((fieldPath) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'field_edit_end',
        payload: {
          user_id: user.id,
          user_name: user.name,
          field_path: fieldPath,
          timestamp: new Date().toISOString()
        }
      });

      // 타이머 정리
      if (lockTimeoutRef.current[fieldPath]) {
        clearTimeout(lockTimeoutRef.current[fieldPath]);
        delete lockTimeoutRef.current[fieldPath];
      }
    }
  }, [isConnected, user]);

  // 실시간 프로젝트 업데이트
  const updateRealtimeProject = useCallback(async (projectId, updates) => {
    try {
      // 먼저 하이브리드 스토어 업데이트
      const result = await hybridProjectStore.updateProject(projectId, updates);
      
      if (result.success) {
        // 실시간 상태도 업데이트
        setRealtimeProject(prev => prev ? { ...prev, ...updates } : null);
        
        console.log('✅ [RealtimeProject] Project updated successfully');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [RealtimeProject] Error updating project:', error);
      return { success: false, error: error.message };
    }
  }, [hybridProjectStore]);

  // 필드별 업데이트 (충돌 방지)
  const updateProjectField = useCallback(async (fieldPath, value) => {
    // 필드가 다른 사용자에 의해 잠겨있는지 확인
    const lock = fieldLocks[fieldPath];
    if (lock && lock.userId !== user.id) {
      alert(`이 필드는 현재 ${lock.userName}님이 편집 중입니다. 잠시 후 다시 시도해주세요.`);
      return { success: false, error: 'Field is locked by another user' };
    }

    try {
      // 편집 시작 알림
      broadcastFieldEditStart(fieldPath);
      
      // 필드 경로를 객체 업데이트로 변환
      const updates = setNestedProperty({}, fieldPath, value);
      
      const result = await updateRealtimeProject(projectId, updates);
      
      // 편집 종료 알림
      setTimeout(() => broadcastFieldEditEnd(fieldPath), 1000);
      
      return result;
      
    } catch (error) {
      broadcastFieldEditEnd(fieldPath);
      throw error;
    }
  }, [fieldLocks, user, projectId, updateRealtimeProject, broadcastFieldEditStart, broadcastFieldEditEnd]);

  // 유틸리티 함수들
  const convertSupabaseToLocal = useCallback((supabaseProject) => {
    return {
      id: supabaseProject.id,
      name: supabaseProject.name,
      modelName: supabaseProject.model_name,
      stage1: supabaseProject.stage1 || {},
      stage2: supabaseProject.stage2 || {},
      stage3: supabaseProject.stage3 || {},
      status: supabaseProject.status,
      createdAt: supabaseProject.created_at,
      updatedAt: supabaseProject.updated_at,
      createdBy: supabaseProject.created_by,
      updatedBy: supabaseProject.updated_by
    };
  }, []);

  const updateLocalStorageProject = useCallback((updatedProject) => {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const updatedProjects = projects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }, []);

  const getChangedFields = useCallback((oldProject, newProject) => {
    if (!oldProject) return [];
    
    const changes = [];
    
    // 간단한 필드 비교 (실제로는 deep diff 필요)
    if (oldProject.name !== newProject.name) changes.push('name');
    if (JSON.stringify(oldProject.stage1) !== JSON.stringify(newProject.stage1)) changes.push('stage1');
    if (JSON.stringify(oldProject.stage2) !== JSON.stringify(newProject.stage2)) changes.push('stage2');
    if (JSON.stringify(oldProject.stage3) !== JSON.stringify(newProject.stage3)) changes.push('stage3');
    
    return changes;
  }, []);

  const setNestedProperty = useCallback((obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  }, []);

  const showRealtimeNotification = useCallback((title, message, type = 'info') => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: `project-${type}-${Date.now()}`
      });
    }
    
    const emoji = type === 'update' ? '🔄' : 
                 type === 'join' ? '👋' : 
                 type === 'leave' ? '👋' : '📢';
    
    console.log(`${emoji} [RealtimeProject] ${title}: ${message}`);
  }, []);

  // 정리 함수
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    // 모든 타이머 정리
    Object.values(lockTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    lockTimeoutRef.current = {};
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setEditingUsers([]);
    setFieldLocks({});
    
    console.log('🔌 [RealtimeProject] Connection cleaned up');
  }, []);

  // 연결 재시도
  const reconnect = useCallback(() => {
    console.log('🔄 [RealtimeProject] Attempting to reconnect...');
    cleanup();
    setTimeout(initializeRealtimeConnection, 2000);
  }, [initializeRealtimeConnection]);

  // 프로젝트 데이터 통합 (실시간 + 기존)
  const currentProject = useMemo(() => {
    if (realtimeProject) {
      return realtimeProject;
    }
    
    // 기존 하이브리드 스토어에서 프로젝트 가져오기
    const project = hybridProjectStore.projects?.find(p => p.id === projectId);
    return project || null;
  }, [realtimeProject, hybridProjectStore.projects, projectId]);

  return {
    // 프로젝트 데이터
    project: currentProject,
    
    // 실시간 상태
    isConnected,
    connectionStatus,
    editingUsers,
    fieldLocks,
    lastUpdate,
    
    // 실시간 액션
    updateProject: updateRealtimeProject,
    updateProjectField,
    broadcastFieldEditStart,
    broadcastFieldEditEnd,
    reconnect,
    
    // 유틸리티
    isFieldLocked: (fieldPath) => !!fieldLocks[fieldPath],
    getFieldLockInfo: (fieldPath) => fieldLocks[fieldPath] || null,
    
    // 기존 하이브리드 기능들
    ...hybridProjectStore
  };
};

export default useRealtimeProject;