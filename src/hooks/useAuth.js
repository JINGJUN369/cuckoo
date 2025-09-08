import React, { createContext, useContext, useReducer, useEffect } from 'react';

// 액션 타입들
const ActionTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS'
};

// 초기 상태
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// 리듀서 함수
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case ActionTypes.LOGOUT:
      // 로컬 스토리지에서 인증 정보 제거
      localStorage.removeItem('currentUser');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
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

    default:
      return state;
  }
};

// 컨텍스트 생성
const AuthContext = createContext();

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 확인
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // 기본 사용자들이 없다면 생성
        if (users.length === 0) {
          const defaultUsers = [
            {
              id: 'admin',
              name: '시스템 관리자',
              email: 'admin@company.com',
              password: 'admin123',
              role: 'admin',
              team: '관리팀',
              status: 'approved',
              createdAt: new Date().toISOString()
            },
            {
              id: 'user',
              name: '일반 사용자',
              email: 'user@company.com',
              password: 'user123',
              role: 'user',
              team: '일반팀',
              status: 'approved',
              createdAt: new Date().toISOString()
            }
          ];
          
          users = defaultUsers;
          localStorage.setItem('users', JSON.stringify(users));
          console.log('🔧 [v1.2] 기본 사용자 계정이 생성되었습니다:', users.map(u => `${u.id}/${u.password}`).join(', '));
        }
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // 사용자가 여전히 승인된 상태인지 확인
          const currentUser = users.find(u => u.id === user.id && u.status === 'approved');
          
          if (currentUser) {
            dispatch({
              type: ActionTypes.LOGIN_SUCCESS,
              payload: currentUser
            });
          } else {
            localStorage.removeItem('currentUser');
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

  // 로그인 함수
  const login = (userId, password) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    dispatch({ type: ActionTypes.SET_ERROR, payload: null });

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.id === userId);

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      if (user.status === 'pending') {
        throw new Error('계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.');
      }

      if (user.status === 'inactive') {
        throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
      }

      if (user.status !== 'approved') {
        throw new Error('승인되지 않은 계정입니다.');
      }

      if (user.password !== password) {
        throw new Error('비밀번호가 올바르지 않습니다.');
      }

      // 로그인 성공
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // 활동 로그 기록
      logActivity(user.id, 'LOGIN', '사용자 로그인');

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: user
      });

      return { 
        success: true, 
        user: user,
        mustChangePassword: user.password === '000000' || user.mustChangePassword === true
      };
    } catch (error) {
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    if (state.user) {
      logActivity(state.user.id, 'LOGOUT', '사용자 로그아웃');
    }
    dispatch({ type: ActionTypes.LOGOUT });
  };

  // 회원가입 함수
  const register = (userData) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 이미 존재하는 사용자 체크
      if (users.find(u => u.id === userData.id)) {
        throw new Error('이미 존재하는 사번입니다.');
      }

      if (users.find(u => u.email === userData.email)) {
        throw new Error('이미 존재하는 이메일입니다.');
      }

      const newUser = {
        ...userData,
        password: '000000', // 기본 비밀번호
        status: 'pending', // 승인 대기
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // 활동 로그 기록
      logActivity('SYSTEM', 'REGISTER_REQUEST', `회원가입 요청: ${userData.id} (${userData.name})`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비밀번호 초기화 함수
  const resetPassword = (userId, email) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId && u.email === email);

      if (userIndex === -1) {
        throw new Error('사번과 이메일이 일치하는 사용자를 찾을 수 없습니다.');
      }

      users[userIndex].password = '000000';
      localStorage.setItem('users', JSON.stringify(users));

      // 활동 로그 기록
      logActivity('SYSTEM', 'PASSWORD_RESET', `비밀번호 초기화: ${userId}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 회원가입 함수 (v1.2용)
  const registerUser = (userData) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 이미 존재하는 사용자 체크
      if (users.find(u => u.id === userData.id)) {
        throw new Error('이미 존재하는 사번입니다.');
      }

      if (users.find(u => u.email === userData.email)) {
        throw new Error('이미 존재하는 이메일입니다.');
      }

      const newUser = {
        ...userData,
        password: '000000', // 초기 비밀번호
        role: 'user',
        status: 'pending', // 승인 대기
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // 활동 로그 기록
      logActivity('SYSTEM', 'REGISTER_REQUEST', `회원가입 요청: ${userData.id} (${userData.name})`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비밀번호 재설정 요청 함수
  const requestPasswordReset = (email) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email && u.status === 'approved');

      if (!user) {
        throw new Error('등록된 이메일을 찾을 수 없습니다.');
      }

      // 비밀번호 재설정 요청을 localStorage에 저장
      const resetRequests = JSON.parse(localStorage.getItem('passwordResetRequests') || '[]');
      const newRequest = {
        id: Date.now().toString(),
        userId: user.id,
        email: email,
        name: user.name,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };

      resetRequests.push(newRequest);
      localStorage.setItem('passwordResetRequests', JSON.stringify(resetRequests));

      // 활동 로그 기록
      logActivity('SYSTEM', 'PASSWORD_RESET_REQUEST', `비밀번호 재설정 요청: ${email}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 관리자의 비밀번호 재설정 처리
  const adminResetPassword = (userId) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      users[userIndex].password = '000000';
      localStorage.setItem('users', JSON.stringify(users));

      // 재설정 요청들도 처리 완료로 변경
      const resetRequests = JSON.parse(localStorage.getItem('passwordResetRequests') || '[]');
      const updatedRequests = resetRequests.map(req => 
        req.userId === userId ? { ...req, status: 'completed', completedAt: new Date().toISOString() } : req
      );
      localStorage.setItem('passwordResetRequests', JSON.stringify(updatedRequests));

      // 활동 로그 기록
      logActivity(state.user?.id || 'ADMIN', 'PASSWORD_RESET_ADMIN', `관리자 비밀번호 초기화: ${userId}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비밀번호 변경 함수
  const changePassword = (currentPassword, newPassword) => {
    try {
      if (!state.user) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === state.user.id);

      if (userIndex === -1) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const currentUser = users[userIndex];
      
      if (currentUser.password !== currentPassword) {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      }

      // 비밀번호 업데이트
      users[userIndex].password = newPassword;
      users[userIndex].mustChangePassword = false; // 비밀번호 변경 강제 해제
      users[userIndex].lastPasswordChange = new Date().toISOString();

      localStorage.setItem('users', JSON.stringify(users));
      
      // 현재 로그인된 사용자 정보도 업데이트
      const updatedUser = { ...users[userIndex] };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: updatedUser
      });

      // 활동 로그 기록
      logActivity(state.user.id, 'PASSWORD_CHANGED', '사용자 비밀번호 변경');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    resetPassword,
    registerUser,
    requestPasswordReset,
    adminResetPassword,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 활동 로그 기록 함수
const logActivity = (userId, action, description) => {
  try {
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    const newLog = {
      id: Date.now().toString(),
      userId,
      action,
      description,
      timestamp: new Date().toISOString(),
      ip: 'localhost', // 실제 환경에서는 실제 IP를 가져올 수 있음
      userAgent: navigator.userAgent
    };

    activityLogs.push(newLog);
    
    // 최대 1000개의 로그만 보관 (성능 고려)
    if (activityLogs.length > 1000) {
      activityLogs.splice(0, activityLogs.length - 1000);
    }
    
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
  } catch (error) {
    console.error('Activity log error:', error);
  }
};

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;