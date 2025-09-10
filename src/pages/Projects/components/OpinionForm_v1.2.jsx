import React, { useState, useCallback } from 'react';
import { useSupabaseAuth } from '../../../hooks/useSupabaseAuth';
import { useSupabaseProjectStore } from '../../../hooks/useSupabaseProjectStore';
import { Button } from '../../../components/ui';

/**
 * OpinionForm v1.2 - 의견 작성 폼 컴포넌트
 * 
 * 주요 기능:
 * - Stage별 의견 분류
 * - 실시간 의견 작성 및 저장
 * - 유효성 검사 및 에러 처리
 * - localStorage 기반 데이터 관리
 */
const OpinionForm_v1_2 = ({ 
  project, 
  onOpinionAdded,
  initialStage = null,
  placeholder = "의견을 입력해주세요...",
  className = ""
}) => {
  const { profile } = useSupabaseAuth();
  const { addOpinion } = useSupabaseProjectStore();

  // 폼 상태 관리
  const [formData, setFormData] = useState({
    message: '',
    stage: initialStage || 'general',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  console.log('💬 [v1.2] OpinionForm rendered for project:', project?.name);

  // Stage 옵션 정의
  const stageOptions = [
    { value: 'general', label: '일반 의견', color: 'bg-gray-100 text-gray-700' },
    { value: 'stage1', label: 'Stage 1 (기본정보)', color: 'bg-blue-100 text-blue-700' },
    { value: 'stage2', label: 'Stage 2 (생산준비)', color: 'bg-green-100 text-green-700' },
    { value: 'stage3', label: 'Stage 3 (양산준비)', color: 'bg-purple-100 text-purple-700' }
  ];

  // Priority 옵션 정의
  const priorityOptions = [
    { value: 'low', label: '낮음', color: 'text-gray-600' },
    { value: 'medium', label: '보통', color: 'text-blue-600' },
    { value: 'high', label: '높음', color: 'text-orange-600' }
  ];

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 초기화
    if (error) {
      setError(null);
    }
  }, [error]);

  // 폼 유효성 검사
  const validateForm = useCallback(() => {
    if (!formData.message.trim()) {
      setError('의견 내용을 입력해주세요.');
      return false;
    }

    if (formData.message.trim().length < 10) {
      setError('의견은 최소 10자 이상 입력해주세요.');
      return false;
    }

    if (formData.message.trim().length > 1000) {
      setError('의견은 최대 1000자까지 입력 가능합니다.');
      return false;
    }

    return true;
  }, [formData]);

  // 의견 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!profile || !project || isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📤 [v1.2] Submitting opinion:', formData);

      // 새 의견 객체 생성
      const newOpinion = {
        project_id: project.id,
        project_is_completed: false, 
        author_name: profile.name || profile.email,
        author_team: profile.team || '일반팀',
        message: formData.message.trim(),
        stage: formData.stage === 'stage1' ? 1 : formData.stage === 'stage2' ? 2 : formData.stage === 'stage3' ? 3 : 1,
        status: 'open',
        priority: formData.priority,
        reply: null,
        created_by: profile.id,
        updated_by: profile.id,
        migrated_from_local: false,
        local_created_at: null
      };

      // 의견 추가
      addOpinion(newOpinion);

      // 성공 후 처리
      setFormData({
        message: '',
        stage: initialStage || 'general',
        priority: 'medium'
      });

      // 부모 컴포넌트에 알림
      if (onOpinionAdded) {
        onOpinionAdded(newOpinion);
      }

      console.log('✅ [v1.2] Opinion added successfully:', newOpinion.id);

    } catch (error) {
      console.error('❌ [v1.2] Error adding opinion:', error);
      setError(error.message || '의견 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [profile, project, formData, isSubmitting, validateForm, addOpinion, onOpinionAdded, initialStage]);

  // 사용자가 로그인하지 않은 경우
  if (!profile) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <p className="text-gray-600">의견을 작성하려면 로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">새 의견 작성</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{profile.name || profile.email}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stage 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            분류
          </label>
          <div className="flex flex-wrap gap-2">
            {stageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('stage', option.value)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.stage === option.value
                    ? option.color
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            우선순위
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 의견 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            의견 내용 *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            disabled={isSubmitting}
            maxLength={1000}
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {formData.message.length}/1000
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({
              message: '',
              stage: initialStage || 'general',
              priority: 'medium'
            })}
            disabled={isSubmitting}
          >
            초기화
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.message.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? '등록 중...' : '의견 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OpinionForm_v1_2;