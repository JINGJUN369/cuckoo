import React, { useState } from 'react';
import { AuthProvider_v11 as AuthProvider, useAuth } from './hooks/useAuth_v1.1';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import AdminPage from './pages/Admin/AdminPage';
import { ProjectProvider } from './hooks/useProjectStore_v1.1';
import AppRouter from './AppRouter';
import { BrandHeader } from './components/ui';

/**
 * v1.1 AuthenticatedApp - 개선된 인증 및 앱 구조
 * 
 * 주요 개선사항:
 * - v1.1 useProjectStore 사용
 * - 새로운 AppRouter 연결
 * - 에러 처리 개선
 * - 로딩 상태 최적화
 */

// 인증된 앱의 메인 콘텐츠
const MainContent = () => {
  const { user, logout, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('projects'); // 'projects', 'admin'

  console.log(`🔐 [v1.1] MainContent - user:`, user?.id, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log(`👤 [v1.1] No user, showing auth flow`);
    return <AuthFlow />;
  }

  // 관리자 권한 확인
  const isAdmin = user && (user.id === 'admin' || user.team === '관리팀' || user.id === '10001');
  
  console.log(`🏠 [v1.1] Authenticated user:`, user.id, 'isAdmin:', isAdmin, 'currentPage:', currentPage);

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 브랜드 헤더 */}
        <BrandHeader currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* 메인 콘텐츠 */}
        <main className="flex-1">
          {currentPage === 'projects' && (
            <AppRouter />
          )}
          {currentPage === 'admin' && isAdmin && (
            <div className="container mx-auto px-4 py-6">
              <AdminPage />
            </div>
          )}
          {currentPage === 'admin' && !isAdmin && (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">접근 권한 없음</h2>
                <p className="text-gray-600">관리자 페이지에 접근할 권한이 없습니다.</p>
                <button
                  onClick={() => setCurrentPage('projects')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  프로젝트로 돌아가기
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProjectProvider>
  );
};

// 인증 플로우 (로그인, 회원가입, 비밀번호 초기화)
const AuthFlow = () => {
  const [currentView, setCurrentView] = useState('login');

  console.log(`🔑 [v1.1] AuthFlow - currentView:`, currentView);

  const handleViewChange = (view) => {
    console.log(`🔄 [v1.1] AuthFlow view changing to:`, view);
    setCurrentView(view);
  };

  switch (currentView) {
    case 'register':
      return (
        <RegisterPage 
          onBackToLogin={() => handleViewChange('login')} 
        />
      );
    case 'reset':
      return (
        <ResetPasswordPage 
          onBackToLogin={() => handleViewChange('login')} 
        />
      );
    default:
      return (
        <LoginPage
          onRegisterClick={() => handleViewChange('register')}
          onResetPasswordClick={() => handleViewChange('reset')}
        />
      );
  }
};

// 개발용: localStorage 초기화 함수 (브라우저 콘솔에서 사용 가능)
window.clearAuthData = () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('users');
  localStorage.removeItem('projects');
  localStorage.removeItem('completedProjects');
  localStorage.removeItem('opinions');
  localStorage.removeItem('activityLogs');
  console.log('🧹 [v1.1] 모든 인증 및 앱 데이터가 초기화되었습니다. 페이지를 새로고침하세요.');
};

window.logoutUser = () => {
  localStorage.removeItem('currentUser');
  console.log('🚪 [v1.1] 사용자 로그아웃됨. 페이지를 새로고침하세요.');
};

// 디버깅용: 현재 상태 확인 함수
window.debugAppState = () => {
  console.group('🐛 [v1.1] Debug App State');
  console.log('Current User:', JSON.parse(localStorage.getItem('currentUser') || 'null'));
  console.log('Projects:', JSON.parse(localStorage.getItem('projects') || '[]'));
  console.log('Completed Projects:', JSON.parse(localStorage.getItem('completedProjects') || '[]'));
  console.log('Opinions:', JSON.parse(localStorage.getItem('opinions') || '[]'));
  console.log('Activity Logs:', JSON.parse(localStorage.getItem('activityLogs') || '[]'));
  console.groupEnd();
};

// 최상위 앱 컴포넌트
const AuthenticatedApp_v11 = () => {
  console.log(`🚀 [v1.1] AuthenticatedApp initializing...`);
  
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default AuthenticatedApp_v11;