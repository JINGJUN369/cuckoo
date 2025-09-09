// 사이드바용 온라인 사용자 패널
import React from 'react';
import OnlineUsersDisplay from './OnlineUsersDisplay';

/**
 * 사이드바용 온라인 사용자 패널
 * - 슬라이딩 사이드바로 표시
 * - 배경 오버레이와 함께
 * - 모바일 친화적
 */
export const OnlineUsersSidebar = ({ isOpen, onClose, scope = 'global' }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 사이드바 패널 */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">온라인 사용자</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 온라인 사용자 표시 */}
        <div className="h-full overflow-y-auto pb-20">
          <div className="p-4">
            <OnlineUsersDisplay 
              scope={scope}
              showLocation={true}
              showActivity={true}
              compact={false}
            />
          </div>

          {/* 추가 정보 섹션 */}
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">실시간 활동</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>실시간 동기화 활성화됨</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>프로젝트 변경사항 실시간 반영</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>의견 및 댓글 실시간 업데이트</span>
              </div>
            </div>
          </div>

          {/* 도움말 */}
          <div className="p-4 border-t border-gray-100 bg-blue-50">
            <h4 className="text-sm font-medium text-blue-900 mb-2">상태 아이콘 안내</h4>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex items-center space-x-2">
                <span>🟢</span>
                <span>온라인 - 활발히 활동 중</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🟡</span>
                <span>자리비움 - 5분간 활동 없음</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔴</span>
                <span>바쁨 - 방해받지 않으려 함</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>👀</span>
                <span>브라우징</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✏️</span>
                <span>편집 중</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💬</span>
                <span>댓글 작성 중</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnlineUsersSidebar;