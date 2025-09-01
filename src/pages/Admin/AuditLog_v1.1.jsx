import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { PermissionGuard } from '../../components/ui/PermissionGuard_v1.1';

const AuditLog_v11 = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, today, week, month, custom
    startDate: '',
    endDate: '',
    action: 'all',
    userId: 'all',
    severity: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // 활동 로그 로드
  useEffect(() => {
    loadActivityLogs();
  }, []);

  // 필터링된 로그 업데이트
  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadActivityLogs = () => {
    try {
      const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 사용자 정보와 조인하여 로그 정보 강화
      const enrichedLogs = activityLogs.map(log => {
        const logUser = users.find(u => u.id === log.userId);
        return {
          ...log,
          userName: logUser ? logUser.name : log.userId === 'SYSTEM' ? 'SYSTEM' : '알 수 없는 사용자',
          userRole: logUser ? logUser.role : 'system',
          severity: getSeverityLevel(log.action),
          category: getCategoryFromAction(log.action)
        };
      });

      // 최신순으로 정렬
      enrichedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Activity logs loading error:', error);
    }
  };

  const getSeverityLevel = (action) => {
    const highSeverity = ['LOGIN_FAILED', 'PASSWORD_RESET', 'USER_DELETED', 'ROLE_CHANGED', 'PERMISSION_DENIED', 'BULK_DELETE'];
    const mediumSeverity = ['LOGIN', 'LOGOUT', 'USER_APPROVED', 'USER_REJECTED', 'PROJECT_DELETED'];
    
    if (highSeverity.includes(action)) return 'high';
    if (mediumSeverity.includes(action)) return 'medium';
    return 'low';
  };

  const getCategoryFromAction = (action) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('PASSWORD')) return '인증';
    if (action.includes('USER') || action.includes('ROLE')) return '사용자관리';
    if (action.includes('PROJECT')) return '프로젝트';
    if (action.includes('OPINION')) return '의견';
    return '시스템';
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // 날짜 필터링
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'custom':
          if (filters.startDate) {
            startDate = new Date(filters.startDate);
          }
          break;
      }

      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        if (filters.dateRange === 'custom' && filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          return logDate >= startDate && logDate <= endDate;
        }
        return logDate >= startDate;
      });
    }

    // 액션 필터링
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.category === filters.action);
    }

    // 사용자 필터링
    if (filters.userId !== 'all') {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    // 심각도 필터링
    if (filters.severity !== 'all') {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }

    // 검색 필터링
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogSelection = (logId, isSelected) => {
    if (isSelected) {
      setSelectedLogs(prev => [...prev, logId]);
    } else {
      setSelectedLogs(prev => prev.filter(id => id !== logId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const currentPageLogs = paginatedLogs.map(log => log.id);
      setSelectedLogs(prev => [...new Set([...prev, ...currentPageLogs])]);
    } else {
      const currentPageLogs = paginatedLogs.map(log => log.id);
      setSelectedLogs(prev => prev.filter(id => !currentPageLogs.includes(id)));
    }
  };

  const exportLogs = async () => {
    setIsExporting(true);
    try {
      const logsToExport = selectedLogs.length > 0 
        ? filteredLogs.filter(log => selectedLogs.includes(log.id))
        : filteredLogs;

      const csvContent = convertToCSV(logsToExport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data) => {
    const headers = ['시간', '사용자', '역할', '동작', '분류', '심각도', '설명', 'IP', 'User Agent'];
    const csvRows = [headers.join(',')];

    data.forEach(log => {
      const row = [
        new Date(log.timestamp).toLocaleString('ko-KR'),
        log.userName,
        log.userRole,
        log.action,
        log.category,
        log.severity,
        `"${log.description.replace(/"/g, '""')}"`,
        log.ip || '',
        `"${(log.userAgent || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    return '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM 추가
  };

  const deleteLogs = () => {
    if (selectedLogs.length === 0) return;
    
    if (window.confirm(`선택된 ${selectedLogs.length}개의 로그를 삭제하시겠습니까?`)) {
      const updatedLogs = logs.filter(log => !selectedLogs.includes(log.id));
      setLogs(updatedLogs);
      
      // localStorage 업데이트
      localStorage.setItem('activityLogs', JSON.stringify(updatedLogs));
      setSelectedLogs([]);
      
      // 삭제 로그 기록
      const newLog = {
        id: Date.now().toString(),
        userId: user.id,
        action: 'LOGS_DELETED',
        description: `감사 로그 ${selectedLogs.length}개 삭제됨`,
        timestamp: new Date().toISOString(),
        ip: 'localhost',
        userAgent: navigator.userAgent
      };
      
      const currentLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      currentLogs.push(newLog);
      localStorage.setItem('activityLogs', JSON.stringify(currentLogs));
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  // 통계 계산
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = filteredLogs.filter(log => new Date(log.timestamp) >= today);
    const highSeverityLogs = filteredLogs.filter(log => log.severity === 'high');
    
    const categoryStats = filteredLogs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {});

    return {
      total: filteredLogs.length,
      today: todayLogs.length,
      highSeverity: highSeverityLogs.length,
      categories: categoryStats
    };
  }, [filteredLogs]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💚';
      default: return '📝';
    }
  };

  return (
    <PermissionGuard permission="audit:logs" fallback={
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-lg font-medium text-red-600 mb-2">감사 로그 접근 권한이 없습니다</h3>
        <p className="text-gray-600">이 기능은 관리자만 사용할 수 있습니다.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📊</span>
                감사 로그 & 활동 추적
              </h1>
              <p className="text-gray-600 mt-1">시스템 활동 로그 및 사용자 행동 분석</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => loadActivityLogs()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                🔄 새로고침
              </button>
            </div>
          </div>

          {/* 통계 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">전체 로그</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.today}</div>
              <div className="text-sm text-green-600">오늘 활동</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.highSeverity}</div>
              <div className="text-sm text-red-600">높은 심각도</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.categories).length}</div>
              <div className="text-sm text-purple-600">활동 분류</div>
            </div>
          </div>
        </div>

        {/* 필터 패널 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 필터 및 검색</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 날짜 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
                <option value="month">최근 30일</option>
                <option value="custom">사용자 정의</option>
              </select>
            </div>

            {/* 활동 분류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">전체 분류</option>
                <option value="인증">인증</option>
                <option value="사용자관리">사용자관리</option>
                <option value="프로젝트">프로젝트</option>
                <option value="의견">의견</option>
                <option value="시스템">시스템</option>
              </select>
            </div>

            {/* 심각도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">심각도</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">전체 심각도</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>

            {/* 페이지 크기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">표시 개수</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>
          </div>

          {/* 사용자 정의 날짜 범위 */}
          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="설명, 사용자명, 액션 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* 로그 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* 테이블 헤더 - 액션 버튼 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={paginatedLogs.length > 0 && paginatedLogs.every(log => selectedLogs.includes(log.id))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">전체 선택</span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedLogs.length}개 선택됨
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={exportLogs}
                  disabled={isExporting}
                  className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isExporting ? '⏳' : '📤'} {selectedLogs.length > 0 ? '선택 항목' : '전체'} 내보내기
                </button>
                {selectedLogs.length > 0 && (
                  <PermissionGuard permission="audit:delete">
                    <button
                      onClick={deleteLogs}
                      className="px-3 py-1 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                    >
                      🗑️ 선택 삭제
                    </button>
                  </PermissionGuard>
                )}
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선택
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    활동
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    분류
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    심각도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id)}
                        onChange={(e) => handleLogSelection(log.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(log.timestamp).toLocaleDateString('ko-KR')}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                      <div className="text-xs text-gray-500">{log.userRole}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        <span className="mr-1">{getSeverityIcon(log.severity)}</span>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={log.description}>
                        {log.description}
                      </div>
                      {log.ip && (
                        <div className="text-xs text-gray-500 mt-1">
                          IP: {log.ip}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 빈 상태 */}
          {paginatedLogs.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">로그가 없습니다</h3>
              <p className="text-gray-600">선택한 조건에 맞는 활동 로그가 없습니다.</p>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    전체 <span className="font-medium">{filteredLogs.length}</span>개 중{' '}
                    <span className="font-medium">{startIndex + 1}</span>-{' '}
                    <span className="font-medium">{Math.min(startIndex + pageSize, filteredLogs.length)}</span>개 표시
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      const pageNum = idx + Math.max(1, currentPage - 2);
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AuditLog_v11;