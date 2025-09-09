// 충돌 감지 및 해결 유틸리티
import { getHybridMode, HYBRID_MODE } from '../lib/supabase';

/**
 * 충돌 감지 및 해결 시스템
 * - 동시 편집 감지
 * - 데이터 버전 관리
 * - 자동 병합 시도
 * - 수동 해결 지원
 */
export class ConflictDetector {
  constructor() {
    this.conflictListeners = new Map();
    this.versionCache = new Map();
    this.lockManager = new Map();
  }

  /**
   * 프로젝트 편집 시작 시 호출
   * 다른 사용자의 동시 편집 여부 확인
   */
  async startEditing(projectId, userId, fieldPath = null) {
    console.log('🔒 [ConflictDetector] Starting edit session:', { projectId, userId, fieldPath });
    
    try {
      // 현재 편집 중인 사용자 확인
      const currentEditors = this.lockManager.get(projectId) || new Map();
      
      // 같은 필드를 편집 중인 다른 사용자 확인
      if (fieldPath) {
        const fieldEditors = Array.from(currentEditors.entries())
          .filter(([_, info]) => info.fieldPath === fieldPath && info.userId !== userId);
        
        if (fieldEditors.length > 0) {
          console.log('⚠️ [ConflictDetector] Field editing conflict detected:', fieldEditors);
          return {
            conflict: true,
            type: 'concurrent_edit',
            conflictingUsers: fieldEditors.map(([_, info]) => info.userId),
            fieldPath
          };
        }
      }

      // 편집 잠금 설정
      const lockKey = fieldPath ? `${projectId}:${fieldPath}` : projectId;
      currentEditors.set(lockKey, {
        userId,
        fieldPath,
        startTime: new Date(),
        lastActivity: new Date()
      });
      
      this.lockManager.set(projectId, currentEditors);

      // Supabase 모드에서는 실시간 잠금 브로드캐스트
      if (getHybridMode() !== HYBRID_MODE.DISABLED) {
        await this.broadcastLockStatus(projectId, fieldPath, 'lock', userId);
      }

      return { conflict: false };
      
    } catch (error) {
      console.error('❌ [ConflictDetector] Error starting edit session:', error);
      return { error: true, message: error.message };
    }
  }

  /**
   * 편집 종료 시 호출
   */
  async endEditing(projectId, userId, fieldPath = null) {
    console.log('🔓 [ConflictDetector] Ending edit session:', { projectId, userId, fieldPath });
    
    try {
      const currentEditors = this.lockManager.get(projectId) || new Map();
      const lockKey = fieldPath ? `${projectId}:${fieldPath}` : projectId;
      
      currentEditors.delete(lockKey);
      this.lockManager.set(projectId, currentEditors);

      // Supabase 모드에서는 잠금 해제 브로드캐스트
      if (getHybridMode() !== HYBRID_MODE.DISABLED) {
        await this.broadcastLockStatus(projectId, fieldPath, 'unlock', userId);
      }

    } catch (error) {
      console.error('❌ [ConflictDetector] Error ending edit session:', error);
    }
  }

