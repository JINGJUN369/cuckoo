// 충돌 감지 및 해결 훅
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHybridAuth } from './useHybridAuth';
import { conflictDetector } from '../utils/conflictDetection';
import { getHybridMode, HYBRID_MODE } from '../lib/supabase';

/**
 * 충돌 감지 및 해결 훅
 * - 프로젝트 편집 시 충돌 자동 감지
 * - 충돌 해결 UI 관리
 * - 실시간 편집 상태 관리
 */
export const useConflictDetection = (projectId) => {
  const { user } = useHybridAuth();
  const [conflicts, setConflicts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictResolution, setConflictResolution] = useState(null);
  const [editLocks, setEditLocks] = useState({}); // 다른 사용자의 편집 잠금
  
  const editStartTimeRef = useRef(null);
  const lastSaveRef = useRef(null);

  // 편집 시작
  const startEditing = useCallback(async (fieldPath = null) => {
    if (!projectId || !user) return { conflict: false };

    console.log('🔒 [useConflictDetection] Starting edit for field:', fieldPath);
    
    try {
      const result = await conflictDetector.startEditing(projectId, user.id, fieldPath);
      
      if (result.conflict) {
        console.log('⚠️ [useConflictDetection] Editing conflict detected:', result);
        // 다른 사용자가 편집 중인 경우 경고 표시
        return result;
      }

      setIsEditing(true);
      setEditingField(fieldPath);
      editStartTimeRef.current = new Date();
      
      return { conflict: false };
      
    } catch (error) {
      console.error('❌ [useConflictDetection] Error starting edit:', error);
      return { error: true, message: error.message };
    }
  }, [projectId, user]);

  // 편집 종료
  const endEditing = useCallback(async (fieldPath = null) => {
    if (!projectId || !user) return;

    console.log('🔓 [useConflictDetection] Ending edit for field:', fieldPath || editingField);
    
    try {
      await conflictDetector.endEditing(projectId, user.id, fieldPath || editingField);
      
      setIsEditing(false);
      setEditingField(null);
      editStartTimeRef.current = null;
      
    } catch (error) {
      console.error('❌ [useConflictDetection] Error ending edit:', error);
    }
  }, [projectId, user, editingField]);

  // 데이터 저장 전 충돌 감지
  const checkConflictsBeforeSave = useCallback(async (localData, remoteData = null) => {
    if (!projectId) return { hasConflicts: false, conflicts: [] };

    console.log('🔍 [useConflictDetection] Checking conflicts before save');
    
    try {
      const result = await conflictDetector.detectConflicts(projectId, localData, remoteData);
      
      if (result.hasConflicts) {
        console.log(`⚠️ [useConflictDetection] Found ${result.conflicts.length} conflicts`);
        setConflicts(result.conflicts);
        
        // 자동 해결 시도
        const autoResolution = await conflictDetector.autoResolve(result.conflicts);
        
        if (autoResolution.requiresManualResolution.length > 0) {
          // 수동 해결이 필요한 충돌이 있는 경우 모달 표시
          setShowConflictModal(true);
          return {
            hasConflicts: true,
            conflicts: autoResolution.requiresManualResolution,
            autoResolved: autoResolution.autoResolved
          };
        } else {
          // 모든 충돌이 자동 해결됨
          console.log('✅ [useConflictDetection] All conflicts auto-resolved');
          return {
            hasConflicts: false,
            conflicts: [],
            autoResolved: autoResolution.autoResolved
          };
        }
      }

      return result;
      
    } catch (error) {
      console.error('❌ [useConflictDetection] Error checking conflicts:', error);
      return { error: true, message: error.message };
    }
  }, [projectId]);

  // 충돌 해결 적용
  const resolveConflicts = useCallback(async (resolutionData) => {
    if (!projectId) return null;

    console.log('🔧 [useConflictDetection] Resolving conflicts:', resolutionData);
    
    try {
      const resolvedData = await conflictDetector.applyResolution(projectId, resolutionData);
      
      setConflicts([]);
      setShowConflictModal(false);
      setConflictResolution(resolvedData);
      
      console.log('✅ [useConflictDetection] Conflicts resolved successfully');
      return resolvedData;
      
    } catch (error) {
      console.error('❌ [useConflictDetection] Error resolving conflicts:', error);
      throw error;
    }
  }, [projectId]);

  // 다른 사용자의 편집 잠금 상태 업데이트
  const updateEditLocks = useCallback((lockData) => {
    setEditLocks(prev => ({
      ...prev,
      [lockData.fieldPath || 'global']: {
        userId: lockData.userId,
        userName: lockData.userName,
        startTime: lockData.startTime,
        isLocked: lockData.action === 'lock'
      }
    }));
  }, []);

  // 필드별 편집 가능 여부 확인
  const isFieldLocked = useCallback((fieldPath) => {
    if (!fieldPath) return false;
    const lock = editLocks[fieldPath];
    return lock && lock.isLocked && lock.userId !== user?.id;
  }, [editLocks, user]);

  // 편집 중인 사용자 정보 가져오기
  const getEditingUser = useCallback((fieldPath) => {
    const lock = editLocks[fieldPath];
    return lock && lock.isLocked ? lock : null;
  }, [editLocks]);

  // 충돌 감지 리스너 등록
  useEffect(() => {
    if (!projectId || getHybridMode() === HYBRID_MODE.DISABLED) return;

    const handleConflict = (conflictData) => {
      console.log('🚨 [useConflictDetection] Conflict detected:', conflictData);
      setConflicts(prev => [...prev, ...conflictData.conflicts]);
      
      if (conflictData.requiresUserAction) {
        setShowConflictModal(true);
      }
    };

    conflictDetector.onConflict(projectId, handleConflict);

    return () => {
      conflictDetector.offConflict(projectId, handleConflict);
    };
  }, [projectId]);

  // 편집 세션 정리 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (isEditing && projectId && user) {
        conflictDetector.endEditing(projectId, user.id, editingField);
      }
    };
  }, [isEditing, projectId, user, editingField]);

  // 페이지 이탈 시 편집 세션 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isEditing && projectId && user) {
        // 동기적으로 처리 (비동기는 페이지 이탈 시 완료되지 않을 수 있음)
        navigator.sendBeacon('/api/end-editing', JSON.stringify({
          projectId,
          userId: user.id,
          fieldPath: editingField
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, projectId, user, editingField]);

  // 자동 저장 타이머 (편집 중일 때만)
  useEffect(() => {
    if (!isEditing) return;

    const autoSaveInterval = setInterval(() => {
      if (editStartTimeRef.current) {
        const editDuration = new Date() - editStartTimeRef.current;
        
        // 5분 이상 편집 중이면 자동 저장 알림
        if (editDuration > 5 * 60 * 1000) {
          console.log('💾 [useConflictDetection] Auto-save reminder after 5 minutes of editing');
        }
      }
    }, 60000); // 1분마다 확인

    return () => clearInterval(autoSaveInterval);
  }, [isEditing]);

  return {
    // 상태
    conflicts,
    isEditing,
    editingField,
    showConflictModal,
    conflictResolution,
    editLocks,

    // 편집 관리
    startEditing,
    endEditing,
    
    // 충돌 관리
    checkConflictsBeforeSave,
    resolveConflicts,
    
    // 잠금 관리
    isFieldLocked,
    getEditingUser,
    updateEditLocks,
    
    // UI 제어
    setShowConflictModal,
    
    // 편집 상태 정보
    getEditDuration: () => {
      return editStartTimeRef.current ? new Date() - editStartTimeRef.current : 0;
    },
    
    getLastSaveTime: () => lastSaveRef.current,
    
    setLastSaveTime: (time = new Date()) => {
      lastSaveRef.current = time;
    }
  };
};

export default useConflictDetection;