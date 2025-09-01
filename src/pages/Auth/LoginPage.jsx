import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { BrandHeader } from '../../components/ui';
import { colors } from '../../styles/design-tokens';

const LoginPage = ({ onRegisterClick, onResetPasswordClick }) => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId.trim()) {
      setLoginError('사번을 입력해주세요.');
      return;
    }
    
    if (!formData.password.trim()) {
      setLoginError('비밀번호를 입력해주세요.');
      return;
    }

    const result = await login(formData.userId, formData.password);
    
    if (!result.success) {
      setLoginError(result.error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 브랜딩 */}
      <BrandHeader showNav={false} />
      
      {/* 로그인 폼 */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
              <p className="text-sm text-gray-600 mt-2">
                제품 진척률 관리 시스템에 접속하세요
              </p>
            </div>

            {/* 폼 필드들 - 노션 스타일 */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사번
                  </label>
                  <input 
                    type="text"
                    value={formData.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="사번을 입력하세요"
                    required
                    autoComplete="username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <input 
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="비밀번호를 입력하세요"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {(loginError || error) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">
                        {loginError || error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
              
              <div className="flex flex-col space-y-3">
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="w-full bg-white text-gray-700 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  회원가입
                </button>
                
                <button
                  type="button"
                  onClick={onResetPasswordClick}
                  className="w-full text-gray-600 py-3 font-medium hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all"
                >
                  비밀번호 초기화
                </button>
              </div>
            </form>

            {/* 도움말 */}
            <div className="mt-8 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">💡</span>
                  </div>
                  <div className="ml-3 text-left">
                    <h4 className="text-sm font-medium text-blue-800">
                      처음 사용하시나요?
                    </h4>
                    <div className="mt-1 text-sm text-blue-700">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>회원가입을 통해 계정을 신청하세요</li>
                        <li>관리자 승인 후 로그인이 가능합니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;