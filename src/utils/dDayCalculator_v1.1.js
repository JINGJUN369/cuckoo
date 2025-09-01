/**
 * v1.1 D-Day 계산 및 알림 관련 유틸리티
 * 
 * 주요 기능:
 * - D-Day 계산 (오늘 기준)
 * - D-Day 상태 분류 (예정/지연/완료)
 * - 우선순위 계산
 * - 알림 조건 체크
 * - D-Day 텍스트 포맷팅
 * - 색상 클래스 반환
 */

/**
 * 기본 D-Day 계산
 */
export const calculateDDay = (targetDate) => {
  if (!targetDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * D-Day 상태 분류
 */
export const getDDayStatus = (targetDate, isExecuted = false) => {
  if (isExecuted) return 'completed';
  
  const dDay = calculateDDay(targetDate);
  if (dDay === null) return 'unknown';
  
  if (dDay < 0) return 'overdue';
  if (dDay === 0) return 'today';
  if (dDay <= 7) return 'urgent';
  if (dDay <= 30) return 'upcoming';
  
  return 'future';
};

/**
 * D-Day 텍스트 포맷팅
 */
export const formatDDay = (targetDate, isExecuted = false) => {
  if (isExecuted) return '완료';
  
  const dDay = calculateDDay(targetDate);
  if (dDay === null) return '';
  
  if (dDay < 0) return `D+${Math.abs(dDay)}`;
  if (dDay === 0) return 'D-Day';
  
  return `D-${dDay}`;
};

/**
 * D-Day 색상 클래스 반환 (Tailwind CSS)
 */
export const getDDayColorClass = (targetDate, isExecuted = false) => {
  const status = getDDayStatus(targetDate, isExecuted);
  
  const colorClasses = {
    completed: 'bg-green-500 text-white',
    overdue: 'bg-red-500 text-white',
    today: 'bg-red-600 text-white animate-pulse',
    urgent: 'bg-orange-500 text-white',
    upcoming: 'bg-yellow-500 text-black',
    future: 'bg-blue-500 text-white',
    unknown: 'bg-gray-400 text-white'
  };
  
  return colorClasses[status] || colorClasses.unknown;
};

/**
 * D-Day 우선순위 점수 계산 (숫자가 낮을수록 우선순위 높음)
 */
export const getDDayPriority = (targetDate, isExecuted = false) => {
  if (isExecuted) return 1000; // 완료된 것은 낮은 우선순위
  
  const dDay = calculateDDay(targetDate);
  if (dDay === null) return 999;
  
  if (dDay < 0) return Math.abs(dDay); // 지연된 것은 지연된 만큼 우선순위 높음
  if (dDay === 0) return 0; // 오늘 최우선
  
  return dDay; // 가까운 날짜일수록 우선순위 높음
};

/**
 * 프로젝트의 모든 D-Day 계산
 */
export const calculateProjectDDays = (project) => {
  const dDays = [];
  
  // Stage 1 날짜들
  if (project.stage1?.releaseDate) {
    dDays.push({
      type: 'release',
      label: '출시예정일',
      date: project.stage1.releaseDate,
      executed: project.stage1.releaseDateExecuted || false,
      stage: 'stage1',
      dDay: calculateDDay(project.stage1.releaseDate),
      status: getDDayStatus(project.stage1.releaseDate, project.stage1.releaseDateExecuted),
      priority: getDDayPriority(project.stage1.releaseDate, project.stage1.releaseDateExecuted)
    });
  }
  
  if (project.stage1?.massProductionDate) {
    dDays.push({
      type: 'massProduction',
      label: '양산예정일',
      date: project.stage1.massProductionDate,
      executed: project.stage1.massProductionDateExecuted || false,
      stage: 'stage1',
      dDay: calculateDDay(project.stage1.massProductionDate),
      status: getDDayStatus(project.stage1.massProductionDate, project.stage1.massProductionDateExecuted),
      priority: getDDayPriority(project.stage1.massProductionDate, project.stage1.massProductionDateExecuted)
    });
  }
  
  // Stage 2 날짜들
  if (project.stage2?.pilotProductionDate) {
    dDays.push({
      type: 'pilotProduction',
      label: '파일럿생산일',
      date: project.stage2.pilotProductionDate,
      executed: project.stage2.pilotProductionDateExecuted || false,
      stage: 'stage2',
      dDay: calculateDDay(project.stage2.pilotProductionDate),
      status: getDDayStatus(project.stage2.pilotProductionDate, project.stage2.pilotProductionDateExecuted),
      priority: getDDayPriority(project.stage2.pilotProductionDate, project.stage2.pilotProductionDateExecuted)
    });
  }
  
  if (project.stage2?.techTransferDate) {
    dDays.push({
      type: 'techTransfer',
      label: '기술이전일',
      date: project.stage2.techTransferDate,
      executed: project.stage2.techTransferDateExecuted || false,
      stage: 'stage2',
      dDay: calculateDDay(project.stage2.techTransferDate),
      status: getDDayStatus(project.stage2.techTransferDate, project.stage2.techTransferDateExecuted),
      priority: getDDayPriority(project.stage2.techTransferDate, project.stage2.techTransferDateExecuted)
    });
  }
  
  if (project.stage2?.installationDate) {
    dDays.push({
      type: 'installation',
      label: '설치일',
      date: project.stage2.installationDate,
      executed: project.stage2.installationDateExecuted || false,
      stage: 'stage2',
      dDay: calculateDDay(project.stage2.installationDate),
      status: getDDayStatus(project.stage2.installationDate, project.stage2.installationDateExecuted),
      priority: getDDayPriority(project.stage2.installationDate, project.stage2.installationDateExecuted)
    });
  }
  
  // Stage 3 날짜들
  if (project.stage3?.initialProductionDate) {
    dDays.push({
      type: 'initialProduction',
      label: '최초양산일',
      date: project.stage3.initialProductionDate,
      executed: project.stage3.initialProductionDateExecuted || false,
      stage: 'stage3',
      dDay: calculateDDay(project.stage3.initialProductionDate),
      status: getDDayStatus(project.stage3.initialProductionDate, project.stage3.initialProductionDateExecuted),
      priority: getDDayPriority(project.stage3.initialProductionDate, project.stage3.initialProductionDateExecuted)
    });
  }
  
  if (project.stage3?.bomCompletionDate) {
    dDays.push({
      type: 'bomCompletion',
      label: 'BOM완성일',
      date: project.stage3.bomCompletionDate,
      executed: project.stage3.bomCompletionDateExecuted || false,
      stage: 'stage3',
      dDay: calculateDDay(project.stage3.bomCompletionDate),
      status: getDDayStatus(project.stage3.bomCompletionDate, project.stage3.bomCompletionDateExecuted),
      priority: getDDayPriority(project.stage3.bomCompletionDate, project.stage3.bomCompletionDateExecuted)
    });
  }
  
  if (project.stage3?.partsArrivalDate) {
    dDays.push({
      type: 'partsArrival',
      label: '부품입고일',
      date: project.stage3.partsArrivalDate,
      executed: project.stage3.partsArrivalDateExecuted || false,
      stage: 'stage3',
      dDay: calculateDDay(project.stage3.partsArrivalDate),
      status: getDDayStatus(project.stage3.partsArrivalDate, project.stage3.partsArrivalDateExecuted),
      priority: getDDayPriority(project.stage3.partsArrivalDate, project.stage3.partsArrivalDateExecuted)
    });
  }
  
  if (project.stage3?.qualityApprovalDate) {
    dDays.push({
      type: 'qualityApproval',
      label: '품질승인일',
      date: project.stage3.qualityApprovalDate,
      executed: project.stage3.qualityApprovalDateExecuted || false,
      stage: 'stage3',
      dDay: calculateDDay(project.stage3.qualityApprovalDate),
      status: getDDayStatus(project.stage3.qualityApprovalDate, project.stage3.qualityApprovalDateExecuted),
      priority: getDDayPriority(project.stage3.qualityApprovalDate, project.stage3.qualityApprovalDateExecuted)
    });
  }
  
  // 우선순위 순으로 정렬 (낮은 숫자가 높은 우선순위)
  return dDays.sort((a, b) => a.priority - b.priority);
};

/**
 * 알림이 필요한 D-Day 필터링
 */
export const getNotificationTargets = (projects, options = {}) => {
  const {
    urgentDays = 7,     // 긴급 알림 기준 (D-7)
    reminderDays = 3,   // 리마인더 알림 기준 (D-3)
    includeTodayEvents = true,
    includeOverdueEvents = true
  } = options;
  
  const notifications = [];
  
  projects.forEach(project => {
    const projectDDays = calculateProjectDDays(project);
    
    projectDDays.forEach(dDayInfo => {
      if (dDayInfo.executed) return; // 이미 실행된 것은 제외
      
      const { dDay, status } = dDayInfo;
      let notificationType = null;
      
      // 지연된 이벤트
      if (includeOverdueEvents && status === 'overdue') {
        notificationType = 'overdue';
      }
      // 오늘 이벤트
      else if (includeTodayEvents && status === 'today') {
        notificationType = 'today';
      }
      // 긴급 이벤트 (D-7 이내)
      else if (dDay <= urgentDays && dDay > 0) {
        notificationType = 'urgent';
      }
      // 리마인더 이벤트 (D-3 이내)
      else if (dDay <= reminderDays && dDay > 0) {
        notificationType = 'reminder';
      }
      
      if (notificationType) {
        notifications.push({
          ...dDayInfo,
          projectName: project.name,
          modelName: project.modelName,
          projectId: project.id,
          notificationType,
          urgency: status === 'overdue' ? 'high' : 
                  status === 'today' ? 'high' :
                  status === 'urgent' ? 'medium' : 'low'
        });
      }
    });
  });
  
  // 우선순위 순으로 정렬
  return notifications.sort((a, b) => {
    // 긴급도 순
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    
    // D-Day 순
    return a.priority - b.priority;
  });
};

/**
 * D-Day 통계 계산
 */
export const calculateDDayStatistics = (projects) => {
  const stats = {
    total: 0,
    overdue: 0,
    today: 0,
    urgent: 0,      // D-7 이내
    upcoming: 0,    // D-30 이내
    future: 0,      // D-30 이후
    completed: 0
  };
  
  projects.forEach(project => {
    const projectDDays = calculateProjectDDays(project);
    
    projectDDays.forEach(dDayInfo => {
      stats.total++;
      stats[dDayInfo.status] = (stats[dDayInfo.status] || 0) + 1;
    });
  });
  
  return stats;
};