/**
 * v1.1 달력 내보내기 및 외부 연동 유틸리티
 * 
 * 주요 기능:
 * - iCal 형식 내보내기 (.ics)
 * - CSV 형식 내보내기
 * - Google Calendar 연동 URL 생성
 * - Outlook 연동 URL 생성
 * - 프로젝트별/단계별 필터링 내보내기
 * - 다국어 지원 (한국어/영어)
 */

/**
 * iCal 형식으로 이벤트 내보내기
 */
export const exportToIcal = (events, options = {}) => {
  const {
    title = '프로젝트 관리 달력',
    description = '프로젝트 일정 및 마일스톤',
    language = 'ko'
  } = options;

  console.log('📤 [v1.1] Exporting to iCal format', { eventCount: events.length, options });

  // iCal 헤더
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//프로젝트 관리 시스템//달력 v1.1//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${title}`,
    `X-WR-CALDESC:${description}`,
    'X-WR-TIMEZONE:Asia/Seoul'
  ];

  // 이벤트 변환
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${event.id || `${event.projectId}_${event.type}`}@projectmanagement.local`;
    
    // 이벤트 상태 텍스트
    const statusText = event.executed ? ' (완료됨)' : '';
    const stageText = {
      stage1: '[1단계]',
      stage2: '[2단계]',
      stage3: '[3단계]'
    }[event.stage] || '';
    
    // 설명 생성
    const description = [
      `프로젝트: ${event.projectName}`,
      `모델명: ${event.modelName}`,
      `단계: ${stageText} ${event.stage}`,
      `유형: ${event.label}`,
      event.executed ? '상태: 완료됨' : '상태: 예정됨'
    ].join('\\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${eventDate.toISOString().split('T')[0].replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${eventDate.toISOString().split('T')[0].replace(/-/g, '')}`,
      `SUMMARY:${stageText} ${event.label} - ${event.projectName}${statusText}`,
      `DESCRIPTION:${description}`,
      `CATEGORIES:${event.stage},프로젝트관리,${event.type}`,
      `STATUS:${event.executed ? 'CONFIRMED' : 'TENTATIVE'}`,
      `PRIORITY:${getPriorityLevel(event)}`,
      `CREATED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
      `LAST-MODIFIED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  
  const icalContent = lines.join('\r\n');
  
  // 파일 다운로드
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `프로젝트_달력_${new Date().toISOString().split('T')[0]}.ics`;
  link.click();
  
  URL.revokeObjectURL(link.href);
  
  return icalContent;
};

/**
 * CSV 형식으로 이벤트 내보내기
 */
