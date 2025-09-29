import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import CreateWorkModal from '../../components/workstatus/CreateWorkModal';
import AddTaskModal from '../../components/workstatus/AddTaskModal';
import WorkFilterBar from '../../components/workstatus/WorkFilterBar';
import EditWorkModal from '../../components/workstatus/EditWorkModal';
import { canManageWork, getPermissionDeniedMessage } from '../../utils/workPermissions';

/**
 * WorkStatusManagePage - 업무관리 메인 페이지
 * 
 * 기능:
 * - 추가업무 목록 조회 및 관리
 * - 세부업무 추가, 상태 변경, 진행현황 업데이트
 * - 실시간 협업 및 모니터링
 */
const WorkStatusManagePage = () => {
  const { user, profile } = useSupabaseAuth();
  const {
    additionalWorks,
<<<<<<< HEAD
    users,
=======
    allAdditionalWorks,
>>>>>>> 28f8e6c
    loading,
    error,
    ui,
    fetchAdditionalWorks,
    fetchUsers,
    setSelectedUserId,
    createAdditionalWork,
    updateAdditionalWork,
    deleteAdditionalWork,
    addDetailTask,
    updateTaskStatus,
    updateProgressContent,
    deleteDetailTask,
    deleteAdditionalWork,
    completeAdditionalWork,
    reorderDetailTasks,
    setupRealtimeSubscriptions,
    clearError,
    setFilter,
    getAllAuthors
  } = useWorkStatusStore();

  const [showCreateWorkModal, setShowCreateWorkModal] = useState(false);
  const [showEditWorkModal, setShowEditWorkModal] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [editingWork, setEditingWork] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingProgress, setEditingProgress] = useState({});
<<<<<<< HEAD
  const [newWorkData, setNewWorkData] = useState({
    work_name: '',
    work_owner: '',
    department: '',
    start_date: '',
    end_date: '',
    description: '',
    status: '진행중',
    priority: '보통'
  });

  // 현재 로그인 사용자 이름 가져오기
  const getCurrentUserName = () => {
    if (profile?.name) return profile.name;
    if (user?.email) return user.email;
    const currentUserProfile = users.find(u => u.id === user?.id || u.email === user?.email);
    return currentUserProfile?.name || user?.email || '알 수 없음';
  };

  // 업무 종결/삭제 권한 확인 함수
  const canDeleteOrCompleteWork = (work) => {
    if (!user) return false;
    
    // 관리자는 모든 권한을 가짐
    if (profile?.role === 'admin') return true;
    
    // 담당자(work_owner)는 자신의 업무에 대한 권한을 가짐
    const currentUserName = getCurrentUserName();
    return work.work_owner === currentUserName;
  };

  // 세부업무 삭제 권한 확인 함수
  const canDeleteDetailTask = (work, task) => {
    if (!user) return false;
    
    // 관리자는 모든 권한을 가짐
    if (profile?.role === 'admin') return true;
    
    const currentUserName = getCurrentUserName();
    
    // 업무 담당자(work_owner)는 해당 업무의 모든 세부업무를 삭제할 수 있음
    if (work.work_owner === currentUserName) return true;
    
    // 세부업무 담당자(assigned_to)는 자신의 세부업무만 삭제할 수 있음
    return task.assignee === currentUserName;
  };

  // 노션 스타일 색상 가져오기 (상태와 우선순위에 따라)
  const getNotionStyleColors = (work) => {
    const { status, priority } = work;
    
    // 상태별 색상
    if (status === '종결') {
      return {
        bg: 'bg-gradient-to-r from-green-500 to-green-600',
        text: 'text-green-100'
      };
    } else if (status === '보류') {
      return {
        bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
        text: 'text-orange-100'
      };
    }
    
    // 우선순위별 색상
    if (priority === '높음') {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        text: 'text-red-100'
      };
    } else if (priority === '낮음') {
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-blue-100'
      };
    }
    
    // 기본 색상 (노션 스타일 회색)
    return {
      bg: 'bg-gradient-to-r from-slate-600 to-slate-700',
      text: 'text-slate-200'
    };
  };
  const [newTaskData, setNewTaskData] = useState({
    task_name: '',
    description: '',
    assigned_to: '',
    due_date: ''
  });
