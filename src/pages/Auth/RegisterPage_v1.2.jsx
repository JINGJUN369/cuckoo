import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { Button, Input } from '../../components/ui';
import Footer from '../../components/ui/Footer_v1.1';

/**
 * RegisterPage v1.2 - localStorage 기반 회원가입 페이지
 * 
 * 주요 기능:
 * - 사번, 이메일, 이름, 팀명 입력
 * - 쿠쿠 이메일 도메인 검증
 * - 관리자 승인 대기 시스템
 * - 초기 비밀번호 000000 설정
 */
const RegisterPage_v1_2 = () => {
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    team: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('📝 [v1.2] RegisterPage rendered');

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

    // 이메일 검증
    if (!formData.email.trim()) {
      newErrors.email = '이메일은 필수입니다';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름은 필수입니다';
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 2자 이상이어야 합니다';
    }

    // 팀명 검증
    if (!formData.team.trim()) {
      newErrors.team = '팀명은 필수입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('📤 [v1.2] Attempting registration for:', formData.email);
      
      const result = await signUp(formData.email, formData.password, formData.name, formData.team);

      if (result.error) {
        console.error('❌ [v1.2] Registration failed:', result.error.message);
        setErrors({ submit: result.error.message });
      } else {
        console.log('✅ [v1.2] Registration successful');
        
        // 승인 대기 메시지 표시
        if (result.needsApproval) {
          alert(result.message || '회원가입이 완료되었습니다.\n관리자 승인을 기다려주세요.');
        } else {
          alert('회원가입이 완료되었습니다.');
        }
        
        // 로그인 페이지로 이동
        navigate('/login');
      }
    } catch (error) {
      console.error('❌ [v1.2] Registration error:', error);
      setErrors({ submit: error.message || '회원가입 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 헤더 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              회원가입
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              계정 정보를 입력하여 가입 신청하세요
            </p>
          </div>

          {/* 회원가입 폼 */}
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
                label="이름"
                id="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="실명을 입력하세요"
                error={errors.name}
                required
                disabled={isSubmitting}
              />

              <Input
                label="팀명"
                id="team"
                type="text"
                value={formData.team}
                onChange={(e) => handleInputChange('team', e.target.value)}
                placeholder="소속 팀명을 입력하세요"
                error={errors.team}
                required
                disabled={isSubmitting}
              />

              <Input
                label="비밀번호"
                id="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="6자 이상 비밀번호"
                error={errors.password}
                required
                disabled={isSubmitting}
              />

              <Input
                label="비밀번호 확인"
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                error={errors.confirmPassword}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* 안내 사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-yellow-800">
                    가입 안내사항
                  </h4>
                  <div className="mt-1 text-sm text-yellow-700">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>이메일 인증을 완료해주세요</li>
                      <li>비밀번호는 6자 이상으로 설정해주세요</li>
                      <li>가입 후 바로 로그인이 가능합니다</li>
                      <li>프로필 설정은 로그인 후 진행해주세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 제출 에러 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '가입 신청 중...' : '가입 신청'}
              </Button>
              
              <Link
                to="/login"
                className="w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                로그인 화면으로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RegisterPage_v1_2;