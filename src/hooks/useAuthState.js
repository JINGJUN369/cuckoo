import { useState, useEffect, useCallback } from 'react';

const useAuthState = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedLoginState = localStorage.getItem('loginState');
    if (savedLoginState) {
      const { isLoggedIn: saved, loginTime } = JSON.parse(savedLoginState);
      const oneHour = 60 * 60 * 1000;
      if (saved && Date.now() - loginTime < oneHour) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('loginState');
      }
    }
    
    const savedLockout = localStorage.getItem('lockoutUntil');
    if (savedLockout) {
      const lockoutTime = parseInt(savedLockout);
      if (Date.now() < lockoutTime) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('lockoutUntil');
      }
    }
  }, []);

  const login = useCallback((id, password) => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 60000);
      alert(`로그인이 ${remainingTime}분 동안 차단되었습니다.`);
      return false;
    }

    if (id === '22022225' && password === 'rhrorakswhrxla11!') {
      setIsLoggedIn(true);
      setLoginAttempts(0);
      localStorage.setItem('loginState', JSON.stringify({
        isLoggedIn: true,
        loginTime: Date.now()
      }));
      return true;
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + (30 * 60 * 1000);
        setLockoutUntil(lockoutTime);
        localStorage.setItem('lockoutUntil', lockoutTime.toString());
        alert('로그인 시도 횟수가 초과되었습니다. 30분 후에 다시 시도해주세요.');
      } else {
        alert(`로그인 실패. 남은 시도 횟수: ${5 - newAttempts}`);
      }
      return false;
    }
  }, [lockoutUntil, loginAttempts]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('loginState');
  }, []);

  return {
    isLoggedIn,
    loginAttempts,
    lockoutUntil,
    login,
    logout
  };
};

export default useAuthState;