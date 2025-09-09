import React, { useState } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import PasswordChangeModal from './PasswordChangeModal';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useSupabaseAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    team: profile?.team || '',
    email: profile?.email || user?.email || ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.team.trim()) {
      newErrors.team = '팀을 입력해주세요.';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    
    return newErrors;
  };

  const handleSaveProfile = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Supabase를 통한 프로필 정보 업데이트
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          team: formData.team,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
        
      setIsEditing(false);
      setErrors({});
      
      // 성공 메시지
      alert('프로필이 성공적으로 업데이트되었습니다.');
      
      // 프로필 다시 로드를 위해 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setErrors({ submit: '프로필 업데이트에 실패했습니다.' });
    }

    setIsLoading(false);
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      team: profile?.team || '',
      email: profile?.email || user?.email || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">내 프로필</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 프로필 아바타 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{profile?.name || '사용자'}</h3>
              <p className="text-sm text-gray-600">{profile?.team || '팀 없음'}</p>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사번
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  {profile?.id || user?.id}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="이름을 입력하세요"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {profile?.name}
                  </div>
                )}
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => handleInputChange('team', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.team ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="팀을 입력하세요"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {profile?.team}
                  </div>
                )}
                {errors.team && (
                  <p className="text-sm text-red-600 mt-1">{errors.team}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="이메일을 입력하세요"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {profile?.email || user?.email}
                  </div>
                )}
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가입일
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  {formatDate(profile?.registered_at || profile?.created_at)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  권한
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  {profile?.role === 'admin' ? '관리자' : 
                   profile?.role === 'manager' ? '매니저' : 
                   profile?.role === 'user' ? '일반 사용자' : '뷰어'}
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* 버튼 영역 */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  프로필 수정
                </button>
              )}

              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                비밀번호 변경
              </button>

              <button
                onClick={signOut}
                className="w-full bg-red-50 text-red-700 py-2 px-4 rounded-lg hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isRequired={false}
      />
    </>
  );
};

export default ProfileModal;