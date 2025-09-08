// 편집 상태 표시 컴포넌트
import React from 'react';

/**
 * 편집 상태 표시 컴포넌트
 * - 필드별 편집 잠금 상태 표시
 * - 다른 사용자의 편집 중 표시
 * - 충돌 경고 표시
 */
export const EditingIndicator = ({ 
  isLocked = false,
  editingUser = null,
  isConflicted = false,
  isEditing = false,
  fieldPath = null,
  showTooltip = true,
  size = 'small' // small, medium, large
}) => {
  
  // 크기별 스타일
  const sizeClasses = {
    small: {
      container: 'text-xs px-2 py-1',
      icon: 'text-sm',
      text: 'text-xs'
    },
    medium: {
      container: 'text-sm px-3 py-1.5',
      icon: 'text-base',
      text: 'text-sm'
    },
    large: {
      container: 'text-base px-4 py-2',
      icon: 'text-lg',
      text: 'text-base'
    }
  };

  const styles = sizeClasses[size] || sizeClasses.small;

  // 상태별 표시 내용
  const getIndicatorContent = () => {
    // 충돌 상태가 최우선
    if (isConflicted) {
      return {
        icon: '⚠️',
        text: '충돌',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        tooltip: '데이터 충돌이 발견되었습니다. 해결이 필요합니다.'
      };
    }

    // 다른 사용자가 편집 중
    if (isLocked && editingUser) {
      return {
        icon: '🔒',
        text: `${editingUser.userName || 'Unknown'} 편집중`,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        tooltip: `${editingUser.userName || '다른 사용자'}님이 현재 이 필드를 편집하고 있습니다.`
      };
    }

    // 내가 편집 중
    if (isEditing) {
      return {
        icon: '✏️',
        text: '편집중',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        tooltip: '현재 편집 중입니다.'
      };
    }

    // 아무 상태도 해당되지 않으면 null 반환
    return null;
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <div className="relative inline-block">
      <div className={`
        inline-flex items-center space-x-1 rounded-full border
        ${content.bgColor} ${content.textColor} ${content.borderColor}
        ${styles.container}
        transition-all duration-200
      `}>
        <span className={styles.icon}>{content.icon}</span>
        <span className={`font-medium ${styles.text}`}>
          {content.text}
        </span>
      </div>

      {/* 툴팁 */}
      {showTooltip && content.tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {content.tooltip}
          {editingUser?.startTime && (
            <div className="text-gray-300 mt-1">
              {new Date(editingUser.startTime).toLocaleString('ko-KR')}부터 편집 중
            </div>
          )}
          {/* 툴팁 화살표 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

/**
 * 필드 래퍼 컴포넌트
 * - 입력 필드를 감싸서 편집 상태를 시각적으로 표시
 */
export const EditableFieldWrapper = ({ 
  children, 
  isLocked = false,
  editingUser = null,
  isConflicted = false,
  isEditing = false,
  fieldPath = null,
  onStartEdit = null,
  className = ''
}) => {
  
  const handleClick = () => {
    if (!isLocked && onStartEdit) {
      onStartEdit(fieldPath);
    }
  };

  const getBorderStyle = () => {
    if (isConflicted) return 'border-red-300 ring-red-100';
    if (isLocked) return 'border-yellow-300 ring-yellow-100';
    if (isEditing) return 'border-blue-300 ring-blue-100';
    return 'border-gray-300';
  };

  const getBackgroundStyle = () => {
    if (isConflicted) return 'bg-red-50';
    if (isLocked) return 'bg-yellow-50';
    if (isEditing) return 'bg-blue-50';
    return 'bg-white';
  };

  return (
    <div 
      className={`relative group ${className}`}
      onClick={handleClick}
    >
      {/* 필드 컨테이너 */}
      <div className={`
        rounded-lg border-2 p-2 transition-all duration-200
        ${getBorderStyle()} ${getBackgroundStyle()}
        ${isLocked ? 'cursor-not-allowed' : 'cursor-text'}
        hover:shadow-sm
      `}>
        {children}
      </div>

      {/* 상태 표시기 */}
      <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
        <EditingIndicator
          isLocked={isLocked}
          editingUser={editingUser}
          isConflicted={isConflicted}
          isEditing={isEditing}
          fieldPath={fieldPath}
          showTooltip={true}
          size="small"
        />
      </div>

      {/* 잠금 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 bg-yellow-200 bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-yellow-600 text-center">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs font-medium">
              {editingUser?.userName || '다른 사용자'} 편집중
            </div>
          </div>
        </div>
      )}

      {/* 충돌 오버레이 */}
      {isConflicted && (
        <div className="absolute inset-0 bg-red-200 bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-red-600 text-center">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-xs font-medium">충돌 해결 필요</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 페이지 레벨 편집 상태 표시
 */
export const PageEditingStatus = ({ 
  isEditing = false,
  editingField = null,
  conflictCount = 0,
  onResolveConflicts = null,
  editDuration = 0
}) => {
  
  if (!isEditing && conflictCount === 0) return null;

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        {/* 편집 상태 */}
        {isEditing && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <div className="text-sm font-medium text-gray-900">편집 중</div>
              <div className="text-xs text-gray-500">
                {editingField && `필드: ${editingField}`}
                {editDuration > 0 && ` • ${formatDuration(editDuration)}`}
              </div>
            </div>
          </div>
        )}

        {/* 충돌 상태 */}
        {conflictCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <div>
                <div className="text-sm font-medium text-red-900">
                  {conflictCount}개 충돌 발견
                </div>
                <div className="text-xs text-red-600">해결이 필요합니다</div>
              </div>
            </div>
            {onResolveConflicts && (
              <button
                onClick={onResolveConflicts}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                해결하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditingIndicator;