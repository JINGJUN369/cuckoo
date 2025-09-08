import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { supabase } from '../../lib/supabase';

/**
 * UserManagementPage v1.2 - 완전한 사용자 관리 시스템
 * 
 * 주요 기능:
 * - 사용자 CRUD (추가/수정/삭제)
 * - 계정 승인/거부 시스템
 * - 비밀번호 초기화
 * - 사용자 권한 변경
 * - 계정 상태 관리
 * - 사용자 통계 및 필터링
 * - CSV 내보내기
 * - 활동 로그 추적
 */
const UserManagementPage_v1_2 = () => {
  const { profile } = useSupabaseAuth();
  // Supabase에서 모든 사용자 로드
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 사용자 목록 로드
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('사용자 로드 실패:', error);
        // 실패 시 LocalStorage fallback
        const approvedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
        setUsers([...approvedUsers, ...pendingUsers]);
      } else {
        console.log('✅ Supabase에서 사용자 로드:', data.length + '명');
        setUsers(data);
      }
    } catch (error) {
      console.error('사용자 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    role: 'user',
    password: '',
    confirmPassword: ''
  });

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(u => {
      const matchesSearch = !searchTerm || 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'createdAt' || sortBy === 'lastLoginAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [users, searchTerm, filterStatus, filterRole, sortBy, sortOrder]);

  const updateUsersStorage = useCallback((newUsers) => {
    setUsers(newUsers);
    
    // 승인된 사용자와 승인 대기 사용자를 분리하여 저장
    const approvedUsers = newUsers.filter(u => u.status === 'active' || u.status === 'inactive');
    const pendingUsers = newUsers.filter(u => u.status === 'pending');
    
    localStorage.setItem('users', JSON.stringify(approvedUsers));
    localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
    
    console.log('📝 [UserManagement] Storage updated:', {
      approvedCount: approvedUsers.length,
      pendingCount: pendingUsers.length
    });
  }, []);

  const logActivity = useCallback((action, details) => {
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const newLog = {
      id: Date.now().toString(),
      userId: profile?.id,
      userName: profile?.name,
      action,
      details,
      timestamp: new Date().toISOString(),
      type: 'user_management'
    };
    activityLogs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
  }, [profile]);

  const handleAddUser = useCallback((e) => {
    e.preventDefault();
    
    if (newUser.password !== newUser.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const emailExists = users.find(u => u.email === newUser.email);
    if (emailExists) {
      alert('이미 존재하는 이메일입니다.');
      return;
    }

    const userId = Date.now().toString();
    const userToAdd = {
      id: userId,
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      role: newUser.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      password: newUser.password
    };

    const newUsers = [...users, userToAdd];
    updateUsersStorage(newUsers);
    
    logActivity('USER_CREATED', `새 사용자 생성: ${newUser.name} (${newUser.email})`);
    
    setNewUser({
      name: '',
      email: '',
      department: '',
      role: 'user',
      password: '',
      confirmPassword: ''
    });
    setShowAddModal(false);
  }, [newUser, users, updateUsersStorage, logActivity]);

  const handleEditUser = useCallback((e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? { ...selectedUser } : u
    );
    
    updateUsersStorage(updatedUsers);
    logActivity('USER_UPDATED', `사용자 정보 수정: ${selectedUser.name} (${selectedUser.email})`);
    
    setSelectedUser(null);
    setShowEditModal(false);
  }, [selectedUser, users, updateUsersStorage, logActivity]);

  const handleDeleteUser = useCallback(() => {
    if (!userToDelete) return;

    const updatedUsers = users.filter(u => u.id !== userToDelete.id);
    updateUsersStorage(updatedUsers);
    
    logActivity('USER_DELETED', `사용자 삭제: ${userToDelete.name} (${userToDelete.email})`);
    
    setUserToDelete(null);
    setShowDeleteConfirm(false);
  }, [userToDelete, users, updateUsersStorage, logActivity]);

  // 사용자 승인 처리
  const handleApproveUser = useCallback(async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    console.log('✅ [UserManagement] Approving user:', targetUser.email);
    
    try {
      // 1. Supabase 업데이트
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Supabase 승인 업데이트 실패:', error);
        alert('승인 처리 중 오류가 발생했습니다.');
        return;
      }
      
      console.log('✅ Supabase 사용자 승인 완료:', userId);
      
      // 2. LocalStorage 업데이트
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              status: 'active', // LocalStorage에서는 'active' 사용
              mustChangePassword: false
            }
          : u
      );
      
      updateUsersStorage(updatedUsers);
      logActivity('USER_APPROVED', `사용자 승인: ${targetUser.name} (${targetUser.email})`);
      
      // Supabase에서 사용자 목록 다시 로드
      await loadUsers();
      
      alert(`${targetUser.name}님의 계정이 승인되었습니다.\n가입시 입력하신 비밀번호로 로그인하실 수 있습니다.`);
      
    } catch (error) {
      console.error('승인 처리 오류:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  }, [users, updateUsersStorage, logActivity, loadUsers]);

  const handleStatusToggle = useCallback((userId) => {
    const targetUser = users.find(u => u.id === userId);
    
    if (targetUser.status === 'pending') {
      // 승인 대기 상태면 승인 처리
      handleApproveUser(userId);
    } else {
      // 기존 활성/비활성 토글 로직
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u
      );
      
      const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
      
      updateUsersStorage(updatedUsers);
      logActivity('USER_STATUS_CHANGED', `사용자 상태 변경: ${targetUser.name} (${newStatus})`);
    }
  }, [users, updateUsersStorage, logActivity, handleApproveUser]);

  const handleResetPassword = useCallback((userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUsers = users.map(u => 
      u.id === userId ? { 
        ...u, 
        password: '000000',
        mustChangePassword: true 
      } : u
    );
    
    updateUsersStorage(updatedUsers);
    logActivity('PASSWORD_RESET', `비밀번호 초기화: ${targetUser.name}`);
    
    alert(`${targetUser.name}님의 비밀번호가 000000으로 초기화되었습니다.\n다음 로그인시 비밀번호 변경이 필요합니다.`);
  }, [users, updateUsersStorage, logActivity]);

  const exportUsers = useCallback(() => {
    const exportData = users.map(u => ({
      이름: u.name,
      이메일: u.email,
      부서: u.department || '',
      역할: u.role === 'admin' ? '관리자' : '사용자',
      상태: u.status === 'active' ? '활성' : '비활성',
      생성일: u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '',
      최종로그인: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ko-KR') : '없음'
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
    link.download = `사용자목록_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    logActivity('DATA_EXPORT', '사용자 목록 내보내기 실행');
  }, [users, logActivity]);

  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const pending = users.filter(u => u.status === 'pending').length;
    const admins = users.filter(u => u.role === 'admin').length;
    
    return { total, active, inactive, pending, admins };
  }, [users]);

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
                <span className="text-sm font-medium text-gray-500">👥 사용자 관리</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="mt-2 text-gray-600">시스템 사용자를 관리하고 권한을 설정합니다.</p>
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
                <p className="text-sm font-medium text-gray-500">전체 사용자</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.total}</p>
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
                <p className="text-sm font-medium text-gray-500">활성 사용자</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.active}</p>
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
                <p className="text-sm font-medium text-gray-500">비활성 사용자</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold text-sm">대기</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">승인 대기</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">관리자</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">관리자</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.admins}</p>
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
                    placeholder="이름, 이메일, 부서 검색..."
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
                  <option value="active">승인됨</option>
                  <option value="inactive">비활성</option>
                  <option value="pending">승인 대기</option>
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">모든 역할</option>
                  <option value="admin">관리자</option>
                  <option value="user">사용자</option>
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
                  <option value="name-asc">이름 ↑</option>
                  <option value="name-desc">이름 ↓</option>
                  <option value="email-asc">이메일 ↑</option>
                  <option value="email-desc">이메일 ↓</option>
                  <option value="createdAt-desc">생성일 ↓</option>
                  <option value="createdAt-asc">생성일 ↑</option>
                  <option value="lastLoginAt-desc">최근 로그인 ↓</option>
                  <option value="lastLoginAt-asc">최근 로그인 ↑</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={exportUsers}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  내보내기
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  사용자 추가
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 로그인</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status === 'active' ? '승인됨' : user.status === 'pending' ? '승인 대기' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : '없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser({...user});
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleStatusToggle(user.id)}
                        className={`${
                          user.status === 'pending' 
                            ? 'text-green-600 hover:text-green-900 font-medium'
                            : user.status === 'active' 
                            ? 'text-gray-600 hover:text-gray-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.status === 'pending' 
                          ? '승인하기'
                          : user.status === 'active' 
                          ? '비활성화' 
                          : '활성화'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        비밀번호 초기화
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
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

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">사용자가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">검색 조건을 변경하거나 새 사용자를 추가해보세요.</p>
            </div>
          )}
        </div>

        {/* 사용자 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-6">새 사용자 추가</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">사용자</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewUser({
                        name: '',
                        email: '',
                        department: '',
                        role: 'user',
                        password: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 사용자 수정 모달 */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-6">사용자 정보 수정</h3>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedUser.department || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  >
                    <option value="user">사용자</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedUser.status}
                    onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})}
                  >
                    <option value="active">승인됨</option>
                    <option value="inactive">비활성</option>
                    <option value="pending">승인 대기</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 삭제</h3>
              <p className="text-sm text-gray-600 mb-6">
                정말로 <strong>{userToDelete.name}</strong> 사용자를 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteUser}
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

export default UserManagementPage_v1_2;