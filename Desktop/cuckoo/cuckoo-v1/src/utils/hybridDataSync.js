// 하이브리드 데이터 동기화 시스템
// LocalStorage ↔ Supabase 양방향 동기화

import { supabase, getHybridMode, HYBRID_MODE, executeSupabaseQuery } from '../lib/supabase'

// 동기화 상태 관리
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  CONFLICT: 'conflict'
}

// 동기화 방향
export const SYNC_DIRECTION = {
  LOCAL_TO_SUPABASE: 'local_to_supabase',
  SUPABASE_TO_LOCAL: 'supabase_to_local',
  BIDIRECTIONAL: 'bidirectional'
}

// 데이터 타입별 동기화 설정
export const SYNC_CONFIG = {
  projects: {
    table: 'projects',
    localKey: 'projects',
    primaryKey: 'id',
    syncEnabled: true,
    conflictResolution: 'local_wins' // local_wins, server_wins, manual
  },
  completedProjects: {
    table: 'completed_projects',
    localKey: 'completedProjects', 
    primaryKey: 'id',
    syncEnabled: true,
    conflictResolution: 'local_wins'
  },
  opinions: {
    table: 'opinions',
    localKey: 'opinions',
    primaryKey: 'id', 
    syncEnabled: true,
    conflictResolution: 'server_wins'
  },
  activityLogs: {
    table: 'activity_logs',
    localKey: 'activityLogs',
    primaryKey: 'id',
    syncEnabled: true,
    conflictResolution: 'server_wins'
  }
}

class HybridDataSync {
  constructor() {
    this.syncStatus = {}
    this.conflictQueue = []
    this.syncInProgress = false
    
    // 각 데이터 타입별 상태 초기화
    Object.keys(SYNC_CONFIG).forEach(dataType => {
      this.syncStatus[dataType] = SYNC_STATUS.IDLE
    })
  }

