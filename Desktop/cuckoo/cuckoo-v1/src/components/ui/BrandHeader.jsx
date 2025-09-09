import React, { useState } from 'react';
// import { User, LogOut, Settings } from 'lucide-react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import ProfileModal from './ProfileModal';
// import OnlineUsersIndicator from './OnlineUsersIndicator';

const BrandHeader = ({ showNav = true, currentPage, setCurrentPage, onToggleOnlineUsers }) => {
  const { user, profile, signOut } = useSupabaseAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // 디버깅: 사용자 정보 확인
  console.log('BrandHeader - user:', user);
  console.log('BrandHeader - profile:', profile);
  console.log('BrandHeader - profile.role:', profile?.role);
  console.log('BrandHeader - isAdmin?:', profile?.role === 'admin');

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* 브랜드 로고 */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">쿠쿠</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">고객만족팀</h1>
              <p className="text-sm text-gray-500">제품 진척률 관리 시스템</p>
            </div>
          </div>
          
          {/* 네비게이션 및 사용자 메뉴 */}
          {showNav && user && (
            <div className="flex items-center space-x-6">
              {/* 네비게이션 메뉴 */}
              <nav className="flex items-center space-x-6">
                <button 
                  onClick={() => setCurrentPage && setCurrentPage('projects')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'projects'
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  📊 프로젝트
                </button>
                {profile?.role === 'admin' && (
                  <button 
                    onClick={() => setCurrentPage && setCurrentPage('admin')}
                    className={`text-sm font-medium transition-colors ${
                      currentPage === 'admin'
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    👥 관리자
                  </button>
                )}
              </nav>
              
              {/* 온라인 사용자 표시기 - v1.1에서는 임시 비활성화 */}
              {/* <OnlineUsersIndicator onToggleDetails={onToggleOnlineUsers} /> */}
              
              {/* 사용자 메뉴 */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 text-sm">
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center space-x-2 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                      👤
                    </span>
                    <span className="text-gray-700 font-medium">{profile?.name || user?.email}</span>
                    <span className="text-gray-500">({profile?.team})</span>
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    <button className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-sm">
                      ⚙️ 설정
                    </button>
                    <button 
                      onClick={() => {
                        console.log('로그아웃 버튼 클릭됨', user);
                        signOut();
                      }}
                      className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-sm"
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default BrandHeader;