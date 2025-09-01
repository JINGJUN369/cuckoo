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
  if (!isValidProject(project)) return 0;
  
  // 각 단계별 진행률을 평균내어 전체 진행률 계산
  const stage1Progress = getStageProgress(project, 'stage1');
  const stage2Progress = getStageProgress(project, 'stage2');
  const stage3Progress = getStageProgress(project, 'stage3');
  
  const overallProgress = (stage1Progress + stage2Progress + stage3Progress) / 3;
  
  console.log(`📈 [Overall Progress] 전체: ${Math.round(overallProgress)}% (1단계: ${stage1Progress}%, 2단계: ${stage2Progress}%, 3단계: ${stage3Progress}%)`);
  
  return Math.max(0, Math.min(100, Math.round(overallProgress)));
};

// Calculate progress for individual stage
export const getStageProgress = (project, stageName) => {
  const stage = project[stageName];
  if (!stage) return 0;

  let totalFields = 0;
  let completedFields = 0;

  const fieldNames = Object.keys(stage);
  
  // 체크박스 필드 (실행여부 등) - 진행률에 포함
  const checkboxFields = fieldNames.filter(name => 
    name.endsWith('Executed') || 
    ['trainingCompleted', 'manualUploaded', 'techGuideUploaded', 'partsReceived', 'branchOrderEnabled', 'issueResolved'].includes(name)
  );
  
  // 텍스트 필드 - notes(비고) 제외하고 진행률에 포함
  const textFields = fieldNames.filter(name => 
    !name.endsWith('Executed') && 
    !['trainingCompleted', 'manualUploaded', 'techGuideUploaded', 'partsReceived', 'branchOrderEnabled', 'issueResolved', 'notes'].includes(name)
  );
  
  totalFields = textFields.length + checkboxFields.length;
  
  // 텍스트 필드 완료 체크 (비고 제외)
  textFields.forEach(field => {
    if (stage[field] && stage[field].toString().trim() !== '') {
      completedFields++;
    }
  });
  
  // 체크박스 필드 완료 체크
  checkboxFields.forEach(field => {
    if (stage[field] === true) {
      completedFields++;
    }
  });

  const percentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  
  // 상세 디버그 로깅 (문제 해결을 위해 더 자세히)
  console.log(`📊 [Progress DEBUG] ${stageName}:`, {
    totalFields,
    completedFields,
    percentage: percentage.toFixed(2),
    clampedPercentage,
    textFields: { count: textFields.length, fields: textFields },
    checkboxFields: { count: checkboxFields.length, fields: checkboxFields },
    stage: stage
  });
  
  // 비정상 값 감지 및 강제 수정
  if (percentage > 100 || completedFields > totalFields) {
    console.error(`🚨 [Progress ERROR] ${stageName}: 비정상 값 감지! completedFields(${completedFields}) > totalFields(${totalFields})`);
    console.error(`🚨 Stage data:`, stage);
    console.error(`🚨 Text fields:`, textFields);
    console.error(`🚨 Checkbox fields:`, checkboxFields);
    return 0; // 안전장치: 비정상 값인 경우 0% 반환
  }
  
  return clampedPercentage;
};