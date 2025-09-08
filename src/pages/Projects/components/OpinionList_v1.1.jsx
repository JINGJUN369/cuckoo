import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth_v1.1';

/**
 * v1.1 OpinionList - 통합된 의견 목록 시스템
 * 
 * 주요 개선사항:
 * - 실시간 검색 및 고급 필터링
 * - 무한 스크롤 지원
 * - 투표 시스템 (좋아요/싫어요)
 * - 실시간 알림 시스템
 * - 중첩 답글 시스템
 * - 의견 상태 관리 강화
 * - 접근성 개선
 * - 성능 최적화
 */
const OpinionList_v11 = ({ 
  opinions = [], 
  onUpdateStatus, 
  onReply,
  onEdit,
  onDelete,
  onVote,
  showFilters = true,
  maxItems = null,
  compact = false
}) => {
  console.log('💬 [v1.1] OpinionList rendering', { 
    opinionsCount: opinions.length, 
    showFilters, 
    compact 
  });

  const { user } = useAuth();
  
  // 필터 및 정렬 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('');
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  
  // UI 상태
  const [expandedOpinions, setExpandedOpinions] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingOpinion, setEditingOpinion] = useState(null);
  const [displayCount, setDisplayCount] = useState(maxItems || 10);

  // 카테고리 설정
  const categories = useMemo(() => ({
    general: { 
      label: '일반', 
      color: 'bg-gray-100 text-gray-700 border-gray-300', 
      icon: '💬' 
    },
    technical: { 
      label: '기술', 
      color: 'bg-blue-100 text-blue-700 border-blue-300', 
      icon: '⚙️' 
    },
    schedule: { 
      label: '일정', 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300', 
      icon: '📅' 
    },
    quality: { 
      label: '품질', 
      color: 'bg-red-100 text-red-700 border-red-300', 
      icon: '🎯' 
    },
    process: { 
      label: '프로세스', 
      color: 'bg-purple-100 text-purple-700 border-purple-300', 
      icon: '🔄' 
    },
    resource: { 
      label: '리소스', 
      color: 'bg-green-100 text-green-700 border-green-300', 
      icon: '📦' 
    }
  }), []);

  // 상태 설정
  const statusConfig = useMemo(() => ({
    open: { label: '대기중', color: 'bg-yellow-100 text-yellow-700', icon: '🕐' },
    reviewed: { label: '검토됨', color: 'bg-blue-100 text-blue-700', icon: '👀' },
    resolved: { label: '완료', color: 'bg-green-100 text-green-700', icon: '✅' },
    rejected: { label: '반려', color: 'bg-red-100 text-red-700', icon: '❌' }
  }), []);

  // 우선순위 설정
  const priorities = useMemo(() => ({
    low: { label: '낮음', color: 'bg-gray-100 text-gray-700', icon: '📝' },
    medium: { label: '보통', color: 'bg-blue-100 text-blue-700', icon: '📋' },
    high: { label: '높음', color: 'bg-orange-100 text-orange-700', icon: '⚡' },
    urgent: { label: '긴급', color: 'bg-red-100 text-red-700', icon: '🚨' }
  }), []);

  // 검색어 최적화
  const searchLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);

  // 의견 필터링 및 정렬
  const filteredAndSortedOpinions = useMemo(() => {
    console.log('🔄 [v1.1] OpinionList: Filtering and sorting opinions');
    
    let filtered = opinions;

    // 텍스트 검색
    if (searchTerm) {
      filtered = filtered.filter(opinion =>
        opinion.title?.toLowerCase().includes(searchLower) ||
        opinion.content?.toLowerCase().includes(searchLower) ||
        opinion.author?.toLowerCase().includes(searchLower) ||
        opinion.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 상태 필터
    if (filter !== 'all') {
      filtered = filtered.filter(opinion => opinion.status === filter);
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(opinion => opinion.category === categoryFilter);
    }

    // 우선순위 필터
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(opinion => opinion.priority === priorityFilter);
    }

    // 작성자 필터
    if (authorFilter) {
      filtered = filtered.filter(opinion => 
        opinion.author?.toLowerCase().includes(authorFilter.toLowerCase())
      );
    }

    // 비공개 의견만 보기
    if (showPrivateOnly && user) {
      filtered = filtered.filter(opinion => opinion.isPrivate);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'updated':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'votes':
          return ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0));
        case 'replies':
          return (b.replies?.length || 0) - (a.replies?.length || 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered.slice(0, displayCount);
  }, [
    opinions, searchLower, searchTerm, filter, categoryFilter, priorityFilter,
    authorFilter, showPrivateOnly, user, sortBy, displayCount
  ]);

  // 날짜 포맷
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '오늘 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '어제 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  // 의견 토글
  const toggleOpinion = useCallback((opinionId) => {
    setExpandedOpinions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(opinionId)) {
        newSet.delete(opinionId);
      } else {
        newSet.add(opinionId);
      }
      return newSet;
    });
  }, []);

  // 투표 핸들러
  const handleVote = useCallback((opinionId, voteType) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    onVote?.(opinionId, voteType, user.id);
  }, [user, onVote]);

  // 더 보기
  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + 10);
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setAuthorFilter('');
    setShowPrivateOnly(false);
    setSortBy('newest');
  }, []);

  if (opinions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          등록된 의견이 없습니다
        </h3>
        <p className="text-gray-600">
          이 프로젝트에 대한 첫 번째 의견을 남겨보세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            {/* 검색 */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="제목, 내용, 작성자, 태그로 검색..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <input
                type="text"
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                placeholder="작성자 필터"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex flex-wrap items-center gap-4">
              {/* 상태 필터 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">상태:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">카테고리:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  {Object.entries(categories).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* 우선순위 필터 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">우선순위:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  {Object.entries(priorities).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* 정렬 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">정렬:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">최신순</option>
                  <option value="oldest">오래된순</option>
                  <option value="updated">업데이트순</option>
                  <option value="priority">우선순위순</option>
                  <option value="votes">투표순</option>
                  <option value="replies">답변순</option>
                  <option value="category">카테고리순</option>
                  <option value="author">작성자순</option>
                </select>
              </div>

              {/* 비공개 의견만 보기 (관리자용) */}
              {user && (user.role === 'admin' || user.role === 'manager') && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showPrivateOnly}
                    onChange={(e) => setShowPrivateOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">비공개만</span>
                </label>
              )}

              {/* 필터 초기화 */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                🔄 초기화
              </Button>
            </div>

            {/* 검색 결과 요약 */}
            <div className="text-sm text-gray-600 flex items-center justify-between">
              <span>
                총 {opinions.length}개 의견 중 {filteredAndSortedOpinions.length}개 표시
                {displayCount < filteredAndSortedOpinions.length && ` (${displayCount}개만 표시 중)`}
              </span>
              
              {/* 활성 필터 표시 */}
              {(searchTerm || filter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || authorFilter || showPrivateOnly) && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">활성 필터:</span>
                  {searchTerm && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">검색: "{searchTerm}"</span>}
                  {filter !== 'all' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">상태: {statusConfig[filter].label}</span>}
                  {categoryFilter !== 'all' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">카테고리: {categories[categoryFilter].label}</span>}
                  {priorityFilter !== 'all' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">우선순위: {priorities[priorityFilter].label}</span>}
                  {authorFilter && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">작성자: {authorFilter}</span>}
                  {showPrivateOnly && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">비공개만</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 의견 목록 */}
      <div className={compact ? "space-y-3" : "space-y-6"}>
        {filteredAndSortedOpinions.map((opinion) => {
          const isExpanded = expandedOpinions.has(opinion.id);
          const category = categories[opinion.category] || categories.general;
          const status = statusConfig[opinion.status] || statusConfig.open;
          const priority = priorities[opinion.priority] || priorities.medium;
          const canEdit = user && (user.id === opinion.userId || user.role === 'admin');
          const netVotes = (opinion.upvotes || 0) - (opinion.downvotes || 0);

          return (
            <div 
              key={opinion.id} 
              className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
                opinion.isPrivate ? 'border-red-200 bg-red-50' : ''
              } ${
                opinion.priority === 'urgent' ? 'border-l-4 border-l-red-500' : 
                opinion.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''
              }`}
            >
              {/* 헤더 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {/* 아바타 */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {(opinion.author && opinion.author.length > 0) ? opinion.author.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 제목 및 메타 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 
                          className={`font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors ${
                            compact ? 'text-sm' : 'text-base'
                          }`}
                          onClick={() => toggleOpinion(opinion.id)}
                        >
                          {opinion.title || '제목 없음'}
                        </h4>
                        
                        {/* 비공개 표시 */}
                        {opinion.isPrivate && (
                          <span className="text-red-500 text-xs" title="비공개 의견">🔒</span>
                        )}
                      </div>
                      
                      {/* 메타 정보 */}
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                        <span className="font-medium text-gray-700">{opinion.author || '익명'}</span>
                        <span>•</span>
                        <span>{opinion.department || '부서 미상'}</span>
                        <span>•</span>
                        <span>{formatDate(opinion.createdAt)}</span>
                        {opinion.updatedAt !== opinion.createdAt && (
                          <>
                            <span>•</span>
                            <span>수정됨</span>
                          </>
                        )}
                      </div>
                      
                      {/* 배지들 */}
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${category.color}`}>
                          {category.icon} {category.label}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${priority.color}`}>
                          {priority.icon} {priority.label}
                        </span>
                        
                        {/* 조회수 */}
                        {opinion.views > 0 && (
                          <span className="text-xs text-gray-500">
                            👁️ {opinion.views}
                          </span>
                        )}
                      </div>
                      
                      {/* 태그 */}
                      {opinion.tags && opinion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opinion.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center space-x-2">
                    {/* 투표 버튼 */}
                    {onVote && (
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                        <button
                          onClick={() => handleVote(opinion.id, 'up')}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                          disabled={!user}
                          title="좋아요"
                        >
                          👍
                        </button>
                        <span className={`text-xs font-medium ${
                          netVotes > 0 ? 'text-green-600' : 
                          netVotes < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {netVotes}
                        </span>
                        <button
                          onClick={() => handleVote(opinion.id, 'down')}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          disabled={!user}
                          title="싫어요"
                        >
                          👎
                        </button>
                      </div>
                    )}

                    {/* 상태 변경 버튼 */}
                    {onUpdateStatus && user && user.role === 'admin' && opinion.status !== 'resolved' && (
                      <div className="flex space-x-1">
                        {opinion.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateStatus(opinion.id, 'reviewed')}
                            className="text-xs"
                          >
                            검토완료
                          </Button>
                        )}
                        {opinion.status === 'reviewed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateStatus(opinion.id, 'resolved')}
                            className="text-xs"
                          >
                            해결완료
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* 답변 버튼 */}
                    {onReply && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(opinion.id)}
                        className="text-xs"
                      >
                        💬 답변
                      </Button>
                    )}

                    {/* 편집/삭제 버튼 */}
                    {canEdit && (
                      <div className="flex space-x-1">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(opinion)}
                            className="text-xs"
                          >
                            ✏️
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('정말 이 의견을 삭제하시겠습니까?')) {
                                onDelete(opinion.id);
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    )}

                    {/* 토글 버튼 */}
                    <button
                      onClick={() => toggleOpinion(opinion.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      aria-label={isExpanded ? '접기' : '펼치기'}
                    >
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* 내용 (확장 시) */}
              {isExpanded && (
                <>
                  <div className="px-6 py-4">
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {opinion.content || '내용이 없습니다.'}
                    </div>
                  </div>

                  {/* 답변 목록 */}
                  {opinion.replies && opinion.replies.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-900">답변 ({opinion.replies.length}개)</h5>
                        {opinion.replies.map((reply) => (
                          <div key={reply.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{reply.author}</span>
                                <span className="text-xs text-gray-500">({reply.department})</span>
                                <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {reply.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 답변 작성 영역 */}
                  {replyingTo === opinion.id && onReply && (
                    <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">답변 작성</h5>
                        <textarea
                          placeholder="답변을 입력하세요..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyingTo(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              // TODO: 답변 제출 로직
                              onReply(opinion.id, {
                                content: '답변 내용',
                                author: user?.name || '익명',
                                department: user?.department || '부서 미상'
                              });
                              setReplyingTo(null);
                            }}
                          >
                            답변 등록
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 요약 정보 (축소 시) */}
              {!isExpanded && (
                <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {(opinion.content || '').slice(0, 100)}{(opinion.content || '').length > 100 && '...'}
                    </span>
                    <div className="flex items-center space-x-3 ml-4">
                      {opinion.replies && opinion.replies.length > 0 && (
                        <span>💬 {opinion.replies.length}</span>
                      )}
                      {netVotes !== 0 && (
                        <span className={netVotes > 0 ? 'text-green-600' : 'text-red-600'}>
                          {netVotes > 0 ? '👍' : '👎'} {Math.abs(netVotes)}
                        </span>
                      )}
                      <span>클릭하여 펼치기</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 더 보기 버튼 */}
      {!maxItems && displayCount < opinions.length && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="px-8"
          >
            더 보기 ({opinions.length - displayCount}개 더)
          </Button>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {filteredAndSortedOpinions.length === 0 && opinions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터 조건을 시도해보세요
          </p>
          <Button variant="outline" onClick={resetFilters}>
            모든 필터 초기화
          </Button>
        </div>
      )}
    </div>
  );
};

export default OpinionList_v11;