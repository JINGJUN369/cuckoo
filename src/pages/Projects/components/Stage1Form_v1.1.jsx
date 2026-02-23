import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Input } from '../../../components/ui';
import { getStageProgress } from '../../../types/project';

/**
 * v1.1 Stage1Form - 1단계 기본정보 폼 (최적화됨)
 * 
 * 주요 개선사항:
 * - 성능 최적화 (불필요한 리렌더링 방지)
 * - 실시간 유효성 검사
 * - 향상된 사용자 경험
 * - 상세한 진행률 추적
 */
const Stage1Form_v11 = ({ project, onUpdate, mode = 'edit' }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [localFormData, setLocalFormData] = useState({});
  const saveTimeoutRef = useRef(null);

  console.log(`📝 [v1.1] Stage1Form rendered - mode: ${mode}, project: ${project?.name}`);

  const stage1Data = useMemo(() => {
    const data = project?.stage1 || {};
    console.log(`📋 [v1.1] Stage1 data loaded:`, data);
    return data;
  }, [project?.stage1]);

  // 로컬 폼 데이터 초기화
  useEffect(() => {
    setLocalFormData(stage1Data);
  }, [stage1Data]);
  
  // 필드 정의 (v1.1 확장)
  const formFields = useMemo(() => [
    {
      key: 'productGroup',
      label: '1. 제품군',
      type: 'text',
      placeholder: '예: 정수기, 비데, 공기청정기',
      required: true,
      gridCols: 1
    },
    {
      key: 'modelName',
      label: '2. 모델명',
      type: 'text',
      placeholder: '예: CP-A100B, WP-3500L',
      required: true,
      gridCols: 1
    },
    {
      key: 'manufacturer',
      label: '3. 제조사', 
      type: 'text',
      placeholder: '예: 자사, 나누텍, 하이센스',
      required: true,
      gridCols: 1
    },
    {
      key: 'vendor',
      label: '4. 벤더사',
      type: 'text',
      placeholder: '예: 신성전자, TKK',
      required: false,
      gridCols: 1
    },
    {
      key: 'derivativeModel',
      label: '5. 파생모델',
      type: 'text', 
      placeholder: '예: CHP-06DRW, CHP-06DRB',
      required: false,
      gridCols: 1
    },
    {
      key: 'launchDate',
      label: '6. 출시예정일',
      type: 'date',
      required: true,
      hasExecuted: 'launchDateExecuted',
      gridCols: 1
    },
    {
      key: 'productManager',
      label: '7. 상품개발 담당자',
      type: 'text',
      placeholder: '예: 홍길동',
      required: true,
      gridCols: 1
    },
    {
      key: 'mechanicalEngineer',
      label: '8. 연구소 담당자 (기구)',
      type: 'text',
      placeholder: '예: 김기구',
      required: false,
      gridCols: 1
    },
    {
      key: 'circuitEngineer',
      label: '9. 연구소 담당자 (회로)',
      type: 'text',
      placeholder: '예: 이회로',
      required: false,
      gridCols: 1
    },
    {
      key: 'massProductionDate',
      label: '10. 양산 예정일',
      type: 'date',
      required: true,
      hasExecuted: 'massProductionDateExecuted',
      gridCols: 1
    }
  ], []);

  // 유효성 검사
  const validateField = useCallback((key, value, isRequired) => {
    if (isRequired && (!value || value.trim() === '')) {
      return '필수 입력 항목입니다.';
    }
    
    if (key.includes('Date') && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return '올바른 날짜 형식이 아닙니다.';
      }
      
      // 출시일과 양산일 순서 검사
      if (key === 'launchDate' && stage1Data.massProductionDate) {
        const massDate = new Date(stage1Data.massProductionDate);
        if (date >= massDate) {
          return '출시 예정일은 양산 예정일보다 빨라야 합니다.';
        }
      }
      
      if (key === 'massProductionDate' && stage1Data.launchDate) {
        const launchDate = new Date(stage1Data.launchDate);
        if (date <= launchDate) {
          return '양산 예정일은 출시 예정일보다 늦어야 합니다.';
        }
      }
    }
    
    return null;
  }, [stage1Data.launchDate, stage1Data.massProductionDate]);

  // Debounced save function
  const debouncedSave = useCallback((updatedData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (onUpdate && mode === 'edit') {
        console.log(`💾 [v1.1] Debounced save triggered`);
        try {
          onUpdate(updatedData);
          console.log(`✅ [v1.1] onUpdate called successfully`);
        } catch (error) {
          console.error(`❌ [v1.1] Error calling onUpdate:`, error);
        }
      }
    }, 500); // 500ms 지연
  }, [onUpdate, mode]);

  // 필드 업데이트 핸들러 (즉시 로컬 상태 업데이트, 지연된 저장)
  const handleFieldChange = useCallback((field, value) => {
    console.log(`📝 [v1.1] Stage1Form field updated: ${field} = ${value}`);

    // 터치 상태 업데이트
    setTouched(prev => ({ ...prev, [field]: true }));

    // 유효성 검사
    const fieldDef = formFields.find(f => f.key === field);
    const error = validateField(field, value, fieldDef?.required);

    setValidationErrors(prev => ({ ...prev, [field]: error }));

    // 로컬 상태 즉시 업데이트
    const updatedData = {
      ...localFormData,
      [field]: value
    };
    setLocalFormData(updatedData);

    // 디바운스된 저장
    debouncedSave({
      ...stage1Data,
      [field]: value
    });
  }, [formFields, validateField, localFormData, stage1Data, debouncedSave]);

  // 체크박스 업데이트 핸들러
  const handleExecutedChange = useCallback((field, checked) => {
    console.log(`✅ [v1.1] Stage1Form executed updated: ${field} = ${checked}`);
    
    if (onUpdate && mode === 'edit') {
      const updatedStage1Data = {
        ...stage1Data,
        [field]: checked
      };
      onUpdate(updatedStage1Data);
    }
  }, [onUpdate, mode, stage1Data]);

  // 진행률 계산 (표준화된 함수 사용)
  const progressPercentage = useMemo(() => {
    if (!project) return 0;
    const progress = getStageProgress(project, 'stage1');
    console.log('🎯 [Stage1Form] Final progress percentage:', progress);
    return progress;
  }, [project]);

  // 미완성 필드 찾기
  const incompleteFields = useMemo(() => {
    const currentData = mode === 'edit' ? localFormData : stage1Data;
    const incomplete = [];

    console.log('🔍 [Stage1] Debug - currentData:', currentData);
    console.log('🔍 [Stage1] Debug - formFields:', formFields);
    console.log('🔍 [Stage1] Required fields:', formFields.filter(f => f.required).map(f => f.key));
    console.log('🔍 [Stage1] Date fields with execution:', formFields.filter(f => f.hasExecuted).map(f => ({ date: f.key, executed: f.hasExecuted })));

    formFields.forEach(field => {
      if (field.required && !currentData[field.key]) {
        console.log(`❌ [Stage1] Missing required field: ${field.key}`, field.label);
        incomplete.push({
          key: field.key,
          label: field.label,
          type: field.type
        });
      }
      // 날짜 필드의 실행완료 체크
      if (field.hasExecuted && currentData[field.key] && !currentData[field.hasExecuted]) {
        console.log(`⚠️ [Stage1] Missing execution for: ${field.hasExecuted}`, field.label);
        incomplete.push({
          key: field.hasExecuted,
          label: `${field.label} 실행완료`,
          type: 'checkbox'
        });
      }
    });

    console.log('📊 [Stage1] Final incomplete fields:', incomplete);
    return incomplete;
  }, [formFields, localFormData, stage1Data, mode]);

  // 필드가 미완성인지 확인하는 함수
  const isFieldIncomplete = useCallback((fieldKey, hasExecuted = null) => {
    const currentData = mode === 'edit' ? localFormData : stage1Data;
    if (hasExecuted) {
      return currentData[fieldKey] && !currentData[hasExecuted];
    }
    const field = formFields.find(f => f.key === fieldKey);
    return field?.required && !currentData[fieldKey];
  }, [formFields, localFormData, stage1Data, mode]);

  // 읽기 전용 모드 렌더링
  if (mode === 'view') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-semibold text-blue-600">1차 단계 - 기본 정보</h3>
          </div>
          <div className="flex items-center space-x-4">
            {incompleteFields.length > 0 && (
              <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                <span className="mr-2">⚠️</span>
                미완성 {incompleteFields.length}개
              </div>
            )}
            <div className={`text-sm font-medium ${
              progressPercentage === 100 ? 'text-green-600' : 'text-gray-600'
            }`}>
              진행률: {progressPercentage}%
            </div>
          </div>
        </div>

        {/* 미완성 필드 상세 알림 */}
        {incompleteFields.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-amber-600 font-medium">📝 완료하지 않은 항목:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {incompleteFields.map((field, index) => (
                <div key={field.key} className="flex items-center text-sm text-amber-700">
                  <span className="mr-2">•</span>
                  {field.label}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formFields.map(field => (
            <div key={field.key} className={`${field.gridCols === 2 ? 'md:col-span-2' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {isFieldIncomplete(field.key) && (
                  <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    미완성
                  </span>
                )}
              </label>
              
              {field.type === 'date' ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                    {stage1Data[field.key] ? 
                      new Date(stage1Data[field.key]).toLocaleDateString('ko-KR') : 
                      '설정되지 않음'
                    }
                  </div>
                  {field.hasExecuted && (
                    <div className="flex items-center whitespace-nowrap">
                      <div className={`w-4 h-4 rounded ${
                        stage1Data[field.hasExecuted] ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-sm text-gray-600">
                        {stage1Data[field.hasExecuted] ? '실행완료' : '대기중'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                  {stage1Data[field.key] || '입력되지 않음'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 비고 영역 (읽기 전용) */}
        <div className="mt-6 pt-6 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">비고 (공용 메모)</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800 min-h-[100px] whitespace-pre-wrap">
            {stage1Data.notes || '메모가 없습니다.'}
          </div>
        </div>
      </div>
    );
  }

  // 편집 모드 렌더링
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
          <h3 className="text-xl font-semibold text-blue-600">1차 단계 - 기본 정보</h3>
          {incompleteFields.length > 0 && (
            <span className="ml-3 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              미완성 {incompleteFields.length}개
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            진행률: <span className="font-medium text-blue-600">{progressPercentage}%</span>
          </div>
          {/* 진행률 바 */}
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 미완성 필드 경고 영역 (편집 모드) */}
      {incompleteFields.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
            <h4 className="text-sm font-medium text-amber-800">완료되지 않은 항목들</h4>
          </div>
          <ul className="text-sm text-amber-700 space-y-1">
            {incompleteFields.map((item, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map(field => (
          <div key={field.key} className={`${field.gridCols === 2 ? 'md:col-span-2' : ''}`}>
            {field.type === 'date' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="date"
                    value={localFormData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={`flex-1 ${
                      validationErrors[field.key] && touched[field.key] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'focus:ring-blue-500'
                    }`}
                  />
                  {field.hasExecuted && (
                    <label className="flex items-center whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stage1Data[field.hasExecuted] || false}
                        onChange={(e) => handleExecutedChange(field.hasExecuted, e.target.checked)}
                        className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">실행완료</span>
                    </label>
                  )}
                </div>
                {validationErrors[field.key] && touched[field.key] && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors[field.key]}</p>
                )}
              </div>
            ) : (
              <div>
                <Input
                  label={field.label}
                  required={field.required}
                  value={localFormData[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={
                    validationErrors[field.key] && touched[field.key] 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'focus:ring-blue-500'
                  }
                />
                {validationErrors[field.key] && touched[field.key] && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors[field.key]}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 비고 영역 (전체 너비) */}
      <div className="mt-6 pt-6 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">비고 (공용 메모)</label>
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
          <textarea
            value={localFormData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={6}
            placeholder="이 영역은 모든 사용자가 공유하는 메모장입니다. 프로젝트 관련 중요 사항, 변경 내용, 특이사항 등을 자유롭게 작성해주세요..."
            className="w-full px-4 py-3 border-0 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed"
            disabled={mode === 'view'}
          />
          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
            <span>💡</span>
            <span>팁: 날짜와 내용을 함께 기록하면 변경 이력 추적에 도움됩니다</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage1Form_v11;