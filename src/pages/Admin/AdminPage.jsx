import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { Button } from '../../components/ui';
import UserManagement_v11 from './UserManagement_v1.1';
import ActivityLogs from './components/ActivityLogs';

const AdminPage = () => {
  const { user, profile } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // 데이터 로드
  useEffect(() => {
    loadUsers();
    loadActivityLogs();
  }, []);

  const loadUsers = () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(storedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActivityLogs = () => {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      setActivityLogs(storedLogs.reverse()); // 최신 로그를 먼저 표시
    } catch (error) {
      console.error('Error loading activity logs:', error);
    }
  };

  // 사용자 승인
  const handleApproveUser = (userId) => {
    try {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, status: 'approved', approvedAt: new Date().toISOString() } : u
      );
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // 활동 로그 기록
      logActivity(user?.id, 'USER_APPROVED', `사용자 승인: ${userId}`);
      loadActivityLogs();
      
      alert('사용자가 승인되었습니다.');
    } catch (error) {
      alert('사용자 승인 중 오류가 발생했습니다.');
    }
  };

  // 사용자 거부
  const handleRejectUser = (userId) => {
    if (window.confirm('이 사용자의 가입 신청을 거부하시겠습니까?')) {
      try {
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // 활동 로그 기록
        logActivity(user?.id, 'USER_REJECTED', `사용자 거부: ${userId}`);
        loadActivityLogs();
        
        alert('사용자 가입 신청이 거부되었습니다.');
      } catch (error) {
        alert('사용자 거부 중 오류가 발생했습니다.');
      }
    }
  };

  // 비밀번호 초기화
  const handleResetPassword = (userId) => {
    if (window.confirm(`${userId}의 비밀번호를 000000으로 초기화하시겠습니까?`)) {
      try {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, password: '000000' } : u
        );
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // 활동 로그 기록
        logActivity(user?.id, 'PASSWORD_RESET_ADMIN', `관리자 비밀번호 초기화: ${userId}`);
        loadActivityLogs();
        
        alert('비밀번호가 000000으로 초기화되었습니다.');
      } catch (error) {
        alert('비밀번호 초기화 중 오류가 발생했습니다.');
      }
    }
  };

  // 활동 로그 기록 함수
  const logActivity = (userId, action, description) => {
    try {
      const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      
      const newLog = {
        id: Date.now().toString(),
        userId,
        action,
        description,
        timestamp: new Date().toISOString(),
        ip: 'localhost',
        userAgent: navigator.userAgent
      };

      activityLogs.push(newLog);
      
      // 최대 1000개의 로그만 보관
      if (activityLogs.length > 1000) {
        activityLogs.splice(0, activityLogs.length - 1000);
      }
      
      localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
    } catch (error) {
      console.error('Activity log error:', error);
    }
  };

  // 관리자 권한 확인
  const isAdmin = user && (profile?.role === 'admin' || profile?.team === '관리팀');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              접근 권한이 없습니다
            </h2>
            <p className="text-red-600">
              관리자만 접근할 수 있는 페이지입니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
              <p className="text-sm text-gray-600">사용자 및 시스템 관리</p>
            </div>
            <div className="text-sm text-gray-500">
              관리자: {profile?.name || user?.email} ({profile?.team})
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'users', name: '사용자 관리', icon: '👥' },
                { id: 'logs', name: '활동 로그', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <UserManagement_v11
                users={users}
                onApprove={handleApproveUser}
                onReject={handleRejectUser}
                onResetPassword={handleResetPassword}
              />
            )}
            
            {activeTab === 'logs' && (
              <ActivityLogs
                logs={activityLogs}
                users={users}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;