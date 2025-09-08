import React, { useState } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * PasswordChangeModal v1.2 - localStorage 기반 비밀번호 변경 모달
 * 
 * 주요 기능:
 * - 현재 비밀번호 확인
 * - 새 비밀번호 유효성 검사
 * - 필수/선택 변경 모드 지원
 * - mustChangePassword 플래그 해제
 */
const PasswordChangeModal_v1_2 = ({ isOpen, onClose, isRequired = false, onSuccess }) => {
  const { profile, updatePassword } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  console.log('🔐 [v1.2] PasswordChangeModal rendered - required:', isRequired);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
    }
    
    if (formData.newPassword === '000000') {
      newErrors.newPassword = '초기 비밀번호(000000)는 사용할 수 없습니다.';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('📤 [v1.2] Attempting password change for:', profile?.id);
      
      const result = await updatePassword(formData.newPassword);
      
      if (result.success) {
        console.log('✅ [v1.2] Password changed successfully');
        
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        if (onSuccess) {
          onSuccess();
        } else {
          alert('비밀번호가 성공적으로 변경되었습니다.');
          onClose();
        }
      } else {
        console.error('❌ [v1.2] Password change failed:', result.error);
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('❌ [v1.2] Password change error:', error);
      setErrors({ submit: error.message || '비밀번호 변경 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isRequired) {
      alert('보안을 위해 초기 비밀번호를 변경해야 합니다.\n변경하지 않으면 시스템을 이용할 수 없습니다.');
      return; // 필수 변경 모드에서는 닫기 불가
    }
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">비밀번호 변경</h2>
            {isRequired && (
              <p className="text-sm text-red-600 mt-1">
                🔒 보안을 위해 초기 비밀번호를 변경해주세요.
              </p>
            )}
          </div>
          {!isRequired && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={isRequired ? "초기 비밀번호: 000000" : "현재 비밀번호를 입력하세요"}
              autoComplete="current-password"
              disabled={isLoading}
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.newPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="새 비밀번호를 입력하세요 (6자 이상)"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="새 비밀번호를 다시 입력하세요"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 안내 메시지 */}
          {isRequired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-yellow-800">안내사항</h4>
                  <div className="mt-1 text-sm text-yellow-700">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>초기 비밀번호는 000000입니다</li>
                      <li>보안을 위해 반드시 변경해주세요</li>
                      <li>비밀번호는 6자 이상이어야 합니다</li>
                      <li>초기 비밀번호와 같은 값은 사용할 수 없습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
            {!isRequired && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal_v1_2;