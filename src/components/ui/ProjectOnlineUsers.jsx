// 프로젝트 페이지용 온라인 사용자 표시
import React from 'react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';

/**
 * 프로젝트 페이지용 온라인 사용자 표시
 * - 같은 프로젝트를 보고 있는 사용자만 표시
 * - 간단한 아바타 형태로 표시
 * - 사용자 활동 상태 표시 (보기/편집)
 */
export const ProjectOnlineUsers = ({ projectId, className = '' }) => {
  const {
    onlineUsers,
    currentUserStatus,
    isConnected
  } = useOnlineUsers(`project_${projectId}`);

  if (!isConnected) return null;

  // 현재 프로젝트를 보고 있는 사용자들만 필터링
  const projectUsers = onlineUsers.filter(user => 
    user.location?.includes(`/projects/${projectId}`) ||
    user.scope === `project_${projectId}`
  );

  if (projectUsers.length === 0) return null;

  // 상태별 색상 설정
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'border-green-400';
      case 'away': return 'border-yellow-400';
      case 'busy': return 'border-red-400';
      default: return 'border-gray-300';
    }
  };

  // 활동별 아이콘
  const getActivityIcon = (activity) => {
    switch (activity) {
      case 'editing': return '✏️';
      case 'viewing': return '👀';
      case 'commenting': return '💬';
      case 'browsing': return '🔍';
      default: return '👤';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">이 프로젝트를 보고 있는 사용자:</span>
      
      <div className="flex -space-x-2">
        {projectUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="relative group"
          >
            {/* 사용자 아바타 */}
            <div className={`w-8 h-8 rounded-full border-2 ${getStatusColor(user.status)} bg-white flex items-center justify-center text-sm font-medium shadow-sm`}>
              {user.name?.charAt(0) || 'U'}
            </div>
            
            {/* 활동 상태 아이콘 */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs">
              {getActivityIcon(user.activity)}
            </div>
            
            {/* 호버 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              <div className="font-medium">{user.name}</div>
              <div className="text-gray-300">
                {user.activity === 'editing' ? '편집 중' : '보기 모드'}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        ))}
        
        {/* 더 많은 사용자가 있을 때 */}
        {projectUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center text-xs font-medium shadow-sm">
            +{projectUsers.length - 5}
          </div>
        )}
      </div>
      
      {/* 실시간 표시 점 */}
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-500">실시간</span>
      </div>
    </div>
  );
};

export default ProjectOnlineUsers;