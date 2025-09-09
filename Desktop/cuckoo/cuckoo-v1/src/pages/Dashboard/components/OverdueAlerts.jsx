import React from 'react';
import { Button } from '../../../components/ui';

const OverdueAlerts = ({ tasks, onProjectClick }) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  // 작업 타입별로 분류
  const overdueTasks = tasks.filter(task => task.type === 'overdue');
  const todayTasks = tasks.filter(task => task.type === 'today');
  const upcomingTasks = tasks.filter(task => task.type === 'upcoming');
  const reminderTasks = tasks.filter(task => task.type === 'reminder');

  const getTaskStatusInfo = (task) => {
    switch (task.type) {
      case 'overdue':
        return {
          icon: '🚨',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          statusText: `${task.daysOverdue}일 지연`,
          statusColor: 'text-red-600',
          buttonVariant: 'danger'
        };
      case 'today':
        return {
          icon: '🔥',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          titleColor: 'text-orange-800',
          textColor: 'text-orange-700',
          statusText: '오늘 마감',
          statusColor: 'text-orange-600',
          buttonVariant: 'warning'
        };
      case 'upcoming':
        return {
          icon: '⏰',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          statusText: '내일 마감',
          statusColor: 'text-yellow-600',
          buttonVariant: 'secondary'
        };
      case 'reminder':
        return {
          icon: '💡',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700',
          statusText: `${Math.abs(task.daysOverdue)}일 후 마감`,
          statusColor: 'text-blue-600',
          buttonVariant: 'outline'
        };
      default:
        return {
          icon: '⚠️',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-800',
          textColor: 'text-gray-700',
          statusText: '확인 필요',
          statusColor: 'text-gray-600',
          buttonVariant: 'outline'
        };
    }
  };

  const renderTaskSection = (sectionTasks, title, defaultInfo) => {
    if (sectionTasks.length === 0) return null;
    
    const info = sectionTasks.length > 0 ? getTaskStatusInfo(sectionTasks[0]) : defaultInfo;
    
    return (
      <div className={`${info.bgColor} border ${info.borderColor} rounded-lg p-4 mb-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="text-2xl">{info.icon}</div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${info.titleColor}`}>
              {title}
            </h3>
            <div className={`mt-2 text-sm ${info.textColor}`}>
              <p className="mb-3">
                <strong>{sectionTasks.length}개</strong>의 작업이 실행 체크가 필요합니다.
              </p>
              
              <div className="space-y-2">
                {sectionTasks.map((task, index) => (
                  <div
                    key={`${task.projectId}-${task.taskName}-${index}`}
                    className="flex items-center justify-between bg-white rounded p-2 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {task.projectName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {task.taskName}
                      </p>
                      <p className={`text-xs mt-1 ${info.statusColor}`}>
                        {info.statusText} ({new Date(task.date).toLocaleDateString('ko-KR')})
                      </p>
                    </div>
                    
                    <div className="ml-2 flex-shrink-0">
                      <Button
                        size="small"
                        variant={info.buttonVariant}
                        onClick={() => onProjectClick(task.projectId)}
                      >
                        확인
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTaskSection(overdueTasks, '🚨 지연된 작업 알림')}
      {renderTaskSection(todayTasks, '🔥 오늘 마감 작업')}
      {renderTaskSection(upcomingTasks, '⏰ 내일 마감 작업')}
      {renderTaskSection(reminderTasks, '💡 곧 마감되는 작업')}
    </div>
  );
};

export default OverdueAlerts;