// 온라인 사용자 상태 표시 컴포넌트
import React, { useState } from 'react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * 온라인 사용자 표시 컴포넌트
 * - 실시간 온라인 사용자 목록
 * - 사용자 상태별 표시 (온라인, 자리비움, 바쁨)
 * - 현재 위치 및 활동 표시
 * - 축소/확장 가능한 패널
 */
export const OnlineUsersDisplay = ({ 
  scope = 'global', 
  showLocation = true, 
  showActivity = true,
  compact = false 
}) => {
  const { user } = useSupabaseAuth();
  const {
    onlineUsers,
    totalOnlineCount,
    currentUserStatus,
    connectionStatus,
    isConnected,
    getUserCountByStatus,
    updateUserStatus
  } = useOnlineUsers(scope);

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // 상태 아이콘 및 색상 매핑
  const getStatusConfig = (status) => {
    const configs = {
      online: { 
        icon: '🟢', 
        color: 'text-green-500', 
        bgColor: 'bg-green-100', 
        label: '온라인' 
      },
      away: { 
        icon: '🟡', 
        color: 'text-yellow-500', 
        bgColor: 'bg-yellow-100', 
        label: '자리비움' 
      },
      busy: { 
        icon: '🔴', 
        color: 'text-red-500', 
        bgColor: 'bg-red-100', 
        label: '바쁨' 
      },
      offline: { 
        icon: '⚪', 
        color: 'text-gray-400', 
        bgColor: 'bg-gray-100', 
        label: '오프라인' 
      }
    };
    return configs[status] || configs.offline;
  };

  // 활동 아이콘 매핑
  const getActivityIcon = (activity) => {
    const icons = {
      browsing: '👀',
      editing: '✏️',
      viewing: '📖',
      creating: '➕',
      commenting: '💬',
      idle: '😴'
    };
    return icons[activity] || '👤';
  };

  // 위치 표시명 변환
  const getLocationName = (location) => {
    const locationMap = {
      '/': '대시보드',
      '/projects': '프로젝트 목록',
      '/project-dashboard': '프로젝트 대시보드',
      '/calendar': '캘린더',
      '/completed': '완료된 프로젝트',
      '/admin': '관리자 페이지',
      '/profile': '프로필'
    };
    
    if (location.includes('/projects/') && location.includes('/detail')) {
      return '프로젝트 상세';
    }
    if (location.includes('/projects/') && location.includes('/edit')) {
      return '프로젝트 편집';
    }
    
    return locationMap[location] || '알 수 없음';
  };

  // 연결 상태가 좋지 않을 때
  if (!isConnected && connectionStatus !== 'connecting') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-sm text-yellow-700">
            실시간 연결이 끊어졌습니다
          </span>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-yellow-600 underline hover:text-yellow-800"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  const statusCounts = getUserCountByStatus();
  const currentStatusConfig = getStatusConfig(currentUserStatus.status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* 헤더 - 온라인 사용자 수 및 토글 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            온라인 사용자
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            {totalOnlineCount}명
          </span>
          {connectionStatus === 'connecting' && (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
              <span className="text-xs text-gray-500">연결 중...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 내 상태 표시 */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <span>{currentStatusConfig.icon}</span>
              <span className="text-xs text-gray-600">{currentStatusConfig.label}</span>
            </button>
            
            {/* 상태 변경 메뉴 */}
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                {Object.entries(getStatusConfig()).map(([status, config]) => (
                  status !== 'offline' && (
                    <button
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateUserStatus({ status });
                        setShowStatusMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
          
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? '⌄' : '⌃'}
          </button>
        </div>
      </div>

      {/* 상태별 요약 (축소 모드에서도 표시) */}
      {!isExpanded && (
        <div className="px-3 pb-3">
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <span className="flex items-center space-x-1">
              <span>🟢</span>
              <span>{statusCounts.online}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🟡</span>
              <span>{statusCounts.away}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🔴</span>
              <span>{statusCounts.busy}</span>
            </span>
          </div>
        </div>
      )}

      {/* 확장된 사용자 목록 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* 현재 사용자 */}
          <div className="p-3 bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${currentStatusConfig.bgColor} rounded-full flex items-center justify-center`}>
                  <span className="text-xs">{currentStatusConfig.icon}</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Unknown'} (나)
                  </p>
                  <span className={`text-xs px-2 py-1 rounded ${currentStatusConfig.bgColor} ${currentStatusConfig.color}`}>
                    {currentStatusConfig.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  {showActivity && (
                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                      <span>{getActivityIcon(currentUserStatus.activity)}</span>
                      <span>{currentUserStatus.activity}</span>
                    </span>
                  )}
                  {showLocation && (
                    <span className="text-xs text-gray-500">
                      📍 {getLocationName(currentUserStatus.location)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 다른 온라인 사용자들 */}
          <div className="max-h-64 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                다른 온라인 사용자가 없습니다
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {onlineUsers.map((onlineUser) => {
                  const statusConfig = getStatusConfig(onlineUser.status);
                  const timeDiff = new Date() - onlineUser.lastActive;
                  const isRecent = timeDiff < 60000; // 1분 이내
                  
                  return (
                    <div key={onlineUser.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {onlineUser.name?.charAt(0) || 'U'}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${statusConfig.bgColor} rounded-full flex items-center justify-center`}>
                            <span className="text-xs">{statusConfig.icon}</span>
                          </div>
                          {isRecent && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {onlineUser.name}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {onlineUser.role === 'admin' && (
                              <span className="text-xs px-1 py-0.5 bg-purple-100 text-purple-600 rounded">
                                관리자
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            {showActivity && (
                              <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <span>{getActivityIcon(onlineUser.activity)}</span>
                                <span>{onlineUser.activity}</span>
                              </span>
                            )}
                            {showLocation && (
                              <span className="text-xs text-gray-500">
                                📍 {getLocationName(onlineUser.location)}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {isRecent ? '방금 전' : `${Math.round(timeDiff / 60000)}분 전`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 푸터 - 상태별 통계 */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <span>🟢 온라인</span>
                  <span className="font-medium">{statusCounts.online}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>🟡 자리비움</span>
                  <span className="font-medium">{statusCounts.away}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>🔴 바쁨</span>
                  <span className="font-medium">{statusCounts.busy}</span>
                </span>
              </div>
              
              <div className="text-gray-500">
                총 {totalOnlineCount}명 접속
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상태 변경 메뉴 오버레이 닫기 */}
      {showStatusMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </div>
  );
};

export default OnlineUsersDisplay;