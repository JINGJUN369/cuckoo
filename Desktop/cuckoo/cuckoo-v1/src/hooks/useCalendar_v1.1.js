import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from './useProjectStore_v1.1';

/**
 * v1.1 useCalendar - 달력 관련 상태 및 유틸리티 관리 훅
 * 
 * 주요 기능:
 * - 달력 뷰 모드 관리 (month/week/day/list)
 * - 날짜 네비게이션
 * - 이벤트 필터링 및 검색
 * - D-Day 계산 및 우선순위
 * - 통계 계산
 * - 외부 캘린더 내보내기
 */
export const useCalendar = () => {
  console.log('📅 [v1.1] useCalendar hook initialized');

  const { state } = useProjectStore();
  const { projects = [] } = state;

  // 달력 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day', 'list'
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({
    stages: ['stage1', 'stage2', 'stage3'], // 기본적으로 모든 단계 활성화
    status: 'all', // 'all', 'upcoming', 'overdue', 'completed'
    projects: 'all', // 'all' 또는 특정 프로젝트 ID 배열
    eventTypes: 'all', // 'all' 또는 특정 이벤트 타입 배열
    search: ''
  });

  // 이벤트 타입 정의
  const eventTypes = {
    // Stage 1 이벤트
    releaseDate: { label: '출시예정일', color: 'bg-blue-500', stage: 'stage1' },
    massProductionDate: { label: '양산예정일', color: 'bg-blue-600', stage: 'stage1' },
    
    // Stage 2 이벤트
    pilotProductionDate: { label: '파일럿생산일', color: 'bg-green-500', stage: 'stage2' },
    techTransferDate: { label: '기술이전일', color: 'bg-green-600', stage: 'stage2' },
    installationDate: { label: '설치일', color: 'bg-green-400', stage: 'stage2' },
    
    // Stage 3 이벤트
    initialProductionDate: { label: '최초양산일', color: 'bg-purple-500', stage: 'stage3' },
    bomCompletionDate: { label: 'BOM완성일', color: 'bg-purple-600', stage: 'stage3' },
    partsArrivalDate: { label: '부품입고일', color: 'bg-purple-400', stage: 'stage3' },
    qualityApprovalDate: { label: '품질승인일', color: 'bg-purple-700', stage: 'stage3' },
    
    // 기타 이벤트
    reviewDate: { label: '검토일', color: 'bg-gray-500', stage: 'general' },
    meetingDate: { label: '회의일', color: 'bg-yellow-500', stage: 'general' }
  };

  // 프로젝트에서 이벤트 추출
  const extractEventsFromProjects = useCallback(() => {
    const events = [];
    
    projects.forEach(project => {
      // Stage 1 이벤트들
      if (project.stage1?.releaseDate) {
        events.push({
          id: `${project.id}_release`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'releaseDate',
          date: project.stage1.releaseDate,
          executed: project.stage1.releaseDateExecuted || false,
          stage: 'stage1',
          ...eventTypes.releaseDate
        });
      }

      if (project.stage1?.massProductionDate) {
        events.push({
          id: `${project.id}_massProduction`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'massProductionDate',
          date: project.stage1.massProductionDate,
          executed: project.stage1.massProductionDateExecuted || false,
          stage: 'stage1',
          ...eventTypes.massProductionDate
        });
      }

      // Stage 2 이벤트들
      if (project.stage2?.pilotProductionDate) {
        events.push({
          id: `${project.id}_pilotProduction`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'pilotProductionDate',
          date: project.stage2.pilotProductionDate,
          executed: project.stage2.pilotProductionDateExecuted || false,
          stage: 'stage2',
          ...eventTypes.pilotProductionDate
        });
      }

      if (project.stage2?.techTransferDate) {
        events.push({
          id: `${project.id}_techTransfer`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'techTransferDate',
          date: project.stage2.techTransferDate,
          executed: project.stage2.techTransferDateExecuted || false,
          stage: 'stage2',
          ...eventTypes.techTransferDate
        });
      }

      if (project.stage2?.installationDate) {
        events.push({
          id: `${project.id}_installation`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'installationDate',
          date: project.stage2.installationDate,
          executed: project.stage2.installationDateExecuted || false,
          stage: 'stage2',
          ...eventTypes.installationDate
        });
      }

      // Stage 3 이벤트들
      if (project.stage3?.initialProductionDate) {
        events.push({
          id: `${project.id}_initialProduction`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'initialProductionDate',
          date: project.stage3.initialProductionDate,
          executed: project.stage3.initialProductionDateExecuted || false,
          stage: 'stage3',
          ...eventTypes.initialProductionDate
        });
      }

      if (project.stage3?.bomCompletionDate) {
        events.push({
          id: `${project.id}_bomCompletion`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'bomCompletionDate',
          date: project.stage3.bomCompletionDate,
          executed: project.stage3.bomCompletionDateExecuted || false,
          stage: 'stage3',
          ...eventTypes.bomCompletionDate
        });
      }

      if (project.stage3?.partsArrivalDate) {
        events.push({
          id: `${project.id}_partsArrival`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'partsArrivalDate',
          date: project.stage3.partsArrivalDate,
          executed: project.stage3.partsArrivalDateExecuted || false,
          stage: 'stage3',
          ...eventTypes.partsArrivalDate
        });
      }

      if (project.stage3?.qualityApprovalDate) {
        events.push({
          id: `${project.id}_qualityApproval`,
          projectId: project.id,
          projectName: project.name,
          modelName: project.modelName,
          type: 'qualityApprovalDate',
          date: project.stage3.qualityApprovalDate,
          executed: project.stage3.qualityApprovalDateExecuted || false,
          stage: 'stage3',
          ...eventTypes.qualityApprovalDate
        });
      }
    });

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [projects]);

  // 모든 이벤트
  const allEvents = useMemo(() => extractEventsFromProjects(), [extractEventsFromProjects]);

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;

    // 단계 필터
    if (filters.stages.length > 0 && !filters.stages.includes('all')) {
      filtered = filtered.filter(event => filters.stages.includes(event.stage));
    }

    // 상태 필터
    if (filters.status !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        switch (filters.status) {
          case 'upcoming':
            return eventDate >= today && !event.executed;
          case 'overdue':
            return eventDate < today && !event.executed;
          case 'completed':
            return event.executed;
          default:
            return true;
        }
      });
    }

    // 프로젝트 필터
    if (filters.projects !== 'all' && Array.isArray(filters.projects)) {
      filtered = filtered.filter(event => filters.projects.includes(event.projectId));
    }

    // 이벤트 타입 필터
    if (filters.eventTypes !== 'all' && Array.isArray(filters.eventTypes)) {
      filtered = filtered.filter(event => filters.eventTypes.includes(event.type));
    }

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.projectName?.toLowerCase().includes(searchLower) ||
        event.modelName?.toLowerCase().includes(searchLower) ||
        event.label?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allEvents, filters]);

  // D-Day 계산
  const calculateDDay = useCallback((dateString) => {
    if (!dateString) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []);

  // 현재 뷰 기간의 이벤트
  const getEventsForCurrentView = useCallback(() => {
    let startDate, endDate;
    
    switch (viewMode) {
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        break;
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = weekStart;
        endDate = weekEnd;
        break;
      case 'day':
        startDate = new Date(currentDate);
        endDate = new Date(currentDate);
        break;
      case 'list':
        // 리스트 모드는 모든 이벤트 표시
        return filteredEvents;
      default:
        return filteredEvents;
    }

    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }, [viewMode, currentDate, filteredEvents]);

  // 달력 통계
  const calendarStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: filteredEvents.length,
      upcoming: 0,
      overdue: 0,
      completed: 0,
      thisMonth: 0,
      byStage: {
        stage1: 0,
        stage2: 0,
        stage3: 0
      }
    };

    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    filteredEvents.forEach(event => {
      const eventDate = new Date(event.date);
      
      // 상태별 통계
      if (event.executed) {
        stats.completed++;
      } else if (eventDate < today) {
        stats.overdue++;
      } else {
        stats.upcoming++;
      }

      // 이번 달 이벤트
      if (eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear) {
        stats.thisMonth++;
      }

      // 단계별 통계
      stats.byStage[event.stage] = (stats.byStage[event.stage] || 0) + 1;
    });

    return stats;
  }, [filteredEvents]);

  // 날짜 네비게이션
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      default:
        return;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 특정 날짜로 이동
  const goToDate = useCallback((date) => {
    setCurrentDate(new Date(date));
  }, []);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters({
      stages: ['stage1', 'stage2', 'stage3'],
      status: 'all',
      projects: 'all',
      eventTypes: 'all',
      search: ''
    });
  }, []);

  // iCal 형식으로 내보내기
  const exportToIcal = useCallback((events = filteredEvents) => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//프로젝트 관리 시스템//달력//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      lines.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@projectmanagement`,
        `DTSTART:${dateStr}`,
        `DTEND:${dateStr}`,
        `SUMMARY:${event.label} - ${event.projectName}`,
        `DESCRIPTION:프로젝트: ${event.projectName}\\n모델명: ${event.modelName}\\n단계: ${event.stage}${event.executed ? '\\n상태: 완료됨' : ''}`,
        `CATEGORIES:${event.stage},프로젝트관리`,
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    
    const icalContent = lines.join('\r\n');
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `프로젝트_달력_${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }, [filteredEvents]);

  return {
    // 달력 상태
    currentDate,
    viewMode,
    selectedDate,
    filters,

    // 이벤트 데이터
    allEvents,
    filteredEvents,
    currentViewEvents: getEventsForCurrentView(),
    eventTypes,

    // 통계 및 계산
    calendarStats,
    calculateDDay,

    // 액션
    setCurrentDate,
    setViewMode,
    setSelectedDate,
    updateFilters,
    resetFilters,
    navigateDate,
    goToToday,
    goToDate,
    exportToIcal
  };
};