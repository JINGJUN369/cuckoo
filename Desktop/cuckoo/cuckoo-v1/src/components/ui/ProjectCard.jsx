import React from 'react';
import { getProjectProgress, getStageProgress } from '../../types/project';

const ProjectCard = ({ project, onClick }) => {
  const overallProgress = getProjectProgress(project);
  const stage1Progress = getStageProgress(project, 'stage1');
  const stage2Progress = getStageProgress(project, 'stage2');
  const stage3Progress = getStageProgress(project, 'stage3');
  
  // D-Day 계산
  const calculateDDay = (project) => {
    const massProductionDate = project.stage1?.massProductionDate;
    if (!massProductionDate) return null;
    
    const targetDate = new Date(massProductionDate);
    const today = new Date();
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  };

  const dDay = calculateDDay(project);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            {project.modelName && (
              <p className="text-blue-600 font-medium">모델: {project.modelName}</p>
            )}
            <p>
              {project.stage1?.productGroup || '제품군'} • {project.stage1?.manufacturer || '제조사'}
            </p>
          </div>
        </div>
        {dDay !== null && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            dDay < 0 
              ? 'bg-red-100 text-red-700'
              : dDay < 30 
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
          }`}>
            {dDay < 0 ? `D+${Math.abs(dDay)}` : `D-${dDay}`}
          </span>
        )}
      </div>
      
      {/* 진행률 표시 - 노션 스타일 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700">전체 진행률</span>
          <span className="text-sm font-medium text-gray-900">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
      
      {/* 단계별 진척률 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600 mb-2">단계별 진행률</div>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Stage 1 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="text-blue-400 opacity-60">🔵</span>
              <span className="text-xs font-medium text-gray-500">1단계</span>
            </div>
            <div className="bg-blue-50 rounded-full h-1.5 mb-1">
              <div 
                className="bg-blue-300 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${stage1Progress}%` }}
              />
            </div>
            <div className="text-xs text-blue-400 font-medium">{stage1Progress}%</div>
          </div>
          
          {/* Stage 2 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="text-green-400 opacity-60">🟢</span>
              <span className="text-xs font-medium text-gray-500">2단계</span>
            </div>
            <div className="bg-green-50 rounded-full h-1.5 mb-1">
              <div 
                className="bg-green-300 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${stage2Progress}%` }}
              />
            </div>
            <div className="text-xs text-green-400 font-medium">{stage2Progress}%</div>
          </div>
          
          {/* Stage 3 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="text-purple-400 opacity-60">🟣</span>
              <span className="text-xs font-medium text-gray-500">3단계</span>
            </div>
            <div className="bg-purple-50 rounded-full h-1.5 mb-1">
              <div 
                className="bg-purple-300 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${stage3Progress}%` }}
              />
            </div>
            <div className="text-xs text-purple-400 font-medium">{stage3Progress}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;