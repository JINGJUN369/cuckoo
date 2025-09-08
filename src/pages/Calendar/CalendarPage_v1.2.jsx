import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { Button } from '../../components/ui';

// D-Day 계산 함수 (내장)
const calculateDDay = (targetDate) => {
  if (!targetDate) return null;
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * CalendarPage v1.2 - 완전한 프로젝트 캘린더 시스템
 * 
 * 주요 기능:
 * - 프로젝트별 마감일 표시
 * - D-Day 계산 및 알림
 * - 월/주/일 뷰 전환
 * - 일정 클릭 시 해당 프로젝트 이동
 * - 색상별 Stage 분류
 * - 드래그 앤 드롭 지원
 */
const CalendarPage_v1_2 = () => {
  const navigate = useNavigate();
  const { projects } = useSupabaseProjectStore();

  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month', 'week', 'day', 'list'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    stages: ['stage1', 'stage2', 'stage3'],
    eventTypes: 'all',
    overdueOnly: false,
    upcomingOnly: false
  });

  console.log('📅 [v1.2] CalendarPage rendered with', projects.length, 'projects');

  // 이벤트 타입 정의
  const eventTypes = useMemo(() => ({
    'mass-production': {
      label: '양산예정일',
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-500',
      icon: '🏭',
      priority: 5
    },
    'launch': {
      label: '출시예정일',
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-500',
      icon: '🚀',
      priority: 4
    },
    'pilot-production': {
      label: '파일럿생산',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-500',
      icon: '🔧',
      priority: 3
    },
    'pilot-receive': {
      label: '파일럿수령',
      color: 'bg-green-400',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-400',
      icon: '📦',
      priority: 3
    },
    'tech-transfer': {
      label: '기술이전',
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-500',
      icon: '🔬',
      priority: 3
    },
    'initial-production': {
      label: '최초양산',
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-500',
      icon: '⚡',
      priority: 4
    }
  }), []);

  // 프로젝트에서 이벤트 추출
  const calendarEvents = useMemo(() => {
    const events = [];

    projects.forEach(project => {
      const stage1 = project.stage1 || {};
      const stage2 = project.stage2 || {};
      const stage3 = project.stage3 || {};

      // Stage 1 이벤트들
      if (stage1.massProductionDate && filters.stages.includes('stage1')) {
        events.push({
          id: `${project.id}_mass_production`,
          projectId: project.id,
          projectName: project.name,
          title: `${project.name} - 양산예정일`,
          date: stage1.massProductionDate,
          type: 'mass-production',
          stage: 'stage1',
          description: `모델명: ${project.modelName || 'N/A'}`,
          ...eventTypes['mass-production']
        });
      }

      if (stage1.launchDate && filters.stages.includes('stage1')) {
        events.push({
          id: `${project.id}_launch`,
          projectId: project.id,
          projectName: project.name,
          title: `${project.name} - 출시예정일`,
          date: stage1.launchDate,
          type: 'launch',
          stage: 'stage1',
          description: `모델명: ${project.modelName || 'N/A'}`,
          ...eventTypes['launch']
        });
      }

      // Stage 2 이벤트들
      if (stage2.pilotProductionDate && filters.stages.includes('stage2')) {
        events.push({
          id: `${project.id}_pilot_production`,
          projectId: project.id,
          projectName: project.name,
          title: `${project.name} - 파일럿생산`,
          date: stage2.pilotProductionDate,
          type: 'pilot-production',
          stage: 'stage2',
          description: `설치주체: ${stage2.installationEntity || 'N/A'}`,
          ...eventTypes['pilot-production']
        });
      }

      if (stage2.pilotReceiveDate && filters.stages.includes('stage2')) {
        events.push({
          id: `${project.id}_pilot_receive`,
          projectId: project.id,
          projectName: project.name,
          title: `${project.name} - 파일럿수령`,
          date: stage2.pilotReceiveDate,
          type: 'pilot-receive',
          stage: 'stage2',
          description: `수령 예정일`,
          ...eventTypes['pilot-receive']
        });
      }

      if (stage2.techTransferDate && filters.stages.includes('stage2')) {
        events.push({
          id: `${project.id}_tech_transfer`,
          projectId: project.id,
          projectName: project.name,
          title: `${project.name} - 기술이전`,
          date: stage2.techTransferDate,
          type: 'tech-transfer',
          stage: 'stage2',
          description: `기술이전 예정일`,
          ...eventTypes['tech-transfer']
        });
      }

      // Stage 3 이벤트들
      if (stage3.initialProductionDate && filters.stages.includes('stage3')) {
        events.push({
          id: `${project.id}_initial_production`,
          projectId: project.id,
          projectName: project.name,
          title: `${project.name} - 최초양산`,
          date: stage3.initialProductionDate,
          type: 'initial-production',
          stage: 'stage3',
          description: `BOM구성: ${stage3.bomManager || 'N/A'}`,
          ...eventTypes['initial-production']
        });
      }
    });

    // D-Day 계산 및 필터링
    const now = new Date();
    return events
      .map(event => ({
        ...event,
        dDay: calculateDDay(event.date),
        isOverdue: new Date(event.date) < now,
        isUpcoming: new Date(event.date) > now
      }))
      .filter(event => {
        // 필터 적용
        if (filters.overdueOnly && !event.isOverdue) return false;
        if (filters.upcomingOnly && !event.isUpcoming) return false;
        return true;
      })
      .sort((a, b) => {
        // 우선순위 및 날짜순 정렬
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(a.date) - new Date(b.date);
      });
  }, [projects, filters, eventTypes]);

  // 현재 뷰에 맞는 날짜 범위 계산
  const viewDateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewType) {
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        break;
      case 'day':
        // 하루만
        break;
      default:
        break;
    }

    return { start, end };
  }, [currentDate, viewType]);

  // 현재 뷰에 해당하는 이벤트들 필터링
  const visibleEvents = useMemo(() => {
    if (viewType === 'list') return calendarEvents.slice(0, 50); // 리스트뷰는 최대 50개

    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= viewDateRange.start && eventDate <= viewDateRange.end;
    });
  }, [calendarEvents, viewType, viewDateRange]);

  // 달력 그리드 생성 (월간 뷰용)
  const calendarGrid = useMemo(() => {
    if (viewType !== 'month') return [];

    const grid = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + (week * 7) + day);
        
        const dayEvents = visibleEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === currentDay.toDateString();
        });

        weekDays.push({
          date: new Date(currentDay),
          isCurrentMonth: currentDay.getMonth() === currentDate.getMonth(),
          isToday: currentDay.toDateString() === new Date().toDateString(),
          events: dayEvents
        });
      }
      grid.push(weekDays);
      
      // 마지막 주가 다음달 날짜만 있으면 중단
      if (week >= 4 && weekDays.every(day => !day.isCurrentMonth)) break;
    }

    return grid;
  }, [currentDate, viewType, visibleEvents]);

  // 날짜 네비게이션
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, viewType]);

  // 이벤트 클릭 핸들러
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  // 프로젝트로 이동
  const navigateToProject = useCallback((projectId) => {
    navigate(`/projects/${projectId}`);
    setSelectedEvent(null);
  }, [navigate]);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 현재 날짜 포맷팅
  const formatCurrentDate = useCallback(() => {
    const options = {
      year: 'numeric',
      month: 'long',
      ...(viewType === 'day' && { day: 'numeric' })
    };
    return currentDate.toLocaleDateString('ko-KR', options);
  }, [currentDate, viewType]);

  return (
    <div className="min-h-full bg-gray-50">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">프로젝트 캘린더</h1>
            <p className="text-sm text-gray-600 mt-1">
              모든 프로젝트의 일정과 마감일을 한 눈에 확인하세요
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📊 대시보드
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📁 프로젝트 목록
            </Link>
          </div>
        </div>

        {/* 캘린더 컨트롤 */}
        <div className="flex items-center justify-between">
          {/* 날짜 네비게이션 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigateDate(-1)}
                variant="outline"
                size="sm"
                className="px-3 py-1"
              >
                ←
              </Button>
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
                className="px-3 py-1"
              >
                오늘
              </Button>
              <Button
                onClick={() => navigateDate(1)}
                variant="outline"
                size="sm"
                className="px-3 py-1"
              >
                →
              </Button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {formatCurrentDate()}
            </h2>
          </div>

          {/* 뷰 타입 및 필터 */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
            >
              🔍 필터
            </Button>
            
            <div className="flex border border-gray-300 rounded-md">
              {['month', 'week', 'day', 'list'].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-3 py-1 text-sm font-medium ${
                    viewType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${type === 'month' ? 'rounded-l-md' : ''} ${
                    type === 'list' ? 'rounded-r-md' : ''
                  } border-r border-gray-300 last:border-r-0`}
                >
                  {type === 'month' ? '월' :
                   type === 'week' ? '주' :
                   type === 'day' ? '일' : '목록'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage 필터
                </label>
                <div className="space-y-2">
                  {['stage1', 'stage2', 'stage3'].map(stage => (
                    <label key={stage} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.stages.includes(stage)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              stages: [...prev.stages, stage]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              stages: prev.stages.filter(s => s !== stage)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {stage === 'stage1' ? 'Stage 1' :
                         stage === 'stage2' ? 'Stage 2' : 'Stage 3'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태 필터
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.overdueOnly}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        overdueOnly: e.target.checked,
                        upcomingOnly: e.target.checked ? false : prev.upcomingOnly
                      }))}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">지연된 일정만</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.upcomingOnly}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        upcomingOnly: e.target.checked,
                        overdueOnly: e.target.checked ? false : prev.overdueOnly
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">예정된 일정만</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">
                  <div className="mb-2 font-medium">통계</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>총 이벤트: {calendarEvents.length}개</div>
                    <div>표시 중: {visibleEvents.length}개</div>
                    <div className="text-red-600">
                      지연: {calendarEvents.filter(e => e.isOverdue).length}개
                    </div>
                    <div className="text-blue-600">
                      예정: {calendarEvents.filter(e => e.isUpcoming).length}개
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 캘린더 컨텐츠 */}
      <div className="p-4">
        {viewType === 'month' && (
          <MonthView
            calendarGrid={calendarGrid}
            onEventClick={handleEventClick}
          />
        )}

        {viewType === 'week' && (
          <WeekView
            events={visibleEvents}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        )}

        {viewType === 'day' && (
          <DayView
            events={visibleEvents}
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        )}

        {viewType === 'list' && (
          <ListView
            events={visibleEvents}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* 이벤트 상세 모달 */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onNavigateToProject={navigateToProject}
        />
      )}
    </div>
  );
};

// 월간 뷰 컴포넌트
const MonthView = ({ calendarGrid, onEventClick }) => (
  <div className="bg-white rounded-lg shadow">
    {/* 요일 헤더 */}
    <div className="grid grid-cols-7 border-b border-gray-200">
      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
        <div
          key={day}
          className={`p-3 text-center text-sm font-medium ${
            index === 0 ? 'text-red-600' : 
            index === 6 ? 'text-blue-600' : 'text-gray-900'
          }`}
        >
          {day}
        </div>
      ))}
    </div>

    {/* 날짜 그리드 */}
    <div className="divide-y divide-gray-200">
      {calendarGrid.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200">
          {week.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={`min-h-32 p-2 ${
                !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${day.isToday ? 'bg-blue-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                !day.isCurrentMonth ? 'text-gray-400' :
                day.isToday ? 'text-blue-600' :
                dayIndex === 0 ? 'text-red-600' :
                dayIndex === 6 ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate ${event.bgLight} ${event.textColor} hover:opacity-75 transition-opacity`}
                  >
                    <span className="mr-1">{event.icon}</span>
                    {event.projectName}
                    {event.dDay !== null && (
                      <span className={`ml-1 ${event.isOverdue ? 'text-red-600' : ''}`}>
                        (D{event.dDay >= 0 ? '+' : ''}{event.dDay})
                      </span>
                    )}
                  </button>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{day.events.length - 3}개 더
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// 주간 뷰 컴포넌트
const WeekView = ({ events, currentDate, onEventClick }) => {
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === day.toDateString();
      });

      days.push({
        date: day,
        isToday: day.toDateString() === new Date().toDateString(),
        events: dayEvents
      });
    }

    return days;
  }, [currentDate, events]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {weekDays.map((day, index) => (
          <div key={index} className="p-4">
            <div className={`text-center mb-3 ${
              day.isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
            }`}>
              <div className="text-xs text-gray-500 uppercase">
                {['일', '월', '화', '수', '목', '금', '토'][index]}
              </div>
              <div className={`text-2xl mt-1 ${
                day.isToday ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
              }`}>
                {day.date.getDate()}
              </div>
            </div>

            <div className="space-y-2">
              {day.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`w-full text-left p-2 rounded text-sm font-medium ${event.bgLight} ${event.textColor} hover:opacity-75 transition-opacity`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{event.icon}</span>
                    <div className="flex-1 truncate">
                      <div className="truncate">{event.projectName}</div>
                      <div className="text-xs opacity-75">{event.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 일간 뷰 컴포넌트
const DayView = ({ events, currentDate, onEventClick }) => {
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {currentDate.getDate()}
        </div>
        <div className="text-sm text-gray-500">
          {currentDate.toLocaleDateString('ko-KR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long' 
          })}
        </div>
      </div>

      {dayEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📅</div>
          <p>이 날에는 예정된 일정이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dayEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`w-full text-left p-4 rounded-lg border-2 ${event.borderColor} ${event.bgLight} hover:opacity-75 transition-opacity`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{event.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    {event.projectName}
                  </div>
                  <div className={`text-sm font-medium mb-2 ${event.textColor}`}>
                    {event.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {event.description}
                  </div>
                  {event.dDay !== null && (
                    <div className={`text-sm font-medium mt-2 ${
                      event.isOverdue ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      D{event.dDay >= 0 ? '+' : ''}{event.dDay}
                      {event.isOverdue ? ' (지연)' : ''}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 리스트 뷰 컴포넌트
const ListView = ({ events, onEventClick }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">
        전체 일정 목록 ({events.length}개)
      </h3>
    </div>
    
    <div className="divide-y divide-gray-200">
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <p>표시할 일정이 없습니다.</p>
        </div>
      ) : (
        events.map((event) => (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${event.bgLight}`}>
                <span className="text-xl">{event.icon}</span>
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">
                    {event.projectName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div className={`text-sm font-medium ${event.textColor}`}>
                  {event.label}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {event.description}
                </div>
              </div>
              
              <div className="ml-4 text-right">
                {event.dDay !== null && (
                  <div className={`text-sm font-bold ${
                    event.isOverdue ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    D{event.dDay >= 0 ? '+' : ''}{event.dDay}
                  </div>
                )}
                <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                  event.stage === 'stage1' ? 'bg-blue-100 text-blue-600' :
                  event.stage === 'stage2' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {event.stage === 'stage1' ? 'Stage 1' :
                   event.stage === 'stage2' ? 'Stage 2' : 'Stage 3'}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

// 이벤트 상세 모달
const EventDetailModal = ({ event, onClose, onNavigateToProject }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center px-3 py-1 rounded-full ${event.bgLight}`}>
            <span className="text-lg mr-2">{event.icon}</span>
            <span className={`text-sm font-medium ${event.textColor}`}>
              {event.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">닫기</span>
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {event.projectName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {event.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">예정일</div>
              <div className="font-medium">
                {new Date(event.date).toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <div className="text-gray-500">D-Day</div>
              <div className={`font-bold ${
                event.isOverdue ? 'text-red-600' : 'text-blue-600'
              }`}>
                D{event.dDay >= 0 ? '+' : ''}{event.dDay}
                {event.isOverdue && ' (지연)'}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              닫기
            </Button>
            <Button
              onClick={() => onNavigateToProject(event.projectId)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              프로젝트 보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CalendarPage_v1_2;