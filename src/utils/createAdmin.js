import { supabase } from '../lib/supabase';

/**
 * 개발용 어드민 계정 생성 스크립트
 * 브라우저 콘솔에서 실행: window.createAdminAccount()
 */
export const createAdminAccount = async () => {
  console.log('🔧 어드민 계정 생성 시작...');
  
  const adminEmail = 'admin@cuckoo.co.kr';
  const adminPassword = '000000'; // 임시 비밀번호
  
  try {
    // 1. Supabase Auth에 어드민 사용자 생성
    console.log('📧 Supabase Auth에 사용자 생성 중...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          name: '시스템 관리자',
          team: '관리팀'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Auth 계정 생성 실패:', signUpError);
      throw signUpError;
    }

    console.log('✅ Auth 계정 생성 성공:', authData.user?.email);

    // 2. profiles 테이블에 어드민 프로필 생성
    if (authData.user) {
      console.log('👤 프로필 테이블에 어드민 정보 생성 중...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          name: '시스템 관리자',
          team: '관리팀',
          email: adminEmail,
          role: 'admin', // 중요: admin 역할 설정
          registered_at: new Date().toISOString()
        }]);

      if (profileError) {
        console.error('❌ 프로필 생성 실패:', profileError);
        // Auth는 이미 생성되었으므로, 프로필만 재시도
        throw profileError;
      }

      console.log('✅ 어드민 프로필 생성 성공');
    }

    console.log('🎉 어드민 계정 생성 완료!');
    console.log(`📧 이메일: ${adminEmail}`);
    console.log(`🔒 비밀번호: ${adminPassword}`);
    console.log('💡 이제 이 정보로 로그인할 수 있습니다.');
    
    return {
      success: true,
      email: adminEmail,
      password: adminPassword,
      userId: authData.user?.id
    };
    
  } catch (error) {
    console.error('❌ 어드민 계정 생성 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 기존 사용자를 어드민으로 승격
 */
export const promoteToAdmin = async (email) => {
  try {
    console.log(`🔧 ${email}을 어드민으로 승격 중...`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', email);

    if (error) throw error;

    console.log('✅ 어드민 승격 완료!');
    return { success: true };
  } catch (error) {
    console.error('❌ 어드민 승격 실패:', error);
    return { success: false, error: error.message };
  }
};

// 브라우저 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.createAdminAccount = createAdminAccount;
  window.promoteToAdmin = promoteToAdmin;
}