  /**
   * 데이터 저장 전 충돌 감지
   */
  async detectConflicts(projectId, localData, remoteData = null) {
    console.log('🔍 [ConflictDetector] Detecting conflicts for project:', projectId);
    
    try {
      const conflicts = [];
      
      // 원격 데이터가 없는 경우 가져오기 (Supabase 모드에서)
      if (!remoteData && getHybridMode() !== HYBRID_MODE.DISABLED) {
        remoteData = await this.fetchRemoteData(projectId);
      }

      if (!remoteData) {
        console.log('📝 [ConflictDetector] No remote data to compare');
        return { hasConflicts: false, conflicts: [] };
      }

      // 캐시된 버전과 비교
      const cachedVersion = this.versionCache.get(projectId);
      if (cachedVersion && cachedVersion.version !== remoteData.version) {
        console.log('⚠️ [ConflictDetector] Version mismatch detected');
      }

      // Stage 데이터 비교
      const stages = ['stage1', 'stage2', 'stage3'];
      stages.forEach(stage => {
        if (localData[stage] && remoteData[stage]) {
          const stageConflicts = this.compareStageData(
            stage,
            localData[stage],
            remoteData[stage],
            localData.lastModified,
            remoteData.lastModified
          );
          conflicts.push(...stageConflicts);
        }
      });

      // 기본 필드 비교
      const basicFields = ['name', 'modelName', 'description', 'priority', 'status'];
      basicFields.forEach(field => {
        if (localData[field] !== remoteData[field]) {
          conflicts.push({
            field,
            type: 'field_conflict',
            localValue: localData[field],
            remoteValue: remoteData[field],
            localTimestamp: localData.lastModified,
            remoteTimestamp: remoteData.lastModified,
            severity: field === 'name' || field === 'status' ? 'high' : 'medium',
            fieldLabel: this.getFieldLabel(field),
            autoResolvable: false
          });
        }
      });

      console.log(`🔍 [ConflictDetector] Found ${conflicts.length} conflicts`);
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        localVersion: localData.version,
        remoteVersion: remoteData.version
      };

    } catch (error) {
      console.error('❌ [ConflictDetector] Error detecting conflicts:', error);
      return { error: true, message: error.message };
    }
  }

  /**
   * Stage 데이터 비교
   */
  compareStageData(stageName, localStage, remoteStage, localTimestamp, remoteTimestamp) {
    const conflicts = [];
    
    // 모든 필드를 재귀적으로 비교
    const compareFields = (localObj, remoteObj, prefix = '') => {
      Object.keys({ ...localObj, ...remoteObj }).forEach(key => {
        const localValue = localObj[key];
        const remoteValue = remoteObj[key];
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        
        if (typeof localValue === 'object' && typeof remoteValue === 'object' && localValue && remoteValue) {
          // 객체인 경우 재귀 비교
          compareFields(localValue, remoteValue, fieldPath);
        } else if (localValue !== remoteValue) {
          // 값이 다른 경우 충돌로 기록
          const severity = this.getFieldSeverity(stageName, key);
          
          conflicts.push({
            field: `${stageName}.${fieldPath}`,
            type: 'field_conflict',
            localValue,
            remoteValue,
            localTimestamp,
            remoteTimestamp,
            severity,
            fieldLabel: `${this.getStageLabel(stageName)} - ${this.getFieldLabel(key)}`,
            autoResolvable: this.isAutoResolvable(localValue, remoteValue),
            stage: stageName
          });
        }
      });
    };

    compareFields(localStage, remoteStage);
    return conflicts;
  }

  /**
   * 충돌 자동 해결 시도
   */
  async autoResolve(conflicts) {
    console.log('🤖 [ConflictDetector] Attempting auto-resolution for', conflicts.length, 'conflicts');
    
    const resolved = [];
    const unresolved = [];

    conflicts.forEach(conflict => {
      if (conflict.autoResolvable) {
        const resolution = this.getAutoResolution(conflict);
        if (resolution) {
          resolved.push({ ...conflict, resolution });
        } else {
          unresolved.push(conflict);
        }
      } else {
        unresolved.push(conflict);
      }
    });

    console.log(`🤖 [ConflictDetector] Auto-resolved ${resolved.length}, manual required: ${unresolved.length}`);
    
    return {
      autoResolved: resolved,
      requiresManualResolution: unresolved
    };
  }

  /**
   * 수동 해결 적용
   */
  async applyResolution(projectId, resolutions) {
    console.log('🔧 [ConflictDetector] Applying manual resolutions:', resolutions);
    
    try {
      const mergedData = {};
      
      resolutions.conflicts.forEach(conflictResolution => {
        const { field, resolution, value } = conflictResolution;
        
        // 필드 경로를 통해 중첩 객체에 값 설정
        this.setNestedValue(mergedData, field, value);
      });

      // 버전 업데이트
      mergedData.version = Date.now();
      mergedData.lastModified = new Date().toISOString();
      mergedData.conflictResolved = true;

      console.log('✅ [ConflictDetector] Resolution applied successfully');
      return mergedData;

    } catch (error) {
      console.error('❌ [ConflictDetector] Error applying resolution:', error);
      throw error;
    }
  }

  /**
   * 실시간 잠금 상태 브로드캐스트 (Supabase 모드)
   */
  async broadcastLockStatus(projectId, fieldPath, action, userId) {
    // TODO: Supabase Realtime 채널을 통한 브로드캐스트 구현
    console.log('📡 [ConflictDetector] Broadcasting lock status:', { projectId, fieldPath, action, userId });
  }

  /**
   * 원격 데이터 가져오기 (Supabase 모드)
   */
  async fetchRemoteData(projectId) {
    // TODO: Supabase에서 최신 프로젝트 데이터 가져오기
    console.log('☁️ [ConflictDetector] Fetching remote data for:', projectId);
    return null;
  }

  /**
   * 헬퍼 메서드들
   */
  getFieldLabel(field) {
    const labels = {
      name: '프로젝트명',
      modelName: '모델명',
      description: '설명',
      priority: '우선순위',
      status: '상태',
      // Stage1 필드들
      productGroup: '제품군',
      manufacturer: '제조사',
      vendor: '벤더사',
      // 더 많은 필드 라벨들...
    };
    return labels[field] || field;
  }

  getStageLabel(stage) {
    const labels = {
      stage1: 'Stage 1 (기본정보)',
      stage2: 'Stage 2 (생산준비)',
      stage3: 'Stage 3 (양산준비)'
    };
    return labels[stage] || stage;
  }

  getFieldSeverity(stage, field) {
    // 중요 필드들은 높은 우선순위
    const highPriorityFields = ['name', 'status', 'modelName', 'releaseDate', 'massProductionDate'];
    if (highPriorityFields.includes(field)) return 'high';
    
    // Stage별 핵심 필드들
    const stageCriticalFields = {
      stage1: ['productGroup', 'manufacturer', 'vendor'],
      stage2: ['pilotProduction', 'techTransfer'],
      stage3: ['initialProduction', 'bomManager']
    };
    
    if (stageCriticalFields[stage]?.includes(field)) return 'medium';
    return 'low';
  }

  isAutoResolvable(localValue, remoteValue) {
    // 빈 값과 값이 있는 경우 자동 해결 가능
    if (!localValue && remoteValue) return true;
    if (localValue && !remoteValue) return true;
    
    // 숫자 값의 경우 더 큰 값으로 자동 해결 가능한지 판단
    if (typeof localValue === 'number' && typeof remoteValue === 'number') {
      return false; // 숫자는 수동 선택 필요
    }
    
    return false;
  }

  getAutoResolution(conflict) {
    const { localValue, remoteValue } = conflict;
    
    // 빈 값 처리
    if (!localValue && remoteValue) {
      return { type: 'use_remote', value: remoteValue };
    }
    if (localValue && !remoteValue) {
      return { type: 'use_local', value: localValue };
    }
    
    return null;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * 충돌 감지 리스너 등록
   */
  onConflict(projectId, callback) {
    if (!this.conflictListeners.has(projectId)) {
      this.conflictListeners.set(projectId, []);
    }
    this.conflictListeners.get(projectId).push(callback);
  }

  /**
   * 충돌 감지 리스너 제거
   */
  offConflict(projectId, callback) {
    const listeners = this.conflictListeners.get(projectId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 충돌 이벤트 발생
   */
  emitConflict(projectId, conflictData) {
    const listeners = this.conflictListeners.get(projectId) || [];
    listeners.forEach(callback => {
      try {
        callback(conflictData);
      } catch (error) {
        console.error('❌ [ConflictDetector] Error in conflict listener:', error);
      }
    });
  }
}

// 싱글톤 인스턴스
export const conflictDetector = new ConflictDetector();

// 편의 함수들
export const startEditing = (projectId, userId, fieldPath) => 
  conflictDetector.startEditing(projectId, userId, fieldPath);

export const endEditing = (projectId, userId, fieldPath) => 
  conflictDetector.endEditing(projectId, userId, fieldPath);

export const detectConflicts = (projectId, localData, remoteData) => 
  conflictDetector.detectConflicts(projectId, localData, remoteData);

export const autoResolveConflicts = (conflicts) => 
  conflictDetector.autoResolve(conflicts);

export const applyConflictResolution = (projectId, resolutions) => 
  conflictDetector.applyResolution(projectId, resolutions);

export default conflictDetector;