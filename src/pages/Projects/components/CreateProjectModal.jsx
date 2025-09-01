import React, { useState } from 'react';
import { useProjectStore } from '../../../hooks/useProjectStore';
import { Modal, Button, Input, useToast } from '../../../components/ui';

const CreateProjectModal = ({ isOpen, onClose }) => {
  const { addProject } = useProjectStore();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manufacturer: '',
    researcher1: '',
    researcher2: '',
    massProductionDate: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '프로젝트 이름은 필수입니다';
    }
    
    if (!formData.researcher1.trim()) {
      newErrors.researcher1 = '담당자는 필수입니다';
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
      // Generate unique ID
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
      const projectId = `PRJ-${randomStr}-${timestamp.toString().slice(-4)}`;

      const projectData = {
        id: projectId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        stage1: {
          manufacturer: formData.manufacturer.trim(),
          researcher1: formData.researcher1.trim(),
          researcher2: formData.researcher2.trim(),
          massProductionDate: formData.massProductionDate,
        }
      };

      addProject(projectData);
      
      toast.success(`프로젝트 "${formData.name}"이 생성되었습니다!`);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        manufacturer: '',
        researcher1: '',
        researcher2: '',
        massProductionDate: '',
      });
      setErrors({});
      onClose();
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('프로젝트 생성 중 오류가 발생했습니다');
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

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        manufacturer: '',
        researcher1: '',
        researcher2: '',
        massProductionDate: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 프로젝트 생성"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <Input
          label="프로젝트 이름"
          id="projectName"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="예: 에어컨 프로젝트"
          error={errors.name}
          required
        />

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            프로젝트 설명
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="제조사"
            value={formData.manufacturer}
            onChange={(e) => handleInputChange('manufacturer', e.target.value)}
            placeholder="예: LG전자"
          />
          
          <Input
            label="양산예정일"
            type="date"
            value={formData.massProductionDate}
            onChange={(e) => handleInputChange('massProductionDate', e.target.value)}
          />
        </div>

        {/* Researchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="담당자 1"
            value={formData.researcher1}
            onChange={(e) => handleInputChange('researcher1', e.target.value)}
            placeholder="예: 김연구"
            error={errors.researcher1}
            required
          />
          
          <Input
            label="담당자 2"
            value={formData.researcher2}
            onChange={(e) => handleInputChange('researcher2', e.target.value)}
            placeholder="예: 이개발 (선택사항)"
          />
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                프로젝트 생성 안내
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>기본 정보만 입력하고 나머지는 나중에 편집할 수 있습니다</li>
                  <li>프로젝트 ID는 자동으로 생성됩니다</li>
                  <li>생성 후 단계별 상세 정보를 입력하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? '생성 중...' : '프로젝트 생성'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;