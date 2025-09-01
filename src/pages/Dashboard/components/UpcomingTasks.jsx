import React from 'react';
import { Button } from '../../../components/ui';

const UpcomingTasks = ({ tasks, onProjectClick }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <p>다가오는 마감일이 없습니다</p>
        </div>
      </div>
    );
  }

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntil <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getUrgencyIcon = (daysUntil) => {
    if (daysUntil <= 1) return '🔥';
    if (daysUntil <= 3) return '⚡';
    return '📅';
  };

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={`${task.projectId}-${task.taskName}-${index}`}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="text-2xl">
              {getUrgencyIcon(task.daysUntil)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {task.projectName}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {task.taskName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(task.date).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(task.daysUntil)}`}>
              {task.daysUntil === 0 
                ? '오늘' 
                : task.daysUntil === 1 
                  ? '내일' 
                  : `${task.daysUntil}일 후`
              }
            </span>
            <Button
              size="small"
              variant="outline"
              onClick={() => onProjectClick(task.projectId)}
            >
              보기
            </Button>
          </div>
        </div>
      ))}
      
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>다가오는 마감일이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks;