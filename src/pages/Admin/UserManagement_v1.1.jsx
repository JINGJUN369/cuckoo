import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { Button } from '../../components/ui';

/**
 * v1.1 UserManagement - 향상된 사용자 관리 시스템
 * 
 * 주요 기능:
 * - 사용자 승인/거부 관리
 * - 역할 및 권한 관리
 * - 계정 잠금/해제
 * - 비밀번호 초기화
 * - 사용자 활동 모니터링
 * - 대량 관리 기능
 * - 사용자 검색 및 필터링
 * - 상세 사용자 정보 관리
 */
const UserManagement_v11 = () => {
  console.log('👥 [v1.1] UserManagement rendering');

  const { user: currentUser, hasPermission, PERMISSIONS, ROLES, toggleAccountLock } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  // 권한 확인
  if (!hasPermission(PERMISSIONS.USER_READ)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">사용자 관리 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = () => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setUsers(storedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };

    loadUsers();
    
    // 정기적으로 사용자 목록 새로고침
    const interval = setInterval(loadUsers, 30000); // 30초마다
    return () => clearInterval(interval);
  }, []);

  // 필터링된 사용자 목록
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          user.name?.toLowerCase().includes(searchLower) ||
          user.id?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // 상태 필터
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }

      // 역할 필터
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }

      // 부서 필터
      if (departmentFilter !== 'all' && user.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, statusFilter, roleFilter, departmentFilter]);

  // 부서 목록 추출
  const departments = useMemo(() => {
    const depts = [...new Set(users.map(user => user.department).filter(Boolean))];
    return depts.sort();
  }, [users]);

  // 사용자 승인
  const approveUser = useCallback(async (userId) => {
    if (!hasPermission(PERMISSIONS.USER_APPROVE)) {
      alert('사용자 승인 권한이 없습니다.');
      return;
    }

    try {
      const updatedUsers = users.map(user =>
        user.id === userId
          ? {
              ...user,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser?.id
            }
          : user
      );

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // 활동 로그 기록
      logActivity(currentUser?.id, 'USER_APPROVED', `사용자 승인: ${userId}`);
      
      alert('사용자가 승인되었습니다.');
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('사용자 승인 중 오류가 발생했습니다.');
    }
  }, [users, hasPermission, currentUser?.id]);

  // 사용자 거부
  const rejectUser = useCallback(async (userId, reason = '') => {
    if (!hasPermission(PERMISSIONS.USER_APPROVE)) {
      alert('사용자 거부 권한이 없습니다.');
      return;
    }

    const rejectionReason = reason || prompt('거부 사유를 입력해주세요:');
    if (!rejectionReason) return;

    try {
      const updatedUsers = users.map(user =>
        user.id === userId
          ? {
              ...user,
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: currentUser?.id,
              rejectionReason
            }
          : user
      );

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      logActivity(currentUser?.id, 'USER_REJECTED', `사용자 거부: ${userId}, 사유: ${rejectionReason}`);
      
      alert('사용자가 거부되었습니다.');
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('사용자 거부 중 오류가 발생했습니다.');
    }
  }, [users, hasPermission, currentUser?.id]);

  // 사용자 역할 변경
  const changeUserRole = useCallback(async (userId, newRole) => {
    if (!hasPermission(PERMISSIONS.USER_UPDATE)) {
      alert('사용자 수정 권한이 없습니다.');
      return;
    }

    try {
      const updatedUsers = users.map(user =>
        user.id === userId
          ? {
              ...user,
              role: newRole,
              roleChangedAt: new Date().toISOString(),
              roleChangedBy: currentUser?.id
            }
          : user
      );

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      logActivity(currentUser?.id, 'USER_ROLE_CHANGED', `역할 변경: ${userId} -> ${newRole}`);
      
      alert('사용자 역할이 변경되었습니다.');
    } catch (error) {
      console.error('Failed to change user role:', error);
      alert('역할 변경 중 오류가 발생했습니다.');
    }
  }, [users, hasPermission, currentUser?.id]);

  // 비밀번호 초기화
  const resetUserPassword = useCallback(async (userId) => {
    if (!hasPermission(PERMISSIONS.USER_UPDATE)) {
      alert('사용자 수정 권한이 없습니다.');
      return;
    }

    if (!window.confirm('이 사용자의 비밀번호를 초기화하시겠습니까?')) {
      return;
    }

    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      const updatedUsers = users.map(user =>
        user.id === userId
          ? {
              ...user,
              password: tempPassword,
              mustChangePassword: true,
              passwordResetAt: new Date().toISOString(),
              passwordResetBy: currentUser?.id
            }
          : user
      );

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      logActivity(currentUser?.id, 'PASSWORD_RESET_ADMIN', `관리자 비밀번호 초기화: ${userId}`);
      
      alert(`비밀번호가 초기화되었습니다.\n임시 비밀번호: ${tempPassword}\n사용자에게 전달해주세요.`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('비밀번호 초기화 중 오류가 발생했습니다.');
    }
  }, [users, hasPermission, currentUser?.id]);

  // 계정 잠금/해제
  const toggleUserLock = useCallback(async (userId, shouldLock) => {
    try {
      const result = await toggleAccountLock(userId, shouldLock);
      if (result.success) {
        // 로컬 상태 업데이트
        const updatedUsers = users.map(user =>
          user.id === userId ? { ...user, isLocked: shouldLock } : user
        );
        setUsers(updatedUsers);
        
        alert(`계정이 ${shouldLock ? '잠김' : '해제'}되었습니다.`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to toggle account lock:', error);
      alert('계정 상태 변경 중 오류가 발생했습니다.');
    }
  }, [users, toggleAccountLock]);

  // 대량 작업 실행
  const executeBulkAction = useCallback(async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      alert('작업을 선택하고 대상 사용자를 선택해주세요.');
      return;
    }

    const confirmMessage = `${selectedUsers.length}명의 사용자에 대해 "${bulkAction}" 작업을 수행하시겠습니까?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      let updatedUsers = [...users];

      for (const userId of selectedUsers) {
        switch (bulkAction) {
          case 'approve':
            if (hasPermission(PERMISSIONS.USER_APPROVE)) {
              updatedUsers = updatedUsers.map(user =>
                user.id === userId && user.status === 'pending'
                  ? {
                      ...user,
                      status: 'approved',
                      approvedAt: new Date().toISOString(),
                      approvedBy: currentUser?.id
                    }
                  : user
              );
            }
            break;

          case 'reject':
            if (hasPermission(PERMISSIONS.USER_APPROVE)) {
              const reason = prompt('거부 사유를 입력해주세요:');
              if (reason) {
                updatedUsers = updatedUsers.map(user =>
                  user.id === userId && user.status === 'pending'
                    ? {
                        ...user,
                        status: 'rejected',
                        rejectedAt: new Date().toISOString(),
                        rejectedBy: currentUser?.id,
                        rejectionReason: reason
                      }
                    : user
                );
              }
            }
            break;

          case 'lock':
            if (hasPermission(PERMISSIONS.USER_UPDATE)) {
              updatedUsers = updatedUsers.map(user =>
                user.id === userId
                  ? {
                      ...user,
                      isLocked: true,
                      lockedAt: new Date().toISOString(),
                      lockedBy: currentUser?.id
                    }
                  : user
              );
            }
            break;

          case 'unlock':
            if (hasPermission(PERMISSIONS.USER_UPDATE)) {
              updatedUsers = updatedUsers.map(user =>
                user.id === userId
                  ? {
                      ...user,
                      isLocked: false,
                      unlockedAt: new Date().toISOString(),
                      unlockedBy: currentUser?.id
                    }
                  : user
              );
            }
            break;
        }
      }

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      logActivity(
        currentUser?.id,
        'BULK_USER_ACTION',
        `대량 작업 수행: ${bulkAction}, 대상: ${selectedUsers.length}명`
      );
      
      setSelectedUsers([]);
      setBulkAction('');
      alert('대량 작업이 완료되었습니다.');
    } catch (error) {
      console.error('Failed to execute bulk action:', error);
      alert('대량 작업 중 오류가 발생했습니다.');
    }
  }, [bulkAction, selectedUsers, users, hasPermission, currentUser?.id]);

  // 사용자 선택 토글
  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // 전체 선택/해제
  const toggleAllSelection = useCallback(() => {
    setSelectedUsers(prev =>
      prev.length === filteredUsers.length
        ? []
        : filteredUsers.map(user => user.id)
    );
  }, [filteredUsers]);

  // 사용자 상태 뱃지
  const getStatusBadge = (user) => {
    const badges = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[user.status] || 'bg-gray-100 text-gray-700'}`}>
        {user.status === 'approved' ? '승인됨' :
         user.status === 'pending' ? '대기중' : '거부됨'}
        {user.isLocked && ' 🔒'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-1">
            전체 {users.length}명 | 필터링됨 {filteredUsers.length}명
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {hasPermission(PERMISSIONS.USER_CREATE) && (
            <Button
              variant="primary"
              onClick={() => {
                setSelectedUser(null);
                setShowUserModal(true);
              }}
            >
              ➕ 사용자 추가
            </Button>
          )}
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="이름, 사번, 이메일 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 상태</option>
              <option value="approved">승인됨</option>
              <option value="pending">대기중</option>
              <option value="rejected">거부됨</option>
            </select>
          </div>
          
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 역할</option>
              {Object.values(ROLES).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 부서</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setDepartmentFilter('all');
              }}
              className="w-full"
            >
              초기화
            </Button>
          </div>
        </div>
      </div>

      {/* 대량 작업 */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-800 font-medium">
                {selectedUsers.length}명 선택됨
              </span>
              
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-blue-300 rounded-md text-sm"
              >
                <option value="">작업 선택</option>
                {hasPermission(PERMISSIONS.USER_APPROVE) && (
                  <>
                    <option value="approve">승인</option>
                    <option value="reject">거부</option>
                  </>
                )}
                {hasPermission(PERMISSIONS.USER_UPDATE) && (
                  <>
                    <option value="lock">계정 잠금</option>
                    <option value="unlock">계정 해제</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={executeBulkAction}
                disabled={!bulkAction}
              >
                실행
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUsers([])}
              >
                선택 해제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 로그인
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    조건에 맞는 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name?.charAt(0) || user.id?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.id} | {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {hasPermission(PERMISSIONS.USER_UPDATE) ? (
                        <select
                          value={user.role || ROLES.USER}
                          onChange={(e) => changeUserRole(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {Object.values(ROLES).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">{user.role || ROLES.USER}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleString('ko-KR')
                        : '없음'
                      }
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.status === 'pending' && hasPermission(PERMISSIONS.USER_APPROVE) && (
                          <>
                            <button
                              onClick={() => approveUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              거부
                            </button>
                          </>
                        )}
                        
                        {hasPermission(PERMISSIONS.USER_UPDATE) && (
                          <>
                            <button
                              onClick={() => toggleUserLock(user.id, !user.isLocked)}
                              className={user.isLocked ? "text-green-600 hover:text-green-900" : "text-red-600 hover:text-red-900"}
                            >
                              {user.isLocked ? '해제' : '잠금'}
                            </button>
                            
                            <button
                              onClick={() => resetUserPassword(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              초기화
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          상세
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사용자 상세 모달 (간단 구현) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedUser ? '사용자 상세 정보' : '새 사용자 추가'}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {selectedUser && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">이름</label>
                    <p className="text-sm text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">사번</label>
                    <p className="text-sm text-gray-900">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">이메일</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">부서</label>
                    <p className="text-sm text-gray-900">{selectedUser.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">가입일</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">로그인 횟수</label>
                    <p className="text-sm text-gray-900">{selectedUser.loginCount || 0}회</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
    
    if (activityLogs.length > 5000) {
      activityLogs.splice(0, activityLogs.length - 5000);
    }
    
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
  } catch (error) {
    console.error('Activity log error:', error);
  }
};

export default UserManagement_v11;