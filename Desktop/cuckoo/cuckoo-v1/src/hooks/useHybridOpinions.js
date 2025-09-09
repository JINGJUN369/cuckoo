// 하이브리드 의견 시스템 - LocalStorage + Supabase 연동
import { useCallback, useEffect, useState } from 'react'
import { useProjectStore } from './useProjectStore_v1.1'
import { hybridDataSync, SYNC_STATUS } from '../utils/hybridDataSync'
import { getHybridMode, HYBRID_MODE, executeSupabaseQuery, supabase } from '../lib/supabase'

export const useHybridOpinions = () => {
  // 기존 LocalStorage 기반 스토어에서 의견 관련 기능 사용
  const { opinions, addOpinion: localAddOpinion, updateOpinion: localUpdateOpinion } = useProjectStore()
  
  // 하이브리드 상태 관리
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncErrors, setSyncErrors] = useState([])
  
  // 실시간 의견 업데이트를 위한 상태
  const [realtimeOpinions, setRealtimeOpinions] = useState([])

  // 의견 추가 (하이브리드)
  const addOpinion = useCallback(async (opinionData) => {
    try {
      // UUID 생성 (Supabase 호환)
      const opinionId = opinionData.id || `opinion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newOpinion = {
        ...opinionData,
        id: opinionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 1. LocalStorage에 먼저 추가 (기존 방식)
      localAddOpinion(newOpinion)
      console.log('✅ Opinion added to LocalStorage:', opinionId)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        // Supabase 형식으로 변환
        const supabaseOpinion = {
          id: opinionId,
          project_id: newOpinion.projectId,
          project_is_completed: newOpinion.projectIsCompleted || false,
          author_name: newOpinion.authorName,
          message: newOpinion.message,
          stage: newOpinion.stage || null,
          status: newOpinion.status || 'open',
          priority: newOpinion.priority || 'medium',
          reply: newOpinion.reply || null,
          created_by: newOpinion.createdBy || null,
          updated_by: newOpinion.updatedBy || null,
          migrated_from_local: true,
          local_created_at: newOpinion.createdAt
        }
        
        const { success, error } = await executeSupabaseQuery(
          () => supabase.from('opinions').insert([supabaseOpinion]).select()
        )
        
        if (success) {
          setSyncStatus(SYNC_STATUS.SUCCESS)
          console.log('✅ Opinion synced to Supabase:', opinionId)
        } else {
          setSyncStatus(SYNC_STATUS.ERROR)
          setSyncErrors(prev => [...prev, `Failed to sync opinion ${opinionId}: ${error.message}`])
          console.error('❌ Failed to sync opinion to Supabase:', error)
        }
      }

      return { success: true, data: newOpinion }

    } catch (error) {
      console.error('Error adding opinion:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localAddOpinion])

  // 의견 업데이트 (하이브리드)
  const updateOpinion = useCallback(async (opinionId, updates) => {
    try {
      // 1. LocalStorage 업데이트 (기존 방식)
      const updatedOpinionData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      localUpdateOpinion(opinionId, updatedOpinionData)
      console.log('✅ Opinion updated in LocalStorage:', opinionId)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        // Supabase 업데이트 데이터 변환
        const supabaseUpdates = {}
        if (updates.message !== undefined) supabaseUpdates.message = updates.message
        if (updates.status !== undefined) supabaseUpdates.status = updates.status
        if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority
        if (updates.reply !== undefined) supabaseUpdates.reply = updates.reply
        if (updates.stage !== undefined) supabaseUpdates.stage = updates.stage
        if (updates.updatedBy !== undefined) supabaseUpdates.updated_by = updates.updatedBy
        
        supabaseUpdates.updated_at = new Date().toISOString()
        
        const { success, error } = await executeSupabaseQuery(
          () => supabase.from('opinions').update(supabaseUpdates).eq('id', opinionId)
        )
        
        if (success) {
          setSyncStatus(SYNC_STATUS.SUCCESS)
          console.log('✅ Opinion update synced to Supabase:', opinionId)
        } else {
          setSyncStatus(SYNC_STATUS.ERROR)
          setSyncErrors(prev => [...prev, `Failed to sync opinion update ${opinionId}: ${error.message}`])
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error updating opinion:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localUpdateOpinion])

  // 의견 삭제 (하이브리드)
  const deleteOpinion = useCallback(async (opinionId) => {
    try {
      // 1. LocalStorage에서 삭제
      const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]')
      const filteredOpinions = localOpinions.filter(opinion => opinion.id !== opinionId)
      localStorage.setItem('opinions', JSON.stringify(filteredOpinions))
      console.log('✅ Opinion deleted from LocalStorage:', opinionId)

      // 2. 하이브리드 모드에서 Supabase에서도 삭제
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        const { success, error } = await executeSupabaseQuery(
          () => supabase.from('opinions').delete().eq('id', opinionId)
        )
        
        if (success) {
          setSyncStatus(SYNC_STATUS.SUCCESS)
          console.log('✅ Opinion deleted from Supabase:', opinionId)
        } else {
          setSyncStatus(SYNC_STATUS.ERROR)
          setSyncErrors(prev => [...prev, `Failed to delete opinion ${opinionId}: ${error.message}`])
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error deleting opinion:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [])

  // 프로젝트별 의견 가져오기 (하이브리드)
  const getOpinionsByProject = useCallback(async (projectId, includeCompleted = false) => {
    try {
      // LocalStorage에서 기본 의견들 가져오기
      let localOpinions = opinions.filter(opinion => opinion.projectId === projectId)
      
      // 하이브리드 모드에서 Supabase에서도 가져오기
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        const { success, data: supabaseOpinions } = await executeSupabaseQuery(
          () => supabase.from('opinions')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
        )
        
        if (success && supabaseOpinions) {
          // Supabase → LocalStorage 형식 변환
          const convertedOpinions = supabaseOpinions.map(opinion => ({
            id: opinion.id,
            projectId: opinion.project_id,
            projectIsCompleted: opinion.project_is_completed,
            authorName: opinion.author_name,
            message: opinion.message,
            stage: opinion.stage,
            status: opinion.status,
            priority: opinion.priority,
            reply: opinion.reply,
            createdAt: opinion.created_at,
            updatedAt: opinion.updated_at,
            createdBy: opinion.created_by,
            updatedBy: opinion.updated_by
          }))
          
          // 중복 제거 후 병합 (LocalStorage 우선)
          const localIds = localOpinions.map(op => op.id)
          const newSupabaseOpinions = convertedOpinions.filter(op => !localIds.includes(op.id))
          
          localOpinions = [...localOpinions, ...newSupabaseOpinions]
          console.log(`📊 Opinions loaded: ${localOpinions.length} total (${newSupabaseOpinions.length} from Supabase)`)
        }
      }
      
      return localOpinions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
    } catch (error) {
      console.error('Error getting opinions by project:', error)
      return opinions.filter(opinion => opinion.projectId === projectId)
    }
  }, [opinions])

  // 전체 의견 동기화
  const syncAllOpinions = useCallback(async () => {
    try {
      setSyncStatus(SYNC_STATUS.SYNCING)
      console.log('🔄 Starting opinion sync...')

      const result = await hybridDataSync.syncDataType('opinions')
      
      if (result.success) {
        setSyncStatus(SYNC_STATUS.SUCCESS)
        setLastSyncTime(new Date())
        setSyncErrors([])
        console.log('✅ Opinion sync completed:', result.result)
        
        return { success: true, stats: result.result }
      } else {
        setSyncStatus(SYNC_STATUS.ERROR)
        setSyncErrors([result.error])
        return { success: false, error: result.error }
      }

    } catch (error) {
      console.error('Error syncing opinions:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      setSyncErrors([error.message])
      return { success: false, error: error.message }
    }
  }, [])

  // 실시간 의견 업데이트 구독 설정
  const subscribeToRealtimeOpinions = useCallback((projectId) => {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.DISABLED) return null

    console.log('📡 Subscribing to realtime opinions for project:', projectId)

    const channel = supabase
      .channel(`opinions_${projectId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'opinions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('📡 Realtime opinion change:', payload)
          
          if (payload.eventType === 'INSERT') {
            // 새로운 의견 추가
            const newOpinion = {
              id: payload.new.id,
              projectId: payload.new.project_id,
              authorName: payload.new.author_name,
              message: payload.new.message,
              stage: payload.new.stage,
              status: payload.new.status,
              priority: payload.new.priority,
              reply: payload.new.reply,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
              createdBy: payload.new.created_by,
              updatedBy: payload.new.updated_by
            }
            
            // LocalStorage에도 추가 (중복 방지)
            const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]')
            if (!localOpinions.find(op => op.id === newOpinion.id)) {
              localOpinions.push(newOpinion)
              localStorage.setItem('opinions', JSON.stringify(localOpinions))
              console.log('📡 New opinion added from realtime:', newOpinion.id)
            }
          } else if (payload.eventType === 'UPDATE') {
            // 의견 업데이트
            const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]')
            const opinionIndex = localOpinions.findIndex(op => op.id === payload.new.id)
            
            if (opinionIndex !== -1) {
              localOpinions[opinionIndex] = {
                ...localOpinions[opinionIndex],
                message: payload.new.message,
                status: payload.new.status,
                priority: payload.new.priority,
                reply: payload.new.reply,
                updatedAt: payload.new.updated_at,
                updatedBy: payload.new.updated_by
              }
              
              localStorage.setItem('opinions', JSON.stringify(localOpinions))
              console.log('📡 Opinion updated from realtime:', payload.new.id)
            }
          } else if (payload.eventType === 'DELETE') {
            // 의견 삭제
            const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]')
            const filteredOpinions = localOpinions.filter(op => op.id !== payload.old.id)
            localStorage.setItem('opinions', JSON.stringify(filteredOpinions))
            console.log('📡 Opinion deleted from realtime:', payload.old.id)
          }
        }
      )
      .subscribe()

    return channel
  }, [])

  // 실시간 구독 해제
  const unsubscribeFromRealtimeOpinions = useCallback((channel) => {
    if (channel) {
      supabase.removeChannel(channel)
      console.log('📡 Unsubscribed from realtime opinions')
    }
  }, [])

  // 초기 동기화
  useEffect(() => {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.ENABLED) {
      console.log('🚀 Initial opinion sync...')
      setTimeout(syncAllOpinions, 3000) // 3초 후 초기 동기화
    }
  }, [syncAllOpinions])

  // 동기화 상태 정리
  const clearSyncErrors = useCallback(() => {
    setSyncErrors([])
    if (syncStatus === SYNC_STATUS.ERROR) {
      setSyncStatus(SYNC_STATUS.IDLE)
    }
  }, [syncStatus])

  return {
    // 기존 의견 데이터
    opinions,
    
    // 하이브리드 확장 메서드들
    addOpinion,
    updateOpinion,
    deleteOpinion,
    getOpinionsByProject,
    syncAllOpinions,
    clearSyncErrors,
    
    // 실시간 기능
    subscribeToRealtimeOpinions,
    unsubscribeFromRealtimeOpinions,
    
    // 하이브리드 상태
    hybridMode: getHybridMode(),
    syncStatus,
    lastSyncTime,
    syncErrors,
    hasSyncErrors: syncErrors.length > 0,
    
    // 유틸리티
    isHybridEnabled: getHybridMode() !== HYBRID_MODE.DISABLED,
    isSyncing: syncStatus === SYNC_STATUS.SYNCING
  }
}