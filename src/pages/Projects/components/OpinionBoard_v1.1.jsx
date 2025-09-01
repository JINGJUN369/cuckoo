import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui';
import { useProjectStore } from '../../../hooks/useProjectStore_v1.1';
import { useOpinions } from '../../../hooks/useOpinions_v1.1';
import { useAuth } from '../../../hooks/useAuth_v1.1';
import OpinionForm_v11 from './OpinionForm_v1.1';
import OpinionList_v11 from './OpinionList_v1.1';
import { createOpinionReplyNotification, createOpinionStatusNotification } from '../../../components/ui/NotificationSystem_v1.1';

/**
 * v1.1 OpinionBoard - 통합된 의견 게시판 시스템
 * 
 * 주요 개선사항:
 * - OpinionForm_v1.1 및 OpinionList_v1.1 통합
 * - useOpinions_v1.1 훅 활용
 * - 실시간 알림 시스템 연동
 * - 향상된 권한 관리
 * - 통계 및 분석 기능
 * - 반응형 디자인 개선
 * - 성능 최적화
 */
const OpinionBoard_v11 = ({ projectId = null, embedded = false }) => {
  console.log('💬 [v1.1] OpinionBoard rendering', { projectId, embedded });

  const { state, setSelectedProject, setCurrentView } = useProjectStore();
  const { projects } = state;
  const { user } = useAuth();
  
  // useOpinions 훅 사용
  const {
    opinions,
    opinionStats,
    loading,
    error,
    createOpinion,
    editOpinion,
    removeOpinion,
    changeOpinionStatus,
    addReply,
    voteOpinion,
    incrementViews,
    canEditOpinion,
    canDeleteOpinion,
    canChangeStatus,
    clearError
  } = useOpinions(projectId);

  // 로컬 상태
  const [showForm, setShowForm] = useState(false);
  const [editingOpinion, setEditingOpinion] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'my', 'unread'
  const [showStats, setShowStats] = useState(!embedded);

  // 프로젝트 이름을 가져오는 함수
  const getProjectName = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '알 수 없는 프로젝트';
  }, [projects]);

  // 프로젝트 클릭 핸들러
  const handleProjectClick = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setCurrentView('detail');
    }
  }, [projects, setSelectedProject, setCurrentView]);

  // 의견 생성 핸들러
  const handleCreateOpinion = useCallback(async (opinionData) => {
    try {
      await createOpinion(opinionData);
      setShowForm(false);
      
      // TODO: 성공 토스트 메시지
      console.log('✅ Opinion created successfully');
    } catch (error) {
      console.error('❌ Failed to create opinion:', error);
      // 에러는 useOpinions 훅에서 처리됨
    }
  }, [createOpinion]);

  // 의견 수정 핸들러
  const handleEditOpinion = useCallback(async (opinion, updates) => {
    try {
      await editOpinion(opinion.id, updates);
      setEditingOpinion(null);
      
      console.log('✅ Opinion updated successfully');
    } catch (error) {
      console.error('❌ Failed to update opinion:', error);
    }
  }, [editOpinion]);

  // 의견 삭제 핸들러
  const handleDeleteOpinion = useCallback(async (opinionId) => {
    try {
      await removeOpinion(opinionId);
      
      console.log('✅ Opinion deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete opinion:', error);
    }
  }, [removeOpinion]);

  // 상태 변경 핸들러
  const handleStatusChange = useCallback(async (opinionId, newStatus) => {
    try {
      const opinion = opinions.find(o => o.id === opinionId);
      if (!opinion) return;

      await changeOpinionStatus(opinionId, newStatus);
      
      // 알림 생성
      if (opinion.userId !== user?.id) {
        createOpinionStatusNotification(
          opinion.title,
          newStatus,
          getProjectName(opinion.projectId)
        );
      }

      console.log('✅ Opinion status changed successfully');
    } catch (error) {
      console.error('❌ Failed to change opinion status:', error);
    }
  }, [opinions, changeOpinionStatus, user?.id, getProjectName]);

  // 답글 추가 핸들러
  const handleAddReply = useCallback(async (opinionId, replyData) => {
    try {
      const opinion = opinions.find(o => o.id === opinionId);
      if (!opinion) return;

      await addReply(opinionId, replyData);
      
      // 알림 생성
      if (opinion.userId !== user?.id) {
        createOpinionReplyNotification(
          opinion.title,
          user?.name || '익명',
          getProjectName(opinion.projectId)
        );
      }

      console.log('✅ Reply added successfully');
    } catch (error) {
      console.error('❌ Failed to add reply:', error);
    }
  }, [opinions, addReply, user, getProjectName]);

  // 투표 핸들러
  const handleVote = useCallback(async (opinionId, voteType, userId) => {
    try {
      await voteOpinion(opinionId, voteType, userId);
      
      console.log('✅ Vote processed successfully');
    } catch (error) {
      console.error('❌ Failed to process vote:', error);
    }
  }, [voteOpinion]);

  // 탭별 의견 필터링
  const filteredOpinions = useMemo(() => {
    switch (selectedTab) {
      case 'my':
        return opinions.filter(opinion => opinion.userId === user?.id);
      case 'unread':
        return opinions.filter(opinion => 
          !opinion.readBy || !opinion.readBy.includes(user?.id)
        );
      case 'all':
      default:
        return opinions;
    }
  }, [opinions, selectedTab, user?.id]);

  // 에러 처리
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800">오류 발생</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
          <Button onClick={clearError} variant="outline" size="sm">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      {!embedded && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">💬 프로젝트 의견 게시판</h2>
              <p className="text-gray-600 mt-1">
                {projectId 
                  ? `${getProjectName(projectId)} 프로젝트의 의견을 확인하고 소통하세요`
                  : '모든 프로젝트의 의견을 한곳에서 확인하고 소통하세요'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                size="sm"
              >
                📊 {showStats ? '통계 숨기기' : '통계 보기'}
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
              >
                ✏️ 의견 작성
              </Button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                전체 의견 ({opinions.length})
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setSelectedTab('my')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'my'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    내 의견 ({opinionStats.myOpinions})
                  </button>
                  <button
                    onClick={() => setSelectedTab('unread')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                      selectedTab === 'unread'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    읽지 않음 ({opinionStats.unread})
                    {opinionStats.unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {opinionStats.unread > 9 ? '9+' : opinionStats.unread}
                      </span>
                    )}
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* 통계 섹션 */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 의견</p>
                <p className="text-2xl font-bold text-gray-900">{opinionStats.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">{opinionStats.byStatus.open}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">🕐</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">검토됨</p>
                <p className="text-2xl font-bold text-blue-600">{opinionStats.byStatus.reviewed}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">👀</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완료됨</p>
                <p className="text-2xl font-bold text-green-600">{opinionStats.byStatus.resolved}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리별 통계 (확장 통계) */}
      {showStats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 분포</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(opinionStats.byCategory).map(([category, count]) => {
              const categoryInfo = {
                general: { label: '일반', icon: '💬', color: 'text-gray-600' },
                technical: { label: '기술', icon: '⚙️', color: 'text-blue-600' },
                schedule: { label: '일정', icon: '📅', color: 'text-yellow-600' },
                quality: { label: '품질', icon: '🎯', color: 'text-red-600' },
                process: { label: '프로세스', icon: '🔄', color: 'text-purple-600' },
                resource: { label: '리소스', icon: '📦', color: 'text-green-600' }
              }[category] || { label: category, icon: '📝', color: 'text-gray-600' };

              return (
                <div key={category} className="text-center">
                  <div className={`text-2xl ${categoryInfo.color} mb-1`}>
                    {categoryInfo.icon}
                  </div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{categoryInfo.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 의견 작성 폼 */}
      {showForm && (
        <OpinionForm_v11
          projectId={projectId}
          onSubmit={handleCreateOpinion}
          onClose={() => setShowForm(false)}
          mode="create"
        />
      )}

      {/* 의견 수정 폼 */}
      {editingOpinion && (
        <OpinionForm_v11
          projectId={editingOpinion.projectId}
          initialData={editingOpinion}
          onSubmit={(updates) => handleEditOpinion(editingOpinion, updates)}
          onClose={() => setEditingOpinion(null)}
          mode="edit"
        />
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">의견을 불러오는 중...</p>
        </div>
      )}

      {/* 의견 목록 */}
      {!loading && (
        <OpinionList_v11
          opinions={filteredOpinions}
          onUpdateStatus={canChangeStatus() ? handleStatusChange : null}
          onReply={handleAddReply}
          onEdit={canEditOpinion ? (opinion) => setEditingOpinion(opinion) : null}
          onDelete={canDeleteOpinion ? handleDeleteOpinion : null}
          onVote={handleVote}
          showFilters={!embedded}
          compact={embedded}
        />
      )}

      {/* 프로젝트별 네비게이션 (전체 게시판인 경우) */}
      {!projectId && !embedded && filteredOpinions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트별 의견 현황</h3>
          <div className="space-y-3">
            {projects
              .filter(project => opinions.some(o => o.projectId === project.id))
              .map(project => {
                const projectOpinions = opinions.filter(o => o.projectId === project.id);
                const openCount = projectOpinions.filter(o => o.status === 'open').length;
                
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600">
                        총 {projectOpinions.length}개 의견
                        {openCount > 0 && (
                          <span className="ml-2 text-yellow-600">• {openCount}개 대기중</span>
                        )}
                      </p>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 빈 상태 (임베디드 모드) */}
      {embedded && filteredOpinions.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">💭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            의견이 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            이 프로젝트에 대한 첫 번째 의견을 남겨보세요
          </p>
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            size="sm"
          >
            의견 작성하기
          </Button>
        </div>
      )}
    </div>
  );
};

export default OpinionBoard_v11;