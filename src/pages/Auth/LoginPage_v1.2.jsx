import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { Button, Input, LoadingSpinner } from '../../components/ui';
import Footer from '../../components/ui/Footer_v1.1';

/**
 * LoginPage v1.2 - URL 기반 라우팅을 지원하는 로그인 페이지
 * 
 * 주요 변경사항:
 * - React Router를 사용한 네비게이션
 * - 로그인 후 원래 페이지로 리다이렉트
 * - URL 상태 관리
 */
const LoginPage_v1_2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, loading, profile } = useSupabaseAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('🔐 [v1.2] LoginPage rendered');

  // 이미 인증된 경우 역할에 따라 리다이렉트 (한 번만 실행)
  useEffect(() => {
    if (isAuthenticated && profile && !loading) {
      const from = location.state?.from?.pathname;
      if (from) {
        // 특정 페이지에서 왔으면 그곳으로
        console.log('✅ [v1.2] User authenticated, redirecting to:', from);
        navigate(from, { replace: true });
      } else {
        // 처음 로그인인 경우 역할에 따라 리디렉트
        const isAdmin = profile?.role === 'admin';
        const redirectPath = isAdmin ? '/admin/dashboard' : '/dashboard';
        console.log('🚀 [v1.2] Redirecting based on role:', isAdmin ? 'admin' : 'user', 'to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, profile, loading, navigate, location.state?.from?.pathname]);

  // 입력값 변경 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 로그인 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('📤 [v1.2] Attempting login for:', formData.email);
      
      const result = await signIn(formData.email, formData.password);

      if (result.error) {
        console.error('❌ [v1.2] Login failed:', result.error.message);
        setErrors({ submit: result.error.message });
      } else {
        console.log('✅ [v1.2] Login successful', result.data?.user);
        
        // 로그인 성공 시 잠시 대기 후 리디렉트 (상태 업데이트 시간 확보)
        alert('로그인 성공!');
        
        // 상태 업데이트를 위한 짧은 지연 후 리디렉트
        setTimeout(() => {
          const userData = result.data?.user;
          const isAdmin = userData?.role === 'admin';
          const redirectPath = isAdmin ? '/admin/dashboard' : '/dashboard';
          console.log('🚀 [v1.2] Redirecting to:', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('❌ [v1.2] Login error:', error);
      setErrors({ submit: error.message || '로그인 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  // 인증 상태를 확인하는 동안만 로딩 표시
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  // 이미 인증된 사용자는 로딩 없이 바로 리디렉트
  if (isAuthenticated && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">대시보드로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            쿠쿠 프로젝트 관리 시스템
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            이메일과 비밀번호로 로그인하세요
          </p>
          
          {/* 원래 페이지 정보 표시 */}
          {location.state?.from && (
            <div className="mt-2 text-xs text-blue-600">
              로그인 후 {location.state.from.pathname}로 이동합니다
            </div>
          )}
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="이메일"
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="이메일을 입력하세요"
              error={errors.email}
              required
              disabled={isSubmitting}
            />

            <Input
              label="비밀번호"
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="비밀번호를 입력하세요"
              error={errors.password}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 옵션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <Link 
                to="/reset-password" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>

          {/* 제출 에러 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>

          {/* 계정 관련 링크들 */}
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register"
                className="text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                📝 회원가입
              </Link>
              
              <Link
                to="/reset-password"
                className="text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                🔑 비밀번호 재설정
              </Link>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link 
                to="/register" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                회원가입
              </Link>
            </span>
          </div>
        </form>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LoginPage_v1_2;