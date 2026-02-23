import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Input } from '../../../components/ui';
import { getStageProgress } from '../../../types/project';

/**
 * v1.1 Stage2Form - 2단계 생산준비 폼 (최적화됨)
 * 
 * 주요 개선사항:
 * - 성능 최적화 (불필요한 리렌더링 방지)
 * - 실시간 유효성 검사
 * - 향상된 사용자 경험
 * - 상세한 진행률 추적
 */
const Stage2Form_v11 = ({ project, onUpdate, mode = 'edit' }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [localFormData, setLocalFormData] = useState({});
  const saveTimeoutRef = useRef(null);

  console.log(`📝 [v1.1] Stage2Form rendered - mode: ${mode}, project: ${project?.name}`);

  const stage2Data = useMemo(() => {
    const data = project?.stage2 || {};
    console.log(`📋 [v1.1] Stage2 data loaded:`, data);
    return data;
  }, [project?.stage2]);

  // 로컬 폼 데이터 초기화
  useEffect(() => {
    setLocalFormData(stage2Data);
  }, [stage2Data]);
  
  // 필드 정의 (v1.1 확장)
  const formFields = useMemo(() => [
    {
      key: 'pilotProductionDate',
      label: '1. 파일럿 생산 예정일(샘플입고일)',
      type: 'date',
      required: true,
      hasExecuted: 'pilotProductionDateExecuted',
      gridCols: 1
    },
    {
      key: 'techTransferDate',
      label: '2. 기술이전 예정일',
      type: 'date',
      required: true,
      hasExecuted: 'techTransferDateExecuted',
      gridCols: 1
    },
    {
      key: 'installationParty',
      label: '3. 설치 주체',
      type: 'text',
      placeholder: '예: 자사, 외주업체명',
      required: true,
      gridCols: 1
    },
    {
      key: 'serviceParty',
      label: '4. 서비스 주체',
      type: 'text',
      placeholder: '예: 자사, 서비스업체명',
      required: true,
      gridCols: 1
    },
    {
      key: 'trainingDate',
      label: '5. 교육 예정일',
      type: 'date',
      required: true,
      hasExecuted: 'trainingDateExecuted',
      gridCols: 1
    },
    {
      key: 'userManualDate',
      label: '6. 사용자 설명서 작성일',
      type: 'date',
      required: true,
      hasExecuted: 'userManualDateExecuted',
      gridCols: 1
    },
    {
      key: 'techManualDate',
      label: '7. 기술교본 작성일',
      type: 'date',
      required: true,
      hasExecuted: 'techManualDateExecuted',
      gridCols: 1
    }
  ], []);

  // 유효성 검사
  const validateField = useCallback((key, value, isRequired) => {
    if (isRequired && (!value || value.trim() === '')) {
      return '필수 입력 항목입니다.';
    }
    
    if (key.includes('Date') || key.includes('pilotProductionDate') || key.includes('techTransferDate') ||
        key.includes('trainingDate') || key.includes('userManualDate') || key.includes('techManualDate')) {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return '올바른 날짜 형식이 아닙니다.';
        }
        
        // 1단계 양산 예정일과 비교
        const stage1Data = project?.stage1 || {};
        if (stage1Data.massProductionDate) {
          const massDate = new Date(stage1Data.massProductionDate);
          if (date > massDate) {
            return '2단계 작업은 양산 예정일 이전에 완료되어야 합니다.';
          }
        }
        
        // 단계별 순서 검증
        if (key === 'techTransferDate' && stage2Data.pilotProductionDate) {
          const pilotDate = new Date(stage2Data.pilotProductionDate);
          if (date < pilotDate) {
            return '기술이전은 파일럿 생산 이후에 진행되어야 합니다.';
          }
        }
      }
    }
    
    return null;
  }, [project?.stage1, stage2Data.pilotProductionDate]);

  // 필드 업데이트 핸들러
  // Debounced save function
  const debouncedSave = useCallback((updatedData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (onUpdate && mode === 'edit') {
        console.log(`💾 [v1.1] Stage2 Debounced save triggered`);
        try {
          onUpdate(updatedData);
          console.log(`✅ [v1.1] Stage2 onUpdate called successfully`);
        } catch (error) {
          console.error(`❌ [v1.1] Error calling Stage2 onUpdate:`, error);
        }
      }
    }, 500); // 500ms 지연
  }, [onUpdate, mode]);

  const handleFieldChange = useCallback((field, value) => {
    console.log(`📝 [v1.1] Stage2Form field updated: ${field} = ${value}`);

    // 터치 상태 업데이트
    setTouched(prev => ({ ...prev, [field]: true }));

    // 유효성 검사
    const fieldDef = formFields.find(f => f.key === field);
    const error = validateField(field, value, fieldDef?.required);

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // 로컬 상태 즉시 업데이트
    const updatedData = {
      ...localFormData,
      [field]: value
    };
    setLocalFormData(updatedData);

    // 디바운스된 저장
    debouncedSave({
      ...stage2Data,
      [field]: value
    });
  }, [formFields, validateField, localFormData, stage2Data, debouncedSave]);

  // 체크박스 업데이트 핸들러
  const handleExecutedChange = useCallback((field, checked) => {
    console.log(`✅ [v1.1] Stage2Form executed updated: ${field} = ${checked}`);

    // 로컬 상태 즉시 업데이트
    const updatedData = {
      ...localFormData,
      [field]: checked
    };
    setLocalFormData(updatedData);

    // 디바운스된 저장
    debouncedSave({
      ...stage2Data,
      [field]: checked
    });
  }, [localFormData, stage2Data, debouncedSave]);

  // 진행률 계산 (표준화된 함수 사용)
  const progressPercentage = useMemo(() => {
    if (!project) return 0;
    return getStageProgress(project, 'stage2');
  }, [project]);

  // 미완성 필드 계산
  const incompleteFields = useMemo(() => {
    const currentData = mode === 'edit' ? localFormData : stage2Data;
    const incomplete = [];

    console.log('🔍 [Stage2] Debug - currentData:', currentData);
    console.log('🔍 [Stage2] Debug - formFields:', formFields);

    formFields.forEach(field => {
      // 필수 필드 체크
      if (field.required) {
        const value = currentData[field.key];
        if (!value || value.trim() === '') {
          console.log(`❌ [Stage2] Missing required field: ${field.key}`, field.label);
          incomplete.push({
            key: field.key,
            label: field.label,
            type: 'required'
          });
        }
      }

      // 실행완료 체크박스 체크 (date 및 file 필드에 대해)
      if (field.hasExecuted) {
        const executedValue = currentData[field.hasExecuted];
        if (!executedValue) {
          console.log(`⚠️ [Stage2] Missing execution for: ${field.hasExecuted}`, field.label);
          incomplete.push({
            key: field.hasExecuted,
            label: `${field.label} - 실행완료`,
            type: 'execution'
          });
        }
      }
    });

    console.log('📊 [Stage2] Final incomplete fields:', incomplete);
    return incomplete;
  }, [formFields, localFormData, stage2Data, mode]);

  // 필드가 미완성인지 확인하는 헬퍼 함수
  const isFieldIncomplete = useCallback((fieldKey, hasExecutedKey = null) => {
    return incompleteFields.some(item =>
      item.key === fieldKey || item.key === hasExecutedKey
    );
  }, [incompleteFields]);

  // 읽기 전용 모드 렌더링
  if (mode === 'view') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-semibold text-green-600">2차 단계 - 생산 준비</h3>
            {incompleteFields.length > 0 && (
              <span className="ml-3 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                미완성 {incompleteFields.length}개
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            진행률: {progressPercentage}%
          </div>
        </div>

        {/* 미완성 필드 경고 영역 */}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {isFieldIncomplete(field.key, field.hasExecuted) && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                    미완성
                  </span>
                )}
              </label>
              
              {field.type === 'date' ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                    {stage2Data[field.key] ? 
                      new Date(stage2Data[field.key]).toLocaleDateString('ko-KR') : 
                      '설정되지 않음'
                    }
                  </div>
                  {field.hasExecuted && (
                    <div className="flex items-center whitespace-nowrap">
                      <div className={`w-4 h-4 rounded ${
                        stage2Data[field.hasExecuted] ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-sm text-gray-600">
                        {stage2Data[field.hasExecuted] ? '실행완료' : '대기중'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                  {stage2Data[field.key] || '입력되지 않음'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 비고 영역 (읽기 전용) */}
        <div className="mt-6 pt-6 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">비고 (공용 메모)</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800 min-h-[100px] whitespace-pre-wrap">
            {stage2Data.notes || '메모가 없습니다.'}
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
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
          <h3 className="text-xl font-semibold text-green-600">2차 단계 - 생산 준비</h3>
          {incompleteFields.length > 0 && (
            <span className="ml-3 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              미완성 {incompleteFields.length}개
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            진행률: <span className="font-medium text-green-600">{progressPercentage}%</span>
          </div>
          {/* 진행률 바 */}
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
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
                  {isFieldIncomplete(field.key, field.hasExecuted) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      미완성
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="date"
                    value={localFormData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={`flex-1 ${
                      validationErrors[field.key] && touched[field.key] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'focus:ring-green-500'
                    }`}
                  />
                  {field.hasExecuted && (
                    <label className="flex items-center whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localFormData[field.hasExecuted] || false}
                        onChange={(e) => handleExecutedChange(field.hasExecuted, e.target.checked)}
                        className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600">실행완료</span>
                    </label>
                  )}
                </div>
                {validationErrors[field.key] && touched[field.key] && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors[field.key]}</p>
                )}
              </div>
            ) : field.type === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {isFieldIncomplete(field.key, field.hasExecuted) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      미완성
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFieldChange(field.key, file.name);
                      }
                    }}
                    className={`flex-1 ${
                      validationErrors[field.key] && touched[field.key] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'focus:ring-green-500'
                    }`}
                  />
                  {field.hasExecuted && (
                    <label className="flex items-center whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localFormData[field.hasExecuted] || false}
                        onChange={(e) => handleExecutedChange(field.hasExecuted, e.target.checked)}
                        className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600">업로드완료</span>
                    </label>
                  )}
                </div>
                {stage2Data[field.key] && (
                  <p className="mt-1 text-sm text-green-600">📄 {stage2Data[field.key]}</p>
                )}
                {validationErrors[field.key] && touched[field.key] && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors[field.key]}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {isFieldIncomplete(field.key) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      미완성
                    </span>
                  )}
                </div>
                <Input
                  value={localFormData[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={
                    validationErrors[field.key] && touched[field.key]
                      ? 'border-red-500 focus:ring-red-500'
                      : 'focus:ring-green-500'
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
            placeholder="2단계 생산준비 관련 메모를 작성하세요. 예: 생산라인 세부 계획, 인증 진행 상황, 교육 내용 등..."
            className="w-full px-4 py-3 border-0 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm leading-relaxed"
            disabled={mode === 'view'}
          />
          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
            <span>🏭</span>
            <span>팁: 생산 준비 단계의 세부 계획과 진행 상황을 기록하세요</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage2Form_v11;