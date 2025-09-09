// 하이브리드 시스템 관리 컴포넌트
// 동기화 상태, 모드 전환, 충돌 해결 등을 관리하는 UI

import React, { useState, useEffect } from 'react'
import { useHybridAuth } from '../../hooks/useHybridAuth'
import { useHybridProjectStore } from '../../hooks/useHybridProjectStore' 
import { useHybridOpinions } from '../../hooks/useHybridOpinions'
import { getHybridMode, setHybridMode, HYBRID_MODE } from '../../lib/supabase'
import { hybridDataSync, getSyncStatus, startRealtimeSync } from '../../utils/hybridDataSync'

export const HybridSystemManager = ({ isAdmin = false }) => {
  const [showManager, setShowManager] = useState(false)
  const [currentMode, setCurrentMode] = useState(getHybridMode())
  const [syncStats, setSyncStats] = useState({})
  const [conflictQueue, setConflictQueue] = useState([])
  const [isFullSyncing, setIsFullSyncing] = useState(false)
  
  // 하이브리드 훅들
  const hybridAuth = useHybridAuth()
  const hybridProjects = useHybridProjectStore()
  const hybridOpinions = useHybridOpinions()

  // 동기화 상태 업데이트
  useEffect(() => {
    const updateStatus = () => {
      const status = getSyncStatus()
      setSyncStats(status)
      setConflictQueue(hybridDataSync.getConflictQueue())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000) // 5초마다 업데이트

    return () => clearInterval(interval)
  }, [])

  // 모드 전환 핸들러
  const handleModeChange = async (newMode) => {
    try {
      const result = await hybridAuth.switchHybridMode(newMode)
      if (result.success) {
        setCurrentMode(newMode)
        
        // 모드별 초기화 작업
        if (newMode === HYBRID_MODE.ENABLED) {
          startRealtimeSync()
          await performFullSync()
        }
        
        alert(`하이브리드 모드가 ${getModeDisplayName(newMode)}로 변경되었습니다.`)
      } else {
        alert(`모드 변경 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Mode change error:', error)
      alert('모드 변경 중 오류가 발생했습니다.')
    }
  }

  // 전체 동기화 실행
  const performFullSync = async () => {
    setIsFullSyncing(true)
    try {
      console.log('🚀 Starting full system sync...')
      
      const results = await Promise.all([
        hybridAuth.syncAllUsersToSupabase(),
        hybridProjects.syncAllProjects(),
        hybridOpinions.syncAllOpinions()
      ])

      const [usersResult, projectsResult, opinionsResult] = results
      
      const successCount = results.filter(r => r.success).length
      const totalResults = results.length

      if (successCount === totalResults) {
        alert('전체 동기화가 완료되었습니다.')
      } else {
        alert(`동기화 완료: ${successCount}/${totalResults} 성공`)
      }

      console.log('📊 Full sync results:', { usersResult, projectsResult, opinionsResult })
      
    } catch (error) {
      console.error('Full sync error:', error)
      alert('전체 동기화 중 오류가 발생했습니다.')
    } finally {
      setIsFullSyncing(false)
    }
  }

  // 충돌 해결
  const resolveConflict = async (conflictId, resolution) => {
    try {
      const result = await hybridDataSync.resolveConflictManually(conflictId, resolution)
      if (result.success) {
        setConflictQueue(prev => prev.filter(c => c.id !== conflictId))
        alert('충돌이 해결되었습니다.')
      } else {
        alert(`충돌 해결 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Conflict resolution error:', error)
      alert('충돌 해결 중 오류가 발생했습니다.')
    }
  }

  // 모드 표시명
  const getModeDisplayName = (mode) => {
    switch (mode) {
      case HYBRID_MODE.DISABLED: return 'LocalStorage만 사용'
      case HYBRID_MODE.ENABLED: return 'LocalStorage + Supabase 동기화'
      case HYBRID_MODE.SUPABASE_ONLY: return 'Supabase만 사용'
      default: return '알 수 없음'
    }
  }

  // 동기화 상태 표시
  const getSyncStatusDisplay = () => {
    const { syncInProgress, hybridMode } = syncStats
    
    if (hybridMode === HYBRID_MODE.DISABLED) {
      return { text: '비활성화', color: 'gray' }
    } else if (syncInProgress) {
      return { text: '동기화 중', color: 'blue' }
    } else if (hybridProjects.syncStatus === 'success') {
      return { text: '동기화됨', color: 'green' }
    } else if (hybridProjects.hasSyncErrors) {
      return { text: '오류', color: 'red' }
    } else {
      return { text: '대기 중', color: 'yellow' }
    }
  }

  const syncStatus = getSyncStatusDisplay()

  if (!showManager) {
    // 축소된 상태 표시 (상태 표시줄)
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowManager(true)}
          className={`px-4 py-2 rounded-lg shadow-lg text-white font-medium transition-all hover:shadow-xl ${
            syncStatus.color === 'gray' ? 'bg-gray-500' :
            syncStatus.color === 'blue' ? 'bg-blue-500 animate-pulse' :
            syncStatus.color === 'green' ? 'bg-green-500' :
            syncStatus.color === 'red' ? 'bg-red-500' :
            'bg-yellow-500'
          }`}
          title="하이브리드 시스템 관리"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus.color === 'blue' ? 'bg-white animate-ping' : 'bg-white/70'
            }`} />
            <span className="text-sm">{syncStatus.text}</span>
          </div>
        </button>
      </div>
    )
  }

  // 확장된 관리 패널
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-96 overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">하이브리드 시스템 관리</h3>
          <button
            onClick={() => setShowManager(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 현재 상태 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">현재 모드</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentMode === HYBRID_MODE.DISABLED ? 'bg-gray-100 text-gray-800' :
              currentMode === HYBRID_MODE.ENABLED ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {getModeDisplayName(currentMode)}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">동기화 상태</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              syncStatus.color === 'gray' ? 'bg-gray-100 text-gray-800' :
              syncStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              syncStatus.color === 'green' ? 'bg-green-100 text-green-800' :
              syncStatus.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {syncStatus.text}
            </span>
          </div>

          {hybridAuth.isSupabaseConnected && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Supabase 연결</span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                연결됨
              </span>
            </div>
          )}
        </div>

        {/* 모드 전환 (관리자만) */}
        {isAdmin && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">모드 전환</h4>
            <div className="space-y-2">
              {Object.values(HYBRID_MODE).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  disabled={currentMode === mode || hybridAuth.hybridStatus === 'initializing'}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    currentMode === mode 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  } disabled:opacity-50`}
                >
                  {getModeDisplayName(mode)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 동기화 동작 */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium text-gray-900 mb-2">동기화 동작</h4>
          <div className="space-y-2">
            <button
              onClick={performFullSync}
              disabled={isFullSyncing || currentMode === HYBRID_MODE.DISABLED}
              className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFullSyncing ? '동기화 중...' : '전체 동기화 실행'}
            </button>
            
            <button
              onClick={() => hybridProjects.clearSyncErrors()}
              disabled={!hybridProjects.hasSyncErrors}
              className="w-full px-3 py-2 bg-gray-50 text-gray-700 rounded text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              오류 기록 지우기
            </button>
          </div>
        </div>

        {/* 충돌 해결 */}
        {conflictQueue.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">충돌 해결</h4>
            <div className="text-sm text-gray-600 mb-2">
              {conflictQueue.length}개의 충돌이 발견되었습니다.
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conflictQueue.slice(0, 3).map((conflict, index) => (
                <div key={conflict.id} className="bg-red-50 p-2 rounded">
                  <div className="text-sm font-medium text-red-800">
                    {conflict.dataType} - {conflict.id}
                  </div>
                  <div className="flex space-x-2 mt-1">
                    <button
                      onClick={() => resolveConflict(conflict.id, 'local')}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      로컬 우선
                    </button>
                    <button
                      onClick={() => resolveConflict(conflict.id, 'remote')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      서버 우선
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통계 및 정보 */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">시스템 정보</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>프로젝트: {hybridProjects.projects?.length || 0}개</div>
            <div>완료 프로젝트: {hybridProjects.completedProjects?.length || 0}개</div>
            <div>의견: {hybridOpinions.opinions?.length || 0}개</div>
            {hybridProjects.lastSyncTime && (
              <div>마지막 동기화: {new Date(hybridProjects.lastSyncTime).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}