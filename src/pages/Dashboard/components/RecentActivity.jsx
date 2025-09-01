import React from 'react';
import { getProjectProgress } from '../../../types/project';
import { Button } from '../../../components/ui';

const RecentActivity = ({ projects, onProjectClick }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <p>진행 중인 프로젝트가 없습니다</p>
        </div>
      </div>
    );
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (progress) => {
    if (progress >= 80) return '🎯';
    if (progress >= 60) return '🚀';
    if (progress >= 40) return '⚡';
    if (progress >= 20) return '📈';
    return '🔄';
  };

  const calculateDDay = (project) => {
    const massProductionDate = project.stage1.massProductionDate;
    if (!massProductionDate) return null;
    
    const targetDate = new Date(massProductionDate);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDDayBadge = (dday) => {
    if (dday === null) return null;
    
    let badgeClass = 'px-2 py-1 text-xs font-medium rounded-full ';
    let text = '';
    
    if (dday < 0) {
      badgeClass += 'bg-red-100 text-red-800';
      text = `D+${Math.abs(dday)}`;
    } else if (dday === 0) {
      badgeClass += 'bg-red-100 text-red-800';
      text = 'D-Day';
    } else if (dday <= 7) {
      badgeClass += 'bg-yellow-100 text-yellow-800';
      text = `D-${dday}`;
    } else if (dday <= 30) {
      badgeClass += 'bg-blue-100 text-blue-800';
      text = `D-${dday}`;
    } else {
      badgeClass += 'bg-gray-100 text-gray-800';
      text = `D-${dday}`;
    }
    
    return <span className={badgeClass}>{text}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const progress = getProjectProgress(project);
          const dday = calculateDDay(project);
          
          return (
            <div
              key={project.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getStatusIcon(progress)}</span>
                  <h4 className="font-medium text-gray-900 truncate flex-1">
                    {project.name}
                  </h4>
                </div>
                {dday !== null && getDDayBadge(dday)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">진행률</span>
                  <span className="font-medium text-gray-900">{progress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    ID: {project.id}
                  </div>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => onProjectClick(project.id)}
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {projects.length > 6 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => onProjectClick(null)}>
            모든 프로젝트 보기
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;