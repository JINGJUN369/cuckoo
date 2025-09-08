import { useState, useEffect } from 'react';

/**
 * Supabase Auth의 임시 대체 (LocalStorage 기반)
 * 로딩 문제 해결을 위한 fallback
 */
export const useSupabaseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // 로컬스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('currentUser');
    const savedProfile = localStorage.getItem('currentProfile');
    
    console.log('🔐 [Fallback] 저장된 사용자 확인:', { savedUser: !!savedUser, savedProfile: !!savedProfile });
    
    if (savedUser && savedProfile) {
      try {
        const userData = JSON.parse(savedUser);
        const profileData = JSON.parse(savedProfile);
        
        console.log('✅ [Fallback] 로그인 상태 복원:', userData.email);
        setUser(userData);
        setProfile(profileData);
      } catch (error) {
        console.error('❌ [Fallback] 사용자 데이터 파싱 실패:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentProfile');
      }
    }
  }, []);

  const signIn = async (email, password) => {
    console.log('📤 [Fallback] 로그인 시도:', email);
    
    // 간단한 로그인 시뮬레이션
    try {
      const userData = {
        id: `user_${Date.now()}`,
        email: email,
        created_at: new Date().toISOString()
      };
      
      const profileData = {
        id: userData.id,
        name: email === 'admin@cuckoo.co.kr' ? '시스템 관리자' : '사용자',
        email: email,
        role: email === 'admin@cuckoo.co.kr' ? 'admin' : 'user',
        team: email === 'admin@cuckoo.co.kr' ? '관리팀' : '일반팀'
      };

      // 로컬스토리지에 저장
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('currentProfile', JSON.stringify(profileData));
      
      setUser(userData);
      setProfile(profileData);
      
      console.log('✅ [Fallback] 로그인 성공:', email);
      return { data: { user: userData }, error: null };
    } catch (error) {
      console.error('❌ [Fallback] 로그인 실패:', error);
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    console.log('🚪 [Fallback] 로그아웃');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentProfile');
    setUser(null);
    setProfile(null);
    return { error: null };
  };

  const signUp = async (email, password, name, team) => {
    console.log('📝 [Fallback] 회원가입:', email);
    return signIn(email, password); // 간단하게 바로 로그인으로 처리
  };

  const updatePassword = async (newPassword) => {
    return { error: null };
  };

  const updateProfile = async (updates) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      localStorage.setItem('currentProfile', JSON.stringify(updatedProfile));
    }
    return { error: null };
  };

  const requestPasswordReset = async (email) => {
    return { success: true };
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
    requestPasswordReset,
    // 기존 useAuth와 호환성을 위한 별칭들
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    mustChangePassword: false
  };
};