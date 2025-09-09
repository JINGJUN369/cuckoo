import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { Button, Input } from '../../components/ui';
import Footer from '../../components/ui/Footer_v1.1';

/**
 * PasswordResetPage v1.2 - 비밀번호 재설정 페이지
 * 
 * 주요 기능:
 * - 이메일 주소로 초기화 요청
 * - 관리자에게 초기화 요청 전달
 * - 초기화 완료 시 000000으로 재설정
 */
const PasswordResetPage_v1_2 = () => {
  const navigate = useNavigate();
  const { requestPasswordReset } = useSupabaseAuth();
  
  const [formData, setFormData] = useState({
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  console.log('🔑 [v1.2] PasswordResetPage rendered');

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
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 비밀번호 재설정 요청 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('📤 [v1.2] Requesting password reset for:', formData.email);
      
      const result = await requestPasswordReset(formData.email);

      if (result.success) {
        console.log('✅ [v1.2] Password reset request successful');
        setIsSuccess(true);
        
        // 성공 팝업
        alert('비밀번호 재설정 이메일이 전송되었습니다.\n이메일을 확인하여 비밀번호를 재설정해주세요.');
        
      } else {
        console.error('❌ [v1.2] Password reset request failed:', result.error);
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('❌ [v1.2] Password reset error:', error);
      setErrors({ submit: error.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 성공 화면
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* 성공 헤더 */}
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                초기화 요청 완료
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                비밀번호 초기화 요청이 관리자에게 전달되었습니다
              </p>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400">📧</span>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-green-800">
                    처리 안내
                  </h4>
                  <div className="mt-1 text-sm text-green-700">
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>{formData.email}</strong>로 요청되었습니다</li>
                      <li>관리자가 확인 후 비밀번호를 초기화합니다</li>
                      <li>초기화된 비밀번호는 <strong>000000</strong>입니다</li>
                      <li>처리까지 1-2시간 소요될 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex flex-col space-y-3">
              <Link
                to="/login"
                className="w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                로그인 화면으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 헤더 */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔑</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              비밀번호 재설정
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              가입시 입력한 이메일 주소를 입력하세요
            </p>
          </div>

          {/* 비밀번호 재설정 폼 */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="이메일 주소"
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="이름@cuckoo.co.kr"
                error={errors.email}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* 안내 사항 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-400">ℹ️</span>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-blue-800">
                    초기화 안내사항
                  </h4>
                  <div className="mt-1 text-sm text-blue-700">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>가입시 등록한 이메일 주소를 정확히 입력해주세요</li>
                      <li>관리자가 확인 후 비밀번호를 초기화합니다</li>
                      <li>초기화된 비밀번호는 000000입니다</li>
                      <li>로그인 후 반드시 비밀번호를 변경하세요</li>
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
                {isSubmitting ? '요청 중...' : '초기화 요청'}
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

export default PasswordResetPage_v1_2;