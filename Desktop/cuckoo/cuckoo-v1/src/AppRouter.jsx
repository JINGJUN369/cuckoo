import React, { useCallback, useEffect, useState } from 'react';
import { useProjectStore } from './hooks/useProjectStore_v1.1';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

// 프로젝트 페이지 컴포넌트 imports (v1.1 updated)
import ProjectList_v11 from './pages/Projects/ProjectList_v1.1';
import ProjectDetail_v11 from './pages/Projects/ProjectDetail_v1.1';
import ProjectEdit_v11 from './pages/Projects/ProjectEdit_v1.1';
import ProjectDashboard_v11 from './pages/Projects/ProjectDashboard_v1.1';
import MainDashboard_v11 from './pages/Projects/MainDashboard_v1.1';
import ProjectCalendar_v11 from './pages/Projects/ProjectCalendar_v1.1';
import CompletedProjects_v11 from './pages/Projects/CompletedProjects_v1.1';

// 관리자 시스템 컴포넌트 imports (v1.1 updated)
import AdminDashboard_v11 from './pages/Admin/AdminDashboard_v1.1';
import UserManagement_v11 from './pages/Admin/UserManagement_v1.1';
import AuditLog_v11 from './pages/Admin/AuditLog_v1.1';
import SecuritySettings_v11 from './pages/Admin/SecuritySettings_v1.1';

// 인증 컴포넌트 imports
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

// UI 컴포넌트 imports
import Footer_v11 from './components/ui/Footer_v1.1';

/**
 * v1.1 AppRouter - 핵심 라우팅 시스템
 * 
 * 주요 개선사항:
 * - Context 렌더링 문제 해결
 * - 뷰 전환 로직 최적화
 * - 상태 변경 감지 개선
 * - 디버깅 정보 강화
 * - 통합 인증 시스템 연결
 * - 관리자 시스템 v1.1 연결
 */
const AppRouter = () => {
  // 렌더링 추적을 위한 카운터
  const [renderCount, setRenderCount] = useState(0);
  
  console.log(`🚀 [v1.1] AppRouter rendered (count: ${renderCount + 1})`);
  
  // 인증 상태 구독
  const { user, isAuthenticated, loading: isLoading } = useSupabaseAuth();
  
  // Project Store 상태 구독
  const { 
    ui, 
    selectedProject, 
    loading,
    error,
    setCurrentView 
  } = useProjectStore();
  const currentView = ui?.currentView || (isAuthenticated ? 'list' : 'login');
  
  // 렌더링 카운터 증가
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [currentView]);
  
  // 상태 변경 감지 및 로깅
  useEffect(() => {
    console.log(`🔄 [v1.1] View changed to: ${currentView}`);
    console.log(`📂 [v1.1] Selected project: ${selectedProject?.name || 'None'}`);
    console.log(`🔍 [v1.1] Full UI state:`, ui);
  }, [currentView, selectedProject?.name, ui]);
  
  // 뷰 컴포넌트 렌더링 함수
  const renderCurrentView = useCallback(() => {
    console.log(`✨ [v1.1] Rendering view: ${currentView}`);
    console.log(`🔐 [v1.1] Auth status: isAuthenticated=${isAuthenticated}, user=${user?.name}`);
    
    // 로딩 중일 때
    if (isLoading) {
      console.log(`⏳ [v1.1] → Loading component`);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      );
    }
    
    // 인증이 필요한 뷰들
    const protectedViews = ['list', 'detail', 'edit', 'project-dashboard', 'main-dashboard', 'calendar', 'completed', 'admin-dashboard', 'user-management', 'audit-log', 'security-settings'];
    
    // 인증되지 않은 상태에서 보호된 뷰 접근 시 로그인으로 리다이렉트
    if (!isAuthenticated && protectedViews.includes(currentView)) {
      console.log(`🚫 [v1.1] → Login required for protected view: ${currentView}`);
      return <LoginPage />;
    }
    
    switch (currentView) {
      // 인증 관련 뷰
      case 'login':
        console.log(`✅ [v1.1] → LoginPage component`);
        return <LoginPage />;
        
      case 'register':
        console.log(`✅ [v1.1] → RegisterPage component`);
        return <RegisterPage />;
        
      case 'forgot-password':
        console.log(`✅ [v1.1] → ResetPasswordPage component`);
        return <ResetPasswordPage />;
        
      // 프로젝트 관련 뷰
      case 'list':
        console.log(`✅ [v1.1] → ProjectList_v11 component`);
        return <ProjectList_v11 />;
        
      case 'detail':
        console.log(`✅ [v1.1] → ProjectDetail_v11 component`);
        return <ProjectDetail_v11 />;
        
      case 'edit':
        console.log(`✅ [v1.1] → ProjectEdit_v11 component`);
        return <ProjectEdit_v11 />;
        
      case 'project-dashboard':
        console.log(`✅ [v1.1] → ProjectDashboard_v11 component`);
        return <ProjectDashboard_v11 type="project" />;
        
      case 'main-dashboard':
        console.log(`✅ [v1.1] → MainDashboard_v11 component`);
        return <MainDashboard_v11 />;
        
      case 'calendar':
        console.log(`✅ [v1.1] → ProjectCalendar_v11 component`);
        return <ProjectCalendar_v11 />;
        
      case 'completed':
        console.log(`✅ [v1.1] → CompletedProjects_v11 component`);
        return <CompletedProjects_v11 />;
        
      // 관리자 시스템 뷰 (v1.1)
      case 'admin-dashboard':
        console.log(`✅ [v1.1] → AdminDashboard_v11 component`);
        return <AdminDashboard_v11 />;
        
      case 'user-management':
        console.log(`✅ [v1.1] → UserManagement_v11 component`);
        return <UserManagement_v11 />;
        
      case 'audit-log':
        console.log(`✅ [v1.1] → AuditLog_v11 component`);
        return <AuditLog_v11 />;
        
      case 'security-settings':
        console.log(`✅ [v1.1] → SecuritySettings_v11 component`);
        return <SecuritySettings_v11 />;
        
      default:
        console.warn(`⚠️ [v1.1] Unknown view: ${currentView}`);
        if (isAuthenticated) {
          console.log(`✅ [v1.1] → Fallback to ProjectList_v11 component`);
          return <ProjectList_v11 />;
        } else {
          console.log(`✅ [v1.1] → Fallback to LoginPage component`);
          return <LoginPage />;
        }
    }
  }, [currentView, isAuthenticated, isLoading, user]);
  
  // 에러 경계 처리
  if (error) {
    console.error(`❌ [v1.1] Supabase error:`, error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">시스템 오류</h2>
          <p className="text-gray-600">데이터를 불러올 수 없습니다: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!ui) {
    console.error(`❌ [v1.1] No UI state available`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">UI 오류</h2>
          <p className="text-gray-600">UI 상태를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }
  
  // 메인 렌더링
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="app-router">
      {/* 개발용 상태 표시 (프로덕션에서는 제거) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-75 text-white text-xs p-2 m-2 rounded">
          <div>View: {currentView}</div>
          <div>Render: #{renderCount + 1}</div>
          <div>Project: {selectedProject?.name || 'None'}</div>
        </div>
      )}
      
      {/* 현재 뷰 렌더링 */}
      <div className="flex-1 w-full" key={`${currentView}-${renderCount}`}>
        {renderCurrentView()}
      </div>
      
      {/* Footer 컴포넌트 */}
      <Footer_v11 />
    </div>
  );
};

export default AppRouter;