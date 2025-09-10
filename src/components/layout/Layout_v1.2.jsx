import React, { useState, useCallback, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import BrandHeader from '../ui/BrandHeader';
import Footer from '../ui/Footer_v1.1';
import PasswordChangeModal_v1_2 from '../ui/PasswordChangeModal_v1.2';
import OnlineUsersSidebar from '../ui/OnlineUsersSidebar';

/**
 * Layout v1.2 - 모든 페이지에 공통으로 적용되는 레이아웃
 * 
 * 주요 기능:
 * - 네비게이션 바
 * - 사이드바 (선택적)
 * - 푸터
 * - 공통 UI 요소들
 */
const Layout = React.memo(({ children }) => {
  const { user, profile, signOut, loading, isInitialized, isAuthenticated } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOnlineUsersSidebar, setShowOnlineUsersSidebar] = useState(false);

  console.log('🏗️ [v1.2] Layout rendered for path:', location.pathname, {
    loading, 
    isInitialized, 
    isAuthenticated, 
    hasProfile: !!profile
  });

  // 비밀번호 변경 모달 자동 표시 (메모이제이션으로 최적화)
  React.useEffect(() => {
    if (profile?.must_change_password === true && !showPasswordModal) {
      console.log('🔐 [v1.2] User needs password change, showing modal');
      setShowPasswordModal(true);
    }
  }, [profile?.must_change_password, showPasswordModal]);

  // 네비게이션 메뉴 설정 (메모이제이션)
  const navigationItems = useMemo(() => [
    { path: '/dashboard', label: '대시보드', icon: '📊', section: 'main' },
    { path: '/projects', label: '신제품관리', icon: '📁', section: 'products' },
    { path: '/calendar', label: '달력', icon: '📅', section: 'products' },
    { path: '/completed', label: '완료된 프로젝트', icon: '✅', section: 'products' },
    { path: '/work-status', label: '업무현황관리', icon: '📋', section: 'work' },
  ], []);

  // 관리자 메뉴 (관리자만 표시)
  const adminItems = useMemo(() => [
    { path: '/admin', label: '관리자 대시보드', icon: '⚙️' },
    { path: '/admin/users', label: '사용자 관리', icon: '👥' },
    { path: '/admin/logs', label: '활동 로그', icon: '📋' },
    { path: '/admin/security', label: '보안 설정', icon: '🔒' },
    { path: '/admin/reports', label: '공개 보고서 관리', icon: '📊' },
  ], []);

  const isAdmin = useMemo(() => 
    profile?.role === 'admin' || user?.email === 'admin@cuckoo.co.kr',
    [profile?.role, user?.email]
  );
  
  const isCurrentPath = useCallback((path) => location.pathname === path, [location.pathname]);

  // 콜백 함수들을 미리 정의
  const handleToggleOnlineUsers = useCallback(() => setShowOnlineUsersSidebar(true), []);
  const handleNavigateToProfile = useCallback(() => navigate('/profile'), [navigate]);
  const handleClosePasswordModal = useCallback(() => setShowPasswordModal(false), []);
  const handlePasswordChangeSuccess = useCallback(() => {
    setShowPasswordModal(false);
    alert('비밀번호가 변경되었습니다.\n보안을 위해 새로운 비밀번호로 다시 로그인해주세요.');
    signOut();
    navigate('/login');
  }, [signOut, navigate]);
  const handleCloseOnlineUsersSidebar = useCallback(() => setShowOnlineUsersSidebar(false), []);

  // 디버깅: 관리자 메뉴 표시 조건 확인
  console.log('🔍 [Layout] Admin menu debug:', {
    isAuthenticated,
    isAdmin,
    profile: profile,
    profileRole: profile?.role,
    user: user?.email
  });

  // 인증 상태가 안정화되지 않았을 때는 로딩 표시
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <BrandHeader 
        showNav={true}
        currentPage={location.pathname.split('/')[1] || 'dashboard'}
        onToggleOnlineUsers={handleToggleOnlineUsers}
      />

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
          <nav className="flex-1 mt-8 px-4">
            {/* Main Navigation */}
            <div className="space-y-6">
              {/* Dashboard */}
              <div className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  대시보드
                </h3>
                {isAuthenticated && navigationItems.filter(item => item.section === 'main').map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isCurrentPath(item.path)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
              
              {/* Product Management */}
              <div className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  신제품관리
                </h3>
                {isAuthenticated && navigationItems.filter(item => item.section === 'products').map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isCurrentPath(item.path)
                        ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
              
              {/* Work Status Management */}
              <div className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  업무현황관리 <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">v2.0</span>
                </h3>
                {isAuthenticated && navigationItems.filter(item => item.section === 'work').map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isCurrentPath(item.path)
                        ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin Navigation */}
            {isAuthenticated && isAdmin && (
              <div className="mt-8 space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  관리자 메뉴
                </h3>
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isCurrentPath(item.path)
                        ? 'bg-red-50 text-red-700 border-r-2 border-red-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* User Info - Clickable */}
          <div className="mt-auto p-4">
            <button 
              onClick={handleNavigateToProfile}
              className="w-full bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-4 text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-medium">
                    {(profile?.name || user?.email)?.[0] || '?'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.name || user?.email || '사용자'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile?.email || user?.email}
                  </p>
                </div>
                <div className="text-gray-400">
                  ⚙️
                </div>
              </div>
              {profile?.role === 'admin' && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    관리자
                  </span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pb-20">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal_v1_2
          isOpen={showPasswordModal}
          onClose={handleClosePasswordModal}
          isRequired={profile?.must_change_password === true}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}

      {/* Online Users Sidebar */}
      <OnlineUsersSidebar
        isOpen={showOnlineUsersSidebar}
        onClose={handleCloseOnlineUsersSidebar}
        scope="global"
      />
    </div>
  );
});

export default Layout;