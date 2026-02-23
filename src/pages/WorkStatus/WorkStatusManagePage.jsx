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
    allAdditionalWorks,
    loading,
    error,
    fetchAdditionalWorks,
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
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingProgress, setEditingProgress] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchAdditionalWorks();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // 에러 클리어
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    try {
      await addDetailTask(workId, taskData);
      setShowTaskModal(false);
      setSelectedWorkId(null);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 업무관리</h1>
            <p className="text-gray-600 mt-2">추가업무 및 세부업무를 관리하고 진행상황을 실시간으로 공유합니다.</p>
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
                    <h3 className="text-xl font-bold mb-2">{work.work_name}</h3>
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
                    </div>
                  </div>
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
                            
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => deleteDetailTask(task.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                              title="세부업무 삭제"
                            >
                              ×
                            </button>
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
          ))
        )}
      </div>

      {/* 모달 컴포넌트들 */}
      <CreateWorkModal
        isOpen={showCreateWorkModal}
        onClose={() => setShowCreateWorkModal(false)}
      />
      
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
    </div>
  );
};

export default WorkStatusManagePage;