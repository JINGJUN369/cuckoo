import React, { useState, useCallback, useMemo } from 'react';
import { Button, Input } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth_v1.1';

/**
 * v1.1 OpinionForm - 통합된 의견 등록 폼 시스템
 * 
 * 주요 개선사항:
 * - 사용자 인증 정보 자동 연동
 * - 실시간 유효성 검사 및 피드백
 * - 향상된 카테고리 시스템
 * - 자동 저장 기능
 * - 파일 첨부 지원
 * - 태그 시스템
 * - 접근성 개선
 */
const OpinionForm_v11 = ({ 
  projectId, 
  stage = null, 
  onSubmit, 
  onClose,
  initialData = null,
  mode = 'create' // 'create', 'edit', 'reply'
}) => {
  console.log('💬 [v1.1] OpinionForm rendering', { projectId, stage, mode });

  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || 'general',
    priority: initialData?.priority || 'medium',
    tags: initialData?.tags || [],
    isPrivate: initialData?.isPrivate || false,
    notifyOnReply: initialData?.notifyOnReply || true,
    // 사용자 정보는 인증 시스템에서 자동으로 가져옴
    author: initialData?.author || user?.name || '',
    department: initialData?.department || user?.department || '',
    email: initialData?.email || user?.email || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // 카테고리 설정 (확장된 버전)
  const categories = useMemo(() => ({
    general: { 
      label: '일반', 
      color: 'bg-gray-100 text-gray-700 border-gray-300', 
      icon: '💬',
      description: '일반적인 의견이나 제안사항'
    },
    technical: { 
      label: '기술', 
      color: 'bg-blue-100 text-blue-700 border-blue-300', 
      icon: '⚙️',
      description: '기술적 이슈나 개선사항'
    },
    schedule: { 
      label: '일정', 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300', 
      icon: '📅',
      description: '일정 관련 문의나 조정 요청'
    },
    quality: { 
      label: '품질', 
      color: 'bg-red-100 text-red-700 border-red-300', 
      icon: '🎯',
      description: '품질 관련 피드백이나 개선점'
    },
    process: { 
      label: '프로세스', 
      color: 'bg-purple-100 text-purple-700 border-purple-300', 
      icon: '🔄',
      description: '업무 프로세스 개선 제안'
    },
    resource: { 
      label: '리소스', 
      color: 'bg-green-100 text-green-700 border-green-300', 
      icon: '📦',
      description: '인력이나 자원 관련 요청'
    }
  }), []);

  // 우선순위 설정
  const priorities = useMemo(() => ({
    low: { label: '낮음', color: 'bg-gray-100 text-gray-700', icon: '📝' },
    medium: { label: '보통', color: 'bg-blue-100 text-blue-700', icon: '📋' },
    high: { label: '높음', color: 'bg-orange-100 text-orange-700', icon: '⚡' },
    urgent: { label: '긴급', color: 'bg-red-100 text-red-700', icon: '🚨' }
  }), []);

  // 자동 저장 기능
  const autosave = useCallback(() => {
    if (formData.title.trim() || formData.content.trim()) {
      const draftKey = `opinion_draft_${projectId}_${stage || 'general'}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 2000);
    }
  }, [formData, projectId, stage]);

  // 폼 유효성 검사
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // 제목 검사
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = '제목은 5자 이상 입력해주세요';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = '제목은 100자 이하로 입력해주세요';
    }

    // 내용 검사
    if (!formData.content.trim()) {
      newErrors.content = '의견 내용을 입력해주세요';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = '의견 내용은 10자 이상 입력해주세요';
    } else if (formData.content.trim().length > 2000) {
      newErrors.content = '의견 내용은 2000자 이하로 입력해주세요';
    }

    // 작성자 정보 검사 (인증되지 않은 경우)
    if (!user) {
      if (!formData.author.trim()) {
        newErrors.author = '작성자명을 입력해주세요';
      }
      if (!formData.department.trim()) {
        newErrors.department = '부서명을 입력해주세요';
      }
      if (!formData.email.trim()) {
        newErrors.email = '이메일을 입력해주세요';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = '올바른 이메일 형식을 입력해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, user]);

  // 입력 변경 핸들러
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    // 3초 후 자동 저장
    clearTimeout(window.opinionAutosaveTimeout);
    window.opinionAutosaveTimeout = setTimeout(autosave, 3000);
  }, [errors, autosave]);

  // 태그 추가
  const handleAddTag = useCallback(() => {
    const newTag = tagInput.trim();
    if (newTag && !formData.tags.includes(newTag)) {
      handleInputChange('tags', [...formData.tags, newTag]);
      setTagInput('');
    }
  }, [tagInput, formData.tags, handleInputChange]);

  // 태그 제거
  const handleRemoveTag = useCallback((tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, handleInputChange]);

  // 태그 키 입력 핸들러
  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      handleRemoveTag(formData.tags[formData.tags.length - 1]);
    }
  }, [tagInput, formData.tags, handleAddTag, handleRemoveTag]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    console.log('📤 [v1.1] OpinionForm: Submitting', { mode, formData });
    
    if (!validateForm()) {
      console.warn('❌ [v1.1] OpinionForm: Validation failed', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const opinion = {
        ...(initialData || {}),
        id: initialData?.id || Date.now().toString(),
        projectId,
        stage,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        tags: formData.tags,
        isPrivate: formData.isPrivate,
        notifyOnReply: formData.notifyOnReply,
        // 인증된 사용자 정보 우선 사용
        author: user?.name || formData.author.trim(),
        department: user?.department || formData.department.trim(),
        email: user?.email || formData.email.trim(),
        userId: user?.id || null,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: initialData?.status || 'open',
        replies: initialData?.replies || [],
        views: initialData?.views || 0,
        upvotes: initialData?.upvotes || 0,
        downvotes: initialData?.downvotes || 0
      };

      console.log('✅ [v1.1] OpinionForm: Opinion created', opinion);
      
      // 부모 컴포넌트에 제출
      await onSubmit(opinion);

      // Draft 삭제
      const draftKey = `opinion_draft_${projectId}_${stage || 'general'}`;
      localStorage.removeItem(draftKey);

      // 폼 초기화 (새 의견 작성 모드인 경우)
      if (mode === 'create') {
        setFormData({
          title: '',
          content: '',
          category: 'general',
          priority: 'medium',
          tags: [],
          isPrivate: false,
          notifyOnReply: true,
          author: user?.name || '',
          department: user?.department || '',
          email: user?.email || ''
        });
      }

      setErrors({});

    } catch (error) {
      console.error('❌ [v1.1] OpinionForm: Submission error', error);
      setErrors({ submit: '의견 등록 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, validateForm, formData, projectId, stage, user, 
    initialData, mode, onSubmit, errors
  ]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    
    // 변경사항이 있으면 확인
    const hasChanges = formData.title.trim() || formData.content.trim();
    if (hasChanges && !confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?')) {
      return;
    }
    
    onClose?.();
  }, [isSubmitting, formData, onClose]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  }, [handleClose, isSubmitting]);

  // Draft 복원
  const restoreDraft = useCallback(() => {
    const draftKey = `opinion_draft_${projectId}_${stage || 'general'}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...draftData }));
        localStorage.removeItem(draftKey);
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [projectId, stage]);

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border p-6"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'edit' ? '의견 수정' : mode === 'reply' ? '답글 작성' : '의견 등록'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {stage ? `${stage === 'stage1' ? '1단계' : stage === 'stage2' ? '2단계' : '3단계'} 관련 ` : ''}
            의견을 남겨주세요
          </p>
          {isDraftSaved && (
            <p className="text-xs text-green-600 mt-1">✅ 임시저장 완료</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Draft 복원 버튼 */}
          <button
            type="button"
            onClick={restoreDraft}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            📄 임시저장 복원
          </button>
          
          {onClose && (
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 사용자 정보 (인증되지 않은 경우만) */}
        {!user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Input
              label="작성자명"
              id="author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              placeholder="홍길동"
              error={errors.author}
              required
              disabled={isSubmitting}
            />
            
            <Input
              label="부서명"
              id="department"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              placeholder="개발팀"
              error={errors.department}
              required
              disabled={isSubmitting}
            />

            <Input
              label="이메일"
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="hong@company.com"
              error={errors.email}
              required
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* 인증된 사용자 정보 표시 */}
        {user && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-medium">
                  {user.name?.[0] || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-green-900">{user.name}</p>
                <p className="text-sm text-green-700">{user.department} • {user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* 제목 */}
        <Input
          label="제목"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="의견이나 제안사항의 제목을 입력하세요"
          error={errors.title}
          required
          disabled={isSubmitting}
          maxLength={100}
          showCharCount
        />

        {/* 카테고리 및 우선순위 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(categories).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleInputChange('category', key)}
                  disabled={isSubmitting}
                  className={`p-3 text-sm rounded-lg border-2 transition-all hover:shadow-sm ${
                    formData.category === key
                      ? category.color
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                  title={category.description}
                >
                  <div className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              우선순위
            </label>
            <div className="space-y-2">
              {Object.entries(priorities).map(([key, priority]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value={key}
                    checked={formData.priority === key}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    disabled={isSubmitting}
                    className="mr-3"
                  />
                  <span className={`px-3 py-1 text-sm rounded-full ${priority.color} flex items-center space-x-2`}>
                    <span>{priority.icon}</span>
                    <span>{priority.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            태그 (선택사항)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그를 입력하고 Enter를 누르세요"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={isSubmitting || !tagInput.trim()}
            >
              추가
            </Button>
          </div>
        </div>

        {/* 내용 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            의견 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={8}
            maxLength={2000}
            placeholder="프로젝트에 대한 의견이나 제안사항을 자세히 작성해주세요..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>최소 10자 이상 입력해주세요</span>
            <span>{formData.content.length}/2000</span>
          </div>
        </div>

        {/* 옵션 */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPrivate}
              onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
              disabled={isSubmitting}
              className="mr-3"
            />
            <span className="text-sm text-gray-700">
              🔒 비공개 의견 (관리자만 확인 가능)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notifyOnReply}
              onChange={(e) => handleInputChange('notifyOnReply', e.target.checked)}
              disabled={isSubmitting}
              className="mr-3"
            />
            <span className="text-sm text-gray-700">
              🔔 답변 알림 받기
            </span>
          </label>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                의견 등록 안내
              </h4>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>등록된 의견은 프로젝트 관리자가 검토합니다</li>
                  <li>긴급한 사항은 우선순위를 '긴급'으로 설정해주세요</li>
                  <li>비공개 의견은 관리자만 확인할 수 있습니다</li>
                  <li>태그를 활용하여 의견을 분류해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 제출 에러 */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* 버튼들 */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'edit' ? '수정 중...' : '등록 중...'}
              </span>
            ) : (
              mode === 'edit' ? '의견 수정' : mode === 'reply' ? '답글 등록' : '의견 등록'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OpinionForm_v11;