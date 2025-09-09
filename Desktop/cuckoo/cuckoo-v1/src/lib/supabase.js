// Supabase 클라이언트 설정 - 하이브리드 시스템용
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Supabase 클라이언트 생성 (하이브리드 모드 설정)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 자동 리프레시 토큰 비활성화 (커스텀 인증 사용)
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  realtime: {
    // 실시간 기능 활성화 (나중에 동기화에 사용)
    params: {
      eventsPerSecond: 10
    }
  }
})

// 하이브리드 모드 상태 관리
export const HYBRID_MODE = {
  DISABLED: 'disabled',      // LocalStorage만 사용
  ENABLED: 'enabled',        // LocalStorage + Supabase 동기화
  SUPABASE_ONLY: 'supabase'  // Supabase만 사용
}

let currentHybridMode = HYBRID_MODE.DISABLED
let supabaseConnected = false

// 현재 하이브리드 모드 가져오기
export const getHybridMode = () => currentHybridMode

// 하이브리드 모드 설정
export const setHybridMode = (mode) => {
  currentHybridMode = mode
  console.log(`🔄 Hybrid mode changed to: ${mode}`)
  
  // 모드 변경을 localStorage에 저장
  localStorage.setItem('hybridMode', mode)
}

// 현재 사용자 세션 설정 함수 (우리의 커스텀 인증과 연동)
export const setSupabaseSession = async (userId) => {
  try {
    // Supabase RLS를 위한 사용자 ID 설정
    const { error } = await supabase.rpc('set_current_user', { user_id: userId })
    
    if (error) {
      console.warn('Failed to set Supabase session:', error.message)
      return false
    }
    
    console.log('✅ Supabase session set for user:', userId)
    return true
  } catch (error) {
    console.warn('Supabase session error:', error)
    return false
  }
}

// Supabase 연결 테스트 함수
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (정상)
      throw error
    }
    
    supabaseConnected = true
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    supabaseConnected = false
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}

// Supabase 연결 상태 확인
export const isSupabaseConnected = () => supabaseConnected

// 에러 핸들링 유틸리티
export const handleSupabaseError = (error, context = 'Supabase operation') => {
  console.error(`${context} error:`, error)
  
  // 일반적인 에러 메시지 변환
  let userMessage = '데이터베이스 오류가 발생했습니다.'
  
  if (error?.code === 'PGRST301') {
    userMessage = '권한이 없습니다.'
  } else if (error?.code === 'PGRST116') {
    userMessage = '데이터를 찾을 수 없습니다.'
  } else if (error?.message?.includes('duplicate key')) {
    userMessage = '이미 존재하는 데이터입니다.'
  } else if (error?.message?.includes('foreign key')) {
    userMessage = '연관된 데이터가 없습니다.'
  } else if (error?.message?.includes('network') || error?.message?.includes('connection')) {
    userMessage = '네트워크 연결을 확인해주세요.'
  }
  
  return {
    code: error?.code || 'UNKNOWN',
    message: userMessage,
    details: error?.message || '알 수 없는 오류',
    originalError: error
  }
}

// 재시도 로직이 포함된 Supabase 쿼리 래퍼
export const executeSupabaseQuery = async (queryFunction, maxRetries = 3) => {
  // 하이브리드 모드가 비활성화되어 있으면 실행하지 않음
  if (currentHybridMode === HYBRID_MODE.DISABLED) {
    return { success: false, error: { message: 'Hybrid mode disabled' } }
  }
  
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFunction()
      
      if (result.error) {
        throw result.error
      }
      
      return { success: true, data: result.data }
    } catch (error) {
      lastError = error
      console.warn(`Supabase query attempt ${attempt}/${maxRetries} failed:`, error)
      
      // 네트워크 오류나 일시적 오류인 경우만 재시도
      if (attempt < maxRetries && (
        error?.code === 'NETWORK_ERROR' || 
        error?.message?.includes('timeout') ||
        error?.message?.includes('connection') ||
        error?.message?.includes('network')
      )) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)) // 백오프
        continue
      }
      
      break
    }
  }
  
  return { 
    success: false, 
    error: handleSupabaseError(lastError, 'Query execution')
  }
}

// 하이브리드 시스템 초기화
export const initializeHybridSystem = async () => {
  console.log('🚀 Initializing hybrid system...')
  
  // 저장된 모드 복원
  const savedMode = localStorage.getItem('hybridMode')
  if (savedMode && Object.values(HYBRID_MODE).includes(savedMode)) {
    currentHybridMode = savedMode
  }
  
  // Supabase 연결 테스트
  const connected = await testSupabaseConnection()
  
  if (!connected && currentHybridMode !== HYBRID_MODE.DISABLED) {
    console.warn('⚠️ Supabase connection failed, falling back to LocalStorage only')
    setHybridMode(HYBRID_MODE.DISABLED)
  }
  
  console.log(`✅ Hybrid system initialized - Mode: ${currentHybridMode}`)
  return { mode: currentHybridMode, connected }
}

// 개발용 디버그 로그
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 Supabase 하이브리드 클라이언트 설정 완료:', supabaseUrl)
}

export default supabase