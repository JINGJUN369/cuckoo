import React, { memo } from 'react';
import { formatDDay, getDDayColorClass, getDDayStatus } from '../../utils/dDayCalculator_v1.1';

/**
 * v1.1 D-Day 뱃지 컴포넌트
 * 
 * 기능:
 * - D-Day 상태에 따른 색상 표시
 * - 애니메이션 효과 (오늘, 지연 등)
 * - 완료 상태 표시
 * - 다양한 크기 지원
 * - 호버 효과 및 툴팁
 */
const DDayBadge = memo(({ 
  targetDate, 
  isExecuted = false,
  size = 'md', 
  showTooltip = true,
  label = '',
  onClick = null,
  className = '' 
}) => {
  console.log('🏷️ [v1.1] DDayBadge rendering', { targetDate, isExecuted, size, label });

  if (!targetDate) return null;

  const dDayText = formatDDay(targetDate, isExecuted);
  const colorClass = getDDayColorClass(targetDate, isExecuted);
  const status = getDDayStatus(targetDate, isExecuted);
  
  // 크기별 클래스
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
    xl: 'text-lg px-4 py-2'
  };
  
  // 애니메이션 클래스
  const animationClasses = {
    today: 'animate-pulse',
    overdue: 'animate-bounce',
    urgent: 'animate-pulse'
  };
  
  // 기본 스타일 클래스
  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold rounded-full
    transition-all duration-200
    ${sizeClasses[size]}
    ${colorClass}
    ${animationClasses[status] || ''}
    ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // 툴팁 텍스트 생성
  const getTooltipText = () => {
    if (!showTooltip) return '';
    
    const statusTexts = {
      completed: '완료됨',
      overdue: '지연됨',
      today: '오늘',
      urgent: '긴급',
      upcoming: '예정',
      future: '미래',
      unknown: '알 수 없음'
    };
    
    const baseText = label ? `${label}: ${dDayText}` : dDayText;
    const statusText = statusTexts[status] || '';
    
    return `${baseText}${statusText ? ` (${statusText})` : ''}`;
  };

  // 아이콘 표시 (상태에 따라)
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <span className="mr-1">✓</span>;
      case 'overdue':
        return <span className="mr-1">⚠️</span>;
      case 'today':
        return <span className="mr-1">🎯</span>;
      case 'urgent':
        return <span className="mr-1">🔥</span>;
      default:
        return null;
    }
  };

  return (
    <span
      className={baseClasses}
      title={getTooltipText()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {size !== 'xs' && getStatusIcon()}
      {dDayText}
    </span>
  );
});

DDayBadge.displayName = 'DDayBadge';

export default DDayBadge;