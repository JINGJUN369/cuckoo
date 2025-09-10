import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

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
    users,
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
    setupRealtimeSubscriptions,
    clearError
  } = useWorkStatusStore();

  const [showCreateWorkModal, setShowCreateWorkModal] = useState(false);
  const [showEditWorkModal, setShowEditWorkModal] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [editingWork, setEditingWork] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingProgress, setEditingProgress] = useState({});
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
  const [newTaskData, setNewTaskData] = useState({
    task_name: '',
    description: '',
    assigned_to: '',
    due_date: ''
  });

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

  // 새업무 추가 핸들러
  const handleCreateWork = async (e) => {
    e.preventDefault();
    try {
      await createAdditionalWork(newWorkData);
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
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">참여자</p>
              <p className="text-2xl font-semibold text-purple-600">
                {new Set(additionalWorks.flatMap(work => 
                  [work.work_owner, ...(work.detail_tasks?.map(task => task.assignee).filter(Boolean) || [])]
                )).size}
              </p>
            </div>
          </div>
        </div>
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
          additionalWorks.map((work) => (
            <div key={work.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 업무 헤더 */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold">{work.work_name}</h3>
                      
                      {/* 진행률 표시 */}
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm text-indigo-100">진행률</div>
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
                    
                    <div className="flex flex-wrap gap-4 text-indigo-100">
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
                      </div>
                    </div>
                  </div>
                </div>
                {work.description && (
                  <p className="mt-3 text-indigo-100">{work.description}</p>
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
                    
                    {work.detail_tasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{task.task_name}</h5>
                            {task.assignee && (
                              <p className="text-sm text-gray-600 mt-1">담당자: {task.assignee}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* 상태 변경 드롭다운 */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(task.status)}`}
                            >
                              <option value="대기">대기</option>
                              <option value="진행">진행</option>
                              <option value="완료">완료</option>
                              <option value="보류">보류</option>
                              <option value="피드백">피드백</option>
                            </select>
                            
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => deleteDetailTask(task.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="세부업무 삭제"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        {/* 진행현황 */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            진행현황
                          </label>
                          {editingProgress[task.id] ? (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={task.progress_content || ''}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="진행현황을 입력하세요..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    handleProgressSave(task.id, e.target.value);
                                  }
                                }}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    const textarea = e.target.closest('.space-y-2').querySelector('textarea');
                                    handleProgressSave(task.id, textarea.value);
                                  }}
                                  className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => setEditingProgress({ ...editingProgress, [task.id]: false })}
                                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingProgress({ ...editingProgress, [task.id]: true })}
                              className="min-h-[60px] p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              {task.progress_content ? (
                                <p className="text-gray-900 whitespace-pre-wrap">{task.progress_content}</p>
                              ) : (
                                <p className="text-gray-500 italic">클릭해서 진행현황을 입력하세요...</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 생성 정보 */}
                        <div className="mt-3 text-xs text-gray-500 flex justify-between">
                          <span>생성: {new Date(task.created_at).toLocaleString('ko-KR')}</span>
                          {task.updated_at !== task.created_at && (
                            <span>수정: {new Date(task.updated_at).toLocaleString('ko-KR')}</span>
                          )}
                        </div>
                      </div>
                    ))}
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
          ))
        )}
      </div>

      {/* 모달들은 여기에 추가 예정 */}
      {/* TODO: CreateWorkModal, TaskModal 컴포넌트 구현 */}
      
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
                  <input
                    type="text"
                    required
                    value={newWorkData.work_owner}
                    onChange={(e) => setNewWorkData({...newWorkData, work_owner: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="담당자명을 입력하세요"
                  />
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
    </div>
  );
};

export default WorkStatusManagePage;