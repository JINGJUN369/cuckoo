import React, { useMemo, useCallback } from 'react';
import { getProjectProgress, getStageProgress } from '../../types/project';
import { Button } from './Button';

/**
 * v1.1 ProjectCard - 개선된 프로젝트 카드 컴포넌트
 * 
 * 주요 개선사항:
 * - 성능 최적화 (메모이제이션)
 * - 향상된 시각화 (2열 그리드)
 * - 무채색 단계 표시
 * - 정확한 진행률 계산
 * - 모바일 반응형
 */
const ProjectCard_v11 = ({ 
  project, 
  onClick, 
  onEdit, 
  onView, 
  onComplete,
  mode = 'grid', // 'list', 'grid', 'compact'
  showActions = false,
  className = ''
}) => {
  console.log(`🃏 [v1.1] ProjectCard rendering: ${project?.name}`);

  // 진행률 계산 (메모이제이션) - 강제 재계산 포함
  const progress = useMemo(() => {
    const clampProgress = (value) => Math.max(0, Math.min(100, value || 0));
    
    const progressData = {
      overall: clampProgress(getProjectProgress(project)),
      stage1: clampProgress(getStageProgress(project, 'stage1')),
      stage2: clampProgress(getStageProgress(project, 'stage2')),
      stage3: clampProgress(getStageProgress(project, 'stage3'))
    };
    
    console.log(`🔄 [ProjectCard] ${project?.name} 진행률:`, progressData);
    
    return progressData;
  }, [project, project?.updatedAt, project?.id]);

  // D-Day 계산 (메모이제이션)
  const dDay = useMemo(() => {
    const massProductionDate = project.stage1?.massProductionDate;
    if (!massProductionDate) return null;
    
    const targetDate = new Date(massProductionDate);
    const today = new Date();
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [project.stage1?.massProductionDate]);

  // D-Day 스타일링
  const dDayInfo = useMemo(() => {
    if (dDay === null) return null;
    
    let style = {
      text: '',
      className: '',
      emoji: ''
    };

    if (dDay < 0) {
      style = {
        text: `D+${Math.abs(dDay)}`,
        className: 'bg-red-50 text-red-600 border border-red-200',
        emoji: '🚨'
      };
    } else if (dDay === 0) {
      style = {
        text: 'D-DAY',
        className: 'bg-orange-50 text-orange-600 border border-orange-200',
        emoji: '⚡'
      };
    } else if (dDay <= 7) {
      style = {
        text: `D-${dDay}`,
        className: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
        emoji: '⚠️'
      };
    } else if (dDay <= 30) {
      style = {
        text: `D-${dDay}`,
        className: 'bg-blue-50 text-blue-600 border border-blue-200',
        emoji: '📅'
      };
    } else {
      style = {
        text: `D-${dDay}`,
        className: 'bg-gray-50 text-gray-600 border border-gray-200',
        emoji: '📍'
      };
    }

    return style;
  }, [dDay]);

  // 전체 진행률 기반 색상 (강조)
  const statusColor = useMemo(() => {
    const overall = progress.overall;
    if (overall >= 90) return 'text-emerald-600';
    if (overall >= 70) return 'text-blue-600';
    if (overall >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  }, [progress.overall]);

  const handleClick = useCallback((e) => {
    if (e.target.closest('button')) return;
    onClick?.(project);
  }, [onClick, project]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit?.(project);
  }, [onEdit, project]);

  const handleView = useCallback((e) => {
    e.stopPropagation();
    onView?.(project);
  }, [onView, project]);

  const handleComplete = useCallback((e) => {
    e.stopPropagation();
    onComplete?.(project);
  }, [onComplete, project]);

  // 미니 진행률 바 컴포넌트
  const MiniProgressBar = ({ value, label }) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 font-medium min-w-0 flex-shrink-0">{label}</span>
      <div className="flex items-center ml-2">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-400 transition-all duration-300"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-gray-600 font-medium ml-2 min-w-0 flex-shrink-0">
          {value}%
        </span>
      </div>
    </div>
  );

  // 컴팩트 모드
  if (mode === 'compact') {
    return (
      <div 
        onClick={handleClick}
        className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group ${className}`}
        role="button"
        tabIndex={0}
        aria-label={`프로젝트: ${project.name}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {project.modelName || project.id}
            </p>
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <div className="text-right">
              <span className={`text-lg font-bold ${statusColor}`}>
                {progress.overall}%
              </span>
            </div>
            {dDayInfo && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${dDayInfo.className}`}>
                {dDayInfo.emoji} {dDayInfo.text}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 그리드 모드 (기본 - 2열)
  if (mode === 'grid') {
    return (
      <div 
        onClick={handleClick}
        className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group ${className}`}
        role="button"
        tabIndex={0}
        aria-label={`프로젝트: ${project.name}`}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">
                {project.modelName || project.id}
              </span>
              {project.stage1?.manufacturer && (
                <span className="text-gray-500">
                  {project.stage1.manufacturer}
                </span>
              )}
            </div>
          </div>
          {dDayInfo && (
            <span className={`px-3 py-1 text-sm font-medium rounded-full flex-shrink-0 ml-3 ${dDayInfo.className}`}>
              {dDayInfo.emoji} {dDayInfo.text}
            </span>
          )}
        </div>

        {/* 전체 진행률 강조 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">전체 진행률</span>
            <span className={`text-2xl font-bold ${statusColor}`}>
              {progress.overall}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                progress.overall >= 90 ? 'bg-emerald-500' :
                progress.overall >= 70 ? 'bg-blue-500' :
                progress.overall >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
              }`}
              style={{ width: `${progress.overall}%` }}
            />
          </div>
        </div>

        {/* 단계별 진행률 (무채색) */}
        <div className="space-y-2 mb-4">
          <MiniProgressBar value={progress.stage1} label="1단계" />
          <MiniProgressBar value={progress.stage2} label="2단계" />
          <MiniProgressBar value={progress.stage3} label="3단계" />
        </div>

        {/* 액션 버튼들 */}
        {showActions && (
          <div className="flex space-x-2 pt-2 border-t border-gray-100">
            <Button
              onClick={handleView}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              보기
            </Button>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              편집
            </Button>
            {onComplete && (
              <Button
                onClick={handleComplete}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                완료
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // 리스트 모드
  return (
    <div 
      onClick={handleClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`프로젝트: ${project.name}`}
    >
      <div className="flex items-center justify-between">
        {/* 좌측: 프로젝트 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 truncate">
                {project.name}
              </h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded font-medium">
                  {project.modelName || project.id}
                </span>
                {project.stage1?.manufacturer && (
                  <span>{project.stage1.manufacturer}</span>
                )}
                {dDayInfo && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${dDayInfo.className}`}>
                    {dDayInfo.emoji} {dDayInfo.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 진행률 표시 */}
          <div className="grid grid-cols-4 gap-4 items-center">
            {/* 전체 진행률 */}
            <div className="col-span-1">
              <div className="text-center">
                <span className={`text-xl font-bold ${statusColor}`}>
                  {progress.overall}%
                </span>
                <p className="text-xs text-gray-500 mt-1">전체</p>
              </div>
            </div>

            {/* 단계별 진행률 */}
            <div className="col-span-3 space-y-2">
              <MiniProgressBar value={progress.stage1} label="1단계" />
              <MiniProgressBar value={progress.stage2} label="2단계" />
              <MiniProgressBar value={progress.stage3} label="3단계" />
            </div>
          </div>
        </div>

        {/* 우측: 액션 버튼 */}
        {showActions && (
          <div className="flex space-x-2 ml-6">
            <Button
              onClick={handleView}
              variant="outline"
              size="sm"
            >
              보기
            </Button>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
            >
              편집
            </Button>
            {onComplete && (
              <Button
                onClick={handleComplete}
                variant="outline"
                size="sm"
              >
                완료
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard_v11;