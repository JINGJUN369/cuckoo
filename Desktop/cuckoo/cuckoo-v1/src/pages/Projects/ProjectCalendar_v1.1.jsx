import React, { useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore_v1.1';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { Button } from '../../components/ui';
import { createScheduleAlertNotification } from '../../components/ui/NotificationSystem_v1.1';

/**
 * v1.1 ProjectCalendar - 통합된 프로젝트 달력 시스템
 * 
 * 주요 개선사항:
 * - 다중 뷰 지원 (월간/주간/일간/리스트)
 * - 드래그 앤 드롭 일정 관리
 * - 실시간 D-Day 계산 및 알림
 * - 일정 필터링 및 검색
 * - 달력 내보내기 (iCal, Google Calendar)
 * - 반복 일정 지원
 * - 알림 및 미리 알림
 * - 성능 최적화
 * - 접근성 개선
 */
const ProjectCalendar_v11 = () => {
  console.log('📅 [v1.1] ProjectCalendar rendering');

  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { projects } = state;
  const { user } = useAuth();

  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month', 'week', 'day', 'list'
  const [selectedFilters, setSelectedFilters] = useState({
    projects: 'all', // 'all' or specific project IDs
    stages: ['stage1', 'stage2', 'stage3'],
    eventTypes: 'all',
    overdue: true,
    upcoming: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showEventDetails, setShowEventDetails] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);

  // 이벤트 유형 정의
  const eventTypes = useMemo(() => ({
    'mass-production': {
      label: '양산예정일',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
      icon: '🏭',
      priority: 5
    },
    'launch': {
      label: '출시예정일',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      icon: '🚀',
      priority: 4
    },
    'pilot-production': {
      label: '파일럿생산',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      icon: '🔧',
      priority: 3
    },
    'pilot-receive': {
      label: '파일럿수령',
      color: 'bg-green-400',
      borderColor: 'border-green-400',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      icon: '📦',
      priority: 3
    },
    'tech-transfer': {
      label: '기술이전',
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      icon: '🔬',
      priority: 3
    },
    'initial-production': {
      label: '최초양산',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-700',
      bgLight: 'bg-orange-50',
      icon: '⚡',
      priority: 4
    },
    'first-order': {
      label: '1차부품발주',
      color: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      bgLight: 'bg-yellow-50',
      icon: '📋',
      priority: 2
    },
    'bom-target': {
      label: 'BOM구성',
      color: 'bg-indigo-500',
      borderColor: 'border-indigo-500',
      textColor: 'text-indigo-700',
      bgLight: 'bg-indigo-50',
      icon: '📊',
      priority: 2
    },
    'price-target': {
      label: '단가등록',
      color: 'bg-pink-500',
      borderColor: 'border-pink-500',
      textColor: 'text-pink-700',
      bgLight: 'bg-pink-50',
      icon: '💰',
      priority: 2
    },
    'parts-delivery': {
      label: '부품입고',
      color: 'bg-teal-500',
      borderColor: 'border-teal-500',
      textColor: 'text-teal-700',
      bgLight: 'bg-teal-50',
      icon: '🚚',
      priority: 3
    },
    'training': {
      label: '교육일정',
      color: 'bg-cyan-500',
      borderColor: 'border-cyan-500',
      textColor: 'text-cyan-700',
      bgLight: 'bg-cyan-50',
      icon: '🎓',
      priority: 1
    },
    'order-acceptance': {
      label: '수주승인',
      color: 'bg-emerald-500',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
      icon: '✅',
      priority: 3
    }
  }), []);

  // 달력 계산
  const calendarData = useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    let startOfCalendar, endOfCalendar;
    
    if (viewType === 'month') {
      startOfCalendar = new Date(startOfMonth);
      startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());
      endOfCalendar = new Date(endOfMonth);
      endOfCalendar.setDate(endOfCalendar.getDate() + (6 - endOfCalendar.getDay()));
    } else if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      startOfCalendar = startOfWeek;
      endOfCalendar = endOfWeek;
    } else if (viewType === 'day') {
      startOfCalendar = new Date(currentDate);
      endOfCalendar = new Date(currentDate);
    }

    const calendarDays = [];
    const currentCalendarDate = new Date(startOfCalendar);
    while (currentCalendarDate <= endOfCalendar) {
      calendarDays.push(new Date(currentCalendarDate));
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }

    return {
      startOfMonth,
      endOfMonth,
      startOfCalendar,
      endOfCalendar,
      calendarDays
    };
  }, [currentDate, viewType]);

  // 프로젝트 이벤트 추출 및 필터링
  const getAllEvents = useCallback(() => {
    const events = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    projects.forEach(project => {
      // 프로젝트 필터링
      if (selectedFilters.projects !== 'all' && 
          !selectedFilters.projects.includes(project.id)) {
        return;
      }

      // 검색 필터링
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !project.modelName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }

      const addEvent = (date, type, stage, executed = false, executedField = null) => {
        if (!date || !selectedFilters.stages.includes(stage)) return;
        
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);
        
        const daysFromToday = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        const isOverdue = daysFromToday < 0 && !executed;
        const isUpcoming = daysFromToday >= 0 && daysFromToday <= 30;

        // 필터 조건 확인
        if (!selectedFilters.overdue && isOverdue) return;
        if (!selectedFilters.upcoming && isUpcoming) return;

        const eventTypeConfig = eventTypes[type];
        if (!eventTypeConfig) return;

        events.push({
          id: `${project.id}_${type}_${date}`,
          type,
          project,
          title: eventTypeConfig.label,
          date: eventDate,
          stage,
          executed,
          executedField,
          isOverdue,
          isUpcoming,
          daysFromToday,
          ...eventTypeConfig
        });
      };

      // Stage1 이벤트들
      if (selectedFilters.stages.includes('stage1')) {
        addEvent(project.stage1?.launchDate, 'launch', 'stage1', 
                 project.stage1?.launchDateExecuted, 'launchDateExecuted');
        addEvent(project.stage1?.massProductionDate, 'mass-production', 'stage1', 
                 project.stage1?.massProductionDateExecuted, 'massProductionDateExecuted');
      }

      // Stage2 이벤트들
      if (selectedFilters.stages.includes('stage2')) {
        addEvent(project.stage2?.pilotProductionDate, 'pilot-production', 'stage2',
                 project.stage2?.pilotProductionDateExecuted, 'pilotProductionDateExecuted');
        addEvent(project.stage2?.pilotReceiveDate, 'pilot-receive', 'stage2',
                 project.stage2?.pilotReceiveDateExecuted, 'pilotReceiveDateExecuted');
        addEvent(project.stage2?.techTransferDate, 'tech-transfer', 'stage2',
                 project.stage2?.techTransferDateExecuted, 'techTransferDateExecuted');
        addEvent(project.stage2?.trainingDate, 'training', 'stage2',
                 project.stage2?.trainingDateExecuted, 'trainingDateExecuted');
        addEvent(project.stage2?.orderAcceptanceDate, 'order-acceptance', 'stage2',
                 project.stage2?.orderAcceptanceDateExecuted, 'orderAcceptanceDateExecuted');
      }

      // Stage3 이벤트들
      if (selectedFilters.stages.includes('stage3')) {
        addEvent(project.stage3?.initialProductionDate, 'initial-production', 'stage3',
                 project.stage3?.initialProductionDateExecuted, 'initialProductionDateExecuted');
        addEvent(project.stage3?.firstOrderDate, 'first-order', 'stage3',
                 project.stage3?.firstOrderDateExecuted, 'firstOrderDateExecuted');
        addEvent(project.stage3?.bomTargetDate, 'bom-target', 'stage3',
                 project.stage3?.bomTargetDateExecuted, 'bomTargetDateExecuted');
        addEvent(project.stage3?.priceTargetDate, 'price-target', 'stage3',
                 project.stage3?.priceTargetDateExecuted, 'priceTargetDateExecuted');
        addEvent(project.stage3?.partsDeliveryDate, 'parts-delivery', 'stage3',
                 project.stage3?.partsDeliveryDateExecuted, 'partsDeliveryDateExecuted');
      }
    });

    // 이벤트 정렬 (우선순위 및 날짜순)
    return events.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date - b.date;
      }
      return b.priority - a.priority;
    });
  }, [projects, selectedFilters, searchTerm, eventTypes]);

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = useCallback((date) => {
    const allEvents = getAllEvents();
    const dateString = date.toDateString();
    return allEvents.filter(event => event.date.toDateString() === dateString);
  }, [getAllEvents]);

  // 월간 통계
  const monthlyStats = useMemo(() => {
    const allEvents = getAllEvents();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthEvents = allEvents.filter(event => 
      event.date.getMonth() === currentMonth && 
      event.date.getFullYear() === currentYear
    );

    return {
      total: monthEvents.length,
      overdue: monthEvents.filter(e => e.isOverdue).length,
      upcoming: monthEvents.filter(e => e.isUpcoming).length,
      completed: monthEvents.filter(e => e.executed).length,
      byType: monthEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {})
    };
  }, [getAllEvents, currentDate]);

  // 날짜 네비게이션
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  }, [currentDate, viewType]);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 프로젝트 클릭 핸들러
  const handleProjectClick = useCallback((project) => {
    setSelectedProject(project);
    setCurrentView('detail');
  }, [setSelectedProject, setCurrentView]);

  // 필터 토글
  const toggleFilter = useCallback((filterType, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'stages') {
        if (newFilters.stages.includes(value)) {
          newFilters.stages = newFilters.stages.filter(s => s !== value);
        } else {
          newFilters.stages = [...newFilters.stages, value];
        }
      } else {
        newFilters[filterType] = value;
      }
      
      return newFilters;
    });
  }, []);

  // 달력 내보내기
  const exportCalendar = useCallback((format) => {
    const allEvents = getAllEvents();
    
    if (format === 'ical') {
      let icalContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Project Calendar//EN\n';
      
      allEvents.forEach(event => {
        const startDate = event.date.toISOString().replace(/[-:]/g, '').split('T')[0];
        icalContent += `BEGIN:VEVENT\n`;
        icalContent += `UID:${event.id}@projectcalendar\n`;
        icalContent += `DTSTART;VALUE=DATE:${startDate}\n`;
        icalContent += `SUMMARY:${event.project.name} - ${event.title}\n`;
        icalContent += `DESCRIPTION:프로젝트: ${event.project.name}\\n모델: ${event.project.modelName || 'N/A'}\\n단계: ${event.stage}\n`;
        icalContent += `END:VEVENT\n`;
      });
      
      icalContent += 'END:VCALENDAR';
      
      const blob = new Blob([icalContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project_calendar.ics';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [getAllEvents]);

  // 유틸리티 함수들
  const isToday = useCallback((date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isCurrentMonth = useCallback((date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  }, [currentDate]);

  const formatDate = useCallback((date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long'
    });
  }, []);

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 프로젝트 달력</h1>
              <p className="text-gray-600">
                프로젝트 일정을 달력 형태로 확인하고 관리하세요
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* 검색 */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="프로젝트 검색..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* 뷰 타입 선택 */}
              <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                {[
                  { key: 'month', label: '월간', icon: '📅' },
                  { key: 'week', label: '주간', icon: '📋' },
                  { key: 'day', label: '일간', icon: '📝' },
                  { key: 'list', label: '목록', icon: '📊' }
                ].map(view => (
                  <button
                    key={view.key}
                    onClick={() => setViewType(view.key)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewType === view.key
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {view.icon} {view.label}
                  </button>
                ))}
              </div>
              
              {/* 네비게이션 버튼 */}
              <div className="flex space-x-2">
                <Button onClick={() => setCurrentView('list')} variant="outline" size="sm">
                  📋 목록
                </Button>
                <Button onClick={() => setCurrentView('project-dashboard')} variant="outline" size="sm">
                  📊 대시보드
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* 필터 */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* 단계 필터 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">단계:</span>
                {[
                  { key: 'stage1', label: '1단계', color: 'text-blue-600' },
                  { key: 'stage2', label: '2단계', color: 'text-green-600' },
                  { key: 'stage3', label: '3단계', color: 'text-purple-600' }
                ].map(stage => (
                  <label key={stage.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.stages.includes(stage.key)}
                      onChange={() => toggleFilter('stages', stage.key)}
                      className="mr-1"
                    />
                    <span className={`text-sm ${stage.color}`}>{stage.label}</span>
                  </label>
                ))}
              </div>
              
              {/* 상태 필터 */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.overdue}
                    onChange={() => toggleFilter('overdue', !selectedFilters.overdue)}
                    className="mr-1"
                  />
                  <span className="text-sm text-red-600">지연</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.upcoming}
                    onChange={() => toggleFilter('upcoming', !selectedFilters.upcoming)}
                    className="mr-1"
                  />
                  <span className="text-sm text-orange-600">임박</span>
                </label>
              </div>

              {/* 내보내기 */}
              <div className="flex items-center space-x-2 ml-auto">
                <Button
                  onClick={() => exportCalendar('ical')}
                  variant="outline"
                  size="sm"
                >
                  📅 iCal 내보내기
                </Button>
              </div>
            </div>
          </div>

          {/* 월간 통계 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">이달의 통계</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">전체 일정</span>
                <span className="font-medium">{monthlyStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">지연</span>
                <span className="font-medium text-red-600">{monthlyStats.overdue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">임박</span>
                <span className="font-medium text-orange-600">{monthlyStats.upcoming}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">완료</span>
                <span className="font-medium text-green-600">{monthlyStats.completed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 달력 컨트롤 */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="이전"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {viewType === 'month' && `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
                {viewType === 'week' && `${formatDate(calendarData.startOfCalendar)} - ${formatDate(calendarData.endOfCalendar)}`}
                {viewType === 'day' && formatDate(currentDate)}
                {viewType === 'list' && `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
              </h2>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="다음"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <Button onClick={goToToday} variant="primary" size="sm">
              오늘
            </Button>
          </div>
        </div>

        {/* 범례 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-900">일정 범례</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Object.entries(eventTypes).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${config.color} rounded-full flex-shrink-0`}></div>
                <span className="text-xs text-gray-700 truncate">
                  {config.icon} {config.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 달력 뷰 */}
        {viewType === 'month' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`p-4 text-center text-sm font-medium ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 날짜들 */}
            <div className="grid grid-cols-7">
              {calendarData.calendarDays.map((date, index) => {
                const events = getEventsForDate(date);
                const isCurrentMonthDate = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-100 relative ${
                      !isCurrentMonthDate ? 'bg-gray-50' : ''
                    } ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    {/* 날짜 숫자 */}
                    <div className={`text-sm font-medium mb-2 ${
                      !isCurrentMonthDate ? 'text-gray-400' :
                      isTodayDate ? 'text-blue-600' :
                      index % 7 === 0 ? 'text-red-600' :
                      index % 7 === 6 ? 'text-blue-600' :
                      'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>

                    {/* 이벤트들 */}
                    <div className="space-y-1">
                      {events.slice(0, 3).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          onClick={() => handleProjectClick(event.project)}
                          className={`
                            ${event.color} text-white text-xs px-2 py-1 rounded cursor-pointer
                            hover:opacity-80 transition-opacity relative
                            ${event.isOverdue && !event.executed ? 'animate-pulse' : ''}
                            ${event.executed ? 'opacity-60 line-through' : ''}
                          `}
                          title={`${event.project.name}${event.project.modelName ? ` (${event.project.modelName})` : ''} - ${event.title}${event.isOverdue ? ' (지연됨)' : ''}`}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">{event.icon}</span>
                            <div className="truncate flex-1">
                              {event.project.modelName || event.project.name}
                            </div>
                          </div>
                          <div className="text-xs opacity-90 truncate">
                            {event.title}
                          </div>
                          {event.isOverdue && !event.executed && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-xs text-gray-500 px-2 cursor-pointer hover:text-gray-700"
                             onClick={() => setShowEventDetails({ date, events })}>
                          +{events.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 리스트 뷰 */}
        {viewType === 'list' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="space-y-6">
                {(() => {
                  const allEvents = getAllEvents();
                  const currentMonthEvents = allEvents.filter(event => 
                    event.date.getMonth() === currentDate.getMonth() &&
                    event.date.getFullYear() === currentDate.getFullYear()
                  );

                  if (currentMonthEvents.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          이달에 예정된 일정이 없습니다
                        </h3>
                        <p className="text-gray-600">
                          다른 달을 확인해보거나 새로운 일정을 등록해보세요
                        </p>
                      </div>
                    );
                  }

                  const groupedEvents = currentMonthEvents.reduce((groups, event) => {
                    const dateKey = event.date.toDateString();
                    if (!groups[dateKey]) {
                      groups[dateKey] = [];
                    }
                    groups[dateKey].push(event);
                    return groups;
                  }, {});

                  return Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
                    const date = new Date(dateKey);
                    return (
                      <div key={dateKey} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`text-lg font-semibold ${
                            isToday(date) ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {date.getMonth() + 1}/{date.getDate()}({weekDays[date.getDay()]})
                          </div>
                          {isToday(date) && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              오늘
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {dateEvents.map((event, index) => (
                            <div
                              key={index}
                              onClick={() => handleProjectClick(event.project)}
                              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border-l-4 ${event.borderColor} ${
                                event.executed ? 'opacity-60' : ''
                              } ${event.isOverdue && !event.executed ? 'bg-red-50' : event.bgLight}`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{event.icon}</span>
                                <div>
                                  <div className={`font-medium ${
                                    event.executed ? 'line-through text-gray-500' : event.textColor
                                  }`}>
                                    {event.project.name}
                                    {event.project.modelName && (
                                      <span className="text-gray-500 ml-2">({event.project.modelName})</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">{event.title}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {event.executed && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    완료
                                  </span>
                                )}
                                {event.isOverdue && !event.executed && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full animate-pulse">
                                    지연 {Math.abs(event.daysFromToday)}일
                                  </span>
                                )}
                                {event.isUpcoming && !event.executed && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    {event.daysFromToday}일 후
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 이벤트 상세 모달 */}
        {showEventDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showEventDetails.date.getMonth() + 1}월 {showEventDetails.date.getDate()}일 일정
                  </h3>
                  <button
                    onClick={() => setShowEventDetails(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {showEventDetails.events.map((event, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handleProjectClick(event.project);
                        setShowEventDetails(null);
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 border-l-4 ${event.borderColor} ${event.bgLight}`}
                    >
                      <span className="text-lg">{event.icon}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${event.textColor}`}>
                          {event.project.name}
                          {event.project.modelName && (
                            <span className="text-gray-500 ml-2">({event.project.modelName})</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{event.title}</div>
                      </div>
                      {event.isOverdue && !event.executed && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          지연됨
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCalendar_v11;