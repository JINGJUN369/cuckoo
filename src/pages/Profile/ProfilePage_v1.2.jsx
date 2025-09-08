import React, { useState } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * ProfilePage v1.2 - 사용자 계정 정보 페이지
 * 
 * 주요 기능:
 * - 사용자 프로필 정보 표시
 * - 개인 정보 수정
 * - 비밀번호 변경
 * - 계정 설정 관리
 */
const ProfilePage_v1_2 = () => {
  const { user, profile, updateProfile } = useSupabaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile?.name || '',
    team: profile?.team || ''
  });

  console.log('👤 [v1.2] ProfilePage rendered:', { user, profile });

  const handleEdit = () => {
    setEditForm({
      name: profile?.name || '',
      team: profile?.team || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      alert('프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: profile?.name || '',
      team: profile?.team || ''
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'user':
        return '일반 사용자';
      default:
        return '사용자';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      case 'pending':
        return '승인 대기';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">계정 정보</h1>
        <p className="mt-2 text-gray-600">계정 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">프로필 정보</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="이름을 입력하세요"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    {profile?.name || '이름 없음'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {profile?.email || user?.email || '이메일 없음'}
                </div>
                <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀명
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.team}
                    onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="팀명을 입력하세요"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    {profile?.team || '팀명 없음'}
                  </div>
                )}
              </div>
            </div>

            {/* 계정 정보 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getRoleDisplayName(profile?.role)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계정 상태
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : profile?.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusDisplayName(profile?.status)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 ID
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono">
                  {profile?.id || user?.id || '알 수 없음'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가입일
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '알 수 없음'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between">
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    정보 수정
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-500">
                마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 보안 설정 */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">보안 설정</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">비밀번호 변경</h3>
                <p className="text-sm text-gray-500">계정 보안을 위해 정기적으로 비밀번호를 변경해주세요.</p>
              </div>
              <button
                onClick={() => alert('비밀번호 변경 기능은 추후 구현 예정입니다.')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage_v1_2;