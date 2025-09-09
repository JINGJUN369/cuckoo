// 충돌 해결 모달 컴포넌트
import React, { useState, useEffect } from 'react';
import { useHybridAuth } from '../../hooks/useHybridAuth';

/**
 * 충돌 해결 모달 컴포넌트
 * - 동시 편집 충돌 감지 시 표시
 * - 변경사항 비교 및 병합 옵션 제공
 * - 자동 해결 및 수동 해결 지원
 */
export const ConflictResolutionModal = ({ 
  isOpen, 
  onClose, 
  conflicts = [],
  onResolve,
  projectData,
  localChanges,
  remoteChanges
}) => {
  const { user } = useHybridAuth();
  const [selectedResolution, setSelectedResolution] = useState('merge'); // merge, local, remote, manual
  const [manualResolutions, setManualResolutions] = useState({});
  const [showDiff, setShowDiff] = useState(false);

  // 충돌 해결 옵션
  const resolutionOptions = [
    {
      value: 'merge',
      label: '자동 병합',
      description: '충돌하지 않는 변경사항을 자동으로 병합하고, 충돌되는 부분만 수동 선택',
      icon: '🔀'
    },
    {
      value: 'local',
      label: '내 변경사항 유지',
      description: '내가 작업한 모든 변경사항을 유지하고 다른 사용자의 변경사항 무시',
      icon: '📝'
    },
    {
      value: 'remote',
      label: '서버 변경사항 적용',
      description: '서버의 최신 변경사항을 적용하고 내 변경사항 무시',
      icon: '☁️'
    },
    {
      value: 'manual',
      label: '수동 해결',
      description: '각 충돌 항목을 개별적으로 선택하여 해결',
      icon: '⚙️'
    }
  ];

  // 충돌 유형별 아이콘
  const getConflictIcon = (type) => {
    switch (type) {
      case 'field_conflict': return '📝';
      case 'concurrent_edit': return '⚡';
      case 'version_mismatch': return '🔄';
      case 'data_integrity': return '⚠️';
      default: return '❓';
    }
  };

  // 충돌 우선순위 색상
  const getConflictColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // 필드값 비교 표시
  const renderValueComparison = (conflict) => {
    const { field, localValue, remoteValue, type } = conflict;
    
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-900">
          {getConflictIcon(type)} {conflict.fieldLabel || field}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* 내 변경사항 */}
          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
            <div className="text-xs text-blue-600 font-medium mb-2">내 변경사항</div>
            <div className="text-sm text-gray-900 break-words">
              {localValue !== undefined ? (
                typeof localValue === 'object' ? JSON.stringify(localValue, null, 2) : String(localValue)
              ) : (
                <span className="text-gray-400 italic">변경 없음</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {conflict.localTimestamp && new Date(conflict.localTimestamp).toLocaleString('ko-KR')}
            </div>
          </div>

          {/* 서버 변경사항 */}
          <div className="border border-green-200 rounded-lg p-3 bg-green-50">
            <div className="text-xs text-green-600 font-medium mb-2">
              서버 변경사항 ({conflict.remoteUser || '다른 사용자'})
            </div>
            <div className="text-sm text-gray-900 break-words">
              {remoteValue !== undefined ? (
                typeof remoteValue === 'object' ? JSON.stringify(remoteValue, null, 2) : String(remoteValue)
              ) : (
                <span className="text-gray-400 italic">변경 없음</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {conflict.remoteTimestamp && new Date(conflict.remoteTimestamp).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 수동 선택 (manual 모드에서만) */}
        {selectedResolution === 'manual' && (
          <div className="flex justify-center space-x-4 pt-3 border-t border-gray-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`resolution-${field}`}
                value="local"
                checked={manualResolutions[field] === 'local'}
                onChange={(e) => setManualResolutions(prev => ({
                  ...prev,
                  [field]: e.target.value
                }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-blue-600">내 변경사항 선택</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`resolution-${field}`}
                value="remote"
                checked={manualResolutions[field] === 'remote'}
                onChange={(e) => setManualResolutions(prev => ({
                  ...prev,
                  [field]: e.target.value
                }))}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm text-green-600">서버 변경사항 선택</span>
            </label>
          </div>
        )}
      </div>
    );
  };

  // 해결 실행
  const handleResolve = () => {
    let resolution;
    
    switch (selectedResolution) {
      case 'merge':
        resolution = {
          type: 'auto_merge',
          conflicts: conflicts.map(conflict => ({
            field: conflict.field,
            resolution: 'merge'
          }))
        };
        break;
        
      case 'local':
        resolution = {
          type: 'keep_local',
          conflicts: conflicts.map(conflict => ({
            field: conflict.field,
            resolution: 'local',
            value: conflict.localValue
          }))
        };
        break;
        
      case 'remote':
        resolution = {
          type: 'keep_remote',
          conflicts: conflicts.map(conflict => ({
            field: conflict.field,
            resolution: 'remote',
            value: conflict.remoteValue
          }))
        };
        break;
        
      case 'manual':
        resolution = {
          type: 'manual',
          conflicts: conflicts.map(conflict => ({
            field: conflict.field,
            resolution: manualResolutions[conflict.field] || 'local',
            value: manualResolutions[conflict.field] === 'remote' 
              ? conflict.remoteValue 
              : conflict.localValue
          }))
        };
        break;
    }

    console.log('🔀 [ConflictResolution] Resolving conflicts:', resolution);
    onResolve(resolution);
  };

  // 모달이 열릴 때 기본값 설정
  useEffect(() => {
    if (isOpen && conflicts.length > 0) {
      // 충돌 필드별로 기본값을 local로 설정
      const defaultResolutions = {};
      conflicts.forEach(conflict => {
        defaultResolutions[conflict.field] = 'local';
      });
      setManualResolutions(defaultResolutions);
    }
  }, [isOpen, conflicts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-900">
                편집 충돌 발견
              </h2>
              <p className="text-sm text-red-700">
                다른 사용자가 동시에 같은 데이터를 수정했습니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 충돌 정보 요약 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{conflicts.length}</div>
              <div className="text-sm text-gray-600">충돌 항목</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {conflicts.filter(c => c.severity === 'high').length}
              </div>
              <div className="text-sm text-gray-600">높은 우선순위</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {conflicts.filter(c => c.type === 'field_conflict').length}
              </div>
              <div className="text-sm text-gray-600">필드 충돌</div>
            </div>
          </div>
        </div>

        {/* 해결 옵션 선택 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">해결 방법 선택</h3>
          <div className="grid grid-cols-2 gap-3">
            {resolutionOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedResolution === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  value={option.value}
                  checked={selectedResolution === option.value}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="w-5 h-5 text-blue-600 mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 충돌 항목 상세 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">충돌 항목 상세</h3>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showDiff ? '단순 보기' : '차이점 보기'}
            </button>
          </div>
          
          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div
                key={`${conflict.field}-${index}`}
                className={`border-2 rounded-lg p-4 ${getConflictColor(conflict.severity)}`}
              >
                {renderValueComparison(conflict)}
                
                {/* 충돌 추가 정보 */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>우선순위: {conflict.severity}</span>
                    <span>유형: {conflict.type}</span>
                    {conflict.autoResolvable && (
                      <span className="text-green-600">자동 해결 가능</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedResolution === 'manual' && (
              <span>
                {Object.keys(manualResolutions).length}/{conflicts.length} 항목 선택됨
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleResolve}
              disabled={
                selectedResolution === 'manual' && 
                Object.keys(manualResolutions).length !== conflicts.length
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              충돌 해결 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;