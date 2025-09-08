import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * PublicReportManagement v1.2 - 공개 보고서 관리 페이지
 * 
 * 주요 기능:
 * - 생성된 공개 보고서 목록 표시
 * - 보고서 활성화/비활성화 관리
 * - 보고서 삭제 기능
 * - 보고서 링크 복사
 * - 보고서 미리보기
 */
const PublicReportManagement_v1_2 = () => {
  const { profile } = useSupabaseAuth();
  const [reports, setReports] = useState(() => {
    return JSON.parse(localStorage.getItem('publicReports') || '[]');
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // 필터링된 보고서 목록
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !searchTerm || 
        report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && report.isActive) ||
        (filterStatus === 'inactive' && !report.isActive);
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reports, searchTerm, filterStatus]);

  // 보고서 상태 업데이트
  const updateReportsStorage = useCallback((newReports) => {
    setReports(newReports);
    localStorage.setItem('publicReports', JSON.stringify(newReports));
  }, []);

  // 활동 로그 기록
  const logActivity = useCallback((action, details) => {
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const newLog = {
      id: Date.now().toString(),
      userId: profile?.id,
      userName: profile?.name,
      action,
      details,
      timestamp: new Date().toISOString(),
      type: 'report_management'
    };
    activityLogs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
  }, [profile]);

  // 보고서 활성화/비활성화 토글
  const handleToggleStatus = useCallback((reportId) => {
    const updatedReports = reports.map(report => 
      report.id === reportId 
        ? { ...report, isActive: !report.isActive }
        : report
    );
    
    const targetReport = reports.find(r => r.id === reportId);
    const newStatus = !targetReport.isActive ? '활성화' : '비활성화';
    
    updateReportsStorage(updatedReports);
    logActivity('REPORT_STATUS_CHANGED', `공개 보고서 ${newStatus}: ${targetReport.projectName}`);
    
    alert(`보고서가 ${newStatus}되었습니다.`);
  }, [reports, updateReportsStorage, logActivity]);

  // 보고서 삭제
  const handleDeleteReport = useCallback(() => {
    if (!reportToDelete) return;

    const updatedReports = reports.filter(r => r.id !== reportToDelete.id);
    updateReportsStorage(updatedReports);
    
    logActivity('REPORT_DELETED', `공개 보고서 삭제: ${reportToDelete.projectName}`);
    
    setReportToDelete(null);
    setShowDeleteConfirm(false);
    alert('보고서가 삭제되었습니다.');
  }, [reportToDelete, reports, updateReportsStorage, logActivity]);

  // URL 복사
  const handleCopyUrl = useCallback((reportId) => {
    const url = `${window.location.origin}/public-report/${reportId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('URL이 클립보드에 복사되었습니다!');
      });
    } else {
      // fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL이 클립보드에 복사되었습니다!');
    }
  }, []);

  // 통계 계산
  const stats = useMemo(() => {
    const total = reports.length;
    const active = reports.filter(r => r.isActive).length;
    const inactive = reports.filter(r => !r.isActive).length;
    
    return { total, active, inactive };
  }, [reports]);

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
                <span className="text-sm font-medium text-gray-500">📊 공개 보고서 관리</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">공개 보고서 관리</h1>
          <p className="mt-2 text-gray-600">생성된 공개 보고서를 관리하고 삭제할 수 있습니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">전체</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">전체 보고서</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">활성</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">활성 보고서</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">비활성</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">비활성 보고서</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="프로젝트명, 모델명, 생성자 검색..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
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
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 보고서 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">공개 보고서가 없습니다</h3>
              <p className="text-gray-500">프로젝트에서 보고서를 생성하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.projectName}</div>
                          <div className="text-sm text-gray-500">모델명: {report.modelName || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.isActive 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <a
                          href={`/public-report/${report.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          보기
                        </a>
                        <button
                          onClick={() => handleCopyUrl(report.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          링크복사
                        </button>
                        <button
                          onClick={() => handleToggleStatus(report.id)}
                          className={`${
                            report.isActive 
                              ? 'text-gray-600 hover:text-gray-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {report.isActive ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => {
                            setReportToDelete(report);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && reportToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">보고서 삭제</h3>
              <p className="text-sm text-gray-600 mb-6">
                정말로 <strong>{reportToDelete.projectName}</strong> 프로젝트의 공개 보고서를 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없으며, 공개 링크가 더 이상 작동하지 않습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setReportToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteReport}
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

export default PublicReportManagement_v1_2;