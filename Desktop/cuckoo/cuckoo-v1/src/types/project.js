// Project Types and Interfaces

export const ProjectStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled'
};

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue'
};

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Stage structure based on existing data
export const createStage1 = () => ({
  productGroup: '',
  manufacturer: '',
  vendor: '',
  productTool: '',
  derivativeModel: '',
  launchDate: '',
  launchDateExecuted: false,
  researcher1: '',
  researcher2: '',
  massProductionDate: '',
  massProductionDateExecuted: false,
  notes: ''
});

export const createStage2 = () => ({
  pilotProductionDate: '',
  pilotProductionDateExecuted: false,
  pilotQuantity: '',
  pilotReceiveDate: '',
  pilotReceiveDateExecuted: false,
  techTransferDate: '',
  techTransferDateExecuted: false,
  installationEntity: '',
  serviceEntity: '',
  trainingDate: '',
  trainingDateExecuted: false,
  orderAcceptanceDate: '',
  orderAcceptanceDateExecuted: false,
  trainingCompleted: false,
  manualUploaded: false,
  techGuideUploaded: false,
  notes: ''
});

export const createStage3 = () => ({
  initialProductionDate: '',
  initialProductionDateExecuted: false,
  firstOrderDate: '',
  firstOrderDateExecuted: false,
  bomManager: '',
  bomTargetDate: '',
  bomTargetDateExecuted: false,
  priceManager: '',
  priceTargetDate: '',
  priceTargetDateExecuted: false,
  partsDeliveryDate: '',
  partsDeliveryDateExecuted: false,
  partsReceived: false,
  branchOrderEnabled: false,
  issueResolved: false,
  notes: ''
});

export const createProject = (data = {}) => ({
  id: data.id || `PRJ-${Date.now()}`,
  name: data.name || '',
  description: data.description || '',
  status: data.status || ProjectStatus.ACTIVE,
  completed: data.completed || false,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
  stage1: { ...createStage1(), ...data.stage1 },
  stage2: { ...createStage2(), ...data.stage2 },
  stage3: { ...createStage3(), ...data.stage3 }
});

export const createUser = (data = {}) => ({
  id: data.id || `USER-${Date.now()}`,
  name: data.name || '',
  email: data.email || '',
  role: data.role || 'user',
  isLoggedIn: data.isLoggedIn || false
});

export const createOpinion = (data = {}) => ({
  id: data.id || `OP-${Date.now()}`,
  projectId: data.projectId || '',
  authorName: data.authorName || '',
  message: data.message || '',
  createdAt: data.createdAt || new Date().toISOString()
});

// Validation helpers
export const isValidProject = (project) => {
  return project && 
         typeof project.id === 'string' && 
         typeof project.name === 'string' && 
         project.stage1 && 
         project.stage2 && 
         project.stage3;
};

export const getProjectProgress = (project) => {
  if (!isValidProject(project)) {
    return { overall: 0, stage1: 0, stage2: 0, stage3: 0 };
  }
  
  // 각 단계별 진행률 계산
  const stage1Progress = getStageProgress(project, 'stage1');
  const stage2Progress = getStageProgress(project, 'stage2');
  const stage3Progress = getStageProgress(project, 'stage3');
  
  const overallProgress = (stage1Progress + stage2Progress + stage3Progress) / 3;
  const clampedOverall = Math.max(0, Math.min(100, Math.round(overallProgress)));
  
  console.log(`📈 [Overall Progress] 전체: ${clampedOverall}% (1단계: ${stage1Progress}%, 2단계: ${stage2Progress}%, 3단계: ${stage3Progress}%)`);
  
  return {
    overall: clampedOverall,
    stage1: stage1Progress,
    stage2: stage2Progress,
    stage3: stage3Progress
  };
};

// 하위 호환성을 위한 간단한 전체 진행률 함수
export const getOverallProgress = (project) => {
  const progress = getProjectProgress(project);
  return progress.overall || 0;
};

// Calculate progress for individual stage (날짜 50% + 실행완료 50%)
export const getStageProgress = (project, stageName) => {
  const stage = project[stageName];
  if (!stage) return 0;

  const fieldNames = Object.keys(stage);
  
  // 날짜 필드들 (실행완료와 쌍을 이루는 것들)
  const dateFields = fieldNames.filter(name => 
    name.endsWith('Date') && 
    name !== 'notes' &&
    fieldNames.includes(name + 'Executed') // 대응하는 Executed 필드가 있는 경우만
  );
  
  // 실행완료 필드들 (날짜와 쌍을 이루는 것들)
  const executedFields = dateFields.map(dateField => dateField + 'Executed');
  
  // 일반 텍스트 필드들 (날짜가 아니고 실행완료도 아닌 것들)
  const regularFields = fieldNames.filter(name => 
    !name.endsWith('Date') &&
    !name.endsWith('Executed') &&
    !['trainingCompleted', 'manualUploaded', 'techGuideUploaded', 'partsReceived', 'branchOrderEnabled', 'issueResolved', 'notes'].includes(name)
  );
  
  // 기타 체크박스 필드들
  const otherCheckboxFields = fieldNames.filter(name => 
    ['trainingCompleted', 'manualUploaded', 'techGuideUploaded', 'partsReceived', 'branchOrderEnabled', 'issueResolved'].includes(name)
  );

  let totalScore = 0;
  let achievedScore = 0;

  // 날짜 + 실행완료 쌍 처리 (각각 0.5점씩)
  dateFields.forEach(dateField => {
    const executedField = dateField + 'Executed';
    
    totalScore += 1.0; // 날짜(0.5) + 실행완료(0.5) = 1.0점
    
    // 날짜 입력 완료 시 0.5점
    if (stage[dateField] && stage[dateField].toString().trim() !== '') {
      achievedScore += 0.5;
    }
    
    // 실행완료 체크 시 0.5점
    if (stage[executedField] === true) {
      achievedScore += 0.5;
    }
  });
  
  // 일반 텍스트 필드들 (각각 1점)
  regularFields.forEach(field => {
    totalScore += 1.0;
    if (stage[field] && stage[field].toString().trim() !== '') {
      achievedScore += 1.0;
    }
  });
  
  // 기타 체크박스 필드들 (각각 1점)
  otherCheckboxFields.forEach(field => {
    totalScore += 1.0;
    if (stage[field] === true) {
      achievedScore += 1.0;
    }
  });

  const percentage = totalScore > 0 ? (achievedScore / totalScore) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  
  // 상세 디버그 로깅
  console.log(`📊 [Progress v2] ${stageName}:`, {
    totalScore: totalScore.toFixed(1),
    achievedScore: achievedScore.toFixed(1),
    percentage: percentage.toFixed(2),
    clampedPercentage,
    dateFields: { count: dateFields.length, fields: dateFields },
    executedFields: { count: executedFields.length, fields: executedFields },
    regularFields: { count: regularFields.length, fields: regularFields },
    otherCheckboxFields: { count: otherCheckboxFields.length, fields: otherCheckboxFields }
  });
  
  return clampedPercentage;
};