export const exportToCsv = (events, options = {}) => {
  const { language = 'ko' } = options;
  
  console.log('📤 [v1.1] Exporting to CSV format', { eventCount: events.length });

  // CSV 헤더 (한국어)
  const headers = [
    '프로젝트명',
    '모델명',
    '단계',
    '일정유형',
    '날짜',
    '상태',
    'D-Day',
    '설명'
  ];

  // CSV 데이터 생성
  const csvData = events.map(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const dDay = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    const dDayText = event.executed ? '완료' : 
                     dDay < 0 ? `D+${Math.abs(dDay)}` :
                     dDay === 0 ? 'D-Day' : `D-${dDay}`;
    
    const stageText = {
      stage1: '1단계 (기본정보)',
      stage2: '2단계 (생산준비)',
      stage3: '3단계 (양산준비)'
    }[event.stage] || event.stage;

    return [
      event.projectName,
      event.modelName,
      stageText,
      event.label,
      eventDate.toISOString().split('T')[0],
      event.executed ? '완료됨' : '예정됨',
      dDayText,
      `${event.projectName} - ${event.label}`
    ];
  });

  // CSV 문자열 생성 (UTF-8 BOM 포함)
  const csvContent = '\uFEFF' + [headers, ...csvData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // 파일 다운로드
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `프로젝트_일정_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(link.href);
  
  return csvContent;
};

/**
 * Google Calendar 추가 URL 생성
 */
export const generateGoogleCalendarUrl = (event) => {
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.label} - ${event.projectName}`,
    dates: `${dateStr}/${dateStr}`,
    details: `프로젝트: ${event.projectName}\n모델명: ${event.modelName}\n단계: ${event.stage}\n유형: ${event.label}`,
    location: '',
    trp: 'false' // 반복 없음
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Outlook Calendar 추가 URL 생성
 */
export const generateOutlookCalendarUrl = (event) => {
  const eventDate = new Date(event.date);
  const startTime = eventDate.toISOString();
  const endTime = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 하루 종일 이벤트
  
  const params = new URLSearchParams({
    subject: `${event.label} - ${event.projectName}`,
    startdt: startTime,
    enddt: endTime,
    body: `프로젝트: ${event.projectName}\n모델명: ${event.modelName}\n단계: ${event.stage}\n유형: ${event.label}`,
    allday: 'true'
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * 다중 이벤트를 외부 캘린더에 추가하는 URL 생성
 */
export const generateBulkCalendarUrls = (events) => {
  return {
    google: events.map(event => ({
      ...event,
      googleUrl: generateGoogleCalendarUrl(event)
    })),
    outlook: events.map(event => ({
      ...event,
      outlookUrl: generateOutlookCalendarUrl(event)
    }))
  };
};

/**
 * 프로젝트별 달력 내보내기
 */
export const exportProjectCalendar = (project, format = 'ical') => {
  const events = [];
  
  // 프로젝트의 모든 날짜 필드를 이벤트로 변환
  const dateFields = [
    // Stage 1
    { field: 'releaseDate', label: '출시예정일', stage: 'stage1' },
    { field: 'massProductionDate', label: '양산예정일', stage: 'stage1' },
    
    // Stage 2
    { field: 'pilotProductionDate', label: '파일럿생산일', stage: 'stage2' },
    { field: 'techTransferDate', label: '기술이전일', stage: 'stage2' },
    { field: 'installationDate', label: '설치일', stage: 'stage2' },
    
    // Stage 3
    { field: 'initialProductionDate', label: '최초양산일', stage: 'stage3' },
    { field: 'bomCompletionDate', label: 'BOM완성일', stage: 'stage3' },
    { field: 'partsArrivalDate', label: '부품입고일', stage: 'stage3' },
    { field: 'qualityApprovalDate', label: '품질승인일', stage: 'stage3' }
  ];

  dateFields.forEach(({ field, label, stage }) => {
    const stageData = project[stage];
    if (stageData && stageData[field]) {
      events.push({
        id: `${project.id}_${field}`,
        projectId: project.id,
        projectName: project.name,
        modelName: project.modelName,
        type: field,
        label: label,
        date: stageData[field],
        executed: stageData[`${field}Executed`] || false,
        stage: stage
      });
    }
  });

  // 포맷에 따라 내보내기
  switch (format.toLowerCase()) {
    case 'csv':
      return exportToCsv(events);
    case 'ical':
    default:
      return exportToIcal(events, {
        title: `${project.name} 프로젝트 일정`,
        description: `${project.name} (${project.modelName}) 프로젝트의 모든 일정`
      });
  }
};

/**
 * 전체 프로젝트 달력 내보내기
 */
export const exportAllProjectsCalendar = (projects, format = 'ical', filters = {}) => {
  const allEvents = [];
  
  projects.forEach(project => {
    // 프로젝트별 이벤트 추출
    const projectEvents = extractProjectEvents(project);
    allEvents.push(...projectEvents);
  });
  
  // 필터 적용
  let filteredEvents = allEvents;
  
  if (filters.stages && filters.stages.length > 0) {
    filteredEvents = filteredEvents.filter(event => filters.stages.includes(event.stage));
  }
  
  if (filters.status && filters.status !== 'all') {
    filteredEvents = filteredEvents.filter(event => {
      switch (filters.status) {
        case 'completed': return event.executed;
        case 'pending': return !event.executed;
        default: return true;
      }
    });
  }
  
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return (!start || eventDate >= new Date(start)) && 
             (!end || eventDate <= new Date(end));
    });
  }

  // 포맷에 따라 내보내기
  switch (format.toLowerCase()) {
    case 'csv':
      return exportToCsv(filteredEvents);
    case 'ical':
    default:
      return exportToIcal(filteredEvents, {
        title: '전체 프로젝트 달력',
        description: '모든 프로젝트의 일정 및 마일스톤'
      });
  }
};

/**
 * 프로젝트에서 이벤트 추출 헬퍼 함수
 */
const extractProjectEvents = (project) => {
  const events = [];
  
  const dateFields = [
    // Stage 1
    { field: 'releaseDate', label: '출시예정일', stage: 'stage1' },
    { field: 'massProductionDate', label: '양산예정일', stage: 'stage1' },
    
    // Stage 2
    { field: 'pilotProductionDate', label: '파일럿생산일', stage: 'stage2' },
    { field: 'techTransferDate', label: '기술이전일', stage: 'stage2' },
    { field: 'installationDate', label: '설치일', stage: 'stage2' },
    
    // Stage 3
    { field: 'initialProductionDate', label: '최초양산일', stage: 'stage3' },
    { field: 'bomCompletionDate', label: 'BOM완성일', stage: 'stage3' },
    { field: 'partsArrivalDate', label: '부품입고일', stage: 'stage3' },
    { field: 'qualityApprovalDate', label: '품질승인일', stage: 'stage3' }
  ];

  dateFields.forEach(({ field, label, stage }) => {
    const stageData = project[stage];
    if (stageData && stageData[field]) {
      events.push({
        id: `${project.id}_${field}`,
        projectId: project.id,
        projectName: project.name,
        modelName: project.modelName,
        type: field,
        label: label,
        date: stageData[field],
        executed: stageData[`${field}Executed`] || false,
        stage: stage
      });
    }
  });

  return events;
};

/**
 * 우선순위 레벨 계산 (iCal용)
 */
const getPriorityLevel = (event) => {
  if (event.executed) return '9'; // 낮음 (완료됨)
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date);
  eventDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '1'; // 높음 (지연됨)
  if (diffDays === 0) return '1'; // 높음 (오늘)
  if (diffDays <= 7) return '5'; // 보통 (일주일 이내)
  
  return '9'; // 낮음 (일주일 이후)
};

