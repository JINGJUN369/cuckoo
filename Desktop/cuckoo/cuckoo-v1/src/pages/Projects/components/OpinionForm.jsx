import React, { useState } from 'react';
import { Button, Input } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';

const OpinionForm = ({ projectId, stage, onSubmit, onClose }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    content: '',
    category: 'general' // 'general', 'technical', 'schedule', 'quality'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = {
    general: { label: '일반', color: 'bg-gray-500' },
    technical: { label: '기술', color: 'bg-blue-500' },
    schedule: { label: '일정', color: 'bg-yellow-500' },
    quality: { label: '품질', color: 'bg-red-500' }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름은 필수입니다';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = '부서명은 필수입니다';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '의견 내용은 필수입니다';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = '의견 내용은 최소 10자 이상 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const opinion = {
        id: Date.now().toString(),
        projectId,
        stage,
        name: formData.name.trim(),
        department: formData.department.trim(),
        content: formData.content.trim(),
        category: formData.category,
        createdAt: new Date().toISOString(),
        status: 'open' // 'open', 'reviewed', 'resolved'
      };

      onSubmit(opinion);
      
      toast.success('의견이 성공적으로 등록되었습니다!');
      
      // Reset form
      setFormData({
        name: '',
        department: '',
        content: '',
        category: 'general'
      });
      setErrors({});
      
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Error submitting opinion:', error);
      toast.error('의견 등록 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">의견 남기기</h3>
          <p className="text-sm text-gray-600 mt-1">
            프로젝트에 대한 의견이나 제안사항을 남겨주세요
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="이름"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="홍길동"
            error={errors.name}
            required
          />
          
          <Input
            label="부서명"
            id="department"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            placeholder="개발팀"
            error={errors.department}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleInputChange('category', key)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  formData.category === key
                    ? `${category.color} text-white border-transparent`
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            의견 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={5}
            placeholder="프로젝트에 대한 의견이나 제안사항을 자세히 작성해주세요..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            최소 10자 이상 입력해주세요
          </p>
        </div>

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
                  <li>기술적 문제나 일정 관련 사항은 해당 카테고리를 선택해주세요</li>
                  <li>익명으로 의견을 남기실 수는 없습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '의견 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OpinionForm;