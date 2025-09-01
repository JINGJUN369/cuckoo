import React from 'react';
// import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth_v1.1';

const BrandHeader = ({ showNav = true, currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();

  return (
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
              {(user.id === 'admin' || user.team === '관리팀') && (
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
            
            {/* 사용자 메뉴 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    👤
                  </span>
                  <span className="text-gray-700 font-medium">{user.name || user.id}</span>
                  <span className="text-gray-500">({user.team})</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-sm">
                    ⚙️ 설정
                  </button>
                  <button 
                    onClick={() => {
                      console.log('로그아웃 버튼 클릭됨', user);
                      logout();
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
  );
};

export default BrandHeader;