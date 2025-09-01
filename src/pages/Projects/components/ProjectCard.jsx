import React from 'react';
import { getProjectProgress } from '../../../types/project';
import { Button } from '../../../components/ui';

const ProjectCard = ({ project, onView, onEdit, onComplete }) => {
  const progress = getProjectProgress(project);
  
  // Calculate D-Day
  const calculateDDay = () => {
    const massProductionDate = project.stage1.massProductionDate;
    if (!massProductionDate) return null;
    
    const targetDate = new Date(massProductionDate);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const dday = calculateDDay();

  // Get D-Day badge styling
  const getDDayBadge = () => {
    if (dday === null) return null;
    
    let badgeClass = 'px-2 py-1 text-xs font-medium rounded-full ';
    let text = '';
    
    if (dday < 0) {
      badgeClass += 'bg-red-100 text-red-800 border border-red-200';
      text = `D+${Math.abs(dday)}`;
    } else if (dday === 0) {
      badgeClass += 'bg-red-100 text-red-800 border border-red-200';
      text = 'D-Day';
    } else if (dday <= 7) {
      badgeClass += 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      text = `D-${dday}`;
    } else if (dday <= 30) {
      badgeClass += 'bg-blue-100 text-blue-800 border border-blue-200';
      text = `D-${dday}`;
    } else {
      badgeClass += 'bg-gray-100 text-gray-800 border border-gray-200';
      text = `D-${dday}`;
    }
    
    return <span className={badgeClass}>{text}</span>;
  };

  // Get progress color and icon
  const getProgressInfo = () => {
    if (progress >= 80) return { color: 'bg-green-500', icon: '🎯', textColor: 'text-green-700' };
    if (progress >= 60) return { color: 'bg-blue-500', icon: '🚀', textColor: 'text-blue-700' };
    if (progress >= 40) return { color: 'bg-yellow-500', icon: '⚡', textColor: 'text-yellow-700' };
    if (progress >= 20) return { color: 'bg-orange-500', icon: '📈', textColor: 'text-orange-700' };
    return { color: 'bg-red-500', icon: '🔄', textColor: 'text-red-700' };
  };

  const progressInfo = getProgressInfo();

  // Check for overdue tasks
  const hasOverdueTasks = () => {
    const today = new Date();
    const dateFields = [
      { value: project.stage1.launchDate, executed: project.stage1.launchDateExecuted },
      { value: project.stage1.massProductionDate, executed: project.stage1.massProductionDateExecuted },
      { value: project.stage2.pilotProductionDate, executed: project.stage2.pilotProductionDateExecuted },
      { value: project.stage2.techTransferDate, executed: project.stage2.techTransferDateExecuted },
      { value: project.stage2.trainingDate, executed: project.stage2.trainingDateExecuted }
    ];
    
    return dateFields.some(({ value, executed }) => {
      if (value && !executed) {
        return new Date(value) < today;
      }
      return false;
    });
  };

  const isOverdue = hasOverdueTasks();

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 ${isOverdue ? 'border-red-200 bg-red-50' : 'hover:border-gray-300'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{progressInfo.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600">ID: {project.id}</p>
            </div>
          </div>
          {dday !== null && getDDayBadge()}
        </div>
        
        {isOverdue && (
          <div className="flex items-center space-x-1 text-red-600 text-sm">
            <span>⚠️</span>
            <span>지연된 작업 있음</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">전체 진행률</span>
            <span className={`font-medium ${progressInfo.textColor}`}>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${progressInfo.color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Key Info */}
        <div className="space-y-2 text-sm">
          {project.stage1.researcher1 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">담당자</span>
              <span className="text-gray-900">{project.stage1.researcher1}</span>
            </div>
          )}
          
          {project.stage1.manufacturer && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">제조사</span>
              <span className="text-gray-900">{project.stage1.manufacturer}</span>
            </div>
          )}
          
          {project.stage1.massProductionDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">양산예정일</span>
              <span className="text-gray-900">
                {new Date(project.stage1.massProductionDate).toLocaleDateString('ko-KR')}
              </span>
            </div>
          )}
        </div>

        {/* Stage Progress Indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`w-full h-1 rounded mb-1 ${
              getStageProgress(project.stage1, 1) > 50 ? 'bg-blue-500' : 'bg-gray-200'
            }`} />
            <span className="text-gray-600">1차</span>
          </div>
          <div className="text-center">
            <div className={`w-full h-1 rounded mb-1 ${
              getStageProgress(project.stage2, 2) > 50 ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            <span className="text-gray-600">2차</span>
          </div>
          <div className="text-center">
            <div className={`w-full h-1 rounded mb-1 ${
              getStageProgress(project.stage3, 3) > 50 ? 'bg-purple-500' : 'bg-gray-200'
            }`} />
            <span className="text-gray-600">3차</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          생성: {new Date(project.createdAt).toLocaleDateString('ko-KR')}
        </div>
        <div className="flex space-x-2">
          <Button
            size="small"
            variant="outline"
            onClick={onEdit}
          >
            편집
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={onView}
          >
            상세보기
          </Button>
          {onComplete && (progress === 100 || project.stage1?.massProductionDateExecuted) && (
            <Button
              size="small"
              variant="primary"
              onClick={() => onComplete(project)}
            >
              ✅ 완료
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate stage progress
const getStageProgress = (stage, stageNumber) => {
  if (!stage) return 0;
  
  let baseFields = [];
  let checkboxes = [];
  
  if (stageNumber === 1) {
    baseFields = ['productGroup', 'manufacturer', 'vendor', 'productTool', 'derivativeModel', 'launchDate', 'researcher1', 'researcher2', 'massProductionDate'];
  } else if (stageNumber === 2) {
    baseFields = ['pilotProductionDate', 'pilotQuantity', 'pilotReceiveDate', 'techTransferDate', 'installationEntity', 'serviceEntity', 'trainingDate', 'orderAcceptanceDate'];
    checkboxes = ['trainingCompleted', 'manualUploaded', 'techGuideUploaded'];
  } else if (stageNumber === 3) {
    baseFields = ['initialProductionDate', 'firstOrderDate', 'bomManager', 'bomTargetDate', 'priceManager', 'priceTargetDate', 'partsDeliveryDate'];
    checkboxes = ['partsReceived', 'branchOrderEnabled', 'issueResolved'];
  }

  let completed = 0;
  let total = baseFields.length + checkboxes.length;

  baseFields.forEach(field => {
    if (stage[field] && stage[field].toString().trim() !== '') {
      completed++;
    }
  });

  checkboxes.forEach(checkbox => {
    if (stage[checkbox] === true) {
      completed++;
    }
  });

  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

export default ProjectCard;