=======
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
>>>>>>> 28f8e6c

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchUsers();
    fetchAdditionalWorks();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // 사용자 필터 변경 핸들러
  const handleUserFilterChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  // 현재 선택된 사용자 이름 가져오기
  const getSelectedUserName = () => {
    const { selectedUserId } = ui;
    if (selectedUserId === 'current_user') {
      return profile?.name || user?.email || '현재 사용자';
    } else if (selectedUserId === 'all_users') {
      return '전체 사용자';
    } else {
      const selectedUser = users.find(u => u.id === selectedUserId);
      return selectedUser ? selectedUser.name : '선택된 사용자';
    }
  };

  // 에러 클리어
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

<<<<<<< HEAD
  // 새업무 추가 핸들러
  const handleCreateWork = async (e) => {
    e.preventDefault();
=======
  // 필터 변경 핸들러
  const handleFilterChange = (filterConfig) => {
    const currentUser = profile?.name || user?.name || user?.email || '';
    setFilter({
      ...filterConfig,
      currentUser: currentUser
    });
  };

  // 세부업무 추가 핸들러
  const handleAddTask = async (workId, taskData) => {
>>>>>>> 28f8e6c
    try {
      // work_owner는 서버에서 자동으로 설정되므로 제거
      const { work_owner, ...workDataToSubmit } = newWorkData;
      await createAdditionalWork(workDataToSubmit);
      setShowCreateWorkModal(false);
      setNewWorkData({
        work_name: '',
        work_owner: '',
        department: '',
        start_date: '',
        end_date: '',
        description: '',
        status: '진행중',
        priority: '보통'
      });
    } catch (error) {
      console.error('Failed to create work:', error);
    }
  };

  // 업무 수정 핸들러
  const handleEditWork = (work) => {
    setEditingWork({
      work_name: work.work_name,
      work_owner: work.work_owner,
      department: work.department,
      start_date: work.start_date,
      end_date: work.end_date,
      description: work.description,
      status: work.status,
      priority: work.priority
    });
    setSelectedWorkId(work.id);
    setShowEditWorkModal(true);
  };

  // 업무 수정 저장 핸들러
  const handleUpdateWork = async (e) => {
    e.preventDefault();
    try {
      await updateAdditionalWork(selectedWorkId, editingWork);
      setShowEditWorkModal(false);
      setEditingWork(null);
      setSelectedWorkId(null);
    } catch (error) {
      console.error('Failed to update work:', error);
    }
  };

  // 업무 삭제 핸들러
  const handleDeleteWork = async (workId) => {
    if (window.confirm('정말로 이 업무를 삭제하시겠습니까? 모든 관련 데이터가 영구적으로 삭제됩니다.')) {
      try {
        await deleteAdditionalWork(workId);
      } catch (error) {
        console.error('Failed to delete work:', error);
      }
    }
  };

  // 업무 종결 핸들러
  const handleCompleteWork = async (workId) => {
    if (window.confirm('이 업무를 종결하시겠습니까? 업무 목록에서 숨겨지고 종결된 업무 목록에서만 볼 수 있습니다.')) {
      try {
        await updateAdditionalWork(workId, { status: '종결' });
      } catch (error) {
        console.error('Failed to complete work:', error);
      }
    }
  };

  // 세부업무 추가 핸들러
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addDetailTask(selectedWorkId, newTaskData);
      setShowTaskModal(false);
      setSelectedWorkId(null);
      setNewTaskData({
        task_name: '',
        description: '',
        assigned_to: '',
        due_date: ''
      });
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  // 상태 변경 핸들러
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // 진행현황 저장 핸들러
  const handleProgressSave = async (taskId, content) => {
    try {
      await updateProgressContent(taskId, content);
      setEditingProgress({ ...editingProgress, [taskId]: false });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // 드래그 핸들러들
  const handleDragStart = (e, task, index) => {
    console.log('🔄 [Drag] Start:', task.task_name, 'at index', index);
    setDraggedTask({ task, originalIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, workId, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    console.log('🔄 [Drag] Drop:', {
      draggedTask: draggedTask?.task.task_name,
      originalIndex: draggedTask?.originalIndex,
      dropIndex,
      workId
    });

    if (!draggedTask || draggedTask.originalIndex === dropIndex) {
      console.log('🔄 [Drag] No change needed');
      setDraggedTask(null);
      return;
    }

    try {
      console.log('🔄 [Drag] Calling reorderDetailTasks...');
      await reorderDetailTasks(workId, draggedTask.originalIndex, dropIndex);
      console.log('✅ [Drag] Reorder completed');
      setDraggedTask(null);
    } catch (error) {
      console.error('❌ [Drag] Failed to reorder tasks:', error);
      setDraggedTask(null);
    }
  };

  // 업무 수정 핸들러
  const handleEditWork = (work) => {
    if (!canManageWork(work, user, profile)) {
      alert(getPermissionDeniedMessage('수정'));
      return;
    }
    setSelectedWork(work);
    setShowEditModal(true);
  };

  // 업무 삭제 핸들러
  const handleDeleteWork = async (work) => {
    if (!canManageWork(work, user, profile)) {
      alert(getPermissionDeniedMessage('삭제'));
      return;
    }

    if (!window.confirm(`'${work.work_name}' 업무를 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 세부업무도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await deleteAdditionalWork(work.id);
    } catch (error) {
      console.error('업무 삭제 실패:', error);
      alert('업무 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 업무 종료 핸들러
  const handleCompleteWork = async (work) => {
    if (!canManageWork(work, user, profile)) {
      alert(getPermissionDeniedMessage('종료'));
      return;
    }

    if (!window.confirm(`'${work.work_name}' 업무를 종료하시겠습니까?\n\n✅ 종료된 업무는 완료된 업무 페이지에서 확인할 수 있습니다.`)) {
      return;
    }

    try {
      await completeAdditionalWork(work.id);
    } catch (error) {
      console.error('업무 종료 실패:', error);
      alert('업무 종료에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 상태별 색상 스타일
  const getStatusStyle = (status) => {
    const styles = {
      '대기': 'bg-gray-100 text-gray-800 border-gray-300',
      '진행': 'bg-blue-100 text-blue-800 border-blue-300',
      '완료': 'bg-green-100 text-green-800 border-green-300',
      '보류': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '피드백': 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || styles['대기'];
  };

  // 업무 진행률 계산
  const calculateWorkProgress = (work) => {
    const tasks = work.detail_tasks || [];
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === '완료').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // 진행률 색상 스타일
  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">업무 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 업무관리</h1>
            <p className="text-gray-600 mt-2">추가업무 및 세부업무를 관리하고 진행상황을 실시간으로 공유합니다.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 사용자 필터 드롭다운 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">👤 사용자 필터:</span>
              <select
                value={ui.selectedUserId}
                onChange={handleUserFilterChange}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="current_user">내 업무만</option>
                <option value="all_users">전체 사용자</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              현재 보기: <span className="font-medium text-gray-700">{getSelectedUserName()}</span>
            </div>
            
            <button
              onClick={() => setShowCreateWorkModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <span className="mr-2">➕</span>
              새 업무 추가
            </button>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <WorkFilterBar
        onFilterChange={handleFilterChange}
        totalCount={allAdditionalWorks.length}
        filteredCount={additionalWorks.length}
        allUsers={getAllAuthors()}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-red-500 mr-2">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">전체 업무</p>
              <p className="text-2xl font-semibold text-gray-900">{additionalWorks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">진행 중</p>
              <p className="text-2xl font-semibold text-blue-600">
                {additionalWorks.reduce((acc, work) => 
                  acc + (work.detail_tasks?.filter(task => task.status === '진행')?.length || 0), 0
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">완료</p>
              <p className="text-2xl font-semibold text-green-600">
                {additionalWorks.reduce((acc, work) => 
                  acc + (work.detail_tasks?.filter(task => task.status === '완료')?.length || 0), 0
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">👤</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">활성 담당자</p>
              <p className="text-2xl font-semibold text-purple-600">
                {new Set(additionalWorks
                  .filter(work => work.status !== '종결')
                  .map(work => work.work_owner)
                  .filter(Boolean)
                ).size}명
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 담당자별 현황 */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">👥</span>
          담당자별 업무 현황
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(() => {
            const ownerStats = {};
            additionalWorks.forEach(work => {
              if (work.work_owner) {
                if (!ownerStats[work.work_owner]) {
                  ownerStats[work.work_owner] = {
                    total: 0,
                    inProgress: 0,
                    completed: 0
                  };
                }
                ownerStats[work.work_owner].total += 1;
                
                if (work.status === '종결') {
                  ownerStats[work.work_owner].completed += 1;
                } else {
                  ownerStats[work.work_owner].inProgress += 1;
                }
              }
            });

            return Object.entries(ownerStats).map(([owner, stats]) => (
              <div key={owner} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-900">{owner}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>전체:</span>
                    <span className="font-medium">{stats.total}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>진행중:</span>
                    <span className="font-medium text-blue-600">{stats.inProgress}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>완료:</span>
                    <span className="font-medium text-green-600">{stats.completed}개</span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ));
          })()}
        </div>
        {additionalWorks.length === 0 && (
          <p className="text-gray-500 text-center py-8">등록된 업무가 없습니다.</p>
        )}
      </div>

      {/* 업무 목록 */}
      <div className="space-y-6">
        {additionalWorks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">등록된 업무가 없습니다</h3>
            <p className="text-gray-500 mb-6">새로운 업무를 추가해서 팀과 함께 관리해보세요.</p>
            <button
              onClick={() => setShowCreateWorkModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              첫 번째 업무 추가하기
            </button>
          </div>
        ) : (
          additionalWorks.map((work) => {
            const colors = getNotionStyleColors(work);
            return (
            <div key={work.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 업무 헤더 */}
              <div className={`${colors.bg} text-white p-6`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold">{work.work_name}</h3>
                      
                      {/* 진행률 표시 */}
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-sm ${colors.text}`}>진행률</div>
                          <div className="text-lg font-bold">{calculateWorkProgress(work)}%</div>
                        </div>
                        <div className="w-20 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${getProgressColor(calculateWorkProgress(work))}`}
                            style={{ width: `${calculateWorkProgress(work)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex flex-wrap gap-4 ${colors.text}`}>
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <span>{work.work_owner}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🏢</span>
                        <span>{work.department}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>{work.start_date} ~ {work.end_date}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        <span>{work.duration_days}일</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📋</span>
                        <span>{work.detail_tasks?.filter(task => task.status === '완료').length || 0}/{work.detail_tasks?.length || 0} 완료</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedWorkId(work.id);
                        setShowTaskModal(true);
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <span className="mr-2">➕</span>
                      세부업무 추가
                    </button>
                    
                    <div className="relative group">
                      <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors">
                        <span>⚙️</span>
                      </button>
                      
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => handleEditWork(work)}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center"
                        >
                          <span className="mr-2">✏️</span>
                          업무 수정
                        </button>
                        {canDeleteOrCompleteWork(work) && (
                          <>
                            <button
                              onClick={() => handleCompleteWork(work.id)}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <span className="mr-2">✅</span>
                              업무 종결
                            </button>
                            <button
                              onClick={() => handleDeleteWork(work.id)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-b-lg flex items-center"
                            >
                              <span className="mr-2">🗑️</span>
                              업무 삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
<<<<<<< HEAD
=======
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedWorkId(work.id);
                        setShowTaskModal(true);
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <span className="mr-1">➕</span>
                      세부업무
                    </button>
                    
                    {(() => {
                      const canManage = canManageWork(work, user, profile);
                      console.log('🔍 [WorkStatusManagePage] Permission check:', {
                        workId: work.id,
                        workName: work.work_name,
                        workOwner: work.work_owner,
                        currentUserName: profile?.name || user?.name || user?.email || '',
                        currentUserEmail: user?.email || profile?.email || '',
                        profileRole: profile?.role,
                        canManage: canManage
                      });
                      return canManage;
                    })() && (
                      <>
                        <button
                          onClick={() => handleEditWork(work)}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
                          title="업무 수정"
                        >
                          <span className="mr-1">✏️</span>
                          수정
                        </button>
                        
                        <button
                          onClick={() => handleCompleteWork(work)}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
                          title="업무 종료"
                        >
                          <span className="mr-1">✅</span>
                          종료
                        </button>
                        
                        <button
                          onClick={() => handleDeleteWork(work)}
                          className="bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
                          title="업무 삭제"
                        >
                          <span className="mr-1">🗑️</span>
                          삭제
                        </button>
                      </>
                    )}
                  </div>
>>>>>>> 28f8e6c
                </div>
                {work.description && (
                  <p className={`mt-3 ${colors.text}`}>{work.description}</p>
                )}
              </div>

              {/* 세부업무 목록 */}
              <div className="p-6">
                {work.detail_tasks && work.detail_tasks.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="mr-2">📝</span>
                      세부업무 ({work.detail_tasks.length}개)
                    </h4>
                    
                    {work.detail_tasks.map((task, index) => {
                      // D-Day 계산
                      const getDDay = (endDate) => {
                        if (!endDate) return null;
                        const today = new Date();
                        const end = new Date(endDate);
                        const diffTime = end - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) return { text: `D+${Math.abs(diffDays)}`, color: 'text-red-600 bg-red-50' };
                        if (diffDays === 0) return { text: 'D-Day', color: 'text-orange-600 bg-orange-50' };
                        if (diffDays <= 3) return { text: `D-${diffDays}`, color: 'text-yellow-600 bg-yellow-50' };
                        return { text: `D-${diffDays}`, color: 'text-blue-600 bg-blue-50' };
                      };
                      
                      const dday = getDDay(task.end_date);
                      const isDragOver = dragOverIndex === index;
                      const isDragging = draggedTask?.task.id === task.id;
                      
                      // 디버깅: 세부업무 데이터 확인
                      console.log('🔍 [Debug] Task data:', {
                        task_name: task.task_name,
                        end_date: task.end_date,
                        assignee: task.assignee,
                        created_at: task.created_at,
                        dday: dday
                      });
                      
                      return (
                      <div 
                        key={task.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, task, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, work.id, index)}
                        className={`border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 
                          ${isDragOver ? 'border-indigo-300 bg-indigo-50' : 'bg-gray-50 hover:bg-white'} 
                          ${isDragging ? 'opacity-50 transform rotate-1' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center flex-1 min-w-0">
                            {/* 드래그 핸들 */}
                            <div 
                              className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-sm select-none" 
                              title="드래그하여 순서 변경"
                              onMouseDown={(e) => {
                                // 드래그 핸들 클릭 시에만 드래그 가능하도록 설정
                                const card = e.target.closest('[draggable="true"]');
                                if (card) {
                                  card.draggable = true;
                                }
                              }}
                            >
                              ⋮⋮
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-medium text-gray-900 truncate">{task.task_name}</h5>
                                {dday && (
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${dday.color}`}>
                                    {dday.text}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                {task.end_date && <span className="text-red-600 font-medium">⏰ 마감: {new Date(task.end_date).toLocaleDateString('ko-KR')}</span>}
                                {task.assignee && <span>👤 {task.assignee}</span>}
                                {task.created_at && <span>➕ {new Date(task.created_at).toLocaleDateString('ko-KR')}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {/* 상태 변경 드롭다운 */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(task.status)}`}
                            >
                              <option value="대기">대기</option>
                              <option value="진행">진행</option>
                              <option value="완료">완료</option>
                              <option value="보류">보류</option>
                              <option value="피드백">피드백</option>
                            </select>
                            
<<<<<<< HEAD
                            {/* 삭제 버튼 - 권한이 있는 사용자만 표시 */}
                            {canDeleteDetailTask(work, task) && (
                              <button
                                onClick={() => deleteDetailTask(task.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="세부업무 삭제"
                              >
                                🗑️
                              </button>
                            )}
=======
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => deleteDetailTask(task.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                              title="세부업무 삭제"
                            >
                              ×
                            </button>
>>>>>>> 28f8e6c
                          </div>
                        </div>
                        
                        {/* 진행현황 - 컴팩트하게 수정 */}
                        {task.progress_content && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <div className="flex items-start space-x-2">
                              <span className="text-blue-600 text-xs mt-0.5">📝</span>
                              <p className="text-blue-900 flex-1 line-clamp-2">{task.progress_content}</p>
                              <button
                                onClick={() => setEditingProgress({ ...editingProgress, [task.id]: true })}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                                title="편집"
                              >
                                ✎️
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* 진행현황 편집 모드 */}
                        {editingProgress[task.id] && (
                          <div className="mt-2 space-y-2 p-2 bg-white border border-gray-300 rounded">
                            <textarea
                              defaultValue={task.progress_content || ''}
                              rows={2}
                              className="w-full p-2 border border-gray-200 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="진행현황을 입력하세요..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  handleProgressSave(task.id, e.target.value);
                                }
                              }}
                            />
                            <div className="flex justify-end space-x-1">
                              <button
                                onClick={(e) => {
                                  const textarea = e.target.closest('.space-y-2').querySelector('textarea');
                                  handleProgressSave(task.id, textarea.value);
                                }}
                                className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingProgress({ ...editingProgress, [task.id]: false })}
                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* 진행현황 없을 때 추가 버튼 */}
                        {!task.progress_content && !editingProgress[task.id] && (
                          <button
                            onClick={() => setEditingProgress({ ...editingProgress, [task.id]: true })}
                            className="mt-2 w-full py-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                          >
                            + 진행현황 추가
                          </button>
                        )}
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-3xl block mb-2">📝</span>
                    <p>등록된 세부업무가 없습니다.</p>
                    <button
                      onClick={() => {
                        setSelectedWorkId(work.id);
                        setShowTaskModal(true);
                      }}
                      className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      첫 번째 세부업무 추가하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* 모달 컴포넌트들 */}
      <CreateWorkModal
        isOpen={showCreateWorkModal}
        onClose={() => setShowCreateWorkModal(false)}
      />
      
<<<<<<< HEAD
      {showCreateWorkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <span className="mr-2">➕</span>
              새 업무 추가
            </h3>
            
            <form onSubmit={handleCreateWork} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">업무명 *</label>
                  <input
                    type="text"
                    required
                    value={newWorkData.work_name}
                    onChange={(e) => setNewWorkData({...newWorkData, work_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="업무명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자 *</label>
                  <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2">👤</span>
                      <span>{getCurrentUserName()}</span>
                      <span className="ml-2 text-sm text-gray-500">(로그인 사용자)</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">담당자는 로그인된 사용자로 자동 설정됩니다.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">부서 *</label>
                  <select
                    required
                    value={newWorkData.department}
                    onChange={(e) => setNewWorkData({...newWorkData, department: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">부서를 선택하세요</option>
                    <option value="마케팅팀">마케팅팀</option>
                    <option value="IT개발팀">IT개발팀</option>
                    <option value="고객지원팀">고객지원팀</option>
                    <option value="인사팀">인사팀</option>
                    <option value="품질관리팀">품질관리팀</option>
                    <option value="구매팀">구매팀</option>
                    <option value="재무팀">재무팀</option>
                    <option value="교육팀">교육팀</option>
                    <option value="총무팀">총무팀</option>
                    <option value="IT운영팀">IT운영팀</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                  <select
                    value={newWorkData.priority}
                    onChange={(e) => setNewWorkData({...newWorkData, priority: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="낮음">낮음</option>
                    <option value="보통">보통</option>
                    <option value="높음">높음</option>
                    <option value="긴급">긴급</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작일 *</label>
                  <input
                    type="date"
                    required
                    value={newWorkData.start_date}
                    onChange={(e) => setNewWorkData({...newWorkData, start_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종료일 *</label>
                  <input
                    type="date"
                    required
                    value={newWorkData.end_date}
                    onChange={(e) => setNewWorkData({...newWorkData, end_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">업무 설명</label>
                <textarea
                  value={newWorkData.description}
                  onChange={(e) => setNewWorkData({...newWorkData, description: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="업무에 대한 상세 설명을 입력하세요"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  업무 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 업무 수정 모달 */}
      {showEditWorkModal && editingWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <span className="mr-2">✏️</span>
              업무 수정
            </h3>
            
            <form onSubmit={handleUpdateWork} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">업무명 *</label>
                  <input
                    type="text"
                    required
                    value={editingWork.work_name}
                    onChange={(e) => setEditingWork({...editingWork, work_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="업무명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자 *</label>
                  <input
                    type="text"
                    required
                    value={editingWork.work_owner}
                    onChange={(e) => setEditingWork({...editingWork, work_owner: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="담당자명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">부서 *</label>
                  <select
                    required
                    value={editingWork.department}
                    onChange={(e) => setEditingWork({...editingWork, department: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">부서를 선택하세요</option>
                    <option value="마케팅팀">마케팅팀</option>
                    <option value="IT개발팀">IT개발팀</option>
                    <option value="고객지원팀">고객지원팀</option>
                    <option value="인사팀">인사팀</option>
                    <option value="품질관리팀">품질관리팀</option>
                    <option value="구매팀">구매팀</option>
                    <option value="재무팀">재무팀</option>
                    <option value="교육팀">교육팀</option>
                    <option value="총무팀">총무팀</option>
                    <option value="IT운영팀">IT운영팀</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                  <select
                    value={editingWork.priority}
                    onChange={(e) => setEditingWork({...editingWork, priority: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="낮음">낮음</option>
                    <option value="보통">보통</option>
                    <option value="높음">높음</option>
                    <option value="긴급">긴급</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작일 *</label>
                  <input
                    type="date"
                    required
                    value={editingWork.start_date}
                    onChange={(e) => setEditingWork({...editingWork, start_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종료일 *</label>
                  <input
                    type="date"
                    required
                    value={editingWork.end_date}
                    onChange={(e) => setEditingWork({...editingWork, end_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">업무 설명</label>
                <textarea
                  value={editingWork.description}
                  onChange={(e) => setEditingWork({...editingWork, description: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="업무에 대한 상세 설명을 입력하세요"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditWorkModal(false);
                    setEditingWork(null);
                    setSelectedWorkId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  업무 수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <span className="mr-2">📝</span>
              세부업무 추가
            </h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">업무명 *</label>
                <input
                  type="text"
                  required
                  value={newTaskData.task_name}
                  onChange={(e) => setNewTaskData({...newTaskData, task_name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="세부업무명을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                <input
                  type="text"
                  value={newTaskData.assigned_to}
                  onChange={(e) => setNewTaskData({...newTaskData, assigned_to: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="담당자명을 입력하세요 (선택사항)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                <input
                  type="date"
                  value={newTaskData.due_date}
                  onChange={(e) => setNewTaskData({...newTaskData, due_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">업무 설명</label>
                <textarea
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="세부업무에 대한 설명을 입력하세요"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedWorkId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  세부업무 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
=======
      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedWorkId(null);
        }}
        workId={selectedWorkId}
      />
      
      <EditWorkModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWork(null);
        }}
        work={selectedWork}
      />
>>>>>>> 28f8e6c
    </div>
  );
};

export default WorkStatusManagePage;