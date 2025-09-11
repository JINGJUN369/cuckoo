import React, { useState, useEffect, useRef } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';

/**
 * WorkStatusMonitor - 실시간 업무 모니터링 컴포넌트
 * 
 * 기능:
 * - 실시간 활동 로그 스트리밍
 * - 알림 시스템 (브라우저 알림 + 토스트)
 * - 연결 상태 모니터링
 * - 자동 재연결 기능
 */
const WorkStatusMonitor = ({ children }) => {
  const {
    activityLogs,
    fetchActivityLogs,
    setupRealtimeSubscriptions
  } = useWorkStatusStore();

  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const unsubscribeRef = useRef(null);

  // 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 실시간 구독 설정
  useEffect(() => {
    const setupMonitoring = async () => {
      try {
        // 환경 변수 확인
        if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
          console.warn('⚠️ [WorkStatusMonitor] Supabase environment variables not configured');
          setIsConnected(false);
          return;
        }

        // activity_logs 테이블이 없으므로 로그 로드 스킵
        console.log('ℹ️ [WorkStatusMonitor] Skipping activity logs (table not available)');
        
        // 실시간 구독 설정
        const unsubscribe = setupRealtimeSubscriptions();
        unsubscribeRef.current = unsubscribe;
        setIsConnected(true);
        
        console.log('✅ [WorkStatusMonitor] Real-time monitoring activated');
      } catch (error) {
        console.error('❌ [WorkStatusMonitor] Failed to setup monitoring:', error);
        setIsConnected(false);
      }
    };

    setupMonitoring();

    // 정리 함수
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // 새 활동 감지 및 알림
  useEffect(() => {
    if (activityLogs.length > 0) {
      const latestActivity = activityLogs[0];
      
      // 첫 로드가 아니고 새 활동이 있을 때만 알림
      if (lastActivity && latestActivity.id !== lastActivity.id) {
        showNotification(latestActivity);
        addToastNotification(latestActivity);
      }
      
      setLastActivity(latestActivity);
    }
  }, [activityLogs, lastActivity]);

  // 브라우저 알림 표시
  const showNotification = (activity) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = '업무현황 업데이트';
      const body = `${activity.profiles?.name || '사용자'}님이 ${
        activity.action_type === 'create' ? '새 업무를 생성' :
        activity.action_type === 'update' ? '업무를 수정' : '업무를 삭제'
      }했습니다.`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `work-activity-${activity.id}`,
        timestamp: new Date(activity.created_at).getTime()
      });

      // 5초 후 자동 닫기
      setTimeout(() => {
        notification.close();
      }, 5000);

      // 클릭 시 해당 페이지로 이동
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // 토스트 알림 추가
  const addToastNotification = (activity) => {
    const notification = {
      id: `toast-${activity.id}-${Date.now()}`,
      type: 'info',
      title: '실시간 업데이트',
      message: `${activity.profiles?.name || '사용자'}님이 ${
        activity.action_type === 'create' ? '새 업무를 생성' :
        activity.action_type === 'update' ? '업무를 수정' : '업무를 삭제'
      }했습니다.`,
      timestamp: new Date(activity.created_at),
      autoClose: 5000
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // 최대 5개까지만 유지

    // 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, notification.autoClose);
  };

  // 토스트 알림 수동 닫기
  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 연결 상태 표시
  const ConnectionStatus = () => (
    <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
      isConnected 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{isConnected ? '실시간 연결됨' : '연결 끊김'}</span>
      </div>
    </div>
  );

  // 토스트 알림들
  const ToastNotifications = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">🔄</span>
                <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {notification.timestamp.toLocaleString('ko-KR')}
              </p>
            </div>
            <button
              onClick={() => closeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {children}
      <ConnectionStatus />
      <ToastNotifications />
      
      {/* CSS styles inline */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        @keyframes pulse-custom {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse-custom {
          animation: pulse-custom 2s infinite;
        }
      `}</style>
    </>
  );
};

export default WorkStatusMonitor;