  // LocalStorage 데이터 가져오기
  getLocalData(dataType) {
    try {
      const config = SYNC_CONFIG[dataType]
      if (!config) throw new Error(`Unknown data type: ${dataType}`)
      
      const data = localStorage.getItem(config.localKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error getting local data for ${dataType}:`, error)
      return []
    }
  }

  // LocalStorage 데이터 저장
  setLocalData(dataType, data) {
    try {
      const config = SYNC_CONFIG[dataType]
      if (!config) throw new Error(`Unknown data type: ${dataType}`)
      
      localStorage.setItem(config.localKey, JSON.stringify(data))
      console.log(`✅ Local ${dataType} updated: ${data.length} items`)
      return true
    } catch (error) {
      console.error(`Error setting local data for ${dataType}:`, error)
      return false
    }
  }

  // Supabase 데이터 가져오기
  async getSupabaseData(dataType) {
    try {
      const config = SYNC_CONFIG[dataType]
      if (!config) throw new Error(`Unknown data type: ${dataType}`)

      const { success, data } = await executeSupabaseQuery(
        () => supabase.from(config.table).select('*').order('created_at', { ascending: false })
      )

      if (!success) throw new Error('Failed to fetch from Supabase')
      
      return data || []
    } catch (error) {
      console.error(`Error getting Supabase data for ${dataType}:`, error)
      return []
    }
  }

  // Supabase에 데이터 저장/업데이트
  async setSupabaseData(dataType, items, operation = 'upsert') {
    try {
      const config = SYNC_CONFIG[dataType]
      if (!config) throw new Error(`Unknown data type: ${dataType}`)

      if (!Array.isArray(items)) items = [items]
      if (items.length === 0) return { success: true, data: [] }

      // LocalStorage → Supabase 변환
      const transformedItems = items.map(item => this.transformToSupabase(dataType, item))

      let result
      if (operation === 'upsert') {
        result = await executeSupabaseQuery(
          () => supabase.from(config.table).upsert(transformedItems).select()
        )
      } else if (operation === 'insert') {
        result = await executeSupabaseQuery(
          () => supabase.from(config.table).insert(transformedItems).select()
        )
      } else if (operation === 'update') {
        // 개별 업데이트 (ID 기반)
        const updates = []
        for (const item of transformedItems) {
          const updateResult = await executeSupabaseQuery(
            () => supabase.from(config.table)
              .update(item)
              .eq(config.primaryKey, item[config.primaryKey])
              .select()
          )
          if (updateResult.success) {
            updates.push(updateResult.data[0])
          }
        }
        result = { success: true, data: updates }
      }

      if (!result.success) throw new Error('Failed to save to Supabase')

      console.log(`✅ Supabase ${dataType} ${operation}: ${result.data.length} items`)
      return result

    } catch (error) {
      console.error(`Error setting Supabase data for ${dataType}:`, error)
      return { success: false, error }
    }
  }

  // LocalStorage ↔ Supabase 데이터 변환
  transformToSupabase(dataType, localItem) {
    // 기본 변환 (필요에 따라 데이터 타입별로 확장)
    const transformed = { ...localItem }
    
    // 마이그레이션 플래그 추가
    transformed.migrated_from_local = true
    transformed.local_created_at = localItem.createdAt || new Date().toISOString()
    
    // 컬럼명 매핑: camelCase → snake_case
    if (localItem.createdAt) {
      transformed.created_at = localItem.createdAt
      delete transformed.createdAt // camelCase 제거
    }
    if (localItem.updatedAt) {
      transformed.updated_at = localItem.updatedAt
      delete transformed.updatedAt
    }
    if (localItem.modelName) {
      transformed.model_name = localItem.modelName
      // modelName은 유지 (하위 호환성)
    }
    
    // 현재 시간을 created_at, updated_at으로 설정
    if (!transformed.created_at) {
      transformed.created_at = new Date().toISOString()
    }
    if (!transformed.updated_at) {
      transformed.updated_at = new Date().toISOString()
    }
    
    // UUID 변환 (opinions, activity_logs)
    if (dataType === 'opinions' || dataType === 'activityLogs') {
      // LocalStorage의 string ID를 그대로 사용 (Supabase에서 UUID로 처리)
      if (localItem.id && typeof localItem.id === 'string') {
        // UUID 형식이 아니면 새로 생성하지 않고 문자열 그대로 사용
        transformed.id = localItem.id
      }
    }

    return transformed
  }

  transformToLocal(dataType, supabaseItem) {
    const transformed = { ...supabaseItem }
    
    // Supabase → LocalStorage 변환
    if (transformed.created_at && !transformed.createdAt) {
      transformed.createdAt = transformed.created_at
    }
    if (transformed.updated_at && !transformed.updatedAt) {
      transformed.updatedAt = transformed.updated_at
    }
    
    return transformed
  }

  // 데이터 충돌 감지
  detectConflicts(localItems, supabaseItems, dataType) {
    const conflicts = []
    const config = SYNC_CONFIG[dataType]
    const primaryKey = config.primaryKey

    for (const localItem of localItems) {
      const supabaseItem = supabaseItems.find(item => item[primaryKey] === localItem[primaryKey])
      
      if (supabaseItem) {
        // 수정 시간 비교 (간단한 충돌 감지)
        const localUpdated = new Date(localItem.updatedAt || localItem.createdAt || 0)
        const supabaseUpdated = new Date(supabaseItem.updated_at || supabaseItem.created_at || 0)
        
        if (localUpdated.getTime() !== supabaseUpdated.getTime()) {
          conflicts.push({
            id: localItem[primaryKey],
            dataType,
            local: localItem,
            supabase: supabaseItem,
            localUpdated,
            supabaseUpdated
          })
        }
      }
    }

    return conflicts
  }

  // 충돌 해결
  async resolveConflicts(conflicts) {
    const resolved = []
    
    for (const conflict of conflicts) {
      const config = SYNC_CONFIG[conflict.dataType]
      let resolution

      switch (config.conflictResolution) {
        case 'local_wins':
          resolution = conflict.local
          break
        case 'server_wins': 
          resolution = conflict.supabase
          break
        case 'latest_wins':
          resolution = conflict.localUpdated > conflict.supabaseUpdated 
            ? conflict.local 
            : conflict.supabase
          break
        default:
          // 수동 해결을 위해 큐에 추가
          this.conflictQueue.push(conflict)
          continue
      }

      resolved.push({
        ...conflict,
        resolution,
        resolvedAt: new Date().toISOString()
      })
    }

    return resolved
  }

  // 단일 데이터 타입 동기화
  async syncDataType(dataType, direction = SYNC_DIRECTION.BIDIRECTIONAL) {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.DISABLED) {
      return { success: true, message: 'Sync disabled' }
    }

    const config = SYNC_CONFIG[dataType]
    if (!config?.syncEnabled) {
      return { success: true, message: 'Sync not enabled for this data type' }
    }

    try {
      this.syncStatus[dataType] = SYNC_STATUS.SYNCING
      console.log(`🔄 Syncing ${dataType} (${direction})...`)

      const localData = this.getLocalData(dataType)
      const supabaseData = await this.getSupabaseData(dataType)

      let syncResult = {
        dataType,
        direction,
        localCount: localData.length,
        supabaseCount: supabaseData.length,
        conflicts: [],
        synced: 0,
        errors: 0
      }

      if (direction === SYNC_DIRECTION.LOCAL_TO_SUPABASE || direction === SYNC_DIRECTION.BIDIRECTIONAL) {
        // LocalStorage → Supabase
        if (localData.length > 0) {
          const upsertResult = await this.setSupabaseData(dataType, localData, 'upsert')
          if (upsertResult.success) {
            syncResult.synced += upsertResult.data.length
          } else {
            syncResult.errors++
          }
        }
      }

      if (direction === SYNC_DIRECTION.SUPABASE_TO_LOCAL || direction === SYNC_DIRECTION.BIDIRECTIONAL) {
        // Supabase → LocalStorage (새로운 데이터만)
        const existingIds = localData.map(item => item[config.primaryKey])
        const newSupabaseItems = supabaseData.filter(item => !existingIds.includes(item[config.primaryKey]))
        
        if (newSupabaseItems.length > 0) {
          const transformedItems = newSupabaseItems.map(item => this.transformToLocal(dataType, item))
          const mergedData = [...localData, ...transformedItems]
          this.setLocalData(dataType, mergedData)
          syncResult.synced += newSupabaseItems.length
        }
      }

      // 충돌 감지 및 해결
      if (direction === SYNC_DIRECTION.BIDIRECTIONAL) {
        const conflicts = this.detectConflicts(localData, supabaseData, dataType)
        if (conflicts.length > 0) {
          console.log(`⚠️ ${conflicts.length} conflicts detected for ${dataType}`)
          const resolved = await this.resolveConflicts(conflicts)
          syncResult.conflicts = conflicts
          syncResult.resolved = resolved.length
        }
      }

      this.syncStatus[dataType] = SYNC_STATUS.SUCCESS
      console.log(`✅ ${dataType} sync completed:`, syncResult)
      
      return { success: true, result: syncResult }

    } catch (error) {
      console.error(`❌ Error syncing ${dataType}:`, error)
      this.syncStatus[dataType] = SYNC_STATUS.ERROR
      return { success: false, error: error.message }
    }
  }

  // 모든 데이터 타입 동기화
  async syncAll(direction = SYNC_DIRECTION.BIDIRECTIONAL) {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' }
    }

    try {
      this.syncInProgress = true
      console.log('🚀 Starting full data sync...')

      const results = {}
      const dataTypes = Object.keys(SYNC_CONFIG).filter(type => SYNC_CONFIG[type].syncEnabled)

      for (const dataType of dataTypes) {
        results[dataType] = await this.syncDataType(dataType, direction)
      }

      const totalSynced = Object.values(results)
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.result?.synced || 0), 0)

      const totalErrors = Object.values(results)
        .filter(r => !r.success).length

      console.log(`✅ Full sync completed: ${totalSynced} items synced, ${totalErrors} errors`)

      return { 
        success: totalErrors === 0, 
        results, 
        summary: { synced: totalSynced, errors: totalErrors }
      }

    } finally {
      this.syncInProgress = false
    }
  }

  // 실시간 동기화 시작 (Supabase Realtime)
  startRealtimeSync() {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.DISABLED) return

    console.log('🔴 Starting realtime sync...')

    Object.keys(SYNC_CONFIG).forEach(dataType => {
      const config = SYNC_CONFIG[dataType]
      if (!config.syncEnabled) return

      const channel = supabase
        .channel(`${config.table}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: config.table },
          (payload) => {
            console.log(`🔴 Realtime change in ${dataType}:`, payload)
            this.handleRealtimeChange(dataType, payload)
          }
        )
        .subscribe()

      console.log(`📡 Subscribed to ${dataType} changes`)
    })
  }

  // 실시간 변경사항 처리
  async handleRealtimeChange(dataType, payload) {
    try {
      const config = SYNC_CONFIG[dataType]
      const localData = this.getLocalData(dataType)
      
      switch (payload.eventType) {
        case 'INSERT':
          // 새로운 항목을 LocalStorage에 추가
          const newItem = this.transformToLocal(dataType, payload.new)
          const existingIndex = localData.findIndex(item => item[config.primaryKey] === newItem[config.primaryKey])
          
          if (existingIndex === -1) {
            localData.push(newItem)
            this.setLocalData(dataType, localData)
            console.log(`➕ Added new ${dataType} from realtime:`, newItem[config.primaryKey])
          }
          break
          
        case 'UPDATE':
          // 기존 항목 업데이트
          const updatedItem = this.transformToLocal(dataType, payload.new)
          const updateIndex = localData.findIndex(item => item[config.primaryKey] === updatedItem[config.primaryKey])
          
          if (updateIndex !== -1) {
            localData[updateIndex] = updatedItem
            this.setLocalData(dataType, localData)
            console.log(`✏️ Updated ${dataType} from realtime:`, updatedItem[config.primaryKey])
          }
          break
          
        case 'DELETE':
          // 항목 삭제
          const deletedId = payload.old[config.primaryKey]
          const deleteIndex = localData.findIndex(item => item[config.primaryKey] === deletedId)
          
          if (deleteIndex !== -1) {
            localData.splice(deleteIndex, 1)
            this.setLocalData(dataType, localData)
            console.log(`🗑️ Deleted ${dataType} from realtime:`, deletedId)
          }
          break
      }
      
    } catch (error) {
      console.error(`Error handling realtime change for ${dataType}:`, error)
    }
  }

  // 동기화 상태 가져오기
  getSyncStatus() {
    return {
      syncStatus: { ...this.syncStatus },
      syncInProgress: this.syncInProgress,
      conflictQueue: this.conflictQueue.length,
      hybridMode: getHybridMode()
    }
  }

  // 충돌 큐 가져오기
  getConflictQueue() {
    return [...this.conflictQueue]
  }

  // 수동 충돌 해결
  async resolveConflictManually(conflictId, resolution) {
    const conflictIndex = this.conflictQueue.findIndex(c => c.id === conflictId)
    if (conflictIndex === -1) return { success: false, error: 'Conflict not found' }

    const conflict = this.conflictQueue[conflictIndex]
    
    try {
      // 해결책 적용
      if (resolution === 'local') {
        await this.setSupabaseData(conflict.dataType, conflict.local, 'update')
      } else if (resolution === 'remote') {
        const localData = this.getLocalData(conflict.dataType)
        const itemIndex = localData.findIndex(item => item[SYNC_CONFIG[conflict.dataType].primaryKey] === conflict.id)
        if (itemIndex !== -1) {
          localData[itemIndex] = this.transformToLocal(conflict.dataType, conflict.supabase)
          this.setLocalData(conflict.dataType, localData)
        }
      }

      // 큐에서 제거
      this.conflictQueue.splice(conflictIndex, 1)
      console.log(`✅ Conflict resolved manually: ${conflictId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error resolving conflict manually:', error)
      return { success: false, error: error.message }
    }
  }
}

// 싱글톤 인스턴스
export const hybridDataSync = new HybridDataSync()

// 편의 함수들
export const syncProjects = () => hybridDataSync.syncDataType('projects')
export const syncOpinions = () => hybridDataSync.syncDataType('opinions') 
export const syncAll = () => hybridDataSync.syncAll()
export const getSyncStatus = () => hybridDataSync.getSyncStatus()
export const startRealtimeSync = () => hybridDataSync.startRealtimeSync()

export default hybridDataSync