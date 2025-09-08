import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import AdminPage from './pages/Admin/AdminPage';
import { ProjectProvider } from './hooks/useProjectStore_v1.1';
import MainDashboard_v11 from './pages/Projects/MainDashboard_v1.1';
import { BrandHeader } from './components/ui';

// 인증된 앱의 메인 콘텐츠
const MainContent = () => {
  const { user, logout, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('projects'); // 'projects', 'admin'

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

  // 디버깅을 위한 로그
  console.log('MainContent - user:', user, 'isLoading:', isLoading);

  if (!user) {
    return <AuthFlow />;
  }

  // 관리자 권한 확인
  const isAdmin = user && (user.id === 'admin' || user.team === '관리팀' || user.id === '10001');

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 브랜드 헤더 */}
        <BrandHeader currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* 메인 콘텐츠 */}
        <main>
          {currentPage === 'projects' && <MainDashboard_v11 />}
          {currentPage === 'admin' && isAdmin && <AdminPage />}
        </main>
      </div>
    </ProjectProvider>
  );
};

// 인증 플로우 (로그인, 회원가입, 비밀번호 초기화)
const AuthFlow = () => {
  const [currentView, setCurrentView] = useState('login');

  const handleViewChange = (view) => {
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
  console.log('모든 인증 및 앱 데이터가 초기화되었습니다. 페이지를 새로고침하세요.');
};

window.logoutUser = () => {
  localStorage.removeItem('currentUser');
  console.log('사용자 로그아웃됨. 페이지를 새로고침하세요.');
};

// 최상위 앱 컴포넌트
const AuthenticatedApp = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default AuthenticatedApp;