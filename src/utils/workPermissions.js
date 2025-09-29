/**
 * 업무 관리 권한 확인 유틸리티
 */

/**
 * 현재 사용자가 관리자인지 확인
 */
export const isAdmin = (user, profile) => {
  // 관리자 역할 확인 (profile에서 role 확인 또는 특정 이메일/이름으로 확인)
  if (profile?.role === 'admin') return true;
  
  // 특정 관리자 계정들 (하드코딩으로 관리자 지정)
  const adminEmails = ['admin@company.com', 'manager@company.com'];
  const adminNames = ['관리자', '시스템 관리자', '정준'];
  
  const userEmail = user?.email || profile?.email || '';
  const userName = profile?.name || user?.name || '';
  
  return adminEmails.includes(userEmail) || adminNames.includes(userName);
};

/**
 * 현재 사용자가 해당 업무의 작성자인지 확인
 */
export const isWorkOwner = (work, user, profile) => {
  if (!work || !user) return false;
  
  const currentUserName = profile?.name || user?.name || user?.email || '';
  const workOwnerName = work.work_owner || '';
  
  // 작성자 이름 비교
  return currentUserName === workOwnerName;
};

/**
 * 현재 사용자가 업무를 수정/삭제/종료할 권한이 있는지 확인
 */
export const canManageWork = (work, user, profile) => {
  // 관리자이거나 작성자인 경우 권한 있음
  return isAdmin(user, profile) || isWorkOwner(work, user, profile);
};

/**
 * 권한 없음 메시지 생성
 */
export const getPermissionDeniedMessage = (action = '작업') => {
  return `이 ${action}은(는) 작성자 본인 또는 관리자만 수행할 수 있습니다.`;
};

/**
 * 현재 사용자 정보 가져오기 (일관된 방식)
 */
export const getCurrentUser = (user, profile) => {
  return {
    name: profile?.name || user?.name || user?.email || '',
    email: user?.email || profile?.email || '',
    isAdmin: isAdmin(user, profile)
  };
};