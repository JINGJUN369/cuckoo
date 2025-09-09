// 하이브리드 모드 강제 활성화
import { setHybridMode, HYBRID_MODE, testSupabaseConnection } from '../lib/supabase'

const forceEnableHybridMode = async () => {
  console.log('🔧 Force enabling hybrid mode...')
  
  // 하이브리드 모드를 ENABLED로 강제 설정
  setHybridMode(HYBRID_MODE.ENABLED)
  
  // Supabase 연결 테스트
  const connected = await testSupabaseConnection()
  
  if (connected) {
    console.log('✅ Hybrid mode force enabled - Supabase connected')
  } else {
    console.warn('⚠️ Hybrid mode force enabled - Supabase connection failed')
  }
  
  return { mode: HYBRID_MODE.ENABLED, connected }
}

// 개발 환경에서 자동 실행
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-enabling hybrid mode on startup...')
  setTimeout(forceEnableHybridMode, 3000) // 3초 후 자동 실행
  
  // 개발자 콘솔에서 수동 실행 가능
  window.forceEnableHybridMode = forceEnableHybridMode
}

export default forceEnableHybridMode