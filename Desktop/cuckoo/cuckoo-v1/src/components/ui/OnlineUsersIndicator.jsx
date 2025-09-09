// 헤더용 온라인 사용자 표시기 (미니 버전)
import React, { useState } from 'react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useHybridAuth } from '../../hooks/useHybridAuth';

/**
 * 헤더용 온라인 사용자 표시기
 * - 간단한 온라인 사용자 수 표시
 * - 호버 시 상세 정보 표시
 * - 클릭 시 전체 사용자 목록 토글
 */
export const OnlineUsersIndicator = ({ onToggleDetails }) => {
  const { user } = useHybridAuth();
  const {
    onlineUsers,
    totalOnlineCount,
    currentUserStatus,
    connectionStatus,
    isConnected,
    getUserCountByStatus
  } = useOnlineUsers('global');

  const [showTooltip, setShowTooltip] = useState(false);

  // 상태 아이콘 매핑
  const getStatusIcon = (status) => {
    const icons = {
      online: '🟢',
      away: '🟡',
      busy: '🔴',
      offline: '⚪'
    };
    return icons[status] || icons.offline;
  };

  // 연결 상태에 따른 표시
  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200">
        <span className="text-yellow-600">⚠️</span>
        <span className="text-sm text-yellow-700">연결 끊김</span>
      </div>
    );
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-blue-700">연결 중...</span>
      </div>
    );
  }

  const statusCounts = getUserCountByStatus();
  const currentStatusIcon = getStatusIcon(currentUserStatus.status);

  return (
    <div className="relative">
      {/* 메인 표시기 */}
      <button
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onToggleDetails}
      >
        {/* 내 상태 아이콘 */}
        <span className="text-sm">{currentStatusIcon}</span>
        
        {/* 온라인 사용자 수 */}
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-700">
            {totalOnlineCount}
          </span>
          <span className="text-xs text-gray-500">명</span>
        </div>
        
        {/* 실시간 표시 점 */}
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </button>

      {/* 호버 툴팁 */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          {/* 툴팁 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">온라인 사용자</h3>
            <span className="text-xs text-gray-500">{totalOnlineCount}명 접속</span>
          </div>

          {/* 상태별 통계 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg">{statusCounts.online}</div>
              <div className="text-xs text-green-600">온라인</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-lg">{statusCounts.away}</div>
              <div className="text-xs text-yellow-600">자리비움</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg">{statusCounts.busy}</div>
              <div className="text-xs text-red-600">바쁨</div>
            </div>
          </div>

          {/* 최근 온라인 사용자 미리보기 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 mb-2">최근 활동</h4>
            
            {/* 내 정보 */}
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'Unknown'} (나)
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <span>{currentStatusIcon}</span>
                  <span>{currentUserStatus.activity}</span>
                </div>
              </div>
            </div>

            {/* 다른 사용자들 (최대 3명) */}
            {onlineUsers.slice(0, 3).map((onlineUser) => {
              const statusIcon = getStatusIcon(onlineUser.status);
              const timeDiff = new Date() - onlineUser.lastActive;
              const timeDisplay = timeDiff < 60000 ? '방금 전' : `${Math.round(timeDiff / 60000)}분 전`;
              
              return (
                <div key={onlineUser.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {onlineUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {onlineUser.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <span>{statusIcon}</span>
                      <span>{onlineUser.activity}</span>
                      <span>•</span>
                      <span>{timeDisplay}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 더 많은 사용자가 있을 때 */}
            {onlineUsers.length > 3 && (
              <div className="text-center p-2">
                <span className="text-xs text-gray-500">
                  +{onlineUsers.length - 3}명 더
                </span>
              </div>
            )}
          </div>

          {/* 전체 보기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              onToggleDetails && onToggleDetails();
            }}
            className="w-full mt-3 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors duration-200"
          >
            전체 사용자 보기
          </button>

          {/* 툴팁 화살표 */}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersIndicator;