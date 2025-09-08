import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 전역 초기화 상태 관리
let globalInitialized = false;
let globalUser = null;
let globalProfile = null;
let globalListeners = new Set(); // 상태 변경 리스너들

// 전역 상태 변경 알림
const notifyListeners = () => {
  globalListeners.forEach(listener => listener());
};

export const useSupabaseAuth = () => {
  const [user, setUser] = useState(globalUser);
  const [loading, setLoading] = useState(!globalInitialized);
  const [profile, setProfile] = useState(globalProfile);
  const [isInitialized, setIsInitialized] = useState(globalInitialized);

  // 전역 상태 변경 감지
  useEffect(() => {
    const updateLocalState = () => {
      setUser(globalUser);
      setProfile(globalProfile);
      setLoading(!globalInitialized);
      setIsInitialized(globalInitialized);
    };

    globalListeners.add(updateLocalState);
    return () => globalListeners.delete(updateLocalState);
  }, []);

  // Supabase 전용 초기화 (세션 유지)
  useEffect(() => {
    // 이미 전역적으로 초기화되었다면 건너뛰기
    if (globalInitialized) {
      console.log('ℹ️ 이미 초기화됨 - 건너뜀');
      return;
    }

    console.log('🔐 Supabase 전용 인증 초기화 시작...');
    
    let isMounted = true; // 컴포넌트가 마운트된 상태인지 확인

    const initializeAuth = async () => {
      try {
        // 세션 스토리지에서 사용자 정보 복구 시도
        const savedUser = sessionStorage.getItem('supabase_user');
        const savedProfile = sessionStorage.getItem('supabase_profile');
        
        if (savedUser && savedProfile && isMounted) {
          console.log('🔄 세션에서 사용자 정보 복구');
          const userData = JSON.parse(savedUser);
          const profileData = JSON.parse(savedProfile);
          
          // 전역 상태 설정
          globalUser = userData;
          globalProfile = profileData;
          
          setUser(userData);
          setProfile(profileData);
          
          // RLS 비활성화로 인해 세션 설정 불필요
          console.log('ℹ️ 세션 복구 시 RLS 설정 건너뜀');
        } else {
          console.log('🚪 세션 없음 - 로그인 필요');
        }
        
        if (isMounted) {
          // 전역 초기화 완료 설정
          globalInitialized = true;
          
          setLoading(false);
          setIsInitialized(true);
          
          // 모든 리스너에게 상태 변경 알림
          notifyListeners();
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ 인증 초기화 중 오류:', error);
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // 즉시 실행
    initializeAuth();

    return () => {
      isMounted = false; // cleanup 시 마운트 상태 false로 설정
    };
  }, []); // 빈 dependency 배열로 한 번만 실행

  // 로그인
  const signIn = async (email, password) => {
    try {
      console.log('🔑 로그인 시도:', email);
      setLoading(true);
      
      // users 테이블에서 사용자 확인
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('❌ 사용자 조회 실패:', error);
        throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      if (!data) {
        throw new Error('존재하지 않는 사용자입니다.');
      }

      // 사용자 승인 상태 확인
      if (data.status !== 'approved') {
        console.warn('⚠️ 승인되지 않은 사용자 로그인 시도:', data.email, 'Status:', data.status);
        throw new Error('관리자 승인 대기 중입니다. 승인 후 다시 로그인해주세요.');
      }

      // 비밀번호 검증 건너뛰기 (데모용)
      console.log('✅ 사용자 확인 및 승인 완료:', data.email);
      console.log('🔑 비밀번호 검증 건너뛰기 (데모 모드)');

      // 사용자 정보 설정
      const userData = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        team: data.team,
        status: data.status
      };

      const profileData = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        team: userData.team || '일반팀'
      };

      // 전역 상태 및 로컬 상태 업데이트
      globalUser = userData;
      globalProfile = profileData;
      
      setUser(userData);
      setProfile(profileData);

      // 세션 스토리지에 사용자 정보 저장 (페이지 새로고침 시 유지)
      sessionStorage.setItem('supabase_user', JSON.stringify(userData));
      sessionStorage.setItem('supabase_profile', JSON.stringify(profileData));

      // RLS 비활성화로 인해 세션 설정 불필요
      console.log('ℹ️ RLS 비활성화 모드 - 세션 설정 건너뜀');
      
      // 모든 리스너에게 상태 변경 알림
      notifyListeners();
      
      console.log('✅ 로그인 성공:', userData.email);
      return { data: { user: userData }, error: null };
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setLoading(true);
      
      // 전역 상태 초기화
      globalUser = null;
      globalProfile = null;
      globalInitialized = false;
      
      setUser(null);
      setProfile(null);
      setIsInitialized(false);
      
      // 세션 스토리지 정리
      sessionStorage.removeItem('supabase_user');
      sessionStorage.removeItem('supabase_profile');
      
      // 모든 리스너에게 상태 변경 알림
      notifyListeners();
      
      console.log('🚪 로그아웃 완료 (Supabase 전용)');
      return { error: null };
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const signUp = async (email, password, name, team) => {
    try {
      setLoading(true);
      
      // users 테이블에 새 사용자 추가 (승인 대기 상태로)
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        team: team || '일반팀',
        role: 'user',
        password_hash: 'temp_hash', // 실제로는 해시 필요
        status: 'pending', // 관리자 승인 대기 상태
        must_change_password: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 회원가입 성공 (승인 대기 상태):', data.email);
      return { 
        data: { user: data }, 
        error: null,
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
      };
    } catch (error) {
      console.error('❌ 회원가입 오류:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경
  const updatePassword = async (newPassword) => {
    try {
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('users')
        .update({ 
          password_hash: 'new_hash', // 실제로는 해시 필요
          must_change_password: false,
          last_password_change: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('❌ 비밀번호 변경 오류:', error);
      return { error };
    }
  };

  // 프로필 업데이트
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // 로컬 상태 업데이트 (Supabase 전용)
      const updatedUser = { ...user, ...updates };
      const updatedProfile = { ...profile, ...updates };
      
      setUser(updatedUser);
      setProfile(updatedProfile);
      
      return { error: null };
    } catch (error) {
      console.error('❌ 프로필 업데이트 오류:', error);
      return { error };
    }
  };

  // 비밀번호 재설정 요청
  const requestPasswordReset = async (email) => {
    try {
      // 간단한 구현 - 실제로는 이메일 발송 등이 필요
      console.log('🔄 비밀번호 재설정 요청:', email);
      return { success: true };
    } catch (error) {
      console.error('❌ 비밀번호 재설정 요청 오류:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    profile,
    loading,
    isInitialized,
    signUp,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
    requestPasswordReset,
    // 기존 useAuth와 호환성을 위한 별칭들
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    mustChangePassword: profile?.must_change_password || false
  };
};