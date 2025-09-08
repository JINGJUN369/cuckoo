// 사용자 온라인 상태 관리 훅
import { useCallback, useEffect, useState, useRef } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '../lib/supabase';

/**
 * 사용자 온라인 상태 관리 훅
 * - 실시간 온라인 사용자 추적
 * - 사용자별 활동 상태 표시
 * - 페이지별 현재 활동 중인 사용자 표시
 * - 사용자 활동 히스토리
 */
export const useOnlineUsers = (scope = 'global') => {
  const { user } = useSupabaseAuth();
  
  // 온라인 사용자 상태 관리
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [totalOnlineCount, setTotalOnlineCount] = useState(0);
  const [userActivity, setUserActivity] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // 현재 사용자 상태
  const [currentUserStatus, setCurrentUserStatus] = useState({
    status: 'online', // online, away, busy, offline
    activity: 'browsing', // browsing, editing, viewing
    location: window.location.pathname,
    lastActive: new Date()
  });
  
  // 채널 및 상태 관리
  const channelRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(new Date());

  // Presence 연결 초기화
  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('👥 [OnlineUsers] Initializing presence system');
    initializePresenceSystem();
    initializeActivityTracking();

    return () => {
      cleanup();
    };
  }, [user?.id, scope]);

  // Presence 시스템 초기화
  const initializePresenceSystem = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      cleanup();
      
      const channelName = scope === 'global' ? 'global_presence' : `presence_${scope}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: user.id }
        }
      });

      // Presence 이벤트 구독
      channel.on('presence', { event: 'sync' }, handlePresenceSync);
      channel.on('presence', { event: 'join' }, handlePresenceJoin);
      channel.on('presence', { event: 'leave' }, handlePresenceLeave);

      // 사용자 활동 브로드캐스트 구독
      channel.on('broadcast', { event: 'activity_update' }, handleActivityUpdate);
      channel.on('broadcast', { event: 'status_change' }, handleStatusChange);

      // 채널 구독
      await channel.subscribe(async (status) => {
        console.log(`👥 [OnlineUsers] Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          
          // 자신의 presence 정보 전송
          await trackUserPresence();
          
          // 하트비트 시작
          startHeartbeat();
          
          console.log('✅ [OnlineUsers] Successfully connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
      
    } catch (error) {
      console.error('❌ [OnlineUsers] Initialization error:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [user, scope]);

  // 사용자 presence 추적
  const trackUserPresence = useCallback(async () => {
    if (!channelRef.current || !isConnected) return;

    const presenceData = {
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      status: currentUserStatus.status,
      activity: currentUserStatus.activity,
      location: currentUserStatus.location,
      last_active: new Date().toISOString(),
      user_agent: navigator.userAgent,
      scope: scope
    };

    try {
      await channelRef.current.track(presenceData);
      console.log('👥 [OnlineUsers] Presence tracked:', presenceData);
    } catch (error) {
      console.error('❌ [OnlineUsers] Error tracking presence:', error);
    }
  }, [user, currentUserStatus, isConnected, scope]);

  // Presence 동기화 핸들러
  const handlePresenceSync = useCallback(() => {
    const state = channelRef.current?.presenceState() || {};
    const users = [];
    
    Object.keys(state).forEach(presenceId => {
      const presence = state[presenceId][0];
      if (presence && presence.user_id !== user.id) {
        const user = {
          id: presence.user_id,
          name: presence.user_name,
          role: presence.user_role,
          status: presence.status || 'online',
          activity: presence.activity || 'browsing',
          location: presence.location || '/',
          lastActive: new Date(presence.last_active || new Date()),
          userAgent: presence.user_agent,
          scope: presence.scope
        };
        
        users.push(user);
      }
    });

    setOnlineUsers(users);
    setTotalOnlineCount(users.length + 1); // +1 for current user
    
    console.log(`👥 [OnlineUsers] ${users.length + 1} users online`);
  }, [user]);

  // 사용자 참여 핸들러
  const handlePresenceJoin = useCallback((payload) => {
    const { newPresences } = payload;
    
    newPresences.forEach(presence => {
      if (presence.user_id !== user.id) {
        console.log(`👋 [OnlineUsers] User joined: ${presence.user_name}`);
        
        // 웰컴 알림 (선택적)
        if (scope === 'global') {
          showUserActivityNotification(`${presence.user_name}님이 접속했습니다`, 'join');
        }
      }
    });
  }, [user, scope]);

  // 사용자 퇴장 핸들러
  const handlePresenceLeave = useCallback((payload) => {
    const { leftPresences } = payload;
    
    leftPresences.forEach(presence => {
      if (presence.user_id !== user.id) {
        console.log(`👋 [OnlineUsers] User left: ${presence.user_name}`);
        
        // 사용자 활동 히스토리에서 제거
        setUserActivity(prev => {
          const updated = { ...prev };
          delete updated[presence.user_id];
          return updated;
        });
      }
    });
  }, [user]);

  // 활동 업데이트 핸들러
  const handleActivityUpdate = useCallback((payload) => {
    const { user_id, activity, location, timestamp } = payload.payload;
    
    if (user_id !== user.id) {
      setUserActivity(prev => ({
        ...prev,
        [user_id]: {
          activity,
          location,
          timestamp: new Date(timestamp)
        }
      }));
      
      // 온라인 사용자 목록도 업데이트
      setOnlineUsers(prev => 
        prev.map(u => 
          u.id === user_id 
            ? { ...u, activity, location, lastActive: new Date(timestamp) }
            : u
        )
      );
    }
  }, [user]);

  // 상태 변경 핸들러
  const handleStatusChange = useCallback((payload) => {
    const { user_id, status, timestamp } = payload.payload;
    
    if (user_id !== user.id) {
      setOnlineUsers(prev => 
        prev.map(u => 
          u.id === user_id 
            ? { ...u, status, lastActive: new Date(timestamp) }
            : u
        )
      );
    }
  }, [user]);

  // 사용자 상태 업데이트
  const updateUserStatus = useCallback(async (newStatus) => {
    const updatedStatus = {
      ...currentUserStatus,
      ...newStatus,
      lastActive: new Date()
    };
    
    setCurrentUserStatus(updatedStatus);
    
    // Presence 업데이트
    await trackUserPresence();
    
    // 상태 변경 브로드캐스트
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'status_change',
        payload: {
          user_id: user.id,
          user_name: user.name,
          status: updatedStatus.status,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log('👥 [OnlineUsers] Status updated:', updatedStatus);
  }, [currentUserStatus, trackUserPresence, isConnected, user]);

  // 활동 업데이트
  const updateUserActivity = useCallback(async (activity, location = null) => {
    const updatedStatus = {
      ...currentUserStatus,
      activity,
      location: location || window.location.pathname,
      lastActive: new Date()
    };
    
    setCurrentUserStatus(updatedStatus);
    lastActivityRef.current = new Date();
    
    // Presence 업데이트
    await trackUserPresence();
    
    // 활동 브로드캐스트
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'activity_update',
        payload: {
          user_id: user.id,
          user_name: user.name,
          activity,
          location: updatedStatus.location,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log('👥 [OnlineUsers] Activity updated:', activity);
  }, [currentUserStatus, trackUserPresence, isConnected, user]);

  // 하트비트 시작
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(async () => {
      if (channelRef.current && isConnected) {
        await trackUserPresence();
        
        // 5분간 활동이 없으면 away 상태로 변경
        const timeSinceLastActivity = new Date() - lastActivityRef.current;
        if (timeSinceLastActivity > 5 * 60 * 1000 && currentUserStatus.status === 'online') {
          updateUserStatus({ status: 'away' });
        }
      }
    }, 30000); // 30초마다 하트비트
  }, [isConnected, trackUserPresence, currentUserStatus.status, updateUserStatus]);

  // 활동 추적 초기화
  const initializeActivityTracking = useCallback(() => {
    // 마우스 이동, 키보드 입력 등을 감지하여 활동 상태 업데이트
    const resetActivityTimer = () => {
      lastActivityRef.current = new Date();
      
      if (currentUserStatus.status === 'away') {
        updateUserStatus({ status: 'online' });
      }
      
      // 활동 타이머 재설정
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        if (currentUserStatus.status === 'online') {
          updateUserStatus({ status: 'away' });
        }
      }, 5 * 60 * 1000); // 5분
    };

    // 페이지 이벤트 리스너 추가
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });

    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        updateUserStatus({ status: 'away' });
      } else {
        updateUserStatus({ status: 'online' });
        resetActivityTimer();
      }
    });

    // 창 포커스 변경 감지
    window.addEventListener('focus', () => {
      updateUserStatus({ status: 'online' });
      resetActivityTimer();
    });

    window.addEventListener('blur', () => {
      updateUserStatus({ status: 'away' });
    });

    // 페이지 언로드 시 오프라인 상태로 변경
    const handleBeforeUnload = () => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'status_change',
          payload: {
            user_id: user.id,
            user_name: user.name,
            status: 'offline',
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // 정리 함수 반환
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });
      document.removeEventListener('visibilitychange', resetActivityTimer);
      window.removeEventListener('focus', resetActivityTimer);
      window.removeEventListener('blur', resetActivityTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [currentUserStatus.status, updateUserStatus, user]);

  // 페이지별 온라인 사용자 필터링
  const getUsersByLocation = useCallback((location) => {
    return onlineUsers.filter(user => user.location === location);
  }, [onlineUsers]);

  // 활동별 사용자 필터링
  const getUsersByActivity = useCallback((activity) => {
    return onlineUsers.filter(user => user.activity === activity);
  }, [onlineUsers]);

  // 사용자 상태별 개수
  const getUserCountByStatus = useCallback(() => {
    const counts = {
      online: onlineUsers.filter(u => u.status === 'online').length,
      away: onlineUsers.filter(u => u.status === 'away').length,
      busy: onlineUsers.filter(u => u.status === 'busy').length,
      offline: 0
    };
    
    // 현재 사용자 포함
    counts[currentUserStatus.status]++;
    
    return counts;
  }, [onlineUsers, currentUserStatus.status]);

  // 알림 표시
  const showUserActivityNotification = useCallback((message, type) => {
    console.log(`👥 [OnlineUsers] ${message}`);
    
    // 간단한 토스트 알림 (실제로는 별도 알림 시스템 연동)
    if (window.showToast) {
      window.showToast(message, type);
    }
  }, []);

  // 정리 함수
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setOnlineUsers([]);
    setTotalOnlineCount(0);
    
    console.log('👥 [OnlineUsers] Connection cleaned up');
  }, []);

  // 연결 재시도
  const reconnect = useCallback(() => {
    console.log('🔄 [OnlineUsers] Attempting to reconnect...');
    cleanup();
    setTimeout(initializePresenceSystem, 2000);
  }, [initializePresenceSystem]);

  return {
    // 온라인 사용자 데이터
    onlineUsers,
    totalOnlineCount,
    userActivity,
    
    // 현재 사용자 상태
    currentUserStatus,
    
    // 연결 상태
    isConnected,
    connectionStatus,
    
    // 상태 관리
    updateUserStatus,
    updateUserActivity,
    
    // 유틸리티
    getUsersByLocation,
    getUsersByActivity,
    getUserCountByStatus,
    
    // 연결 관리
    reconnect,
    
    // 상태 헬퍼
    isUserOnline: (userId) => onlineUsers.some(u => u.id === userId && u.status === 'online'),
    getUserStatus: (userId) => onlineUsers.find(u => u.id === userId)?.status || 'offline',
    getUserActivity: (userId) => onlineUsers.find(u => u.id === userId)?.activity || 'unknown'
  };
};

export default useOnlineUsers;