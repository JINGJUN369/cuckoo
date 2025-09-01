import React, { useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';

const Calendar = () => {
  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { projects } = state;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedFilters, setSelectedFilters] = useState({
    stage1: true,
    stage2: true,
    stage3: true
  });

  // 이벤트 타입별 설정
  const eventTypes = {
    launchDate: { label: '출시', color: 'bg-green-500', stage: 'stage1' },
    massProductionDate: { label: '양산', color: 'bg-blue-500', stage: 'stage1' },
    pilotProductionDate: { label: '파일럿', color: 'bg-yellow-500', stage: 'stage2' },
    techTransferDate: { label: '기술이전', color: 'bg-purple-500', stage: 'stage2' },
    trainingDate: { label: '교육', color: 'bg-indigo-500', stage: 'stage2' },
    firstOrderDate: { label: '부품발주', color: 'bg-orange-500', stage: 'stage3' },
    bomTargetDate: { label: 'BOM', color: 'bg-teal-500', stage: 'stage3' },
    priceTargetDate: { label: '단가', color: 'bg-pink-500', stage: 'stage3' }
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];

    projects.forEach(project => {
      const progress = getProjectProgress(project);
      
      Object.entries(eventTypes).forEach(([field, config]) => {
        const executedField = `${field}Executed`;
        const dateValue = project[config.stage]?.[field];
        const executed = project[config.stage]?.[executedField];
        
        if (dateValue === dateStr && selectedFilters[config.stage]) {
          events.push({
            type: config.label,
            color: config.color,
            project: project.name,
            projectId: project.id,
            projectData: project,
            taskName: config.label,
            progress: progress,
            executed: executed,
            stage: config.stage
          });
        }
      });
    });

    return events;
  };

  // 월간 캘린더 렌더링
  const renderMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 border border-gray-200 bg-gray-50"></div>
      );
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;

      days.push(
        <div 
          key={day} 
          className={`h-32 border border-gray-200 p-2 ${
            isToday 
              ? 'bg-blue-50 border-blue-300' 
              : isPast 
                ? 'bg-gray-50' 
                : 'bg-white hover:bg-gray-50'
          } transition-colors overflow-hidden`}
        >
          <div className={`text-sm font-medium mb-2 ${
            isToday 
              ? 'text-blue-600' 
              : isPast 
                ? 'text-gray-500' 
                : 'text-gray-700'
          }`}>
            {day}
          </div>
          
          <div className="space-y-1">
            {events.slice(0, 3).map((event, idx) => (
              <div 
                key={idx} 
                className={`text-xs text-white px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity relative ${
                  event.executed ? 'opacity-60' : ''
                } ${event.color}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(event.projectData);
                  setCurrentView('project-dashboard');
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
                <span className="truncate">{event.type}</span>
              </div>
            ))}
            {events.length > 3 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                +{events.length - 3}개 더
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // 주간 캘린더 렌더링
  const renderWeekCalendar = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <div key={i} className="flex-1 min-h-96">
          <div className={`text-center py-2 border-b ${
            isToday ? 'bg-blue-50 text-blue-600 font-semibold' : 'bg-gray-50 text-gray-700'
          }`}>
            <div className="text-xs">
              {['일', '월', '화', '수', '목', '금', '토'][i]}
            </div>
            <div className="text-lg font-medium">
              {date.getDate()}
            </div>
          </div>
          
          <div className="p-2 space-y-1 bg-white">
            {events.map((event, idx) => (
              <div
                key={idx}
                className={`text-xs text-white px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                  event.executed ? 'opacity-60' : ''
                } ${event.color}`}
                onClick={() => {
                  setSelectedProject(event.projectData);
                  setCurrentView('project-dashboard');
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
                <div className="font-medium">{event.type}</div>
                <div className="opacity-90">{event.project}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  // 날짜 네비게이션
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const getDateRangeText = () => {
    if (viewMode === 'month') {
      return `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.getMonth() + 1}월 ${startOfWeek.getDate()}일 - ${endOfWeek.getMonth() + 1}월 ${endOfWeek.getDate()}일, ${currentDate.getFullYear()}년`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
              className="text-sm"
            >
              ← 대시보드
            </Button>
            <span className="text-sm text-gray-500">프로젝트 캘린더</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📅 전체 일정</h1>
          <p className="text-gray-600 mt-1">
            모든 프로젝트의 일정을 한눈에 확인하세요
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('list')}
          >
            프로젝트 목록
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-xl font-semibold text-gray-800 min-w-0">
                {getDateRangeText()}
              </h2>
              
              <button
                onClick={goToNext}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
            >
              오늘
            </button>
          </div>

          {/* View Mode & Filters */}
          <div className="flex items-center gap-4">
            {/* Stage Filters */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">단계:</span>
              {[
                { key: 'stage1', label: '1차', color: 'bg-blue-500' },
                { key: 'stage2', label: '2차', color: 'bg-green-500' },
                { key: 'stage3', label: '3차', color: 'bg-purple-500' }
              ].map(stage => (
                <button
                  key={stage.key}
                  onClick={() => setSelectedFilters(prev => ({
                    ...prev,
                    [stage.key]: !prev[stage.key]
                  }))}
                  className={`px-2 py-1 text-xs rounded-md transition-all ${
                    selectedFilters[stage.key]
                      ? `${stage.color} text-white`
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'month' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'week' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                주간
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {viewMode === 'month' ? (
          <>
            {/* Month Header */}
            <div className="grid grid-cols-7 gap-0 bg-gray-50">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="p-4 text-center text-sm font-medium text-gray-600 border-b border-gray-200">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Month Calendar */}
            <div className="grid grid-cols-7 gap-0">
              {renderMonthCalendar()}
            </div>
          </>
        ) : (
          <>
            {/* Week Calendar */}
            <div className="flex">
              {renderWeekCalendar()}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">범례</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {Object.entries(eventTypes).map(([key, config]) => (
            <div key={key} className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${config.color} rounded`}></div>
              <span>{config.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          ✓ 표시는 완료된 작업입니다. 이벤트를 클릭하면 해당 프로젝트 대시보드로 이동합니다.
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

export default Calendar;