import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

/**
 * v1.1 useAuth - 향상된 인증 및 권한 관리 시스템
 * 
 * 주요 개선사항:
 * - 역할 기반 접근 제어 (RBAC)
 * - 세션 관리 및 자동 로그아웃
 * - 보안 정책 관리
 * - 비밀번호 정책 강화
 * - 로그인 시도 제한
 * - 계정 잠금 및 해제
 * - 다중 역할 지원
 * - 권한 세분화
 * - 감사 로그 강화
 */

// 역할 및 권한 정의
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // 프로젝트 관련
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_COMPLETE: 'project:complete',
  
  // 사용자 관리
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_APPROVE: 'user:approve',
  
  // 시스템 관리
  ADMIN_ACCESS: 'admin:access',
  SYSTEM_CONFIG: 'system:config',
  AUDIT_LOGS: 'audit:logs',
  
  // 리포트 및 분석
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  
  // 의견 관리
  OPINION_CREATE: 'opinion:create',
  OPINION_UPDATE: 'opinion:update',
  OPINION_DELETE: 'opinion:delete',
  OPINION_MODERATE: 'opinion:moderate'
};

// 역할별 권한 매핑
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_COMPLETE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.OPINION_CREATE,
    PERMISSIONS.OPINION_UPDATE,
    PERMISSIONS.OPINION_DELETE,
    PERMISSIONS.OPINION_MODERATE,
    PERMISSIONS.AUDIT_LOGS
  ],
  [ROLES.USER]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.OPINION_CREATE,
    PERMISSIONS.OPINION_UPDATE,
    PERMISSIONS.REPORT_VIEW
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.REPORT_VIEW
  ]
};

// 보안 설정
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30분
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8시간
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_SPECIAL: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_UPPERCASE: true
};

// 액션 타입들
const ActionTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  INCREMENT_LOGIN_ATTEMPT: 'INCREMENT_LOGIN_ATTEMPT',
  RESET_LOGIN_ATTEMPTS: 'RESET_LOGIN_ATTEMPTS',
  LOCK_ACCOUNT: 'LOCK_ACCOUNT',
  UNLOCK_ACCOUNT: 'UNLOCK_ACCOUNT',
  REFRESH_SESSION: 'REFRESH_SESSION'
};

// 초기 상태
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  loginAttempts: 0,
  isLocked: false,
  lockoutEndTime: null,
  sessionExpiry: null,
  lastActivity: null
};

// 리듀서 함수
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLocked: false,
        lockoutEndTime: null,
        sessionExpiry: action.payload.sessionExpiry,
        lastActivity: Date.now()
      };

    case ActionTypes.LOGOUT:
      // 로컬 스토리지에서 인증 정보 제거
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionExpiry');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionExpiry: null,
        lastActivity: null
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case ActionTypes.INCREMENT_LOGIN_ATTEMPT:
      const newAttempts = state.loginAttempts + 1;
      const shouldLock = newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
      
      return {
        ...state,
        loginAttempts: newAttempts,
        isLocked: shouldLock,
        lockoutEndTime: shouldLock ? Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION : null
      };

    case ActionTypes.RESET_LOGIN_ATTEMPTS:
      return {
        ...state,
        loginAttempts: 0,
        isLocked: false,
        lockoutEndTime: null
      };

    case ActionTypes.REFRESH_SESSION:
      return {
        ...state,
        sessionExpiry: Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT,
        lastActivity: Date.now()
      };

    default:
      return state;
  }
};

// 컨텍스트 생성
const AuthContext = createContext();

