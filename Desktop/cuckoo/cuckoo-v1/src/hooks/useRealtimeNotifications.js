// 실시간 알림 시스템 훅
import { useCallback, useEffect, useState, useRef } from 'react';
import { useHybridAuth } from './useHybridAuth';
import { supabase, getHybridMode, HYBRID_MODE } from '../lib/supabase';

/**
 * 실시간 알림 시스템 훅
 * - 시스템 전체 실시간 알림 관리
 * - 프로젝트 변경, 의견 작성, 사용자 활동 알림
 * - 브라우저 알림 및 인앱 알림
 * - 알림 히스토리 관리
 */
export const useRealtimeNotifications = () => {
  const { user } = useHybridAuth();
  
  // 알림 상태 관리
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  
  // 설정
  const [settings, setSettings] = useState({
    browserNotifications: true,
    soundNotifications: true,
    projectUpdates: true,
    opinionNotifications: true,
    userActivityNotifications: false,
    quietHours: { enabled: false, start: '22:00', end: '08:00' }
  });
  
  // 채널 및 구독 관리
  const channelRef = useRef(null);
  const notificationQueueRef = useRef([]);
  const soundRef = useRef(null);

  // 실시간 알림 연결 초기화
  useEffect(() => {
    if (getHybridMode() === HYBRID_MODE.DISABLED || !user) {
      return;
    }

    console.log('🔔 [RealtimeNotifications] Initializing global notifications');
    initializeGlobalNotifications();
    loadNotificationSettings();
    initializeAudioNotifications();

    return () => {
      cleanup();
    };
  }, [user?.id]);

  // 전역 알림 채널 초기화
  const initializeGlobalNotifications = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      cleanup();
      
      const channel = supabase.channel('global_notifications', {
        config: {
          presence: { key: user.id }
        }
      });

      // 모든 테이블의 변경사항 구독
      
      // 프로젝트 변경 알림
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, handleProjectChange);

      // 의견 변경 알림  
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'opinions'
      }, handleOpinionChange);

      // 사용자 활동 알림
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs'
      }, handleActivityLog);

      // 커스텀 알림 브로드캐스트 구독
      channel.on('broadcast', { event: 'custom_notification' }, handleCustomNotification);
      channel.on('broadcast', { event: 'urgent_notification' }, handleUrgentNotification);

      // 채널 구독
      await channel.subscribe(async (status) => {
        console.log(`🔔 [RealtimeNotifications] Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          console.log('✅ [RealtimeNotifications] Successfully connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
      
    } catch (error) {
      console.error('❌ [RealtimeNotifications] Initialization error:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [user]);

  // 프로젝트 변경 알림 핸들러
  const handleProjectChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // 자신의 변경사항은 알림하지 않음
    if (newRecord?.updated_by === user.id || newRecord?.created_by === user.id) {
      return;
    }

    let notification = null;

    switch (eventType) {
      case 'INSERT':
        notification = {
          id: `project_insert_${newRecord.id}_${Date.now()}`,
          type: 'project_created',
          title: '새 프로젝트 생성',
          message: `"${newRecord.name}" 프로젝트가 생성되었습니다`,
          projectId: newRecord.id,
          projectName: newRecord.name,
          icon: '📁',
          priority: 'normal',
          action: {
            label: '프로젝트 보기',
            url: `/projects/${newRecord.id}`
          }
        };
        break;
        
      case 'UPDATE':
        // 상태 변경 감지
        const statusChanged = oldRecord?.status !== newRecord.status;
        const progressChanged = hasProgressChanged(oldRecord, newRecord);
        
        if (statusChanged) {
          notification = {
            id: `project_status_${newRecord.id}_${Date.now()}`,
            type: 'project_status_changed',
            title: '프로젝트 상태 변경',
            message: `"${newRecord.name}" 프로젝트 상태가 "${newRecord.status}"로 변경되었습니다`,
            projectId: newRecord.id,
            projectName: newRecord.name,
            icon: '🔄',
            priority: 'normal'
          };
        } else if (progressChanged) {
          notification = {
            id: `project_progress_${newRecord.id}_${Date.now()}`,
            type: 'project_updated',
            title: '프로젝트 업데이트',
            message: `"${newRecord.name}" 프로젝트가 업데이트되었습니다`,
            projectId: newRecord.id,
            projectName: newRecord.name,
            icon: '📝',
            priority: 'low'
          };
        }
        break;
        
      case 'DELETE':
        notification = {
          id: `project_delete_${oldRecord.id}_${Date.now()}`,
          type: 'project_deleted',
          title: '프로젝트 삭제',
          message: `"${oldRecord.name}" 프로젝트가 삭제되었습니다`,
          icon: '🗑️',
          priority: 'normal'
        };
        break;
    }

    if (notification && settings.projectUpdates) {
      addNotification(notification);
    }
  }, [user, settings.projectUpdates]);

  // 의견 변경 알림 핸들러
  const handleOpinionChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // 자신의 변경사항은 알림하지 않음
    if (newRecord?.created_by === user.id || newRecord?.updated_by === user.id) {
      return;
    }

    let notification = null;

    switch (eventType) {
      case 'INSERT':
        notification = {
          id: `opinion_insert_${newRecord.id}_${Date.now()}`,
          type: 'opinion_created',
          title: '새 의견 작성',
          message: `${newRecord.author_name}님이 새로운 의견을 작성했습니다`,
          projectId: newRecord.project_id,
          opinionId: newRecord.id,
          authorName: newRecord.author_name,
          icon: '💬',
          priority: newRecord.priority === 'critical' ? 'urgent' : 'normal',
          action: {
            label: '의견 보기',
            url: `/projects/${newRecord.project_id}?tab=opinions`
          }
        };
        break;
        
      case 'UPDATE':
        // 상태 변경 또는 답변 추가
        const statusChanged = oldRecord?.status !== newRecord.status;
        const replyAdded = !oldRecord?.reply && newRecord.reply;
        
        if (replyAdded) {
          notification = {
            id: `opinion_reply_${newRecord.id}_${Date.now()}`,
            type: 'opinion_replied',
            title: '의견 답변',
            message: `귀하의 의견에 답변이 달렸습니다`,
            projectId: newRecord.project_id,
            opinionId: newRecord.id,
            icon: '💭',
            priority: 'high',
            action: {
              label: '답변 보기',
              url: `/projects/${newRecord.project_id}?tab=opinions`
            }
          };
        } else if (statusChanged) {
          notification = {
            id: `opinion_status_${newRecord.id}_${Date.now()}`,
            type: 'opinion_status_changed',
            title: '의견 상태 변경',
            message: `의견 상태가 "${newRecord.status}"로 변경되었습니다`,
            projectId: newRecord.project_id,
            opinionId: newRecord.id,
            icon: '📋',
            priority: 'normal'
          };
        }
        break;
    }

    if (notification && settings.opinionNotifications) {
      addNotification(notification);
    }
  }, [user, settings.opinionNotifications]);

  // 활동 로그 알림 핸들러
  const handleActivityLog = useCallback((payload) => {
    const { new: newRecord } = payload;
    
    // 자신의 활동은 알림하지 않음
    if (newRecord.user_id === user.id) {
      return;
    }

    if (settings.userActivityNotifications) {
      const notification = {
        id: `activity_${newRecord.id}_${Date.now()}`,
        type: 'user_activity',
        title: '사용자 활동',
        message: `${newRecord.user_name}님이 ${getActivityDescription(newRecord.action)}`,
        userId: newRecord.user_id,
        userName: newRecord.user_name,
        action: newRecord.action,
        icon: getActivityIcon(newRecord.action),
        priority: 'low'
      };
      
      addNotification(notification);
    }
  }, [user, settings.userActivityNotifications]);

  // 커스텀 알림 핸들러
  const handleCustomNotification = useCallback((payload) => {
    const notification = payload.payload;
    
    // 자신이 보낸 알림은 무시
    if (notification.senderId === user.id) {
      return;
    }
    
    addNotification({
      ...notification,
      id: `custom_${Date.now()}`,
      type: 'custom',
      icon: notification.icon || '📢'
    });
  }, [user]);

  // 긴급 알림 핸들러
  const handleUrgentNotification = useCallback((payload) => {
    const notification = payload.payload;
    
    if (notification.senderId === user.id) {
      return;
    }
    
    // 긴급 알림은 설정과 관계없이 항상 표시
    addNotification({
      ...notification,
      id: `urgent_${Date.now()}`,
      type: 'urgent',
      priority: 'urgent',
      icon: '🚨'
    });
  }, [user]);

  // 알림 추가
  const addNotification = useCallback((notification) => {
    const fullNotification = {
      ...notification,
      timestamp: new Date(),
      read: false,
      userId: user.id
    };

    // 조용한 시간 확인
    if (settings.quietHours.enabled && isQuietTime()) {
      // 긴급 알림이 아니면 큐에 저장
      if (notification.priority !== 'urgent') {
        notificationQueueRef.current.push(fullNotification);
        return;
      }
    }

    setNotifications(prev => [fullNotification, ...prev.slice(0, 49)]); // 최대 50개 유지
    setUnreadCount(prev => prev + 1);

    // 브라우저 알림 표시
    if (settings.browserNotifications && notificationPermission === 'granted') {
      showBrowserNotification(fullNotification);
    }

    // 사운드 알림
    if (settings.soundNotifications) {
      playNotificationSound(fullNotification.priority);
    }

    // 로컬 스토리지에 저장 (선택적)
    saveNotificationToStorage(fullNotification);

    console.log('🔔 [RealtimeNotifications] New notification:', fullNotification);
  }, [user, settings, notificationPermission]);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback((notification) => {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      badge: '/notification-badge.png',
      data: {
        url: notification.action?.url,
        notificationId: notification.id
      }
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.action?.url) {
        window.location.href = notification.action.url;
      }
      markAsRead(notification.id);
      browserNotification.close();
    };

    // 10초 후 자동 닫기
    setTimeout(() => {
      browserNotification.close();
    }, 10000);
  }, []);

  // 사운드 알림
  const playNotificationSound = useCallback((priority) => {
    if (!soundRef.current) return;

    // 우선순위에 따른 다른 사운드
    let soundFile;
    switch (priority) {
      case 'urgent':
        soundFile = '/sounds/urgent-notification.mp3';
        break;
      case 'high':
        soundFile = '/sounds/high-notification.mp3';
        break;
      default:
        soundFile = '/sounds/notification.mp3';
        break;
    }

    soundRef.current.src = soundFile;
    soundRef.current.play().catch(error => {
      console.log('사운드 재생 실패:', error);
    });
  }, []);

  // 알림을 읽음으로 표시
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // 알림 삭제
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // 모든 알림 삭제
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // 커스텀 알림 전송
  const sendCustomNotification = useCallback((notification) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'custom_notification',
        payload: {
          ...notification,
          senderId: user.id,
          senderName: user.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [isConnected, user]);

  // 긴급 알림 전송 (관리자 전용)
  const sendUrgentNotification = useCallback((notification) => {
    if (user.role !== 'admin') {
      throw new Error('관리자만 긴급 알림을 전송할 수 있습니다');
    }

    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'urgent_notification',
        payload: {
          ...notification,
          senderId: user.id,
          senderName: user.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [isConnected, user]);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  // 알림 설정 업데이트
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    localStorage.setItem('notificationSettings', JSON.stringify({ ...settings, ...newSettings }));
  }, [settings]);

  // 유틸리티 함수들
  const hasProgressChanged = useCallback((oldRecord, newRecord) => {
    // 간단한 진행률 비교 (실제로는 더 정확한 비교 필요)
    return (
      JSON.stringify(oldRecord?.stage1) !== JSON.stringify(newRecord?.stage1) ||
      JSON.stringify(oldRecord?.stage2) !== JSON.stringify(newRecord?.stage2) ||
      JSON.stringify(oldRecord?.stage3) !== JSON.stringify(newRecord?.stage3)
    );
  }, []);

  const getActivityDescription = useCallback((action) => {
    const descriptions = {
      'project_created': '프로젝트를 생성했습니다',
      'project_updated': '프로젝트를 업데이트했습니다',
      'opinion_created': '의견을 작성했습니다',
      'opinion_replied': '의견에 답변했습니다',
      'user_login': '로그인했습니다',
      'user_logout': '로그아웃했습니다'
    };
    return descriptions[action] || '활동했습니다';
  }, []);

  const getActivityIcon = useCallback((action) => {
    const icons = {
      'project_created': '📁',
      'project_updated': '📝',
      'opinion_created': '💬',
      'opinion_replied': '💭',
      'user_login': '🔑',
      'user_logout': '🚪'
    };
    return icons[action] || '📋';
  }, []);

  const isQuietTime = useCallback(() => {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = parseInt(settings.quietHours.start.replace(':', ''));
    const endTime = parseInt(settings.quietHours.end.replace(':', ''));
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [settings.quietHours]);

  const saveNotificationToStorage = useCallback((notification) => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedNotifications') || '[]');
      saved.unshift(notification);
      localStorage.setItem('savedNotifications', JSON.stringify(saved.slice(0, 100))); // 최대 100개
    } catch (error) {
      console.error('알림 저장 실패:', error);
    }
  }, []);

  const loadNotificationSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    }
  }, []);

  const initializeAudioNotifications = useCallback(() => {
    soundRef.current = new Audio();
    soundRef.current.volume = 0.5;
  }, []);

  // 정리 함수
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    console.log('🔔 [RealtimeNotifications] Connection cleaned up');
  }, []);

  // 조용한 시간 종료 후 대기 중인 알림 처리
  useEffect(() => {
    if (!settings.quietHours.enabled) return;
    
    const checkQuietTime = () => {
      if (!isQuietTime() && notificationQueueRef.current.length > 0) {
        // 대기 중인 알림들 처리
        const queuedNotifications = [...notificationQueueRef.current];
        notificationQueueRef.current = [];
        
        queuedNotifications.forEach(notification => {
          addNotification(notification);
        });
      }
    };
    
    const interval = setInterval(checkQuietTime, 60000); // 1분마다 체크
    return () => clearInterval(interval);
  }, [settings.quietHours.enabled, isQuietTime, addNotification]);

  return {
    // 알림 데이터
    notifications,
    unreadCount,
    
    // 연결 상태
    isConnected,
    connectionStatus,
    
    // 권한 및 설정
    notificationPermission,
    settings,
    
    // 알림 관리
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    
    // 알림 전송
    sendCustomNotification,
    sendUrgentNotification,
    
    // 설정 관리
    updateSettings,
    requestNotificationPermission,
    
    // 유틸리티
    isQuietTime: isQuietTime(),
    queuedNotificationsCount: notificationQueueRef.current.length
  };
};

export default useRealtimeNotifications;