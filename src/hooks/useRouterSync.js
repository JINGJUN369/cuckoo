import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseProjectStore } from './useSupabaseProjectStore';

/**
 * useRouterSync - v1.1 상태와 v1.2 라우터 간의 동기화 훅
 * 
 * 기존 v1.1 컴포넌트들이 새로운 URL 기반 라우팅과 호환되도록 하는 어댑터
 * 
 * 주요 기능:
 * - 기존 상태 기반 뷰 변경을 URL 변경으로 변환
 * - URL 변경을 기존 상태로 동기화
 * - 프로젝트 선택 상태와 URL 파라미터 동기화
 */
export const useRouterSync = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ui, selectedProject, setCurrentView, setSelectedProject } = useSupabaseProjectStore();

  // URL 경로를 기존 v1.1 뷰 형식으로 변환
  const pathToView = (pathname, search = '') => {
    const params = new URLSearchParams(search);
    
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'main-dashboard';
      case '/projects':
        return 'list';
      case '/calendar':
        return 'calendar';
      case '/completed':
        return 'completed';
      case '/admin':
        return 'admin-dashboard';
      case '/admin/users':
        return 'user-management';
      case '/admin/logs':
        return 'audit-log';
      case '/admin/security':
        return 'security-settings';
      default:
        if (pathname.startsWith('/projects/')) {
          const segments = pathname.split('/');
          if (segments.length === 3) {
            // /projects/:id
            return 'detail';
          } else if (segments.length === 4 && segments[3] === 'edit') {
            // /projects/:id/edit
            return 'edit';
          }
        }
        return 'list'; // fallback
    }
  };

  // v1.1 뷰를 URL 경로로 변환
  const viewToPath = (view, projectId = null) => {
    switch (view) {
      case 'main-dashboard':
        return '/dashboard';
      case 'list':
        return '/projects';
      case 'detail':
        return projectId ? `/projects/${projectId}` : '/projects';
      case 'edit':
        return projectId ? `/projects/${projectId}/edit` : '/projects';
      case 'calendar':
        return '/calendar';
      case 'completed':
        return '/completed';
      case 'admin-dashboard':
        return '/admin';
      case 'user-management':
        return '/admin/users';
      case 'audit-log':
        return '/admin/logs';
      case 'security-settings':
        return '/admin/security';
      case 'login':
        return '/login';
      default:
        return '/dashboard';
    }
  };

  // URL 변경 시 기존 상태 동기화
  useEffect(() => {
    const currentView = pathToView(location.pathname, location.search);
    
    // 프로젝트 ID 추출
    const projectIdMatch = location.pathname.match(/^\/projects\/([^\/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;

    console.log('🔄 [RouterSync] URL changed:', location.pathname, '-> view:', currentView, 'projectId:', projectId);

    // 상태 업데이트 (무한 루프 방지를 위해 조건부)
    if (ui?.currentView !== currentView) {
      setCurrentView(currentView);
    }

    // 프로젝트 ID가 있고 현재 선택된 프로젝트와 다르면 업데이트
    if (projectId && selectedProject?.id !== projectId) {
      // 프로젝트 스토어에서 해당 프로젝트 찾기
      // 이는 컴포넌트에서 처리하도록 위임 (프로젝트 로딩 등)
    }
  }, [location.pathname, location.search, ui?.currentView, selectedProject?.id, setCurrentView]);

  // 기존 뷰 상태 변경 시 URL 동기화
  useEffect(() => {
    if (!ui?.currentView) return;

    const expectedPath = viewToPath(ui.currentView, selectedProject?.id);
    
    console.log('🔄 [RouterSync] View state changed:', ui.currentView, '-> path:', expectedPath);

    // 현재 URL과 예상 URL이 다르면 네비게이션
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [ui?.currentView, selectedProject?.id, location.pathname, navigate, viewToPath]);

  // 네비게이션 헬퍼 함수들 (기존 코드 호환성용)
  const navigateToView = (view, projectId = null) => {
    const path = viewToPath(view, projectId);
    navigate(path);
  };

  const navigateToProject = (projectId, view = 'detail') => {
    const path = viewToPath(view, projectId);
    navigate(path);
  };

  return {
    // 현재 상태 정보
    currentView: pathToView(location.pathname, location.search),
    currentProjectId: location.pathname.match(/^\/projects\/([^\/]+)/)?.[1] || null,
    
    // 네비게이션 함수들
    navigateToView,
    navigateToProject,
    
    // URL 변환 유틸리티
    pathToView,
    viewToPath
  };
};

/**
 * 기존 컴포넌트에서 사용할 수 있는 래퍼 훅
 * setCurrentView를 호출하면 자동으로 URL이 변경됨
 */
export const useCompatRouter = () => {
  const navigate = useNavigate();
  const { viewToPath } = useRouterSync();
  const { selectedProject, setSelectedProject } = useSupabaseProjectStore();

  const setCurrentView = (view) => {
    const path = viewToPath(view, selectedProject?.id);
    navigate(path);
  };

  const setCurrentViewWithProject = (view, project) => {
    if (project) {
      setSelectedProject(project);
    }
    const path = viewToPath(view, project?.id || selectedProject?.id);
    navigate(path);
  };

  return {
    setCurrentView,
    setCurrentViewWithProject,
    selectedProject,
    setSelectedProject
  };
};

export default useRouterSync;