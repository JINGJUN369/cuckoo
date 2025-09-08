import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * AuditLogPage v1.2 - 완전한 활동 로그 시스템
 * 
 * 주요 기능:
 * - 시스템 활동 로그 실시간 조회
 * - 사용자별/활동별/날짜별 필터링
 * - 로그 검색 및 정렬
 * - 보안 이벤트 하이라이팅
 * - CSV 내보내기
 * - 실시간 통계
 */
const AuditLogPage_v1_2 = () => {
  const { profile } = useSupabaseAuth();
  const [activityLogs, setActivityLogs] = useState(() => {
    return JSON.parse(localStorage.getItem('activityLogs') || '[]');
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 활동 타입별 색상 매핑
  const getActivityTypeColor = useCallback((type) => {
    const colorMap = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'project_created': 'bg-blue-100 text-blue-800',
      'project_updated': 'bg-blue-100 text-blue-800',
      'project_deleted': 'bg-red-100 text-red-800',
      'opinion_created': 'bg-purple-100 text-purple-800',
      'opinion_updated': 'bg-purple-100 text-purple-800',
      'user_management': 'bg-orange-100 text-orange-800',
      'security': 'bg-red-100 text-red-800',
      'data_export': 'bg-yellow-100 text-yellow-800',
      'system': 'bg-indigo-100 text-indigo-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  }, []);

  // 활동 액션별 아이콘
  const getActionIcon = useCallback((action) => {
    const iconMap = {
      'LOGIN': '🔑',
      'LOGOUT': '🚪',
      'PROJECT_CREATED': '📁',
      'PROJECT_UPDATED': '📝',
      'PROJECT_DELETED': '🗑️',
      'OPINION_CREATED': '💬',
      'OPINION_UPDATED': '💬',
      'USER_CREATED': '👤',
      'USER_UPDATED': '👤',
      'USER_DELETED': '❌',
      'PASSWORD_RESET': '🔐',
      'DATA_EXPORT': '📊',
      'SYSTEM_BACKUP': '💾'
    };
    return iconMap[action] || '📋';
  }, []);

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = activityLogs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = filterUser === 'all' || log.userId === filterUser;
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesType = filterType === 'all' || log.type === filterType;
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const days = parseInt(dateRange);
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        matchesDate = logDate >= cutoff;
      }
      
      return matchesSearch && matchesUser && matchesAction && matchesType && matchesDate;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [activityLogs, searchTerm, filterUser, filterAction, filterType, dateRange, sortBy, sortOrder]);

  const uniqueUsers = useMemo(() => {
    const users = [...new Set(activityLogs.map(log => ({ id: log.userId, name: log.userName })))];
    return users.filter(u => u.id && u.name);
  }, [activityLogs]);

  const uniqueActions = useMemo(() => {
    return [...new Set(activityLogs.map(log => log.action))].filter(Boolean);
  }, [activityLogs]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(activityLogs.map(log => log.type))].filter(Boolean);
  }, [activityLogs]);

  const logStats = useMemo(() => {
    const total = activityLogs.length;
    const today = new Date().toDateString();
    const todayLogs = activityLogs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    ).length;
    
    const securityLogs = activityLogs.filter(log => 
      log.type === 'security' || log.action.includes('PASSWORD') || log.action === 'LOGIN'
    ).length;
    
    const userActivities = activityLogs.filter(log => 
      log.type === 'user_management'
    ).length;
    
    const projectActivities = activityLogs.filter(log => 
      log.action.includes('PROJECT')
    ).length;
    
    return { total, todayLogs, securityLogs, userActivities, projectActivities };
  }, [activityLogs]);

  const exportLogs = useCallback(() => {
    const exportData = filteredAndSortedLogs.map(log => ({
      날짜시간: new Date(log.timestamp).toLocaleString('ko-KR'),
      사용자: log.userName || '시스템',
      활동: log.action || '',
      유형: log.type || '',
      세부내용: log.details || '',
      IP주소: log.ipAddress || 'N/A'
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `활동로그_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [filteredAndSortedLogs]);

  const clearOldLogs = useCallback(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredLogs = activityLogs.filter(log => 
      new Date(log.timestamp) >= thirtyDaysAgo
    );
    setActivityLogs(filteredLogs);
    localStorage.setItem('activityLogs', JSON.stringify(filteredLogs));
    setShowDeleteConfirm(false);
  }, [activityLogs]);

  // 관리자 권한 확인
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-6">관리자만 접근할 수 있는 페이지입니다.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 네비게이션 */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                📊 대시보드
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link 
                  to="/admin" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  ⚙️ 관리자
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500">📋 활동 로그</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">활동 로그</h1>
          <p className="mt-2 text-gray-600">시스템의 모든 활동을 추적하고 모니터링합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">전체</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">전체 로그</p>
                <p className="text-2xl font-semibold text-gray-900">{logStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">오늘</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">오늘 활동</p>
                <p className="text-2xl font-semibold text-gray-900">{logStats.todayLogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">보안</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">보안 활동</p>
                <p className="text-2xl font-semibold text-gray-900">{logStats.securityLogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">사용자</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">사용자 관리</p>
                <p className="text-2xl font-semibold text-gray-900">{logStats.userActivities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">프로젝트</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">프로젝트 활동</p>
                <p className="text-2xl font-semibold text-gray-900">{logStats.projectActivities}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="사용자, 활동, 세부내용 검색..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                  >
                    <option value="all">모든 사용자</option>
                    {uniqueUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>

                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                  >
                    <option value="all">모든 활동</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>

                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">모든 유형</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">전체 기간</option>
                  <option value="1">1일</option>
                  <option value="7">7일</option>
                  <option value="30">30일</option>
                  <option value="90">90일</option>
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                >
                  <option value="timestamp-desc">최신순</option>
                  <option value="timestamp-asc">오래된순</option>
                  <option value="userName-asc">사용자 이름 ↑</option>
                  <option value="userName-desc">사용자 이름 ↓</option>
                  <option value="action-asc">활동 ↑</option>
                  <option value="action-desc">활동 ↓</option>
                </select>

                <button
                  onClick={exportLogs}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  내보내기
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  오래된 로그 삭제
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              총 {activityLogs.length}개 로그 중 {filteredAndSortedLogs.length}개 표시
            </div>
          </div>
        </div>

        {/* 활동 로그 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredAndSortedLogs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">활동 로그가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">조건에 맞는 활동 로그를 찾을 수 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {filteredAndSortedLogs.map((log, index) => (
                    <div key={log.id || index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">{getActionIcon(log.action)}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {log.userName || '시스템'}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityTypeColor(log.type)}`}>
                                {log.type || 'system'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          
                          <div className="mt-1">
                            <p className="text-sm text-gray-900 font-medium">
                              {log.action}
                            </p>
                            {log.details && (
                              <p className="text-sm text-gray-600 mt-1">
                                {log.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 30일 이상 오래된 로그 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">오래된 로그 삭제</h3>
              <p className="text-sm text-gray-600 mb-6">
                30일 이상 된 활동 로그를 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={clearOldLogs}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage_v1_2;