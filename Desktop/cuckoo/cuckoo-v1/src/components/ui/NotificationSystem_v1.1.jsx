import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { getNotificationTargets } from '../../utils/dDayCalculator_v1.1';
import DDayBadge from './DDayBadge_v1.1';

/**
 * v1.1 NotificationSystem - 통합된 실시간 알림 시스템
 * 
 * 주요 기능:
 * - 실시간 의견 답글 알림
 * - 프로젝트 상태 변경 알림
 * - D-Day 기반 일정 알림 (자동 생성)
 * - 시스템 공지사항
 * - 알림 읽음 상태 관리
 * - 알림 설정 관리
 * - 브라우저 알림 지원
 */
const NotificationSystem_v11 = ({ 
  className = '',
  maxNotifications = 10,
  autoHide = false,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  console.log('🔔 [v1.1] NotificationSystem rendering');

  const { user, profile } = useSupabaseAuth();
  const { projects = [] } = useProjectStore();
  
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    browserNotifications: true,
    opinionReplies: true,
    projectUpdates: true,
    scheduleAlerts: true,
    ddayAlerts: true, // D-Day 알림 추가
    systemAnnouncements: true
  });
  const [lastDDayCheck, setLastDDayCheck] = useState(null);

  // 알림 유형 설정
  const notificationTypes = useMemo(() => ({
    opinion_reply: {
      icon: '💬',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      title: '의견 답글',
      priority: 'high'
    },
    opinion_status: {
      icon: '🔄',
      color: 'bg-green-100 text-green-700 border-green-200',
      title: '의견 상태 변경',
      priority: 'medium'
    },
    project_update: {
      icon: '📊',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      title: '프로젝트 업데이트',
      priority: 'medium'
    },
    schedule_alert: {
      icon: '📅',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      title: '일정 알림',
      priority: 'high'
    },
    dday_overdue: {
      icon: '⚠️',
      color: 'bg-red-100 text-red-700 border-red-200',
      title: '일정 지연',
      priority: 'urgent'
    },
    dday_today: {
      icon: '🎯',
      color: 'bg-red-100 text-red-700 border-red-200',
      title: '오늘 마감',
      priority: 'urgent'
    },
    dday_urgent: {
      icon: '🔥',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      title: '긴급 일정',
      priority: 'high'
    },
    system_announcement: {
      icon: '📢',
      color: 'bg-red-100 text-red-700 border-red-200',
      title: '시스템 공지',
      priority: 'urgent'
    },
    user_mention: {
      icon: '👤',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      title: '멘션',
      priority: 'high'
    }
  }), []);

  // 읽지 않은 알림 개수
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback((notification) => {
    if (!settings.browserNotifications) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationType = notificationTypes[notification.type] || {};
      
      const browserNotif = new Notification(notificationType.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          // TODO: 라우팅 처리
          console.log('Navigate to:', notification.actionUrl);
        }
        browserNotif.close();
      };

      // 자동 닫기 (긴급하지 않은 경우)
      if (notification.priority !== 'urgent') {
        setTimeout(() => browserNotif.close(), 5000);
      }
    }
  }, [settings.browserNotifications, notificationTypes]);

  // 새 알림 추가
  const addNotification = useCallback((notificationData) => {
    console.log('📥 [v1.1] Adding notification', notificationData);

    const notification = {
      id: Date.now().toString(),
      ...notificationData,
      createdAt: new Date().toISOString(),
      read: false,
      userId: user?.id
    };

    setNotifications(prev => {
      const newNotifications = [notification, ...prev].slice(0, maxNotifications);
      
      // localStorage에 저장
      try {
        localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(newNotifications));
      } catch (error) {
        console.error('Failed to save notifications to localStorage:', error);
      }
      
      return newNotifications;
    });

    // 브라우저 알림 표시
    showBrowserNotification(notification);

    // 자동 숨기기
    if (autoHide && notification.priority !== 'urgent') {
      setTimeout(() => {
        markAsRead(notification.id);
      }, 8000);
    }
  }, [maxNotifications, user?.id, showBrowserNotification, autoHide]);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      );
      
      // localStorage 업데이트
      try {
        localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      
      return updated;
    });
  }, [user?.id]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ 
        ...n, 
        read: true, 
        readAt: n.readAt || new Date().toISOString() 
      }));
      
      // localStorage 업데이트
      try {
        localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      
      return updated;
    });
  }, [user?.id]);

  // 알림 삭제
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      
      // localStorage 업데이트
      try {
        localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      
      return updated;
    });
  }, [user?.id]);

  // 모든 알림 삭제
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    
    // localStorage 정리
    try {
      localStorage.removeItem(`notifications_${user?.id}`);
    } catch (error) {
      console.error('Failed to clear notifications from localStorage:', error);
    }
  }, [user?.id]);

  // 알림 설정 업데이트
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // localStorage에 저장
      try {
        localStorage.setItem(`notification_settings_${user?.id}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save notification settings:', error);
      }
      
      return updated;
    });
  }, [user?.id]);

  // 컴포넌트 마운트 시 저장된 알림 및 설정 로드
  useEffect(() => {
    if (!user?.id) return;

    try {
      // 알림 로드
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      }

      // 설정 로드
      const savedSettings = localStorage.getItem(`notification_settings_${user.id}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }, [user?.id]);

  // D-Day 알림 자동 생성
  const generateDDayNotifications = useCallback(() => {
    if (!settings.ddayAlerts || !user) return;
    
    const notificationTargets = getNotificationTargets(projects, {
      urgentDays: 7,
      reminderDays: 3,
      includeTodayEvents: true,
      includeOverdueEvents: true
    });
    
    const today = new Date().toDateString();
    const isNewDay = lastDDayCheck !== today;
    
    if (isNewDay) {
      notificationTargets.forEach(target => {
        // 중복 알림 방지를 위한 고유 ID
        const notificationId = `dday_${target.projectId}_${target.type}_${today}`;
        const existingNotification = notifications.find(n => n.id === notificationId);
        
        if (!existingNotification) {
          let notificationType = 'schedule_alert';
          
          // 상태에 따른 알림 타입 결정
          switch (target.notificationType) {
            case 'overdue':
              notificationType = 'dday_overdue';
              break;
            case 'today':
              notificationType = 'dday_today';
              break;
            case 'urgent':
              notificationType = 'dday_urgent';
              break;
            default:
              notificationType = 'schedule_alert';
          }
          
          addNotification({
            id: notificationId,
            type: notificationType,
            message: `${target.label}: ${target.projectName} (${target.modelName})`,
            priority: target.urgency,
            actionUrl: `/project/${target.projectId}`,
            metadata: {
              projectId: target.projectId,
              dDay: target.dDay,
              eventType: target.type,
              label: target.label
            }
          });
        }
      });
      
      setLastDDayCheck(today);
    }
  }, [settings.ddayAlerts, user, projects, lastDDayCheck, notifications, addNotification]);

  // D-Day 알림 자동 체크 (매일 오전 9시, 또는 페이지 로드 시)
  useEffect(() => {
    generateDDayNotifications();
    
    // 매시간마다 체크 (실제 운영에서는 더 긴 간격으로 설정 가능)
    const interval = setInterval(generateDDayNotifications, 60 * 60 * 1000); // 1시간
    
    return () => clearInterval(interval);
  }, [generateDDayNotifications]);

  // 브라우저 알림 권한 초기 요청
  useEffect(() => {
    if (settings.browserNotifications && user) {
      requestNotificationPermission();
    }
  }, [settings.browserNotifications, user, requestNotificationPermission]);

  // 포지션 클래스 계산
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  }, [position]);

  // 외부에서 사용할 수 있도록 전역 함수 등록
  useEffect(() => {
    window.addNotification = addNotification;
    
    return () => {
      delete window.addNotification;
    };
  }, [addNotification]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;

  return (
    <>
      {/* 알림 버튼 */}
      <div className={`fixed ${positionClasses} z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
          aria-label="알림"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zm-1-3H4.25A2.25 2.25 0 0 1 2 11.75v-8.5A2.25 2.25 0 0 1 4.25 1h8.5A2.25 2.25 0 0 1 15 3.25V8" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6V4a2 2 0 1 1 4 0v1H8z" />
          </svg>
          
          {/* 읽지 않은 알림 배지 */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* 알림 패널 */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                알림 {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  모두 삭제
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const notificationType = notificationTypes[notification.type] || notificationTypes.system_announcement;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionUrl) {
                          // TODO: 라우팅 처리
                          console.log('Navigate to:', notification.actionUrl);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        {/* 아이콘 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notificationType.color}`}>
                          <span className="text-sm">{notificationType.icon}</span>
                        </div>
                        
                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notificationType.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {/* D-Day 뱃지 표시 (D-Day 관련 알림인 경우) */}
                              {notification.metadata?.dDay !== undefined && (
                                <DDayBadge 
                                  targetDate={notification.metadata.eventDate}
                                  isExecuted={false}
                                  size="xs"
                                  showTooltip={false}
                                />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        
                        {/* 읽지 않음 표시 */}
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm">알림이 없습니다</p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // TODO: 알림 설정 모달 열기
                  console.log('Open notification settings');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                ⚙️ 알림 설정
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 클릭 외부 영역 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

// 알림 생성 유틸리티 함수들
export const createOpinionReplyNotification = (opinionTitle, replierName, projectName) => {
  if (window.addNotification) {
    window.addNotification({
      type: 'opinion_reply',
      message: `${replierName}님이 "${opinionTitle}" 의견에 답글을 남겼습니다. (${projectName})`,
      priority: 'high'
    });
  }
};

export const createOpinionStatusNotification = (opinionTitle, status, projectName) => {
  const statusText = {
    reviewed: '검토됨',
    resolved: '해결됨',
    rejected: '반려됨'
  }[status] || status;

  if (window.addNotification) {
    window.addNotification({
      type: 'opinion_status',
      message: `"${opinionTitle}" 의견이 ${statusText} 상태로 변경되었습니다. (${projectName})`,
      priority: 'medium'
    });
  }
};

export const createProjectUpdateNotification = (projectName, updateType) => {
  const updateText = {
    progress: '진행률이 업데이트',
    stage: '단계가 변경',
    schedule: '일정이 수정',
    completed: '완료'
  }[updateType] || '업데이트';

  if (window.addNotification) {
    window.addNotification({
      type: 'project_update',
      message: `${projectName} 프로젝트가 ${updateText}되었습니다.`,
      priority: 'medium'
    });
  }
};

export const createScheduleAlertNotification = (taskName, daysUntil, projectName) => {
  const timeText = daysUntil === 0 ? '오늘' : 
                   daysUntil === 1 ? '내일' : 
                   daysUntil < 0 ? `${Math.abs(daysUntil)}일 지연됨` :
                   `${daysUntil}일 후`;

  if (window.addNotification) {
    window.addNotification({
      type: 'schedule_alert',
      message: `${taskName} 일정이 ${timeText}입니다. (${projectName})`,
      priority: daysUntil <= 1 ? 'urgent' : 'high'
    });
  }
};

export const createDDayNotification = (eventInfo, projectName, modelName) => {
  if (window.addNotification) {
    let notificationType = 'schedule_alert';
    let priority = 'medium';
    
    // D-Day 상태에 따른 알림 타입 및 우선순위 결정
    switch (eventInfo.status) {
      case 'overdue':
        notificationType = 'dday_overdue';
        priority = 'urgent';
        break;
      case 'today':
        notificationType = 'dday_today';
        priority = 'urgent';
        break;
      case 'urgent':
        notificationType = 'dday_urgent';
        priority = 'high';
        break;
      default:
        notificationType = 'schedule_alert';
        priority = 'medium';
    }
    
    window.addNotification({
      type: notificationType,
      message: `${eventInfo.label}: ${projectName} (${modelName})`,
      priority: priority,
      metadata: {
        projectId: eventInfo.projectId,
        dDay: eventInfo.dDay,
        eventType: eventInfo.type,
        label: eventInfo.label,
        eventDate: eventInfo.date
      }
    });
  }
};

export default NotificationSystem_v11;