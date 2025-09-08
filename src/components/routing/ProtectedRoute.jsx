import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * ProtectedRoute - 인증이 필요한 라우트를 보호하는 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
 * @param {Array<string>} props.roles - 접근 가능한 역할 목록 (선택적)
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading, profile } = useSupabaseAuth();
  const isInitialized = !loading;
  const location = useLocation();

  console.log('🔐 [ProtectedRoute] Auth state:', { 
    loading, 
    isInitialized, 
    isAuthenticated, 
    hasProfile: !!profile,
    userRole: profile?.role 
  });

  // 로딩 중일 때는 로딩 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    console.log('🚫 [ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 역할 기반 접근 제어 (관리자 페이지 등)
  if (roles.length > 0) {
    const userRole = profile?.role || 'user';
    const isAdminEmail = user?.email === 'admin@cuckoo.co.kr';
    
    console.log('🔒 [ProtectedRoute] Role check:', { 
      requiredRoles: roles, 
      userRole, 
      isAdminEmail,
      profileRole: profile?.role
    });
    
    // admin 역할이 필요한 경우 profile.role === 'admin' 또는 특정 이메일 확인
    if (roles.includes('admin') && !((userRole === 'admin') || isAdminEmail)) {
      console.log('🚫 [ProtectedRoute] Admin access denied');
      return <Navigate to="/dashboard" replace />;
    }
    
    // 다른 역할들에 대한 일반적인 검사
    if (!roles.includes('admin') && !roles.includes(userRole)) {
      console.log('🚫 [ProtectedRoute] Role access denied');
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 모든 조건을 만족하면 자식 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;