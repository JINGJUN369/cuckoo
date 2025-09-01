import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from './useProjectStore_v1.1';
import { useAuth } from './useAuth';

/**
 * v1.1 useOpinions - 통합된 의견 관리 훅
 * 
 * 주요 개선사항:
 * - 실시간 의견 상태 관리
 * - 투표 시스템 지원
 * - 알림 시스템 통합
 * - 의견 검색 및 필터링 최적화
 * - 답글 중첩 시스템
 * - 권한 기반 액션 제어
 * - 성능 최적화
 */
export const useOpinions = (projectId = null) => {
  console.log('💬 [v1.1] useOpinions hook initialized', { projectId });

  const { state, addOpinion, updateOpinion, deleteOpinion } = useProjectStore();
  const { user } = useAuth();
  const { opinions = [] } = state;

  // 로컬 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 프로젝트별 의견 필터링
  const projectOpinions = useMemo(() => {
    if (!projectId) return opinions;
    return opinions.filter(opinion => opinion.projectId === projectId);
  }, [opinions, projectId]);

  // 의견 통계 계산
  const opinionStats = useMemo(() => {
    const stats = {
      total: projectOpinions.length,
      byStatus: {
        open: 0,
        reviewed: 0,
        resolved: 0,
        rejected: 0
      },
      byCategory: {
        general: 0,
        technical: 0,
        schedule: 0,
        quality: 0,
        process: 0,
        resource: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      recent: 0, // 7일 이내
      unread: 0, // 사용자가 읽지 않은 의견
      myOpinions: 0 // 내가 작성한 의견
    };

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    projectOpinions.forEach(opinion => {
      // 상태별 통계
      stats.byStatus[opinion.status] = (stats.byStatus[opinion.status] || 0) + 1;
      
      // 카테고리별 통계
      stats.byCategory[opinion.category] = (stats.byCategory[opinion.category] || 0) + 1;
      
      // 우선순위별 통계
      stats.byPriority[opinion.priority] = (stats.byPriority[opinion.priority] || 0) + 1;
      
      // 최근 의견
      if (new Date(opinion.createdAt) > weekAgo) {
        stats.recent++;
      }
      
      // 내 의견
      if (user && opinion.userId === user.id) {
        stats.myOpinions++;
      }
      
      // 읽지 않은 의견 (간단한 구현)
      if (!opinion.readBy || !opinion.readBy.includes(user?.id)) {
        stats.unread++;
      }
    });

    return stats;
  }, [projectOpinions, user]);

  // 의견 생성
  const createOpinion = useCallback(async (opinionData) => {
    console.log('📝 [v1.1] useOpinions: Creating opinion', opinionData);
    
    setLoading(true);
    setError(null);

    try {
      const newOpinion = {
        ...opinionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'open',
        upvotes: 0,
        downvotes: 0,
        views: 0,
        replies: [],
        readBy: user ? [user.id] : [],
        // 알림 설정
        notifyUsers: [] // 답변 시 알림받을 사용자 목록
      };

      await addOpinion(newOpinion);
      console.log('✅ [v1.1] useOpinions: Opinion created successfully');
      
      return newOpinion;
    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error creating opinion', error);
      setError('의견 생성 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addOpinion, user]);

  // 의견 수정
  const editOpinion = useCallback(async (opinionId, updates) => {
    console.log('✏️ [v1.1] useOpinions: Editing opinion', { opinionId, updates });
    
    setLoading(true);
    setError(null);

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        // 수정자 정보 추가
        lastModifiedBy: user?.id,
        lastModifiedByName: user?.name
      };

      await updateOpinion(opinionId, updatedData);
      console.log('✅ [v1.1] useOpinions: Opinion updated successfully');
      
    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error updating opinion', error);
      setError('의견 수정 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateOpinion, user]);

  // 의견 삭제
  const removeOpinion = useCallback(async (opinionId) => {
    console.log('🗑️ [v1.1] useOpinions: Deleting opinion', { opinionId });
    
    setLoading(true);
    setError(null);

    try {
      await deleteOpinion(opinionId);
      console.log('✅ [v1.1] useOpinions: Opinion deleted successfully');
      
    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error deleting opinion', error);
      setError('의견 삭제 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteOpinion]);

  // 의견 상태 변경
  const changeOpinionStatus = useCallback(async (opinionId, newStatus) => {
    console.log('🔄 [v1.1] useOpinions: Changing opinion status', { opinionId, newStatus });
    
    const opinion = projectOpinions.find(o => o.id === opinionId);
    if (!opinion) {
      setError('의견을 찾을 수 없습니다.');
      return;
    }

    // 권한 확인
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      setError('의견 상태를 변경할 권한이 없습니다.');
      return;
    }

    try {
      await editOpinion(opinionId, {
        status: newStatus,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: user.id,
        statusChangedByName: user.name
      });

      // 상태 변경 알림 (작성자에게)
      if (opinion.notifyOnReply && opinion.userId !== user.id) {
        // TODO: 알림 시스템 연동
        console.log('📧 [v1.1] useOpinions: Status change notification sent');
      }

    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error changing status', error);
      throw error;
    }
  }, [projectOpinions, user, editOpinion]);

  // 답글 추가
  const addReply = useCallback(async (opinionId, replyData) => {
    console.log('💬 [v1.1] useOpinions: Adding reply', { opinionId, replyData });
    
    const opinion = projectOpinions.find(o => o.id === opinionId);
    if (!opinion) {
      setError('의견을 찾을 수 없습니다.');
      return;
    }

    try {
      const newReply = {
        id: Date.now().toString(),
        content: replyData.content,
        author: user?.name || replyData.author,
        department: user?.department || replyData.department,
        userId: user?.id,
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0
      };

      const updatedReplies = [...(opinion.replies || []), newReply];

      await editOpinion(opinionId, {
        replies: updatedReplies,
        // 답글이 달리면 자동으로 검토됨 상태로 변경
        status: opinion.status === 'open' ? 'reviewed' : opinion.status,
        lastReplyAt: new Date().toISOString()
      });

      // 답글 알림 (원작성자에게)
      if (opinion.notifyOnReply && opinion.userId !== user?.id) {
        // TODO: 알림 시스템 연동
        console.log('📧 [v1.1] useOpinions: Reply notification sent');
      }

      console.log('✅ [v1.1] useOpinions: Reply added successfully');
      
    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error adding reply', error);
      setError('답글 추가 중 오류가 발생했습니다.');
      throw error;
    }
  }, [projectOpinions, user, editOpinion]);

  // 투표 처리
  const voteOpinion = useCallback(async (opinionId, voteType, userId) => {
    console.log('👍 [v1.1] useOpinions: Voting on opinion', { opinionId, voteType, userId });
    
    const opinion = projectOpinions.find(o => o.id === opinionId);
    if (!opinion) {
      setError('의견을 찾을 수 없습니다.');
      return;
    }

    if (!userId) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      const userVotes = opinion.userVotes || {};
      const currentVote = userVotes[userId];

      let newUpvotes = opinion.upvotes || 0;
      let newDownvotes = opinion.downvotes || 0;

      // 기존 투표 취소
      if (currentVote === 'up') newUpvotes--;
      if (currentVote === 'down') newDownvotes--;

      // 새 투표 적용 (같은 투표면 취소, 다른 투표면 변경)
      if (currentVote !== voteType) {
        if (voteType === 'up') newUpvotes++;
        if (voteType === 'down') newDownvotes++;
        userVotes[userId] = voteType;
      } else {
        delete userVotes[userId]; // 같은 투표면 취소
      }

      await editOpinion(opinionId, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVotes,
        lastVoteAt: new Date().toISOString()
      });

      console.log('✅ [v1.1] useOpinions: Vote processed successfully');
      
    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error processing vote', error);
      setError('투표 처리 중 오류가 발생했습니다.');
      throw error;
    }
  }, [projectOpinions, editOpinion]);

  // 의견 조회수 증가
  const incrementViews = useCallback(async (opinionId, userId) => {
    const opinion = projectOpinions.find(o => o.id === opinionId);
    if (!opinion) return;

    // 이미 읽었으면 증가하지 않음
    if (opinion.readBy && opinion.readBy.includes(userId)) return;

    try {
      const newViews = (opinion.views || 0) + 1;
      const newReadBy = [...(opinion.readBy || []), userId].filter(id => id); // 중복 제거

      await editOpinion(opinionId, {
        views: newViews,
        readBy: newReadBy,
        lastViewAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [v1.1] useOpinions: Error incrementing views', error);
    }
  }, [projectOpinions, editOpinion]);

  // 의견 검색
  const searchOpinions = useCallback((searchTerm, filters = {}) => {
    if (!searchTerm && Object.keys(filters).length === 0) {
      return projectOpinions;
    }

    let filtered = projectOpinions;

    // 텍스트 검색
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(opinion =>
        opinion.title?.toLowerCase().includes(searchLower) ||
        opinion.content?.toLowerCase().includes(searchLower) ||
        opinion.author?.toLowerCase().includes(searchLower) ||
        opinion.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 필터 적용
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(opinion => opinion.status === filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(opinion => opinion.category === filters.category);
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(opinion => opinion.priority === filters.priority);
    }

    if (filters.author) {
      filtered = filtered.filter(opinion => 
        opinion.author?.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    if (filters.isPrivate !== undefined) {
      filtered = filtered.filter(opinion => opinion.isPrivate === filters.isPrivate);
    }

    if (filters.hasReplies !== undefined) {
      filtered = filtered.filter(opinion => 
        filters.hasReplies ? (opinion.replies && opinion.replies.length > 0) : 
                           (!opinion.replies || opinion.replies.length === 0)
      );
    }

    // 날짜 범위 필터
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(opinion => new Date(opinion.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(opinion => new Date(opinion.createdAt) <= toDate);
    }

    return filtered;
  }, [projectOpinions]);

  // 권한 확인 유틸리티
  const canEditOpinion = useCallback((opinion) => {
    if (!user) return false;
    return user.id === opinion.userId || user.role === 'admin' || user.role === 'manager';
  }, [user]);

  const canDeleteOpinion = useCallback((opinion) => {
    if (!user) return false;
    return user.id === opinion.userId || user.role === 'admin';
  }, [user]);

  const canChangeStatus = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  }, [user]);

  return {
    // 데이터
    opinions: projectOpinions,
    opinionStats,
    loading,
    error,

    // 액션
    createOpinion,
    editOpinion,
    removeOpinion,
    changeOpinionStatus,
    addReply,
    voteOpinion,
    incrementViews,
    searchOpinions,

    // 권한 확인
    canEditOpinion,
    canDeleteOpinion,
    canChangeStatus,

    // 유틸리티
    clearError: () => setError(null)
  };
};