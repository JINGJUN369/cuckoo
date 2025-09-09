// 하이브리드 프로젝트 스토어 - LocalStorage + Supabase 연동
import { useCallback, useEffect, useState } from 'react'
import { useProjectStore } from './useProjectStore_v1.1'
import { hybridDataSync, SYNC_STATUS } from '../utils/hybridDataSync'
import { getHybridMode, HYBRID_MODE, executeSupabaseQuery, supabase } from '../lib/supabase'

export const useHybridProjectStore = () => {
  // 기존 LocalStorage 기반 스토어
  const localStore = useProjectStore()
  
  // 하이브리드 상태 관리
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncErrors, setSyncErrors] = useState([])

  // 자동 동기화 간격 (5분)
  const AUTO_SYNC_INTERVAL = 5 * 60 * 1000 // 300초

  // 프로젝트 생성 (하이브리드)
  const addProject = useCallback(async (projectData) => {
    try {
      // 1. LocalStorage에 먼저 생성 (기존 방식)
      localStore.addProject(projectData)
      console.log('✅ Project added to LocalStorage:', projectData.id)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        const syncResult = await hybridDataSync.syncDataType('projects', 'local_to_supabase')
        
        if (syncResult.success) {
          setSyncStatus(SYNC_STATUS.SUCCESS)
          console.log('✅ Project synced to Supabase:', projectData.id)
        } else {
          setSyncStatus(SYNC_STATUS.ERROR)
          setSyncErrors(prev => [...prev, `Failed to sync project ${projectData.id}: ${syncResult.error}`])
          console.error('❌ Failed to sync project to Supabase:', syncResult.error)
        }
      }

      return { success: true, data: projectData }

    } catch (error) {
      console.error('Error adding project:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localStore])

  // 프로젝트 업데이트 (하이브리드)
  const updateProject = useCallback(async (projectId, updates, userId) => {
    try {
      // 1. LocalStorage 업데이트 (기존 방식)
      localStore.updateProject(projectId, updates, userId)
      console.log('✅ Project updated in LocalStorage:', projectId)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        // 특정 프로젝트만 동기화
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProject = localProjects.find(p => p.id === projectId)
        
        if (updatedProject) {
          const syncResult = await hybridDataSync.setSupabaseData('projects', [updatedProject], 'upsert')
          
          if (syncResult.success) {
            setSyncStatus(SYNC_STATUS.SUCCESS)
            console.log('✅ Project update synced to Supabase:', projectId)
          } else {
            setSyncStatus(SYNC_STATUS.ERROR)
            setSyncErrors(prev => [...prev, `Failed to sync project update ${projectId}: ${syncResult.error}`])
          }
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error updating project:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localStore])

  // 프로젝트 삭제 (하이브리드)
  const deleteProject = useCallback(async (projectId) => {
    try {
      // 1. LocalStorage에서 삭제 (기존 방식)
      localStore.deleteProject(projectId)
      console.log('✅ Project deleted from LocalStorage:', projectId)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        // Supabase에서도 삭제
        const { success, error } = await executeSupabaseQuery(
          () => supabase.from('projects').delete().eq('id', projectId)
        )
        
        if (success) {
          setSyncStatus(SYNC_STATUS.SUCCESS)
          console.log('✅ Project deleted from Supabase:', projectId)
        } else {
          setSyncStatus(SYNC_STATUS.ERROR)
          setSyncErrors(prev => [...prev, `Failed to delete project ${projectId}: ${error}`])
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error deleting project:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localStore])

  // 프로젝트 완료 처리 (하이브리드)
  const completeProject = useCallback(async (projectId, completionData = {}) => {
    try {
      console.log('🚀 Starting project completion:', projectId, completionData)
      
      // 1. LocalStorage에서 완료 처리 (기존 방식)
      try {
        // moveToCompleted는 dispatch만 호출하므로 반환값이 없음
        localStore.moveToCompleted(projectId, completionData)
        console.log('✅ Project completed in LocalStorage:', projectId)
        
        // React 상태 업데이트 완료를 위해 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // LocalStorage 처리 성공 확인
        const completedProjects = JSON.parse(localStorage.getItem('completedProjects') || '[]')
        const isCompleted = completedProjects.some(p => p.id === projectId)
        
        if (isCompleted) {
          console.log('✅ Project found in completed projects:', projectId)
        } else {
          console.warn('⚠️ Project not found in completed projects, retrying...')
          // 한 번 더 시도
          await new Promise(resolve => setTimeout(resolve, 200))
          const retryCompleted = JSON.parse(localStorage.getItem('completedProjects') || '[]')
          const isRetryCompleted = retryCompleted.some(p => p.id === projectId)
          
          if (!isRetryCompleted) {
            throw new Error('Project was not moved to completed projects after dispatch')
          }
          console.log('✅ Project found in completed projects after retry:', projectId)
        }
        
      } catch (localError) {
        console.error('❌ LocalStorage completion failed:', localError)
        throw new Error(`LocalStorage completion failed: ${localError.message}`)
      }

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      console.log('🔄 Hybrid mode:', hybridMode)
      
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        try {
          // projects와 completed_projects 모두 동기화
          console.log('🔄 Starting Supabase sync...')
          const syncResults = await Promise.all([
            hybridDataSync.syncDataType('projects', 'local_to_supabase'),
            hybridDataSync.syncDataType('completedProjects', 'local_to_supabase')
          ])
          
          console.log('📊 Sync results:', syncResults)
          
          const allSuccess = syncResults.every(result => result.success)
          
          if (allSuccess) {
            setSyncStatus(SYNC_STATUS.SUCCESS)
            console.log('✅ Project completion synced to Supabase:', projectId)
          } else {
            setSyncStatus(SYNC_STATUS.ERROR)
            const errors = syncResults.filter(r => !r.success).map(r => r.error)
            console.error('❌ Sync errors:', errors)
            setSyncErrors(prev => [...prev, ...errors])
            
            // Supabase 동기화 실패해도 LocalStorage는 완료되었으므로 성공으로 처리
            console.warn('⚠️ Supabase sync failed, but LocalStorage completion succeeded')
          }
        } catch (syncError) {
          console.error('❌ Supabase sync error:', syncError)
          setSyncStatus(SYNC_STATUS.ERROR)
          setSyncErrors(prev => [...prev, syncError.message])
          
          // Supabase 동기화 실패해도 LocalStorage는 완료되었으므로 성공으로 처리
          console.warn('⚠️ Supabase sync failed, but LocalStorage completion succeeded')
        }
      }

      console.log('✅ Project completion process completed:', projectId)
      return { success: true }

    } catch (error) {
      console.error('❌ Error completing project:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localStore])

  // 프로젝트 복원 (하이브리드)
  const restoreProject = useCallback(async (projectId, restorationData = {}) => {
    try {
      // 1. LocalStorage에서 복원 (기존 방식)
      localStore.restoreProject(projectId, restorationData)
      console.log('✅ Project restored in LocalStorage:', projectId)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED) {
        setSyncStatus(SYNC_STATUS.SYNCING)
        
        const syncResults = await Promise.all([
          hybridDataSync.syncDataType('projects', 'local_to_supabase'),
          hybridDataSync.syncDataType('completedProjects', 'local_to_supabase')
        ])
        
        const allSuccess = syncResults.every(result => result.success)
        
        if (allSuccess) {
          setSyncStatus(SYNC_STATUS.SUCCESS)
          console.log('✅ Project restoration synced to Supabase:', projectId)
        } else {
          setSyncStatus(SYNC_STATUS.ERROR)
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error restoring project:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      return { success: false, error: error.message }
    }
  }, [localStore])

  // 전체 프로젝트 동기화
  const syncAllProjects = useCallback(async () => {
    try {
      setSyncStatus(SYNC_STATUS.SYNCING)
      console.log('🔄 Starting full project sync...')

      const results = await Promise.all([
        hybridDataSync.syncDataType('projects'),
        hybridDataSync.syncDataType('completedProjects')
      ])

      const allSuccess = results.every(result => result.success)
      
      if (allSuccess) {
        setSyncStatus(SYNC_STATUS.SUCCESS)
        setLastSyncTime(new Date())
        setSyncErrors([])
        console.log('✅ Full project sync completed')
        
        return { 
          success: true, 
          stats: {
            projects: results[0].result,
            completedProjects: results[1].result
          }
        }
      } else {
        setSyncStatus(SYNC_STATUS.ERROR)
        const errors = results.filter(r => !r.success).map(r => r.error)
        setSyncErrors(errors)
        return { success: false, errors }
      }

    } catch (error) {
      console.error('Error syncing all projects:', error)
      setSyncStatus(SYNC_STATUS.ERROR)
      setSyncErrors([error.message])
      return { success: false, error: error.message }
    }
  }, [])

  // 자동 동기화 설정
  useEffect(() => {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.DISABLED) return

    console.log('⏰ Setting up auto-sync for projects...')
    
    const syncInterval = setInterval(() => {
      const currentMode = getHybridMode()
      if (currentMode !== HYBRID_MODE.DISABLED && syncStatus !== SYNC_STATUS.SYNCING) {
        console.log('⏰ Auto-sync projects (5min interval)...')
        syncAllProjects()
      }
    }, AUTO_SYNC_INTERVAL)

    return () => {
      clearInterval(syncInterval)
      console.log('⏰ Auto-sync stopped')
    }
  }, [syncAllProjects, syncStatus])

  // 초기 동기화
  useEffect(() => {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.ENABLED) {
      console.log('🚀 Initial project sync...')
      setTimeout(syncAllProjects, 2000) // 2초 후 초기 동기화
    }
  }, [syncAllProjects])

  // 동기화 상태 정리
  const clearSyncErrors = useCallback(() => {
    setSyncErrors([])
    if (syncStatus === SYNC_STATUS.ERROR) {
      setSyncStatus(SYNC_STATUS.IDLE)
    }
  }, [syncStatus])

  // 페이지 이동 시 동기화 (즉시)
  const syncOnPageChange = useCallback(async () => {
    const hybridMode = getHybridMode()
    if (hybridMode !== HYBRID_MODE.DISABLED && syncStatus !== SYNC_STATUS.SYNCING) {
      console.log('🔄 Page change sync triggered')
      await syncAllProjects()
    }
  }, [syncAllProjects, syncStatus])

  // 데이터 변경 시 즉시 동기화
  const syncOnDataChange = useCallback(async () => {
    const hybridMode = getHybridMode()
    if (hybridMode !== HYBRID_MODE.DISABLED) {
      console.log('💾 Data change sync triggered')
      await syncAllProjects()
    }
  }, [syncAllProjects])

  // 기존 LocalStorage 스토어의 모든 속성과 메서드 + 하이브리드 확장
  return {
    // 기존 스토어 속성들
    ...localStore,
    
    // 하이브리드 확장 메서드들 (기존 메서드 오버라이드)
    addProject,
    updateProject,
    deleteProject,
    moveToCompleted: completeProject,
    restoreProject,
    
    // 하이브리드 전용 메서드들
    syncAllProjects,
    syncOnPageChange,
    syncOnDataChange,
    clearSyncErrors,
    
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