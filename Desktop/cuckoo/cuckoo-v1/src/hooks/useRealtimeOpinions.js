// 실시간 의견 시스템 - Supabase Realtime 기반
import { useCallback, useEffect, useState, useRef } from 'react';
import { useHybridAuth } from './useHybridAuth';
import { useHybridOpinions } from './useHybridOpinions';
import { supabase, executeSupabaseQuery, getHybridMode, HYBRID_MODE } from '../lib/supabase';

/**
 * 실시간 의견 시스템 훅
 * - 실시간 의견 구독 및 업데이트
 * - 다중 사용자 동시 편집 지원
 * - 충돌 감지 및 해결
 * - 타이핑 상태 표시
 */
export const useRealtimeOpinions = (projectId) => {
  const { user } = useHybridAuth();
  const hybridOpinions = useHybridOpinions();
  
  // 실시간 상태 관리
  const [realtimeOpinions, setRealtimeOpinions] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]); // 현재 활성 사용자들
  const [typingUsers, setTypingUsers] = useState([]); // 타이핑 중인 사용자들
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // 채널 및 구독 관리
  const channelRef = useRef(null);
  const presenceRef = useRef(null);
  const typingTimeoutRef = useRef({});
  
  // 실시간 연결 초기화
  useEffect(() => {
    if (!projectId || getHybridMode() === HYBRID_MODE.DISABLED || !user) {
      return;
    }

    console.log(`📡 [Realtime] Initializing for project: ${projectId}, user: ${user.name}`);
    initializeRealtimeConnection();

    return () => {
      cleanup();
    };
  }, [projectId, user?.id]);

  // 실시간 연결 초기화
  const initializeRealtimeConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      // 기존 채널 정리
      cleanup();
      
      const channelName = `opinions_${projectId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: user.id }
        }
      });

      // 의견 변경 구독
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'opinions',
        filter: `project_id=eq.${projectId}`
      }, handleOpinionChange);

      // 사용자 Presence 구독 (누가 현재 보고 있는지)
      channel.on('presence', { event: 'sync' }, handlePresenceSync);
      channel.on('presence', { event: 'join' }, handlePresenceJoin);
      channel.on('presence', { event: 'leave' }, handlePresenceLeave);

      // 타이핑 상태 브로드캐스트 구독
      channel.on('broadcast', { event: 'typing' }, handleTypingBroadcast);
      channel.on('broadcast', { event: 'stop_typing' }, handleStopTypingBroadcast);

      // 채널 구독
      const subscriptionResult = await channel.subscribe(async (status) => {
        console.log(`📡 [Realtime] Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          
          // 자신의 presence 정보 전송
          await channel.track({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            joined_at: new Date().toISOString(),
            project_id: projectId
          });
          
          console.log('✅ [Realtime] Successfully connected and tracked');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setIsConnected(false);
          console.error('❌ [Realtime] Channel error');
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('timeout');
          setIsConnected(false);
          console.error('⏰ [Realtime] Connection timeout');
        }
      });

      channelRef.current = channel;
      presenceRef.current = channel.presenceState();
      
      console.log('📡 [Realtime] Channel initialized:', channelName);
      
    } catch (error) {
      console.error('❌ [Realtime] Initialization error:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [projectId, user]);

  // 의견 변경 핸들러
  const handleOpinionChange = useCallback((payload) => {
    console.log('📡 [Realtime] Opinion change received:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        handleNewOpinion(newRecord);
        break;
      case 'UPDATE':
        handleUpdatedOpinion(newRecord, oldRecord);
        break;
      case 'DELETE':
        handleDeletedOpinion(oldRecord);
        break;
      default:
        console.warn('[Realtime] Unknown event type:', eventType);
    }
  }, []);

  // 새 의견 처리
  const handleNewOpinion = useCallback((newRecord) => {
    // 자신이 작성한 의견이면 무시 (중복 방지)
    if (newRecord.created_by === user.id) {
      return;
    }

    const newOpinion = convertSupabaseToLocal(newRecord);
    
    setRealtimeOpinions(prev => {
      const exists = prev.find(op => op.id === newOpinion.id);
      if (exists) return prev;
      
      return [...prev, newOpinion].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    });

    // 로컬 스토리지에도 추가 (하이브리드 모드)
    if (getHybridMode() === HYBRID_MODE.ENABLED) {
      const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]');
      const localExists = localOpinions.find(op => op.id === newOpinion.id);
      
      if (!localExists) {
        localOpinions.push(newOpinion);
        localStorage.setItem('opinions', JSON.stringify(localOpinions));
      }
    }

    // 알림 표시
    showRealtimeNotification('새 의견', `${newRecord.author_name}님이 새로운 의견을 작성했습니다`, 'info');
    
    console.log('✅ [Realtime] New opinion added:', newOpinion.id);
  }, [user]);

  // 의견 업데이트 처리
  const handleUpdatedOpinion = useCallback((newRecord, oldRecord) => {
    // 자신이 업데이트한 경우 무시
    if (newRecord.updated_by === user.id) {
      return;
    }

    const updatedOpinion = convertSupabaseToLocal(newRecord);
    
    setRealtimeOpinions(prev => 
      prev.map(op => 
        op.id === updatedOpinion.id ? updatedOpinion : op
      )
    );

    // 로컬 스토리지 업데이트
    if (getHybridMode() === HYBRID_MODE.ENABLED) {
      const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]');
      const updatedLocalOpinions = localOpinions.map(op =>
        op.id === updatedOpinion.id ? updatedOpinion : op
      );
      localStorage.setItem('opinions', JSON.stringify(updatedLocalOpinions));
    }

    // 변경 내용에 따른 알림
    if (oldRecord.status !== newRecord.status) {
      showRealtimeNotification('의견 상태 변경', 
        `의견 상태가 "${newRecord.status}"로 변경되었습니다`, 'update');
    } else if (oldRecord.reply !== newRecord.reply && newRecord.reply) {
      showRealtimeNotification('의견 답변', 
        `${newRecord.author_name}님의 의견에 답변이 달렸습니다`, 'reply');
    }

    console.log('✅ [Realtime] Opinion updated:', updatedOpinion.id);
  }, [user]);

  // 의견 삭제 처리
  const handleDeletedOpinion = useCallback((oldRecord) => {
    setRealtimeOpinions(prev => 
      prev.filter(op => op.id !== oldRecord.id)
    );

    // 로컬 스토리지에서도 제거
    if (getHybridMode() === HYBRID_MODE.ENABLED) {
      const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]');
      const filteredOpinions = localOpinions.filter(op => op.id !== oldRecord.id);
      localStorage.setItem('opinions', JSON.stringify(filteredOpinions));
    }

    showRealtimeNotification('의견 삭제', '의견이 삭제되었습니다', 'delete');
    
    console.log('✅ [Realtime] Opinion deleted:', oldRecord.id);
  }, []);

  // Presence 동기화 핸들러
  const handlePresenceSync = useCallback(() => {
    const state = channelRef.current?.presenceState() || {};
    const users = [];

    Object.keys(state).forEach(presenceId => {
      const presence = state[presenceId][0];
      if (presence && presence.user_id !== user.id) {
        users.push({
          id: presence.user_id,
          name: presence.user_name,
          role: presence.user_role,
          joinedAt: presence.joined_at
        });
      }
    });

    setActiveUsers(users);
    console.log('👥 [Realtime] Active users updated:', users.length);
  }, [user]);

  // 사용자 참여 핸들러
  const handlePresenceJoin = useCallback((payload) => {
    const { key, newPresences } = payload;
    console.log('👋 [Realtime] User joined:', key, newPresences);
    
    if (newPresences && newPresences.length > 0) {
      const newUser = newPresences[0];
      if (newUser.user_id !== user.id) {
        showRealtimeNotification('사용자 참여', 
          `${newUser.user_name}님이 프로젝트를 보고 있습니다`, 'join');
      }
    }
  }, [user]);

  // 사용자 퇴장 핸들러
  const handlePresenceLeave = useCallback((payload) => {
    const { key, leftPresences } = payload;
    console.log('👋 [Realtime] User left:', key, leftPresences);
    
    if (leftPresences && leftPresences.length > 0) {
      const leftUser = leftPresences[0];
      if (leftUser.user_id !== user.id) {
        showRealtimeNotification('사용자 퇴장', 
          `${leftUser.user_name}님이 나갔습니다`, 'leave');
      }
    }
  }, [user]);

  // 타이핑 상태 브로드캐스트 핸들러
  const handleTypingBroadcast = useCallback((payload) => {
    const { user_id, user_name } = payload.payload;
    
    if (user_id !== user.id) {
      setTypingUsers(prev => {
        const exists = prev.find(u => u.id === user_id);
        if (exists) return prev;
        
        return [...prev, { id: user_id, name: user_name }];
      });

      // 3초 후 타이핑 상태 제거
      if (typingTimeoutRef.current[user_id]) {
        clearTimeout(typingTimeoutRef.current[user_id]);
      }
      
      typingTimeoutRef.current[user_id] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.id !== user_id));
        delete typingTimeoutRef.current[user_id];
      }, 3000);
    }
  }, [user]);

  // 타이핑 중지 브로드캐스트 핸들러
  const handleStopTypingBroadcast = useCallback((payload) => {
    const { user_id } = payload.payload;
    
    if (user_id !== user.id) {
      setTypingUsers(prev => prev.filter(u => u.id !== user_id));
      
      if (typingTimeoutRef.current[user_id]) {
        clearTimeout(typingTimeoutRef.current[user_id]);
        delete typingTimeoutRef.current[user_id];
      }
    }
  }, [user]);

  // 타이핑 상태 알림
  const broadcastTyping = useCallback(() => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          user_name: user.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [isConnected, user]);

  // 타이핑 중지 알림
  const broadcastStopTyping = useCallback(() => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: {
          user_id: user.id,
          user_name: user.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [isConnected, user]);

  // 실시간 의견 추가 (충돌 방지)
  const addRealtimeOpinion = useCallback(async (opinionData) => {
    try {
      // 먼저 로컬에 추가 (즉시 UI 반영)
      const result = await hybridOpinions.addOpinion(opinionData);
      
      if (result.success) {
        // 실시간 리스트에도 추가 (중복 방지)
        const newOpinion = result.data;
        setRealtimeOpinions(prev => {
          const exists = prev.find(op => op.id === newOpinion.id);
          if (exists) return prev;
          
          return [newOpinion, ...prev];
        });
        
        console.log('✅ [Realtime] Opinion added successfully:', newOpinion.id);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [Realtime] Error adding opinion:', error);
      return { success: false, error: error.message };
    }
  }, [hybridOpinions]);

  // 실시간 의견 업데이트
  const updateRealtimeOpinion = useCallback(async (opinionId, updates) => {
    try {
      // 먼저 로컬 업데이트
      const result = await hybridOpinions.updateOpinion(opinionId, updates);
      
      if (result.success) {
        // 실시간 리스트에도 반영
        setRealtimeOpinions(prev =>
          prev.map(op =>
            op.id === opinionId 
              ? { ...op, ...updates, updatedAt: new Date().toISOString() }
              : op
          )
        );
        
        console.log('✅ [Realtime] Opinion updated successfully:', opinionId);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [Realtime] Error updating opinion:', error);
      return { success: false, error: error.message };
    }
  }, [hybridOpinions]);

  // Supabase → LocalStorage 형식 변환
  const convertSupabaseToLocal = useCallback((supabaseOpinion) => {
    return {
      id: supabaseOpinion.id,
      projectId: supabaseOpinion.project_id,
      projectIsCompleted: supabaseOpinion.project_is_completed,
      authorName: supabaseOpinion.author_name,
      message: supabaseOpinion.message,
      stage: supabaseOpinion.stage,
      status: supabaseOpinion.status,
      priority: supabaseOpinion.priority,
      reply: supabaseOpinion.reply,
      createdAt: supabaseOpinion.created_at,
      updatedAt: supabaseOpinion.updated_at,
      createdBy: supabaseOpinion.created_by,
      updatedBy: supabaseOpinion.updated_by
    };
  }, []);

  // 실시간 알림 표시
  const showRealtimeNotification = useCallback((title, message, type = 'info') => {
    // 브라우저 알림 (권한이 있는 경우)
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: `opinion-${type}-${Date.now()}`
      });
    }
    
    // 콘솔 로그
    const emoji = type === 'info' ? '💬' : 
                 type === 'update' ? '📝' : 
                 type === 'reply' ? '💭' : 
                 type === 'delete' ? '🗑️' : 
                 type === 'join' ? '👋' : 
                 type === 'leave' ? '👋' : '📢';
    
    console.log(`${emoji} [Notification] ${title}: ${message}`);
  }, []);

  // 정리 함수
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    // 타이핑 타이머 정리
    Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    typingTimeoutRef.current = {};
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setActiveUsers([]);
    setTypingUsers([]);
    
    console.log('🔌 [Realtime] Connection cleaned up');
  }, []);

  // 연결 재시도
  const reconnect = useCallback(() => {
    console.log('🔄 [Realtime] Attempting to reconnect...');
    cleanup();
    setTimeout(initializeRealtimeConnection, 2000);
  }, [initializeRealtimeConnection]);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(`🔔 [Notification] Permission: ${permission}`);
      });
    }
  }, []);

  // 통합된 의견 리스트 (실시간 + 기존)
  const allOpinions = useMemo(() => {
    const hybridList = hybridOpinions.opinions || [];
    const realtimeList = realtimeOpinions || [];
    
    // 중복 제거 후 병합 (실시간이 우선)
    const combined = [...realtimeList];
    
    hybridList.forEach(opinion => {
      const exists = combined.find(op => op.id === opinion.id);
      if (!exists) {
        combined.push(opinion);
      }
    });
    
    return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [hybridOpinions.opinions, realtimeOpinions]);

  return {
    // 기본 의견 데이터
    opinions: allOpinions,
    realtimeOpinions,
    
    // 실시간 기능
    addOpinion: addRealtimeOpinion,
    updateOpinion: updateRealtimeOpinion,
    
    // 실시간 상태
    isConnected,
    connectionStatus,
    activeUsers,
    typingUsers,
    
    // 실시간 액션
    broadcastTyping,
    broadcastStopTyping,
    reconnect,
    
    // 기존 하이브리드 기능들
    ...hybridOpinions
  };
};

export default useRealtimeOpinions;