// AuthProvider 컴포넌트
export const AuthProvider_v11 = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 사용자 권한 확인
  const hasPermission = useCallback((permission) => {
    if (!state.user || !state.isAuthenticated) return false;
    
    const userRole = state.user.role || ROLES.USER;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    return userPermissions.includes(permission);
  }, [state.user, state.isAuthenticated]);

  // 다중 권한 확인
  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // 역할 확인
  const hasRole = useCallback((role) => {
    if (!state.user || !state.isAuthenticated) return false;
    return state.user.role === role;
  }, [state.user, state.isAuthenticated]);

  // 비밀번호 정책 검증
  const validatePassword = useCallback((password) => {
    const errors = [];
    
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`비밀번호는 최소 ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`);
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('대문자를 포함해야 합니다.');
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBER && !/\d/.test(password)) {
      errors.push('숫자를 포함해야 합니다.');
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('특수문자를 포함해야 합니다.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // 계정 잠금 상태 확인
  const checkAccountLock = useCallback(() => {
    if (!state.isLocked || !state.lockoutEndTime) return false;
    
    if (Date.now() > state.lockoutEndTime) {
      dispatch({ type: ActionTypes.RESET_LOGIN_ATTEMPTS });
      return false;
    }
    
    return true;
  }, [state.isLocked, state.lockoutEndTime]);

  // 세션 만료 확인
  const checkSessionExpiry = useCallback(() => {
    if (!state.sessionExpiry || !state.isAuthenticated) return false;
    
    return Date.now() > state.sessionExpiry;
  }, [state.sessionExpiry, state.isAuthenticated]);

  // 세션 갱신
  const refreshSession = useCallback(() => {
    if (state.isAuthenticated) {
      dispatch({ type: ActionTypes.REFRESH_SESSION });
    }
  }, [state.isAuthenticated]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        const storedExpiry = localStorage.getItem('sessionExpiry');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // 초기 관리자 사용자 생성 (사용자가 없는 경우)
        if (users.length === 0) {
          const initialAdmin = {
            id: 'admin',
            name: '시스템 관리자',
            email: 'admin@company.com',
            password: 'admin123',
            role: ROLES.ADMIN,
            team: '관리팀',
            status: 'approved',
            isLocked: false,
            loginAttempts: 0,
            lastLogin: null,
            createdAt: new Date().toISOString(),
            registeredAt: new Date().toISOString(),
            permissions: ROLE_PERMISSIONS[ROLES.ADMIN]
          };
          
          users.push(initialAdmin);
          localStorage.setItem('users', JSON.stringify(users));
          console.log('🔧 초기 관리자 계정이 생성되었습니다: admin / admin123');
        }
        
        if (storedUser && storedExpiry) {
          const user = JSON.parse(storedUser);
          const sessionExpiry = parseInt(storedExpiry);
          
          // 세션이 만료되었는지 확인
          if (Date.now() > sessionExpiry) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionExpiry');
            logActivity('SYSTEM', 'SESSION_EXPIRED', `세션 만료: ${user.id}`);
            dispatch({ type: ActionTypes.SET_LOADING, payload: false });
            return;
          }
          
          // 사용자가 여전히 승인된 상태인지 확인
          const currentUser = users.find(u => u.id === user.id && u.status === 'approved');
          
          if (currentUser) {
            dispatch({
              type: ActionTypes.LOGIN_SUCCESS,
              payload: { 
                user: currentUser,
                sessionExpiry: sessionExpiry
              }
            });
          } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionExpiry');
            dispatch({ type: ActionTypes.SET_LOADING, payload: false });
          }
        } else {
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // 세션 만료 자동 체크
  useEffect(() => {
    let sessionCheckInterval;
    
    if (state.isAuthenticated) {
      sessionCheckInterval = setInterval(() => {
        if (checkSessionExpiry()) {
          logActivity(state.user?.id, 'SESSION_EXPIRED', '세션 자동 만료');
          dispatch({ type: ActionTypes.LOGOUT });
        }
      }, 60000); // 1분마다 체크
    }
    
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [state.isAuthenticated, state.user?.id, checkSessionExpiry]);

  // 로그인 함수
  const login = useCallback(async (userId, password, rememberMe = false) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    dispatch({ type: ActionTypes.SET_ERROR, payload: null });

    try {
      // 계정 잠금 상태 확인
      if (checkAccountLock()) {
        const remainingTime = Math.ceil((state.lockoutEndTime - Date.now()) / 60000);
        throw new Error(`계정이 잠겨있습니다. ${remainingTime}분 후에 다시 시도해주세요.`);
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.id === userId);

      if (!user) {
        dispatch({ type: ActionTypes.INCREMENT_LOGIN_ATTEMPT });
        logActivity('UNKNOWN', 'LOGIN_FAILED', `존재하지 않는 사용자: ${userId}`);
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      if (user.status !== 'approved') {
        logActivity(userId, 'LOGIN_FAILED', '승인되지 않은 계정으로 로그인 시도');
        throw new Error('승인되지 않은 계정입니다. 관리자에게 문의하세요.');
      }

      if (user.isLocked) {
        logActivity(userId, 'LOGIN_FAILED', '잠긴 계정으로 로그인 시도');
        throw new Error('계정이 비활성화되었습니다. 관리자에게 문의하세요.');
      }

      if (user.password !== password) {
        dispatch({ type: ActionTypes.INCREMENT_LOGIN_ATTEMPT });
        logActivity(userId, 'LOGIN_FAILED', '잘못된 비밀번호');
        throw new Error('비밀번호가 올바르지 않습니다.');
      }

      // 000000 비밀번호 사용 시 비밀번호 변경 강제
      const mustChangePassword = user.password === '000000' || user.mustChangePassword;
      
      // 로그인 성공
      const sessionExpiry = Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT;
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString(),
        loginCount: (user.loginCount || 0) + 1,
        mustChangePassword: mustChangePassword
      };

      // 사용자 정보 업데이트
      const userIndex = users.findIndex(u => u.id === userId);
      users[userIndex] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('sessionExpiry', sessionExpiry.toString());
      
      logActivity(userId, 'LOGIN_SUCCESS', '사용자 로그인 성공');

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { 
          user: updatedUser,
          sessionExpiry: sessionExpiry
        }
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  }, [checkAccountLock, state.lockoutEndTime]);

  // 로그아웃 함수
  const logout = useCallback(() => {
    if (state.user) {
      logActivity(state.user.id, 'LOGOUT', '사용자 로그아웃');
    }
    dispatch({ type: ActionTypes.LOGOUT });
  }, [state.user]);

  // 회원가입 함수
  const register = useCallback(async (userData) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 중복 체크
      if (users.find(u => u.id === userData.id)) {
        throw new Error('이미 존재하는 사번입니다.');
      }

      if (users.find(u => u.email === userData.email)) {
        throw new Error('이미 존재하는 이메일입니다.');
      }

      // 비밀번호 검증
      const passwordValidation = validatePassword(userData.password || '000000');
      if (!passwordValidation.isValid && userData.password) {
        throw new Error(passwordValidation.errors.join(' '));
      }

      const newUser = {
        ...userData,
        password: userData.password || '000000',
        role: userData.role || ROLES.USER,
        status: 'pending',
        createdAt: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0,
        isLocked: false,
        mustChangePassword: userData.password === '000000',
        permissions: ROLE_PERMISSIONS[userData.role || ROLES.USER] || []
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      logActivity('SYSTEM', 'REGISTER_REQUEST', `회원가입 요청: ${userData.id} (${userData.name})`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [validatePassword]);

  // 비밀번호 변경
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!state.user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === state.user.id);

      if (userIndex === -1) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      if (users[userIndex].password !== currentPassword) {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(' '));
      }

      users[userIndex].password = newPassword;
      users[userIndex].passwordChangedAt = new Date().toISOString();
      localStorage.setItem('users', JSON.stringify(users));

      const updatedUser = users[userIndex];
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      dispatch({ type: ActionTypes.UPDATE_USER, payload: updatedUser });
      logActivity(state.user.id, 'PASSWORD_CHANGED', '비밀번호 변경');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [state.user, validatePassword]);

  // 비밀번호 초기화
  const resetPassword = useCallback(async (userId, email) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId && u.email === email);

      if (userIndex === -1) {
        throw new Error('사번과 이메일이 일치하는 사용자를 찾을 수 없습니다.');
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      users[userIndex].password = tempPassword;
      users[userIndex].passwordResetAt = new Date().toISOString();
      users[userIndex].mustChangePassword = true;
      
      localStorage.setItem('users', JSON.stringify(users));

      logActivity('SYSTEM', 'PASSWORD_RESET', `비밀번호 초기화: ${userId}`);

      return { success: true, tempPassword };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // 계정 잠금/해제
  const toggleAccountLock = useCallback(async (userId, shouldLock) => {
    if (!hasPermission(PERMISSIONS.USER_UPDATE)) {
      return { success: false, error: '권한이 없습니다.' };
    }

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      users[userIndex].isLocked = shouldLock;
      users[userIndex].lockedAt = shouldLock ? new Date().toISOString() : null;
      users[userIndex].lockedBy = shouldLock ? state.user?.id : null;

      localStorage.setItem('users', JSON.stringify(users));

      logActivity(
        state.user?.id,
        shouldLock ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED',
        `계정 ${shouldLock ? '잠금' : '해제'}: ${userId}`
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [hasPermission, state.user?.id]);

  // 메모이즈된 값들
  const contextValue = useMemo(() => ({
    ...state,
    // 인증 관련
    login,
    logout,
    register,
    changePassword,
    resetPassword,
    
    // 권한 관련
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    
    // 보안 관련
    validatePassword,
    checkAccountLock,
    checkSessionExpiry,
    refreshSession,
    toggleAccountLock,
    
    // 상수
    ROLES,
    PERMISSIONS,
    SECURITY_CONFIG
  }), [
    state,
    login,
    logout,
    register,
    changePassword,
    resetPassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    validatePassword,
    checkAccountLock,
    checkSessionExpiry,
    refreshSession,
    toggleAccountLock
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 향상된 활동 로그 기록 함수
const logActivity = (userId, action, description, metadata = {}) => {
  try {
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    const newLog = {
      id: Date.now().toString(),
      userId,
      action,
      description,
      timestamp: new Date().toISOString(),
      ip: 'localhost',
      userAgent: navigator.userAgent,
      sessionId: localStorage.getItem('sessionId') || 'unknown',
      metadata,
      severity: getSeverityLevel(action)
    };

    activityLogs.push(newLog);
    
    // 최대 5000개의 로그만 보관
    if (activityLogs.length > 5000) {
      activityLogs.splice(0, activityLogs.length - 5000);
    }
    
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
  } catch (error) {
    console.error('Activity log error:', error);
  }
};

// 액션별 심각도 레벨
const getSeverityLevel = (action) => {
  const highSeverity = ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'PERMISSION_DENIED', 'DATA_DELETION'];
  const mediumSeverity = ['LOGIN_SUCCESS', 'LOGOUT', 'PASSWORD_CHANGED', 'USER_CREATED'];
  
  if (highSeverity.includes(action)) return 'HIGH';
  if (mediumSeverity.includes(action)) return 'MEDIUM';
  return 'LOW';
};

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider_v11');
  }
  return context;
};

export default useAuth;