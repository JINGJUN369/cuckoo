import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { SupabaseProjectProvider } from './hooks/useSupabaseProjectStore';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

// Page Components (v1.2)
import LoginPage_v1_2 from './pages/Auth/LoginPage_v1.2';
import RegisterPage_v1_2 from './pages/Auth/RegisterPage_v1.2';
import PasswordResetPage_v1_2 from './pages/Auth/PasswordResetPage_v1.2';
import DashboardPage_v1_2 from './pages/Dashboard/DashboardPage_v1.2';
import ProjectListPage_v1_2 from './pages/Projects/ProjectListPage_v1.2';
import ProjectDetailPage_v1_2 from './pages/Projects/ProjectDetailPage_v1.2';
import ProjectEditPage_v1_2 from './pages/Projects/ProjectEditPage_v1.2';
import CalendarPage_v1_2 from './pages/Calendar/CalendarPage_v1.2';
import CompletedProjectsPage_v1_2 from './pages/Projects/CompletedProjectsPage_v1.2';

// Admin Pages
import AdminDashboardPage_v1_2 from './pages/Admin/AdminDashboardPage_v1.2';
import UserManagementPage_v1_2 from './pages/Admin/UserManagementPage_v1.2';
import AuditLogPage_v1_2 from './pages/Admin/AuditLogPage_v1.2';
import SecuritySettingsPage_v1_2 from './pages/Admin/SecuritySettingsPage_v1.2';
import PublicReportManagement_v1_2 from './pages/Admin/PublicReportManagement_v1.2';

// Profile Page
import ProfilePage_v1_2 from './pages/Profile/ProfilePage_v1.2';

// Public Report Page
import PublicReportViewer from './pages/PublicReport/PublicReportViewer';

// Layout Components
import Layout_v1_2 from './components/layout/Layout_v1.2';

/**
 * App v1.2 - URL 기반 라우팅을 지원하는 Supabase 전용 앱 구조
 * 
 * 주요 변경사항:
 * - React Router 도입으로 URL 기반 네비게이션 지원
 * - 페이지별 독립적인 컴포넌트 구조
 * - 보호된 라우트 시스템
 * - SEO 친화적 URL 구조
 * - Supabase 전용 (LocalStorage 제거)
 */
function App_v1_2() {
  console.log('🚀 [v1.2] App starting with React Router - Supabase Only');
  
  const { user } = useSupabaseAuth();

  // 긴급 수정: 로딩 상태 체크 완전 제거하여 UI 차단 방지

  return (
    <ToastProvider>
      <SupabaseProjectProvider>
            <BrowserRouter>
            <div className="App" data-version="v1.2">
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage_v1_2 />} />
              <Route path="/register" element={<RegisterPage_v1_2 />} />
              <Route path="/reset-password" element={<PasswordResetPage_v1_2 />} />
              
              {/* Public Report - No authentication required */}
              <Route path="/public-report/:reportId" element={<PublicReportViewer />} />
              
              {/* Root redirects to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <DashboardPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/projects" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <ProjectListPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/projects/:id" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <ProjectDetailPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/projects/:id/edit" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <ProjectEditPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <CalendarPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/completed" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <CompletedProjectsPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              {/* Work Status Management Routes (v2.0) */}
              <Route path="/work-status" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">📋 업무현황 관리</h1>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800 mb-2">🚀 <strong>버전 2.0 업데이트</strong></p>
                        <p className="text-blue-700">업무현황관리 시스템이 개발 중입니다.</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded border">
                            <h3 className="font-medium text-gray-900">📊 대시보드</h3>
                            <p className="text-sm text-gray-600 mt-1">업무 현황 모니터링</p>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <h3 className="font-medium text-gray-900">📋 업무 관리</h3>
                            <p className="text-sm text-gray-600 mt-1">추가업무 및 세부업무 관리</p>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <h3 className="font-medium text-gray-900">📅 달력</h3>
                            <p className="text-sm text-gray-600 mt-1">일정 및 마감일 관리</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <ProfilePage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              {/* Admin Routes - Role-based protection */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <Layout_v1_2>
                    <Navigate to="/admin/dashboard" replace />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/dashboard" element={
                <ProtectedRoute roles={['admin']}>
                  <Layout_v1_2>
                    <AdminDashboardPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                  <Layout_v1_2>
                    <UserManagementPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/logs" element={
                <ProtectedRoute roles={['admin']}>
                  <Layout_v1_2>
                    <AuditLogPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/security" element={
                <ProtectedRoute roles={['admin']}>
                  <Layout_v1_2>
                    <SecuritySettingsPage_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute roles={['admin']}>
                  <Layout_v1_2>
                    <PublicReportManagement_v1_2 />
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              
              {/* Catch all - 404 fallback */}
              <Route path="*" element={
                <ProtectedRoute>
                  <Layout_v1_2>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-gray-600 mb-8">페이지를 찾을 수 없습니다.</p>
                        <a 
                          href="/dashboard" 
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          대시보드로 돌아가기
                        </a>
                      </div>
                    </div>
                  </Layout_v1_2>
                </ProtectedRoute>
              } />
              </Routes>
            </div>
          </BrowserRouter>
        </SupabaseProjectProvider>
    </ToastProvider>
  );
}

export default App_v1_2;