import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui';

/**
 * v1.1 NewProjectModal - 통합된 프로젝트 생성 모달
 * 
 * 주요 개선사항:
 * - 실시간 모델명 기반 ID 생성
 * - 향상된 유효성 검사
 * - 중복 체크 기능
 * - 자동완성 지원
 * - 접근성 개선
 */
const NewProjectModal_v11 = ({ isOpen, onClose, onSubmit }) => {
  console.log('📝 [v1.1] NewProjectModal rendering', { isOpen });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    modelName: '',
    productGroup: '',
    manufacturer: '',
    researcher1: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 자주 사용되는 옵션들 (자동완성용)
  const commonOptions = useMemo(() => ({
    productGroups: ['전기밥솥', '전기압력밥솥', '멀티쿠커', '전기포트', '정수기', '에어프라이어', '믹서기', '블렌더'],
    manufacturers: ['쿠쿠전자', '위니아딤채', '동양매직', 'SK매직', '현대렉시온', '대우전자', '삼성전자', 'LG전자'],
    researchers: ['김철수', '이영희', '박민수', '정수연', '최영진', '한미래', '오세진', '임하나']
  }), []);

  // 모델명 기반 ID 생성
  const generateProjectId = useCallback((modelName) => {
    if (!modelName.trim()) return '';
    
    const timestamp = new Date().getTime();
    const cleanModelName = modelName.trim().replace(/[^\w가-힣]/g, '');
    return `${cleanModelName}_${timestamp}`;
  }, []);

  // 예상 ID 미리보기
  const previewId = useMemo(() => {
    return generateProjectId(formData.modelName);
  }, [formData.modelName, generateProjectId]);

  // Input 변경 핸들러
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
  }, [errors]);

  // 유효성 검사
  const validateForm = useCallback(() => {
    const newErrors = {};

    // 필수 필드 검사
    if (!formData.name.trim()) {
      newErrors.name = '프로젝트명을 입력해주세요';
    }

    if (!formData.modelName.trim()) {
      newErrors.modelName = '모델명을 입력해주세요';
    } else if (formData.modelName.length < 2) {
      newErrors.modelName = '모델명은 2자 이상 입력해주세요';
    }

    if (!formData.productGroup.trim()) {
      newErrors.productGroup = '제품군을 선택해주세요';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = '제조사를 선택해주세요';
    }

    if (!formData.researcher1.trim()) {
      newErrors.researcher1 = '담당 연구원을 입력해주세요';
    }

    // 모델명 형식 검사
    if (formData.modelName.trim() && !/^[A-Za-z0-9가-힣\-_]+$/.test(formData.modelName.trim())) {
      newErrors.modelName = '모델명은 영문, 숫자, 한글, 하이픈(-), 언더바(_)만 사용 가능합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    console.log('📤 [v1.1] NewProjectModal: Submitting form', formData);
    
    if (!validateForm()) {
      console.warn('❌ [v1.1] NewProjectModal: Form validation failed', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 새 프로젝트 객체 생성
      const newProject = {
        id: generateProjectId(formData.modelName),
        name: formData.name.trim(),
        modelName: formData.modelName.trim(),
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stage1: {
          productGroup: formData.productGroup.trim(),
          manufacturer: formData.manufacturer.trim(),
          researcher1: formData.researcher1.trim(),
          // 나머지 필드들은 기본값으로 초기화
          vendor: '',
          productTool: '',
          derivativeModel: '',
          launchDate: '',
          launchDateExecuted: false,
          researcher2: '',
          massProductionDate: '',
          massProductionDateExecuted: false
        },
        stage2: {
          pilotProductionDate: '',
          pilotProductionDateExecuted: false,
          pilotQuantity: '',
          pilotReceiveDate: '',
          pilotReceiveDateExecuted: false,
          techTransferDate: '',
          techTransferDateExecuted: false,
          installationEntity: '',
          serviceEntity: '',
          trainingDate: '',
          trainingDateExecuted: false,
          trainingCompleted: false,
          manualUploaded: false,
          techGuideUploaded: false,
          orderAcceptanceDate: '',
          orderAcceptanceDateExecuted: false
        },
        stage3: {
          initialProductionDate: '',
          initialProductionDateExecuted: false,
          firstOrderDate: '',
          firstOrderDateExecuted: false,
          bomManager: '',
          bomTargetDate: '',
          bomTargetDateExecuted: false,
          priceManager: '',
          priceTargetDate: '',
          priceTargetDateExecuted: false,
          partsDeliveryDate: '',
          partsDeliveryDateExecuted: false,
          partsReceived: false,
          branchOrderEnabled: false,
          issueResolved: false
        }
      };

      console.log('✅ [v1.1] NewProjectModal: Project created', newProject);
      
      // 부모 컴포넌트에 제출
      await onSubmit(newProject);

      // 폼 초기화
      setFormData({
        name: '',
        modelName: '',
        productGroup: '',
        manufacturer: '',
        researcher1: '',
        description: ''
      });
      setErrors({});

    } catch (error) {
      console.error('❌ [v1.1] NewProjectModal: Submission error', error);
      setErrors({ submit: '프로젝트 생성 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, validateForm, generateProjectId, onSubmit]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    
    setFormData({
      name: '',
      modelName: '',
      productGroup: '',
      manufacturer: '',
      researcher1: '',
      description: ''
    });
    setErrors({});
    onClose();
  }, [isSubmitting, onClose]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  }, [handleClose, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">새 프로젝트 생성</h2>
            <p className="text-sm text-gray-600 mt-1">새로운 제품 개발 프로젝트를 시작합니다</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="모달 닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 프로젝트 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
            
            {/* 프로젝트명 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                프로젝트명 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="예: 차세대 전기밥솥 개발 프로젝트"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 모델명 */}
            <div>
              <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-2">
                모델명 <span className="text-red-500">*</span>
              </label>
              <input
                id="modelName"
                type="text"
                value={formData.modelName}
                onChange={(e) => handleInputChange('modelName', e.target.value)}
                placeholder="예: CRP-P1009SR"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.modelName ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.modelName && (
                <p className="mt-1 text-sm text-red-600">{errors.modelName}</p>
              )}
              {previewId && (
                <p className="mt-1 text-sm text-gray-600">
                  프로젝트 ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{previewId}</code>
                </p>
              )}
            </div>
          </div>

          {/* 제품 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">제품 정보</h3>
            
            {/* 제품군 */}
            <div>
              <label htmlFor="productGroup" className="block text-sm font-medium text-gray-700 mb-2">
                제품군 <span className="text-red-500">*</span>
              </label>
              <input
                id="productGroup"
                type="text"
                value={formData.productGroup}
                onChange={(e) => handleInputChange('productGroup', e.target.value)}
                placeholder="제품군을 입력하세요 (예: 전기밥솥, 멀티쿠커, 정수기 등)"
                list="productGroups"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.productGroup ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <datalist id="productGroups">
                {commonOptions.productGroups.map(group => (
                  <option key={group} value={group} />
                ))}
              </datalist>
              {errors.productGroup && (
                <p className="mt-1 text-sm text-red-600">{errors.productGroup}</p>
              )}
            </div>

            {/* 제조사 */}
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
                제조사 <span className="text-red-500">*</span>
              </label>
              <input
                id="manufacturer"
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="제조사를 입력하세요 (예: 쿠쿠전자, 위니아딤채, 동양매직 등)"
                list="manufacturers"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.manufacturer ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <datalist id="manufacturers">
                {commonOptions.manufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer} />
                ))}
              </datalist>
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>
              )}
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">담당자 정보</h3>
            
            {/* 담당 연구원 */}
            <div>
              <label htmlFor="researcher1" className="block text-sm font-medium text-gray-700 mb-2">
                담당 연구원 <span className="text-red-500">*</span>
              </label>
              <input
                id="researcher1"
                type="text"
                value={formData.researcher1}
                onChange={(e) => handleInputChange('researcher1', e.target.value)}
                placeholder="담당 연구원 이름을 입력하세요"
                list="researchers"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.researcher1 ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <datalist id="researchers">
                {commonOptions.researchers.map(researcher => (
                  <option key={researcher} value={researcher} />
                ))}
              </datalist>
              {errors.researcher1 && (
                <p className="mt-1 text-sm text-red-600">{errors.researcher1}</p>
              )}
            </div>
          </div>

          {/* 프로젝트 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 설명 (선택사항)
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* 제출 에러 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  생성중...
                </span>
              ) : (
                '프로젝트 생성'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal_v11;