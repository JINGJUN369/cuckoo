import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { Button } from './index';

/**
 * NotificationSystem v1.2 - 알림 시스템 컴포넌트
 * 
 * 주요 기능:
 * - 미해결 의견 알림
 * - 긴급도별 분류
 * - 프로젝트별 그룹핑
 * - 알림 제거 기능
 * - 실시간 카운트 업데이트
 */
const NotificationSystem_v1_2 = ({ 
  className = "",
  showClearAll = true,
  maxItems = 10
}) => {
  const { opinions, projects, updateOpinion } = useSupabaseProjectStore();

  // 읽음 처리된 알림 관리 (localStorage)
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedNotifications_v1.2') || '[]');
    } catch {
      return [];
    }
  });

  console.log('🔔 [v1.2] NotificationSystem rendered with', opinions.length, 'opinions');

  // 미해결 의견 계산
  const pendingOpinions = useMemo(() => {
    return opinions.filter(opinion => 
      opinion.status === 'open' && 
      !dismissedNotifications.includes(opinion.id) &&
      opinion.status !== 'deleted'
    );
  }, [opinions, dismissedNotifications]);

  // 알림별 분류 및 우선순위 계산
  const notifications = useMemo(() => {
    const notificationMap = new Map();

    pendingOpinions.forEach(opinion => {
      const project = projects.find(p => p.id === (opinion.projectId || opinion.project_id));
      const projectName = project?.name || '알 수 없는 프로젝트';
      
      // 우선순위 점수 계산
      const priorityScore = {
        high: 3,
        medium: 2,
        low: 1
      }[opinion.priority] || 2;

      // 생성 시간 기준 점수 (오래된 것일수록 높은 점수)
      const createdAt = new Date(opinion.createdAt || opinion.created_at);
      const daysSinceCreated = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24));
      const ageScore = Math.min(daysSinceCreated * 0.1, 2); // 최대 2점

      const notification = {
        id: opinion.id,
        projectId: opinion.projectId || opinion.project_id,
        projectName,
        content: opinion.message || opinion.content,
        priority: opinion.priority || 'medium',
        stage: opinion.stage || 'general',
        createdAt: opinion.createdAt || opinion.created_at,
        createdBy: opinion.author_name || opinion.createdByName || opinion.createdBy,
        createdByTeam: opinion.author_team || '일반팀',
        score: priorityScore + ageScore,
        daysSinceCreated
      };

      notificationMap.set(opinion.id, notification);
    });

    // 점수 기준으로 정렬하고 최대 개수만큼 반환
    return Array.from(notificationMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);
  }, [pendingOpinions, projects, maxItems]);

  // Stage별 그룹핑
  const notificationsByStage = useMemo(() => {
    const groups = {
      high: [],
      medium: [],
      low: []
    };

    notifications.forEach(notification => {
      groups[notification.priority].push(notification);
    });

    return groups;
  }, [notifications]);

  // 알림 무시하기
  const dismissNotification = useCallback((notificationId) => {
    const updated = [...dismissedNotifications, notificationId];
    setDismissedNotifications(updated);
    localStorage.setItem('dismissedNotifications_v1.2', JSON.stringify(updated));
  }, [dismissedNotifications]);

  // 모든 알림 무시하기
  const clearAllNotifications = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    const updated = [...dismissedNotifications, ...allIds];
    setDismissedNotifications(updated);
    localStorage.setItem('dismissedNotifications_v1.2', JSON.stringify(updated));
  }, [notifications, dismissedNotifications]);

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'low': return 'bg-gray-50 border-gray-200 text-gray-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Stage 색상
  const getStageColor = (stage) => {
    switch (stage) {
      case 'stage1': return 'text-blue-600 bg-blue-100';
      case 'stage2': return 'text-green-600 bg-green-100';
      case 'stage3': return 'text-purple-600 bg-purple-100';
      case 'general': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🔔 의견 알림
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              처리가 필요한 의견 {notifications.length}개
            </p>
          </div>
          {showClearAll && notifications.length > 0 && (
            <Button
              onClick={clearAllNotifications}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              모두 읽음
            </Button>
          )}
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* 긴급 및 높음 우선순위 */}
          {notificationsByStage.high.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(notification.stage)}`}>
                      {notification.stage === 'general' ? '일반' : 
                       notification.stage === 'stage1' ? 'Stage 1' :
                       notification.stage === 'stage2' ? 'Stage 2' :
                       notification.stage === 'stage3' ? 'Stage 3' : notification.stage}
                    </span>
                    <span className="text-xs text-gray-600">
                      {notification.priority === 'high' ? '🟠 높음' :
                       notification.priority === 'medium' ? '🔵 보통' :
                       notification.priority === 'low' ? '⚪ 낮음' : ''}
                    </span>
                    {notification.daysSinceCreated > 3 && (
                      <span className="text-xs text-red-600">
                        📅 {notification.daysSinceCreated}일 경과
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                    {notification.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div>
                      <span>{notification.projectName}</span>
                      <span className="mx-1">•</span>
                      <span>{notification.createdBy}</span>
                      {notification.createdByTeam && (
                        <>
                          <span className="mx-1 text-blue-600">({notification.createdByTeam})</span>
                        </>
                      )}
                      <span className="mx-1">•</span>
                      <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/projects/${notification.projectId}?tab=opinions`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        확인
                      </Link>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        무시
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 일반 및 낮음 우선순위 */}
          {[...notificationsByStage.medium, ...notificationsByStage.low].map((notification) => (
            <div
              key={notification.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(notification.stage)}`}>
                      {notification.stage === 'general' ? '일반' : 
                       notification.stage === 'stage1' ? 'Stage 1' :
                       notification.stage === 'stage2' ? 'Stage 2' :
                       notification.stage === 'stage3' ? 'Stage 3' : notification.stage}
                    </span>
                    {notification.daysSinceCreated > 7 && (
                      <span className="text-xs text-orange-600">
                        📅 {notification.daysSinceCreated}일 경과
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                    {notification.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div>
                      <span>{notification.projectName}</span>
                      <span className="mx-1">•</span>
                      <span>{notification.createdBy}</span>
                      {notification.createdByTeam && (
                        <>
                          <span className="mx-1 text-blue-600">({notification.createdByTeam})</span>
                        </>
                      )}
                      <span className="mx-1">•</span>
                      <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/projects/${notification.projectId}?tab=opinions`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        확인
                      </Link>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        무시
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem_v1_2;