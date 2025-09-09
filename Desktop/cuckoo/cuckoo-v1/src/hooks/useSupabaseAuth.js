import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 로컬스토리지에서 사용자 세션 확인 (한 번만 실행)
  useEffect(() => {
    console.log('🔐 커스텀 인증 초기화 시작...');
    
    let isMounted = true; // 컴포넌트가 마운트된 상태인지 확인

    const checkStoredSession = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser && isMounted) {
          const userData = JSON.parse(storedUser);
          console.log('👤 저장된 사용자 세션 발견:', userData.email);
          setUser(userData);
          setProfile({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            team: userData.team || '일반팀'
          });
        } else if (isMounted) {
          console.log('🚪 저장된 세션이 없음 - 데모 계정 자동 로그인 시도');
          
          // 공개 배포에서는 데모 계정으로 자동 로그인
          if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
            console.log('🌐 공개 배포 환경 - 데모 계정으로 자동 로그인');
            autoSignInAsDemo();
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ 세션 확인 중 오류:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // 즉시 실행
    checkStoredSession();

    return () => {
      isMounted = false; // cleanup 시 마운트 상태 false로 설정
    };
  }, []); // 빈 dependency 배열로 한 번만 실행

  // 로그인
  const signIn = async (email, password) => {
    try {
      console.log('🔑 로그인 시도:', email);
      setLoading(true);
      
      // Supabase 연결 확인
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        throw new Error('Supabase 설정이 누락되었습니다.');
      }
      
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

      // 비밀번호 검증 건너뛰기 (데모용)
      console.log('✅ 사용자 확인 완료:', data.email);
      console.log('🔑 비밀번호 검증 건너뛰기 (데모 모드)');

      // 사용자 정보 설정
      const userData = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        team: data.team
      };

      setUser(userData);
      setProfile({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        team: userData.team || '일반팀'
      });

      // 로컬스토리지에 저장
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
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
      
      // 로컬스토리지에서 세션 제거
      localStorage.removeItem('currentUser');
      
      setUser(null);
      setProfile(null);
      
      console.log('🚪 로그아웃 완료');
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
      
      // users 테이블에 새 사용자 추가
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        team: team || '일반팀',
        role: 'user',
        password_hash: 'temp_hash', // 실제로는 해시 필요
        status: 'approved',
        must_change_password: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 회원가입 성공:', data.email);
      return { data: { user: data }, error: null };
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
      
      // 로컬 상태 업데이트
      const updatedUser = { ...user, ...updates };
      const updatedProfile = { ...profile, ...updates };
      
      setUser(updatedUser);
      setProfile(updatedProfile);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      return { error: null };
    } catch (error) {
      console.error('❌ 프로필 업데이트 오류:', error);
      return { error };
    }
  };

  // 데모 계정 자동 로그인
  const autoSignInAsDemo = async () => {
    try {
      console.log('🎭 데모 계정 자동 로그인 시작...');
      setLoading(true);
      
      // 데모 계정 정보 - 공개 배포용
      const demoUser = {
        id: 'demo_user_public',
        email: 'demo@cuckoo.co.kr',
        name: '데모 사용자',
        role: 'user',
        team: '데모팀'
      };

      setUser(demoUser);
      setProfile({
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        team: demoUser.team
      });

      // 로컬스토리지에 저장 (다음 방문 시 빠른 로딩)
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      
      console.log('✅ 데모 계정 자동 로그인 성공');
      return { data: { user: demoUser }, error: null };
    } catch (error) {
      console.error('❌ 데모 계정 자동 로그인 오류:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
      setIsInitialized(true);
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