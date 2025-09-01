import React from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';

/**
 * v1.1 PermissionGuard - 권한 기반 컴포넌트 가드
 * 
 * 주요 기능:
 * - 권한 기반 렌더링 제어
 * - 역할 기반 접근 제어
 * - 다중 권한/역할 체크
 * - 폴백 컴포넌트 지원
 * - 로딩 상태 처리
 * - 에러 바운더리
 */
const PermissionGuard_v11 = ({
  children,
  permission = null,
  permissions = [],
  role = null,
  roles = [],
  requireAll = false, // true: 모든 권한/역할 필요, false: 하나만 있으면 됨
  fallback = null,
  showFallback = true,
  onUnauthorized = null,
  className = ''
}) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole 
  } = useAuth();

  console.log('🛡️ [v1.1] PermissionGuard checking permissions', { 
    permission, 
    permissions, 
    role, 
    roles, 
    requireAll,
    userRole: user?.role,
    isAuthenticated 
  });

  // 로딩 중
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized('not_authenticated');
    }
    
    if (!showFallback) return null;
    
    return fallback || (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">로그인이 필요합니다</h3>
        <p className="text-gray-600">이 기능을 사용하려면 로그인해주세요.</p>
      </div>
    );
  }

  // 권한 체크 로직
  let hasAccess = true;

  // 개별 권한 체크
  if (permission) {
    hasAccess = hasPermission(permission);
  }

  // 다중 권한 체크
  if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  // 개별 역할 체크
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // 다중 역할 체크
  if (roles.length > 0) {
    const roleCheck = requireAll 
      ? roles.every(r => hasRole(r))
      : roles.some(r => hasRole(r));
    hasAccess = hasAccess && roleCheck;
  }

  // 접근 권한이 없는 경우
  if (!hasAccess) {
    if (onUnauthorized) {
      onUnauthorized('insufficient_permissions');
    }
    
    if (!showFallback) return null;
    
    return fallback || (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-lg font-medium text-red-600 mb-2">접근 권한이 없습니다</h3>
        <p className="text-gray-600">이 기능을 사용할 권한이 없습니다.</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>필요 권한: {[permission, ...permissions].filter(Boolean).join(', ')}</p>
          {(role || roles.length > 0) && (
            <p>필요 역할: {[role, ...roles].filter(Boolean).join(', ')}</p>
          )}
          <p>현재 역할: {user?.role || 'none'}</p>
        </div>
      </div>
    );
  }

  // 권한이 있는 경우 자식 컴포넌트 렌더링
  return <div className={className}>{children}</div>;
};

/**
 * 특정 권한이 필요한 컴포넌트를 감싸는 HOC
 */
export const withPermission = (permission, options = {}) => {
  return (WrappedComponent) => {
    const WithPermissionComponent = (props) => (
      <PermissionGuard_v11 permission={permission} {...options}>
        <WrappedComponent {...props} />
      </PermissionGuard_v11>
    );
    
    WithPermissionComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithPermissionComponent;
  };
};

/**
 * 특정 역할이 필요한 컴포넌트를 감싸는 HOC
 */
export const withRole = (role, options = {}) => {
  return (WrappedComponent) => {
    const WithRoleComponent = (props) => (
      <PermissionGuard_v11 role={role} {...options}>
        <WrappedComponent {...props} />
      </PermissionGuard_v11>
    );
    
    WithRoleComponent.displayName = `withRole(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithRoleComponent;
  };
};

/**
 * 관리자 권한이 필요한 컴포넌트를 감싸는 HOC
 */
export const withAdmin = (options = {}) => {
  return withRole('admin', options);
};

/**
 * 매니저 이상 권한이 필요한 컴포넌트를 감싸는 HOC
 */
export const withManagerOrAbove = (options = {}) => {
  return (WrappedComponent) => {
    const WithManagerComponent = (props) => (
      <PermissionGuard_v11 roles={['admin', 'manager']} {...options}>
        <WrappedComponent {...props} />
      </PermissionGuard_v11>
    );
    
    WithManagerComponent.displayName = `withManagerOrAbove(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithManagerComponent;
  };
};

/**
 * 권한 체크를 위한 유틸리티 컴포넌트들
 */

// 조건부 렌더링을 위한 컴포넌트
export const CanAccess = ({ permission, permissions, role, roles, requireAll, children, fallback }) => (
  <PermissionGuard_v11
    permission={permission}
    permissions={permissions}
    role={role}
    roles={roles}
    requireAll={requireAll}
    fallback={fallback}
  >
    {children}
  </PermissionGuard_v11>
);

// 특정 권한만 체크
export const CanEdit = ({ children, fallback }) => (
  <CanAccess permissions={['project:update', 'user:update']} fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanDelete = ({ children, fallback }) => (
  <CanAccess permissions={['project:delete', 'user:delete']} fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanCreate = ({ children, fallback }) => (
  <CanAccess permissions={['project:create', 'user:create']} fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanViewReports = ({ children, fallback }) => (
  <CanAccess permission="report:view" fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanExportReports = ({ children, fallback }) => (
  <CanAccess permission="report:export" fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanAccessAdmin = ({ children, fallback }) => (
  <CanAccess permission="admin:access" fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanManageUsers = ({ children, fallback }) => (
  <CanAccess permissions={['user:create', 'user:update', 'user:approve']} fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanViewAuditLogs = ({ children, fallback }) => (
  <CanAccess permission="audit:logs" fallback={fallback}>
    {children}
  </CanAccess>
);

export const CanModerateOpinions = ({ children, fallback }) => (
  <CanAccess permission="opinion:moderate" fallback={fallback}>
    {children}
  </CanAccess>
);

// 역할 기반 컴포넌트
export const AdminOnly = ({ children, fallback }) => (
  <CanAccess role="admin" fallback={fallback}>
    {children}
  </CanAccess>
);

export const ManagerOrAbove = ({ children, fallback }) => (
  <CanAccess roles={['admin', 'manager']} fallback={fallback}>
    {children}
  </CanAccess>
);

export const UserOrAbove = ({ children, fallback }) => (
  <CanAccess roles={['admin', 'manager', 'user']} fallback={fallback}>
    {children}
  </CanAccess>
);

// 권한 상태 표시 컴포넌트
export const PermissionStatus = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 ${className}`}>
        <span className="mr-1">🔐</span>
        로그인 필요
      </div>
    );
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    user: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-700'
  };

  const roleIcons = {
    admin: '👑',
    manager: '👨‍💼',
    user: '👤',
    viewer: '👁️'
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${roleColors[user?.role] || roleColors.viewer} ${className}`}>
      <span className="mr-1">{roleIcons[user?.role] || roleIcons.viewer}</span>
      {user?.role || 'viewer'}
    </div>
  );
};

export const PermissionGuard = PermissionGuard_v11;
export default PermissionGuard_v11;