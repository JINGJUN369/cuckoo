import React, { useState } from 'react';

const ActivityLogs = ({ logs, users }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // 사용자 이름 가져오기
  const getUserName = (userId) => {
    if (userId === 'SYSTEM') return '시스템';
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} (${userId})` : userId;
  };

  // 로그 필터링
  const filteredLogs = logs.filter(log => {
    // 액션 타입 필터
    const matchesActionFilter = filter === 'all' || log.action.includes(filter.toUpperCase());
    
    // 검색어 필터
    const matchesSearch = 
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(log.userId).toLowerCase().includes(searchTerm.toLowerCase());
    
    // 날짜 필터
    let matchesDateFilter = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDateFilter = logDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateFilter = logDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateFilter = logDate >= monthAgo;
          break;
        default:
          break;
      }
    }
    
    return matchesActionFilter && matchesSearch && matchesDateFilter;
  });

  // 액션 타입별 아이콘과 색상
  const getActionInfo = (action) => {
    const actionMap = {
      LOGIN: { icon: '🔐', label: '로그인', color: 'text-blue-600 bg-blue-50' },
      LOGOUT: { icon: '🚪', label: '로그아웃', color: 'text-gray-600 bg-gray-50' },
      REGISTER: { icon: '👤', label: '회원가입', color: 'text-green-600 bg-green-50' },
      PASSWORD_RESET: { icon: '🔑', label: '비밀번호 초기화', color: 'text-orange-600 bg-orange-50' },
      USER_APPROVED: { icon: '✅', label: '사용자 승인', color: 'text-green-600 bg-green-50' },
      USER_REJECTED: { icon: '❌', label: '사용자 거부', color: 'text-red-600 bg-red-50' },
      PROJECT_CREATE: { icon: '📝', label: '프로젝트 생성', color: 'text-indigo-600 bg-indigo-50' },
      PROJECT_UPDATE: { icon: '✏️', label: '프로젝트 수정', color: 'text-purple-600 bg-purple-50' },
      PROJECT_DELETE: { icon: '🗑️', label: '프로젝트 삭제', color: 'text-red-600 bg-red-50' },
      // 업무현황 관련 액션들
      WORK_CREATE: { icon: '📝', label: '업무 생성', color: 'text-cyan-600 bg-cyan-50' },
      WORK_UPDATE: { icon: '✏️', label: '업무 수정', color: 'text-teal-600 bg-teal-50' },
      WORK_DELETE: { icon: '🗑️', label: '업무 삭제', color: 'text-red-600 bg-red-50' },
      WORK_COMPLETE: { icon: '✅', label: '업무 종결', color: 'text-green-600 bg-green-50' },
      TASK_CREATE: { icon: '📋', label: '세부업무 생성', color: 'text-blue-600 bg-blue-50' },
      TASK_UPDATE: { icon: '🔄', label: '세부업무 수정', color: 'text-indigo-600 bg-indigo-50' },
      TASK_DELETE: { icon: '🗑️', label: '세부업무 삭제', color: 'text-red-600 bg-red-50' },
      TASK_STATUS_CHANGE: { icon: '🔄', label: '업무 상태 변경', color: 'text-yellow-600 bg-yellow-50' },
      PROGRESS_UPDATE: { icon: '📊', label: '진행현황 업데이트', color: 'text-purple-600 bg-purple-50' }
    };
    
    return actionMap[action] || { icon: '📋', label: action, color: 'text-gray-600 bg-gray-50' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">활동 로그</h2>
        <p className="text-sm text-gray-600">
          시스템의 모든 사용자 활동을 추적합니다. (총 {filteredLogs.length}개 로그)
        </p>
      </div>

      {/* 필터 컨트롤 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 액션 타입 필터 */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: '전체' },
            { key: 'login', label: '로그인/아웃' },
            { key: 'user', label: '사용자 관리' },
            { key: 'project', label: '프로젝트' },
            { key: 'work', label: '업무현황' },
            { key: 'task', label: '세부업무' },
            { key: 'password', label: '비밀번호' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === key
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 날짜 필터 */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">전체 기간</option>
          <option value="today">오늘</option>
          <option value="week">최근 7일</option>
          <option value="month">최근 30일</option>
        </select>

        {/* 검색 */}
        <input
          type="text"
          placeholder="사용자나 내용으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 로그 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            활동 로그가 없습니다
          </h3>
          <p className="text-gray-600">
            선택한 조건에 맞는 로그가 없습니다
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const actionInfo = getActionInfo(log.action);
                
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      {/* 아이콘 */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${actionInfo.color}`}>
                        {actionInfo.icon}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {getUserName(log.userId)}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{formatRelativeTime(log.timestamp)}</span>
                            <span>•</span>
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600">
                          {log.description}
                        </p>
                        
                        {/* 추가 정보 */}
                        {log.ip && (
                          <div className="mt-2 text-xs text-gray-400">
                            IP: {log.ip}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;