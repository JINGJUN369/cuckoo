// 하이브리드 인증 시스템 - LocalStorage + Supabase 동기화
import { useState, useEffect, useCallback } from 'react'
import { 
  supabase, 
  setSupabaseSession, 
  getHybridMode, 
  setHybridMode,
  HYBRID_MODE, 
  executeSupabaseQuery, 
  initializeHybridSystem,
  testSupabaseConnection 
} from '../lib/supabase'

export const useHybridAuth = () => {
  const [hybridStatus, setHybridStatus] = useState('initializing') // initializing, ready, error
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, error, success
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // LocalStorage 사용자를 Supabase에 동기화
  const syncUserToSupabase = useCallback(async (localUser) => {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.DISABLED || !isSupabaseConnected) {
      return { success: true, data: localUser }
    }

    try {
      setSyncStatus('syncing')
      console.log('🔄 Syncing user to Supabase:', localUser.id)
      
      // Supabase에서 사용자 확인
      const { success: checkSuccess, data: existingUsers } = await executeSupabaseQuery(
        () => supabase.from('users').select('*').eq('id', localUser.id).limit(1)
      )
      
      if (!checkSuccess) {
        throw new Error('Failed to check existing user')
      }

      let supabaseUser = existingUsers?.[0]

      if (!supabaseUser) {
        // 사용자가 없으면 생성
        console.log('👤 Creating new user in Supabase:', localUser.id)
        
        const newSupabaseUser = {
          id: localUser.id,
          name: localUser.name || '사용자',
          email: localUser.email,
          password_hash: localUser.password || 'migrated_from_local',
          role: localUser.role || 'user',
          team: localUser.team || '',
          status: localUser.status || 'approved',
          must_change_password: localUser.mustChangePassword || false,
          migrated_from_local: true,
          local_created_at: localUser.createdAt ? new Date(localUser.createdAt) : new Date()
        }

        const { success: insertSuccess, data: insertedUsers } = await executeSupabaseQuery(
          () => supabase.from('users').insert([newSupabaseUser]).select()
        )

        if (!insertSuccess) {
          throw new Error('Failed to create user in Supabase')
        }

        supabaseUser = insertedUsers[0]
        console.log('✅ User created in Supabase:', localUser.id)
      } else {
        // 기존 사용자 정보 업데이트 (LocalStorage가 우선)
        console.log('🔄 Updating existing user in Supabase:', localUser.id)
        
        const { success: updateSuccess } = await executeSupabaseQuery(
          () => supabase.from('users').update({
            name: localUser.name || supabaseUser.name,
            email: localUser.email,
            role: localUser.role || supabaseUser.role,
            team: localUser.team || supabaseUser.team,
            status: localUser.status || supabaseUser.status,
            must_change_password: localUser.mustChangePassword ?? supabaseUser.must_change_password,
            updated_at: new Date().toISOString()
          }).eq('id', localUser.id)
        )

        if (updateSuccess) {
          console.log('✅ User updated in Supabase:', localUser.id)
        } else {
          console.warn('⚠️ Failed to update user in Supabase, continuing with local data')
        }
      }

      // Supabase 세션 설정
      await setSupabaseSession(localUser.id)
      
      setSyncStatus('success')
      return { success: true, data: supabaseUser || localUser }

    } catch (error) {
      console.error('❌ Failed to sync user to Supabase:', error)
      setSyncStatus('error')
      
      // 동기화 실패해도 LocalStorage 사용자는 그대로 사용
      return { success: true, data: localUser, error: 'sync_failed' }
    }
  }, [isSupabaseConnected])

  // LocalStorage에서 모든 사용자를 Supabase에 동기화
  const syncAllUsersToSupabase = useCallback(async () => {
    const hybridMode = getHybridMode()
    if (hybridMode === HYBRID_MODE.DISABLED || !isSupabaseConnected) {
      return { success: true, message: 'Sync skipped (disabled or disconnected)' }
    }

    try {
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]')
      console.log(`🔄 Syncing ${localUsers.length} users to Supabase...`)

      let successCount = 0
      let errorCount = 0
      const results = []

      for (const localUser of localUsers) {
        const result = await syncUserToSupabase(localUser)
        results.push({ userId: localUser.id, success: result.success, error: result.error })
        
        if (result.success && !result.error) {
          successCount++
        } else {
          errorCount++
        }
      }

      const stats = { total: localUsers.length, success: successCount, errors: errorCount }
      console.log(`✅ User sync completed:`, stats)
      
      return { 
        success: true, 
        stats,
        results
      }

    } catch (error) {
      console.error('❌ Failed to sync all users:', error)
      return { success: false, error }
    }
  }, [syncUserToSupabase, isSupabaseConnected])

  // 하이브리드 로그인 (LocalStorage 우선, Supabase 동기화)
  const hybridLogin = useCallback(async (userId, password) => {
    try {
      // 1. LocalStorage에서 먼저 로그인 시도
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]')
      const localUser = localUsers.find(u => u.id === userId)
      
      if (localUser && localUser.password === password && localUser.status === 'approved') {
        console.log('✅ LocalStorage login successful:', userId)
        
        // 2. 하이브리드 모드에서 Supabase 동기화
        const hybridMode = getHybridMode()
        if (hybridMode !== HYBRID_MODE.DISABLED && isSupabaseConnected) {
          const syncResult = await syncUserToSupabase(localUser)
          if (syncResult.success) {
            console.log('✅ User synced to Supabase during login')
          }
        }
        
        return { 
          success: true, 
          user: localUser,
          source: 'localStorage',
          synced: hybridMode !== HYBRID_MODE.DISABLED && isSupabaseConnected
        }
      }

      // 3. LocalStorage 실패 시 Supabase 확인 (SUPABASE_ONLY 모드)
      const hybridMode = getHybridMode()
      if (hybridMode === HYBRID_MODE.SUPABASE_ONLY && isSupabaseConnected) {
        const { success, data: supabaseUsers } = await executeSupabaseQuery(
          () => supabase.from('users')
            .select('*')
            .eq('id', userId)
            .eq('status', 'approved')
            .limit(1)
        )

        if (success && supabaseUsers?.[0]) {
          const supabaseUser = supabaseUsers[0]
          
          // 비밀번호 확인 (실제 환경에서는 해시 비교 필요)
          if (supabaseUser.password_hash === password) {
            await setSupabaseSession(userId)
            console.log('✅ Supabase login successful:', userId)
            
            return {
              success: true,
              user: {
                id: supabaseUser.id,
                name: supabaseUser.name,
                email: supabaseUser.email,
                role: supabaseUser.role,
                team: supabaseUser.team,
                status: supabaseUser.status
              },
              source: 'supabase'
            }
          }
        }
      }

      return { success: false, error: 'Invalid credentials or user not found' }

    } catch (error) {
      console.error('❌ Hybrid login error:', error)
      return { success: false, error: error.message }
    }
  }, [syncUserToSupabase, isSupabaseConnected])

  // 하이브리드 사용자 등록
  const hybridRegister = useCallback(async (userData) => {
    try {
      // 1. LocalStorage에 먼저 등록
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]')
      
      // 중복 확인
      if (localUsers.find(u => u.id === userData.id)) {
        return { success: false, error: '이미 존재하는 사번입니다.' }
      }
      if (localUsers.find(u => u.email === userData.email)) {
        return { success: false, error: '이미 존재하는 이메일입니다.' }
      }

      const newUser = {
        ...userData,
        password: userData.password || '000000',
        status: 'pending',
        role: 'user',
        createdAt: new Date().toISOString()
      }

      localUsers.push(newUser)
      localStorage.setItem('users', JSON.stringify(localUsers))
      console.log('✅ User registered in LocalStorage:', newUser.id)

      // 2. 하이브리드 모드에서 Supabase 동기화
      const hybridMode = getHybridMode()
      if (hybridMode !== HYBRID_MODE.DISABLED && isSupabaseConnected) {
        const syncResult = await syncUserToSupabase(newUser)
        if (syncResult.success) {
          console.log('✅ User synced to Supabase during registration')
        }
      }

      return { 
        success: true, 
        user: newUser,
        synced: hybridMode !== HYBRID_MODE.DISABLED && isSupabaseConnected
      }

    } catch (error) {
      console.error('❌ Hybrid registration error:', error)
      return { success: false, error: error.message }
    }
  }, [syncUserToSupabase, isSupabaseConnected])

  // 하이브리드 모드 전환
  const switchHybridMode = useCallback(async (newMode) => {
    try {
      console.log(`🔄 Switching hybrid mode from ${getHybridMode()} to ${newMode}`)
      
      // 연결 테스트 (DISABLED가 아닌 경우)
      if (newMode !== HYBRID_MODE.DISABLED) {
        const connected = await testSupabaseConnection()
        setIsSupabaseConnected(connected)
        
        if (!connected) {
          console.warn('⚠️ Supabase connection failed, cannot switch to', newMode)
          return { success: false, error: 'Supabase connection failed' }
        }
      }
      
      setHybridMode(newMode)
      
      // ENABLED 모드로 전환 시 사용자 동기화
      if (newMode === HYBRID_MODE.ENABLED) {
        const syncResult = await syncAllUsersToSupabase()
        console.log('📊 User sync result:', syncResult.stats)
      }
      
      return { success: true, mode: newMode }
      
    } catch (error) {
      console.error('❌ Failed to switch hybrid mode:', error)
      return { success: false, error: error.message }
    }
  }, [syncAllUsersToSupabase])

  // 하이브리드 시스템 초기화
  const initializeHybrid = useCallback(async () => {
    try {
      console.log('🚀 Initializing hybrid authentication system...')
      setHybridStatus('initializing')
      
      // Supabase 시스템 초기화
      const initResult = await initializeHybridSystem()
      setIsSupabaseConnected(initResult.connected)
      
      const hybridMode = getHybridMode()
      console.log(`📊 Hybrid system status: mode=${hybridMode}, connected=${initResult.connected}`)

      // ENABLED 모드에서 자동 동기화
      if (hybridMode === HYBRID_MODE.ENABLED && initResult.connected) {
        const syncResult = await syncAllUsersToSupabase()
        console.log('📊 Initial user sync:', syncResult.stats)
      }

      setHybridStatus('ready')
      console.log('✅ Hybrid authentication system initialized')
      
      return { success: true, mode: hybridMode, connected: initResult.connected }

    } catch (error) {
      console.error('❌ Failed to initialize hybrid auth:', error)
      setHybridStatus('error')
      return { success: false, error }
    }
  }, [syncAllUsersToSupabase])

  // 사용자 세션 확인
  const checkUserSession = useCallback(() => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userObj = JSON.parse(currentUser);
        setUser(userObj);
        setProfile(userObj);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error checking user session:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(() => {
    try {
      localStorage.removeItem('currentUser');
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Error during sign out:', error);
    }
  }, []);

  // 로그인
  const signIn = useCallback(async (credentials) => {
    try {
      setLoading(true);
      const result = await hybridLogin(credentials);
      
      if (result.success) {
        setUser(result.user);
        setProfile(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  }, [hybridLogin]);

  // 초기화
  useEffect(() => {
    initializeHybrid();
    checkUserSession();
  }, [initializeHybrid, checkUserSession]);

  return {
    // 기본 인증 상태
    user,
    profile,
    loading,
    isAuthenticated,
    isInitialized,
    
    // 하이브리드 상태
    hybridStatus,
    syncStatus,
    isSupabaseConnected,
    
    // 현재 모드 정보
    currentMode: getHybridMode(),
    
    // 인증 함수들
    signIn,
    signOut,
    
    // 하이브리드 인증 함수들
    hybridLogin,
    hybridRegister,
    
    // 동기화 함수들
    syncUserToSupabase,
    syncAllUsersToSupabase,
    
    // 모드 관리
    switchHybridMode,
    initializeHybrid,
    
    // 유틸리티
    isReady: hybridStatus === 'ready',
    isError: hybridStatus === 'error'
  }
}