/**
 * 웹 캘린더 공유 링크 생성
 */
export const generateWebCalendarLink = (events, options = {}) => {
  const { baseUrl = window.location.origin } = options;
  
  // 이벤트 데이터를 압축하여 URL 파라미터로 전달
  const eventData = events.map(event => ({
    n: event.projectName,
    m: event.modelName,
    l: event.label,
    d: event.date,
    e: event.executed ? 1 : 0,
    s: event.stage
  }));
  
  const compressed = btoa(JSON.stringify(eventData));
  return `${baseUrl}/calendar/shared?data=${compressed}`;
};

/**
 * 외부 캘린더 연동 버튼 데이터 생성
 */
export const getExternalCalendarOptions = (events) => {
  return [
    {
      name: 'Google Calendar',
      icon: '📅',
      action: () => {
        const icalContent = exportToIcal(events);
        // Google Calendar는 iCal 파일 업로드를 통해 연동
        console.log('Google Calendar 연동을 위해 iCal 파일이 다운로드되었습니다.');
      }
    },
    {
      name: 'Outlook',
      icon: '📧',
      action: () => {
        const icalContent = exportToIcal(events);
        // Outlook도 iCal 파일 업로드를 통해 연동
        console.log('Outlook 연동을 위해 iCal 파일이 다운로드되었습니다.');
      }
    },
    {
      name: 'Apple Calendar',
      icon: '🍎',
      action: () => {
        const icalContent = exportToIcal(events);
        console.log('Apple Calendar 연동을 위해 iCal 파일이 다운로드되었습니다.');
      }
    },
    {
      name: 'CSV 파일',
      icon: '📊',
      action: () => {
        exportToCsv(events);
      }
    }
  ];
};