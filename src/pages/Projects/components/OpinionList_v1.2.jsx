import React, { useState, useMemo, useCallback } from 'react';
import { useSupabaseAuth } from '../../../hooks/useSupabaseAuth';
import { useSupabaseProjectStore } from '../../../hooks/useSupabaseProjectStore';
import { Button } from '../../../components/ui';

/**
 * OpinionList v1.2 - 의견 목록 컴포넌트
 * 
 * 주요 기능:
 * - 프로젝트별 의견 필터링 및 표시
 * - Stage별 분류 및 정렬
 * - 페이지네이션
 * - 의견 수정/삭제 (권한 체크)
 * - 실시간 의견 카운트
 */
const OpinionList_v1_2 = ({ 
  project,
  onOpinionUpdate,
  itemsPerPage = 10,
  className = ""
}) => {
  const { profile } = useSupabaseAuth();
  const { opinions, updateOpinion } = useSupabaseProjectStore();

  // 상태 관리
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStage, setFilterStage] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [editingOpinion, setEditingOpinion] = useState(null);
  const [editContent, setEditContent] = useState('');

  console.log('💬 [v1.2] OpinionList rendered with', opinions.length, 'total opinions');

  // Stage 옵션 정의
  const stageOptions = [
    { value: 'all', label: '전체', count: 0 },
    { value: 'general', label: '일반', count: 0 },
    { value: 'stage1', label: 'Stage 1', count: 0 },
    { value: 'stage2', label: 'Stage 2', count: 0 },
    { value: 'stage3', label: 'Stage 3', count: 0 }
  ];

  // 프로젝트별 의견 필터링 및 정렬
  const filteredAndSortedOpinions = useMemo(() => {
    if (!project) return [];

    // 프로젝트별 의견 필터링
    let filtered = opinions.filter(opinion => 
      opinion.projectId === project.id || opinion.project_id === project.id
    );

    // Stage별 필터링
    if (filterStage !== 'all') {
      filtered = filtered.filter(opinion => opinion.stage === filterStage);
    }

    // 정렬
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      
      switch (sortBy) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [opinions, project, filterStage, sortBy]);

  // Stage별 카운트 계산
  const stageOptionsWithCount = useMemo(() => {
    const counts = { all: 0, general: 0, stage1: 0, stage2: 0, stage3: 0 };
    
    if (project) {
      opinions.forEach(opinion => {
        if (opinion.projectId === project.id || opinion.project_id === project.id) {
          counts.all++;
          counts[opinion.stage] = (counts[opinion.stage] || 0) + 1;
        }
      });
    }

    return stageOptions.map(option => ({
      ...option,
      count: counts[option.value] || 0
    }));
  }, [opinions, project]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredAndSortedOpinions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOpinions = filteredAndSortedOpinions.slice(startIndex, startIndex + itemsPerPage);

  // 의견 수정 시작
  const handleEditStart = useCallback((opinion) => {
    setEditingOpinion(opinion.id);
    setEditContent(opinion.content);
  }, []);

  // 의견 수정 취소
  const handleEditCancel = useCallback(() => {
    setEditingOpinion(null);
    setEditContent('');
  }, []);

  // 의견 수정 저장
  const handleEditSave = useCallback(async (opinionId) => {
    if (!editContent.trim()) return;

    try {
      const updates = {
        content: editContent.trim(),
        updatedAt: new Date().toISOString()
      };

      updateOpinion(opinionId, updates);
      
      setEditingOpinion(null);
      setEditContent('');

      if (onOpinionUpdate) {
        onOpinionUpdate();
      }

      console.log('✅ [v1.2] Opinion updated successfully:', opinionId);

    } catch (error) {
      console.error('❌ [v1.2] Error updating opinion:', error);
    }
  }, [editContent, updateOpinion, onOpinionUpdate]);

  // 의견 삭제
  const handleDelete = useCallback((opinionId) => {
    const confirmed = window.confirm('이 의견을 정말 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      // 의견 삭제는 상태를 'deleted'로 변경하여 소프트 삭제
      const updates = {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: profile?.id
      };

      updateOpinion(opinionId, updates);

      if (onOpinionUpdate) {
        onOpinionUpdate();
      }

      console.log('✅ [v1.2] Opinion deleted successfully:', opinionId);

    } catch (error) {
      console.error('❌ [v1.2] Error deleting opinion:', error);
    }
  }, [profile, updateOpinion, onOpinionUpdate]);

  // Priority 색상 가져오기
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Stage 색상 가져오기
  const getStageColor = (stage) => {
    switch (stage) {
      case 'stage1': return 'text-blue-700 bg-blue-100';
      case 'stage2': return 'text-green-700 bg-green-100';
      case 'stage3': return 'text-purple-700 bg-purple-100';
      case 'general': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (!project) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        프로젝트가 선택되지 않았습니다.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 및 필터 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          의견 목록 ({filteredAndSortedOpinions.length}개)
        </h3>
        
        <div className="flex items-center space-x-4">
          {/* 정렬 옵션 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="priority">우선순위순</option>
          </select>
        </div>
      </div>

      {/* Stage 필터 탭 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {stageOptionsWithCount.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilterStage(option.value);
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filterStage === option.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {option.label}
              {option.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 의견 목록 */}
      {filteredAndSortedOpinions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <p>등록된 의견이 없습니다.</p>
          <p className="text-sm mt-2">첫 번째 의견을 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOpinions.map((opinion) => {
            const isEditing = editingOpinion === opinion.id;
            const canEdit = profile && (profile.id === opinion.createdBy || profile.role === 'admin');
            const isDeleted = opinion.status === 'deleted';

            if (isDeleted) return null;

            return (
              <div 
                key={opinion.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                {/* 의견 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {(opinion.createdByName || opinion.createdBy || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {opinion.createdByName || opinion.createdBy}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(opinion.createdAt || opinion.created_at).toLocaleString()}
                        {opinion.updatedAt && opinion.updatedAt !== opinion.createdAt && (
                          <span> (수정됨)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Stage 태그 */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(opinion.stage)}`}>
                      {opinion.stage === 'general' ? '일반' : 
                       opinion.stage === 'stage1' ? 'Stage 1' :
                       opinion.stage === 'stage2' ? 'Stage 2' :
                       opinion.stage === 'stage3' ? 'Stage 3' : opinion.stage}
                    </span>

                    {/* Priority 태그 */}
                    {opinion.priority && opinion.priority !== 'normal' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(opinion.priority)}`}>
                        {opinion.priority === 'critical' ? '긴급' :
                         opinion.priority === 'high' ? '높음' :
                         opinion.priority === 'low' ? '낮음' : opinion.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* 의견 내용 */}
                <div className="mb-3">
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {opinion.content}
                    </p>
                  )}
                </div>

                {/* 액션 버튼 */}
                {canEdit && (
                  <div className="flex justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleEditCancel}
                          variant="outline"
                          size="sm"
                        >
                          취소
                        </Button>
                        <Button
                          onClick={() => handleEditSave(opinion.id)}
                          size="sm"
                          disabled={!editContent.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          저장
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleEditStart(opinion)}
                          variant="outline"
                          size="sm"
                        >
                          수정
                        </Button>
                        <Button
                          onClick={() => handleDelete(opinion.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          삭제
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            이전
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              onClick={() => setCurrentPage(page)}
              variant={page === currentPage ? 'primary' : 'outline'}
              size="sm"
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}
          
          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};

export default OpinionList_v1_2;