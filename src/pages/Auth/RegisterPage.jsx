import React, { useState } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { Button, Input } from '../../components/ui';

const RegisterPage = ({ onBackToLogin }) => {
  const { signUp, loading } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    team: ''
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
    if (!formData.id.trim()) {
      newErrors.id = '사번은 필수입니다';
    }

    // 이메일 검증 (쿠쿠 이메일)
    if (!formData.email.trim()) {
      newErrors.email = '이메일은 필수입니다';
    } else if (!formData.email.includes('@cuckoo.co.kr')) {
      newErrors.email = '쿠쿠 이메일 주소를 입력해주세요 (@cuckoo.co.kr)';
    } else if (!/^[^\s@]+@cuckoo\.co\.kr$/.test(formData.email)) {
      newErrors.email = '올바른 쿠쿠 이메일 형식이 아닙니다';
    }

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름은 필수입니다';
    }

    // 팀명 검증
    if (!formData.team.trim()) {
      newErrors.team = '팀명은 필수입니다';
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
      const result = await signUp(formData.email, formData.password, formData.name, formData.team);
      
      if (result.error) {
        alert(`회원가입 실패: ${result.error.message}`);
      } else {
        // 성공 팝업
        alert('회원가입 신청이 완료되었습니다.\n관리자 승인 후 이용 가능합니다.\n승인 대기중입니다.');
        onBackToLogin();
      }
    } catch (error) {
      alert('회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center bg-green-100 rounded-full">
            <span className="text-3xl">👥</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
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
              label="사번"
              type="text"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              placeholder="사번을 입력하세요"
              error={errors.id}
              required
            />

            <Input
              label="쿠쿠 이메일"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="이름@cuckoo.co.kr"
              error={errors.email}
              required
            />

            <Input
              label="이름"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="실명을 입력하세요"
              error={errors.name}
              required
            />

            <Input
              label="팀명"
              type="text"
              value={formData.team}
              onChange={(e) => handleInputChange('team', e.target.value)}
              placeholder="소속 팀명을 입력하세요"
              error={errors.team}
              required
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
                    <li>관리자 승인 후 계정이 활성화됩니다</li>
                    <li>초기 비밀번호는 000000으로 설정됩니다</li>
                    <li>쿠쿠 이메일 주소만 가입 가능합니다</li>
                    <li>가입 승인까지 1-2일 소요될 수 있습니다</li>
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
              {isSubmitting ? '가입 신청 중...' : '가입 신청'}
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
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;