import React, { useState } from 'react';
import { Button } from '../../../components/ui';

const UserManagement = ({ users, onApprove, onReject, onResetPassword }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [searchTerm, setSearchTerm] = useState('');

  // 사용자 필터링
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = 
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.team.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // 상태별 카운트
  const statusCounts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: '승인 대기', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved: { label: '승인됨', color: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: '거부됨', color: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    const config = configs[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">사용자 관리</h2>
          <p className="text-sm text-gray-600">
            전체 {statusCounts.all}명 (승인 대기: {statusCounts.pending}명, 승인됨: {statusCounts.approved}명)
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: `전체 (${statusCounts.all})` },
            { key: 'pending', label: `승인 대기 (${statusCounts.pending})` },
            { key: 'approved', label: `승인됨 (${statusCounts.approved})` }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filter === key
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="사번, 이름, 이메일, 팀명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 사용자 목록 */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? '검색 결과가 없습니다' : '사용자가 없습니다'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? '다른 검색어를 시도해보세요' : '가입 신청을 기다려주세요'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    팀/부서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.team}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                      {user.approvedAt && (
                        <div className="text-xs text-green-600">
                          승인: {formatDate(user.approvedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {user.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              variant="primary"
                              onClick={() => onApprove(user.id)}
                            >
                              승인
                            </Button>
                            <Button
                              size="small"
                              variant="danger"
                              onClick={() => onReject(user.id)}
                            >
                              거부
                            </Button>
                          </>
                        )}
                        
                        {user.status === 'approved' && (
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => onResetPassword(user.id)}
                          >
                            🔑 비밀번호 초기화
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;