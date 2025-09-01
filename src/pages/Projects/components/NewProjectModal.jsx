import React, { useState } from 'react';
import { Button } from '../../../components/ui';

const NewProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    modelName: '',
    productGroup: '',
    manufacturer: '',
    vendor: '',
    derivativeModel: '',
    releaseDate: '',
    productDeveloper: '',
    researchDeveloper: '',
    massProductionDate: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const getCurrentUser = () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '프로젝트명을 입력해주세요';
    }
    
    if (!formData.modelName.trim()) {
      newErrors.modelName = '모델명을 입력해주세요';
    }
    
    if (!formData.productGroup.trim()) {
      newErrors.productGroup = '제품군을 입력해주세요';
    }
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = '제조사를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const user = getCurrentUser();
    
    // 모델명을 기반으로 프로젝트 ID 생성 (영어/숫자만 사용, 특수문자 제거)
    const sanitizedModelName = formData.modelName.trim()
      .replace(/[^a-zA-Z0-9가-힣]/g, '') // 특수문자 제거
      .replace(/\s+/g, '_'); // 공백을 언더스코어로 변경
    
    const timestamp = Date.now();
    const projectId = `${sanitizedModelName}_${timestamp}`;
    
    const newProject = {
      id: projectId,
      name: formData.name.trim(),
      modelName: formData.modelName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.id || 'unknown',
      stage1: {
        productGroup: formData.productGroup.trim(),
        manufacturer: formData.manufacturer.trim(),
        vendor: formData.vendor.trim(),
        derivativeModel: formData.derivativeModel.trim(),
        launchDate: formData.releaseDate, // releaseDate -> launchDate로 필드명 통일
        productDeveloper: formData.productDeveloper.trim(),
        researchDeveloper: formData.researchDeveloper.trim(),
        massProductionDate: formData.massProductionDate,
        notes: formData.description.trim() // memo -> notes로 필드명 통일
      },
      stage2: {},
      stage3: {}
    };

    onSubmit(newProject);
    
    // 폼 초기화
    setFormData({
      name: '',
      modelName: '',
      productGroup: '',
      manufacturer: '',
      vendor: '',
      derivativeModel: '',
      releaseDate: '',
      productDeveloper: '',
      researchDeveloper: '',
      massProductionDate: '',
      description: ''
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러가 있던 필드에 값을 입력하면 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      modelName: '',
      productGroup: '',
      manufacturer: '',
      vendor: '',
      derivativeModel: '',
      releaseDate: '',
      productDeveloper: '',
      researchDeveloper: '',
      massProductionDate: '',
      description: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">새 프로젝트 생성</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            새로운 프로젝트의 기본 정보를 입력해주세요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              기본 정보
            </h3>
            
            {/* 프로젝트명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로젝트명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="프로젝트명을 입력하세요"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* 모델명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모델명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.modelName}
                onChange={(e) => handleChange('modelName', e.target.value)}
                placeholder="예: CWP-A220, FR-B181R"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.modelName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.modelName && (
                <p className="text-red-500 text-sm mt-1">{errors.modelName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                모델명은 프로젝트 ID에 포함됩니다
              </p>
            </div>

            {/* 제품군 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품군 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.productGroup}
                onChange={(e) => handleChange('productGroup', e.target.value)}
                placeholder="예: 밥솥, 정수기, 에어프라이어 등"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.productGroup ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.productGroup && (
                <p className="text-red-500 text-sm mt-1">{errors.productGroup}</p>
              )}
            </div>

            {/* 제조사 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제조사 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                placeholder="제조사명을 입력하세요"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.manufacturer && (
                <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 벤더사 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  벤더사
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="벤더사명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 파생모델 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파생모델
                </label>
                <input
                  type="text"
                  value={formData.derivativeModel}
                  onChange={(e) => handleChange('derivativeModel', e.target.value)}
                  placeholder="파생모델명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              일정 정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 출시예정일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출시예정일
                </label>
                <input
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => handleChange('releaseDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 양산예정일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  양산예정일
                </label>
                <input
                  type="date"
                  value={formData.massProductionDate}
                  onChange={(e) => handleChange('massProductionDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              담당자 정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 상품개발담당자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품개발담당자
                </label>
                <input
                  type="text"
                  value={formData.productDeveloper}
                  onChange={(e) => handleChange('productDeveloper', e.target.value)}
                  placeholder="담당자명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 연구소담당자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연구소담당자(기구/회로)
                </label>
                <input
                  type="text"
                  value={formData.researchDeveloper}
                  onChange={(e) => handleChange('researchDeveloper', e.target.value)}
                  placeholder="담당자명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 프로젝트 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              프로젝트 생성
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;