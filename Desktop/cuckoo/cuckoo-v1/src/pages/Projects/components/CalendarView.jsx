import React, { useState } from 'react';
import { getProjectProgress } from '../../../types/project';

const CalendarView = ({ projects, onProjectClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];

    projects.forEach(project => {
      const progress = getProjectProgress(project);
      
      // Stage 1 events
      if (project.stage1.massProductionDate === dateStr) {
        events.push({ 
          type: '양산', 
          color: 'bg-blue-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '양산예정일',
          progress: progress,
          executed: project.stage1.massProductionDateExecuted
        });
      }
      if (project.stage1.launchDate === dateStr) {
        events.push({ 
          type: '출시', 
          color: 'bg-green-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '출시예정일',
          progress: progress,
          executed: project.stage1.launchDateExecuted
        });
      }

      // Stage 2 events
      if (project.stage2.pilotProductionDate === dateStr) {
        events.push({ 
          type: '파일럿', 
          color: 'bg-yellow-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '파일럿 생산예정일',
          progress: progress,
          executed: project.stage2.pilotProductionDateExecuted
        });
      }
      if (project.stage2.techTransferDate === dateStr) {
        events.push({ 
          type: '기술이전', 
          color: 'bg-purple-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '기술이전예정일',
          progress: progress,
          executed: project.stage2.techTransferDateExecuted
        });
      }
      if (project.stage2.trainingDate === dateStr) {
        events.push({ 
          type: '교육', 
          color: 'bg-indigo-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '교육예정일',
          progress: progress,
          executed: project.stage2.trainingDateExecuted
        });
      }

      // Stage 3 events
      if (project.stage3.firstOrderDate === dateStr) {
        events.push({ 
          type: '부품발주', 
          color: 'bg-orange-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '1차 부품발주예정일',
          progress: progress,
          executed: project.stage3.firstOrderDateExecuted
        });
      }
      if (project.stage3.bomTargetDate === dateStr) {
        events.push({ 
          type: 'BOM', 
          color: 'bg-teal-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: 'BOM구성목표일자',
          progress: progress,
          executed: project.stage3.bomTargetDateExecuted
        });
      }
      if (project.stage3.priceTargetDate === dateStr) {
        events.push({ 
          type: '단가', 
          color: 'bg-pink-500', 
          project: project.name, 
          projectId: project.id,
          projectData: project,
          taskName: '단가등록목표일자',
          progress: progress,
          executed: project.stage3.priceTargetDateExecuted
        });
      }
    });

    return events;
  };

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Render calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;

      days.push(
        <div 
          key={day} 
          className={`h-24 border border-gray-200 p-1 ${
            isToday 
              ? 'bg-blue-50 border-blue-300' 
              : isPast 
                ? 'bg-gray-50' 
                : 'bg-white hover:bg-gray-50'
          } transition-colors`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday 
              ? 'text-blue-600' 
              : isPast 
                ? 'text-gray-500' 
                : 'text-gray-700'
          }`}>
            {day}
          </div>
          
          <div className="space-y-0.5 overflow-hidden">
            {events.slice(0, 2).map((event, idx) => (
              <div 
                key={idx} 
                className={`text-xs text-white px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity relative ${
                  event.executed ? 'opacity-60' : ''
                } ${event.color}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectClick(event.projectData);
                }}
                onMouseEnter={(e) => {
                  setHoveredEvent(event);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPosition({ 
                    x: rect.left + rect.width / 2, 
                    y: rect.top - 10 
                  });
                }}
                onMouseLeave={() => {
                  setHoveredEvent(null);
                }}
              >
                {event.executed && <span className="mr-1">✓</span>}
                {event.type}
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                +{events.length - 2}개
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
          >
            오늘
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0">
          {renderCalendar()}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">범례</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>양산</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>출시</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>파일럿</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>기술이전</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-indigo-500 rounded"></div>
            <span>교육</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>부품발주</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-teal-500 rounded"></div>
            <span>BOM</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-pink-500 rounded"></div>
            <span>단가</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ✓ 표시는 완료된 작업입니다. 이벤트를 클릭하면 해당 프로젝트로 이동합니다.
        </p>
      </div>

      {/* Tooltip */}
      {hoveredEvent && (
        <div 
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg border border-gray-700 pointer-events-none max-w-xs"
          style={{
            left: tooltipPosition.x - 100,
            top: tooltipPosition.y - 120,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-yellow-300 mb-1">
            {hoveredEvent.project}
          </div>
          <div className="text-blue-200 mb-1">
            ID: {hoveredEvent.projectId}
          </div>
          <div className="text-green-200 mb-1">
            {hoveredEvent.taskName}
          </div>
          <div className="text-gray-300 mb-1">
            진행률: {hoveredEvent.progress}%
          </div>
          {hoveredEvent.executed && (
            <div className="text-green-200 text-xs">
              ✓ 완료됨
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;