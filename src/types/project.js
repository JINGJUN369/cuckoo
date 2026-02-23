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
  modelName: '',
  manufacturer: '',
  vendor: '',
  derivativeModel: '',
  launchDate: '',
  launchDateExecuted: false,
  productManager: '',
  mechanicalEngineer: '',
  circuitEngineer: '',
  massProductionDate: '',
  massProductionDateExecuted: false,
  notes: ''
});

// Required fields definition for progress calculation
export const getRequiredFields = (stageName) => {
  const requiredFieldsMap = {
    stage1: {
      required: ['productGroup', 'modelName', 'manufacturer', 'productManager'],
      requiredDates: ['launchDate', 'massProductionDate'],
      optional: ['vendor', 'derivativeModel', 'mechanicalEngineer', 'circuitEngineer']
    },
    stage2: {
      required: ['installationParty', 'serviceParty'],
      requiredDates: ['pilotProductionDate', 'techTransferDate', 'trainingDate', 'userManualDate', 'techManualDate'],
      optional: []
    },
    stage3: {
      required: ['bomManager', 'priceManager', 'partsReceiptManager'],
      requiredDates: ['firstPartsOrderDate', 'bomCompletionDate', 'priceRegistrationDate', 'partsReceiptDate', 'branchOrderGuideDate'],
      optional: []
    }
  };

  return requiredFieldsMap[stageName] || { required: [], requiredDates: [], optional: [] };
};

export const createStage2 = () => ({
  pilotProductionDate: '',
  pilotProductionDateExecuted: false,
  techTransferDate: '',
  techTransferDateExecuted: false,
  installationParty: '',
  serviceParty: '',
  trainingDate: '',
  trainingDateExecuted: false,
  userManualDate: '',
  userManualDateExecuted: false,
  techManualDate: '',
  techManualDateExecuted: false,
  notes: ''
});

export const createStage3 = () => ({
  firstPartsOrderDate: '',
  firstPartsOrderDateExecuted: false,
  bomManager: '',
  bomCompletionDate: '',
  bomCompletionDateExecuted: false,
  priceManager: '',
  priceRegistrationDate: '',
  priceRegistrationDateExecuted: false,
  partsReceiptDate: '',
  partsReceiptDateExecuted: false,
  partsReceiptManager: '',
  branchOrderGuideDate: '',
  branchOrderGuideDateExecuted: false,
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

// Calculate progress for individual stage - ONLY COUNT REQUIRED FIELDS
export const getStageProgress = (project, stageName) => {
  const stage = project[stageName];
  if (!stage) return 0;

  // Get required fields definition for this stage
  const requiredFieldsConfig = getRequiredFields(stageName);
  const { required, requiredDates } = requiredFieldsConfig;

  let totalScore = 0;
  let achievedScore = 0;

  console.log(`🎯 [Progress v3] ${stageName} - Required fields config:`, requiredFieldsConfig);

  // 1. Required date fields + execution (각각 날짜 0.5점 + 실행완료 0.5점 = 1.0점)
  if (requiredDates) {
    requiredDates.forEach(dateField => {
      const executedField = dateField + 'Executed';

      totalScore += 1.0; // 날짜(0.5) + 실행완료(0.5) = 1.0점

      // 날짜 입력 완료 시 0.5점
      const dateValue = stage[dateField];
      if (dateValue && dateValue.toString().trim() !== '') {
        achievedScore += 0.5;
      }

      // 실행완료 체크 시 0.5점
      const executedValue = stage[executedField];
      if (executedValue === true) {
        achievedScore += 0.5;
      }

      console.log(`   📅 ${dateField}: "${dateValue}" (${dateValue ? '0.5' : '0'}) + ${executedField}: ${executedValue} (${executedValue ? '0.5' : '0'})`);
    });
  }

  // 2. Required text fields (각각 1점)
  if (required) {
    required.forEach(field => {
      totalScore += 1.0;
      const value = stage[field];
      if (value && value.toString().trim() !== '') {
        achievedScore += 1.0;
      }
      console.log(`   📝 ${field}: "${value}" (${value ? '1.0' : '0'})`);
    });
  }


  const percentage = totalScore > 0 ? (achievedScore / totalScore) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));

  // 상세 디버그 로깅
  console.log(`📊 [Progress v3] ${stageName}:`, {
    totalScore: totalScore.toFixed(1),
    achievedScore: achievedScore.toFixed(1),
    percentage: percentage.toFixed(2),
    clampedPercentage,
    requiredConfig: requiredFieldsConfig,
    stageData: stage
  });

  return clampedPercentage;
};