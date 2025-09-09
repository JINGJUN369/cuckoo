import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { Button, Input } from '../../components/ui';

const ResetPasswordPage = ({ onBackToLogin }) => {
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 사번 검증
    if (!formData.userId.trim()) {
      newErrors.userId = '사번은 필수입니다';
    }

    // 이메일 검증 (쿠쿠 이메일)
    if (!formData.email.trim()) {
      newErrors.email = '이메일은 필수입니다';
    } else if (!formData.email.includes('@cuckoo.co.kr')) {
      newErrors.email = '쿠쿠 이메일 주소를 입력해주세요 (@cuckoo.co.kr)';
    } else if (!/^[^\s@]+@cuckoo\.co\.kr$/.test(formData.email)) {
      newErrors.email = '올바른 쿠쿠 이메일 형식이 아닙니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(formData.userId, formData.email);
      
      if (result.success) {
        // 성공 팝업
        alert('비밀번호가 초기화되었습니다.\n초기화된 비밀번호는 관리자에게 문의하세요.');
        onBackToLogin();
      } else {
        alert(`비밀번호 초기화 실패: ${result.error}`);
      }
    } catch (error) {
      alert('비밀번호 초기화 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center bg-orange-100 rounded-full">
            <span className="text-3xl">🔑</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            비밀번호 초기화
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            가입 시 사용한 사번과 이메일을 입력하세요
          </p>
        </div>

        {/* 초기화 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="사번"
              type="text"
              value={formData.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              placeholder="가입 시 사용한 사번을 입력하세요"
              error={errors.userId}
              required
            />

            <Input
              label="쿠쿠 이메일"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="가입 시 사용한 이메일을 입력하세요"
              error={errors.email}
              required
            />
          </div>

          {/* 안내 사항 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400">💡</span>
              </div>
              <div className="ml-2">
                <h4 className="text-sm font-medium text-blue-800">
                  비밀번호 초기화 안내
                </h4>
                <div className="mt-1 text-sm text-blue-700">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>가입 시 입력한 사번과 이메일이 일치해야 합니다</li>
                    <li>비밀번호가 000000으로 초기화됩니다</li>
                    <li>로그인 후 비밀번호를 변경하시기 바랍니다</li>
                    <li>문제가 있는 경우 관리자에게 문의하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex flex-col space-y-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? '초기화 중...' : '비밀번호 초기화'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToLogin}
            >
              로그인 화면으로 돌아가기
            </Button>
          </div>

          {/* 추가 도움말 */}
          <div className="text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-gray-400">📞</span>
                </div>
                <div className="ml-2 text-left">
                  <h4 className="text-sm font-medium text-gray-800">
                    문의사항이 있으신가요?
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    시스템 관리자에게 직접 문의하시거나<br />
                    IT부서로 연락주시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;