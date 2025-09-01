import React from 'react';
import { getProjectProgress, getStageProgress } from '../../../types/project';

const ProgressBar = ({ progress, color = 'bg-blue-500', label }) => {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label}</span>
          <span>{progress}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

const ProjectProgress = ({ project }) => {
  // 강제 리렌더링을 위한 키 생성 (프로젝트 데이터 변경 추적)
  const projectDataKey = React.useMemo(() => {
    if (!project) return 'no-project';
    return JSON.stringify({
      id: project.id,
      stage1: project.stage1,
      stage2: project.stage2,
      stage3: project.stage3,
      updatedAt: project.updatedAt || Date.now()
    });
  }, [project]);

  // 진행률 재계산 (메모이제이션 의존성에 projectDataKey 포함)
  const progressData = React.useMemo(() => {
    const overallProgress = getProjectProgress(project);
    const stage1Progress = getStageProgress(project, 'stage1');
    const stage2Progress = getStageProgress(project, 'stage2');
    const stage3Progress = getStageProgress(project, 'stage3');
    
    console.log(`🔄 [ProjectProgress] 진행률 재계산:`, {
      overall: overallProgress,
      stage1: stage1Progress,
      stage2: stage2Progress,
      stage3: stage3Progress,
      projectName: project?.name
    });
    
    return { overallProgress, stage1Progress, stage2Progress, stage3Progress };
  }, [project, projectDataKey]);

  const { overallProgress, stage1Progress, stage2Progress, stage3Progress } = progressData;

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStageStatus = (progress) => {
    if (progress >= 100) return '완료';
    if (progress >= 50) return '진행중';
    if (progress > 0) return '시작됨';
    return '대기중';
  };

  const calculateDDay = () => {
    const massProductionDate = project.stage1?.massProductionDate;
    if (!massProductionDate) return null;
    
    const targetDate = new Date(massProductionDate);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const dDay = calculateDDay();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">프로젝트 진행 현황</h2>
        {dDay !== null && (
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            dDay > 30 ? 'bg-green-100 text-green-700' :
            dDay > 7 ? 'bg-yellow-100 text-yellow-700' :
            dDay > 0 ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : `D+${Math.abs(dDay)}`}
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <ProgressBar
          progress={overallProgress}
          color={getProgressColor(overallProgress)}
          label="전체 진행률"
        />
      </div>

      {/* Stage Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stage 1 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="text-sm font-semibold text-blue-700">1차 단계</h3>
            </div>
            <span className="text-xs text-blue-600 font-medium">
              {getStageStatus(stage1Progress)}
            </span>
          </div>
          <ProgressBar
            progress={stage1Progress}
            color="bg-blue-500"
          />
          <p className="text-xs text-blue-600 mt-2">기본 정보 및 계획</p>
        </div>

        {/* Stage 2 */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="text-sm font-semibold text-green-700">2차 단계</h3>
            </div>
            <span className="text-xs text-green-600 font-medium">
              {getStageStatus(stage2Progress)}
            </span>
          </div>
          <ProgressBar
            progress={stage2Progress}
            color="bg-green-500"
          />
          <p className="text-xs text-green-600 mt-2">생산 준비 및 기술이전</p>
        </div>

        {/* Stage 3 */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <h3 className="text-sm font-semibold text-purple-700">3차 단계</h3>
            </div>
            <span className="text-xs text-purple-600 font-medium">
              {getStageStatus(stage3Progress)}
            </span>
          </div>
          <ProgressBar
            progress={stage3Progress}
            color="bg-purple-500"
          />
          <p className="text-xs text-purple-600 mt-2">양산 준비 및 부품관리</p>
        </div>
      </div>

      {/* Project Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">프로젝트 ID</span>
            <p className="font-medium text-gray-900">{project.id}</p>
          </div>
          <div>
            <span className="text-gray-500">담당자</span>
            <p className="font-medium text-gray-900">
              {project.stage1?.researcher1 || '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">제조사</span>
            <p className="font-medium text-gray-900">
              {project.stage1?.manufacturer || '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">양산예정일</span>
            <p className="font-medium text-gray-900">
              {project.stage1?.massProductionDate || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;