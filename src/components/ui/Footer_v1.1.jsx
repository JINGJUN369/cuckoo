import React from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

const Footer = () => {
  console.log("🦶 FOOTER IS RENDERING!");
  const { user, profile, isAuthenticated } = useSupabaseAuth();
  
  const currentYear = new Date().getFullYear();
  const version = "2.0.0";
  const buildDate = "2025-01-09";
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* 왼쪽: 브랜드 및 저작권 정보 */}
          <div className="flex flex-col items-center md:items-start space-y-1">
            <div className="flex items-center text-gray-700">
              <span className="text-lg font-bold text-indigo-600 mr-2">🍚 쿠쿠</span>
              <span className="text-sm font-medium">제품 진행 관리 시스템</span>
            </div>
            <div className="text-xs text-gray-500">
              © {currentYear} Cuckoo Homesys Co., Ltd. All rights reserved.
            </div>
            <div className="text-xs text-gray-400 mt-1">
              작성자: 고객만족팀 정준
            </div>
          </div>

          {/* 가운데: 버전 정보 */}
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                v{version}
              </span>
              <span>빌드: {buildDate}</span>
            </div>
            {isAuthenticated && (
              <div className="text-xs text-gray-400">
                사용자: {profile?.name || user?.email} ({profile?.role || 'user'})
              </div>
            )}
          </div>

          {/* 오른쪽: 시스템 상태 및 링크 */}
          <div className="flex flex-col items-center md:items-end space-y-1">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                <span>시스템 정상</span>
              </div>
              {isAuthenticated && (
                <div className="text-gray-500">
                  마지막 접속: {new Date().toLocaleTimeString('ko-KR')}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-400">
              <a href="#" className="hover:text-indigo-600 transition-colors">
                도움말
              </a>
              <span>•</span>
              <a href="#" className="hover:text-indigo-600 transition-colors">
                개인정보 정책
              </a>
              <span>•</span>
              <a href="#" className="hover:text-indigo-600 transition-colors">
                서비스 약관
              </a>
            </div>
          </div>
        </div>

        {/* 개발 환경에서만 표시되는 추가 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap justify-center items-center space-x-6 text-xs text-gray-400">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                개발 모드
              </div>
              <div>React {React.version}</div>
              <div>포트: {window.location.port}</div>
              <div>환경: {process.env.NODE_ENV}</div>
              {isAuthenticated && (
                <div>세션 ID: {user?.id?.slice(-8)}</div>
              )}
              {isAuthenticated && profile?.name && (
                <div>사용자: {profile.name}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;