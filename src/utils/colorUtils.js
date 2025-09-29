/**
 * 업무달력 색상 관리 유틸리티
 */

// 업무별 색상 팔레트 (12가지 톤) - 업무는 매우 연하게, 세부업무는 적당한 진함
const COLOR_PALETTE = [
  {
    name: 'blue',
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-300 text-blue-900',
    ring: 'ring-blue-500'
  },
  {
    name: 'green',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-green-300 text-green-900',
    ring: 'ring-green-500'
  },
  {
    name: 'purple',
    light: 'bg-purple-100 text-purple-800',
    dark: 'bg-purple-300 text-purple-900',
    ring: 'ring-purple-500'
  },
  {
    name: 'red',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-300 text-red-900',
    ring: 'ring-red-500'
  },
  {
    name: 'yellow',
    light: 'bg-yellow-100 text-yellow-800',
    dark: 'bg-yellow-300 text-yellow-900',
    ring: 'ring-yellow-500'
  },
  {
    name: 'indigo',
    light: 'bg-indigo-100 text-indigo-800',
    dark: 'bg-indigo-300 text-indigo-900',
    ring: 'ring-indigo-500'
  },
  {
    name: 'pink',
    light: 'bg-pink-100 text-pink-800',
    dark: 'bg-pink-300 text-pink-900',
    ring: 'ring-pink-500'
  },
  {
    name: 'teal',
    light: 'bg-teal-100 text-teal-800',
    dark: 'bg-teal-300 text-teal-900',
    ring: 'ring-teal-500'
  },
  {
    name: 'orange',
    light: 'bg-orange-100 text-orange-800',
    dark: 'bg-orange-300 text-orange-900',
    ring: 'ring-orange-500'
  },
  {
    name: 'gray',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-gray-300 text-gray-900',
    ring: 'ring-gray-500'
  },
  {
    name: 'cyan',
    light: 'bg-cyan-100 text-cyan-800',
    dark: 'bg-cyan-300 text-cyan-900',
    ring: 'ring-cyan-500'
  },
  {
    name: 'lime',
    light: 'bg-lime-100 text-lime-800',
    dark: 'bg-lime-300 text-lime-900',
    ring: 'ring-lime-500'
  }
];

// 업무 ID별 색상 캐시
const workColorCache = new Map();

/**
 * 문자열 해시 생성 (업무명 → 숫자)
 */
const stringToHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
};

/**
 * 업무별 색상 할당
 * @param {object} work - 업무 객체
 * @param {boolean} isDetailTask - 세부업무 여부
 * @returns {object} { colorClass, priorityClass, borderClass }
 */
export const getWorkColor = (work, isDetailTask = false) => {
  if (!work) return { colorClass: 'bg-gray-300 text-gray-900', priorityClass: '', borderClass: '' };

  // 업무 고유 식별자 생성 (같은 업무의 세부업무들은 같은 색상을 가짐)
  const workId = work.additional_work_id || work.work_name || work.id;
  
  // 캐시에서 색상 확인
  if (workColorCache.has(workId)) {
    const colorIndex = workColorCache.get(workId);
    const colorPalette = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
    
    // 마감일 기준 우선순위 클래스 (경고용)
    const priorityClass = getPriorityClass(work);
    
    return {
      colorClass: isDetailTask ? colorPalette.dark : colorPalette.light,
      priorityClass,
      borderClass: priorityClass ? `border-2 ${colorPalette.ring.replace('ring-', 'border-')}` : ''
    };
  }

  // 새 업무인 경우 색상 할당
  const hash = stringToHash(workId.toString());
  const colorIndex = hash % COLOR_PALETTE.length;
  workColorCache.set(workId, colorIndex);
  
  const colorPalette = COLOR_PALETTE[colorIndex];
  const priorityClass = getPriorityClass(work);
  
  return {
    colorClass: isDetailTask ? colorPalette.dark : colorPalette.light,
    priorityClass,
    borderClass: priorityClass ? `border-2 ${colorPalette.ring.replace('ring-', 'border-')}` : ''
  };
};

/**
 * 마감일 기준 우선순위 클래스 생성
 */
const getPriorityClass = (work) => {
  const today = new Date();
  const endDate = new Date(work.end_date);
  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'urgent'; // 지연
  if (daysLeft === 0) return 'today'; // 오늘 마감  
  if (daysLeft <= 3) return 'soon'; // 임박
  return ''; // 일반
};

/**
 * 우선순위 텍스트 반환
 */
export const getPriorityText = (work) => {
  const today = new Date();
  const endDate = new Date(work.end_date);
  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return '지연';
  if (daysLeft === 0) return '오늘 마감';
  if (daysLeft <= 3) return '임박';
  return '일반';
};

/**
 * 업무 타입 확인
 * @param {object} item - 업무 또는 세부업무 객체
 * @returns {boolean} 세부업무 여부
 */
export const isDetailTask = (item) => {
  // additional_work_id가 있으면 세부업무
  return item.hasOwnProperty('additional_work_id') && item.additional_work_id !== null;
};

/**
 * 색상 캐시 초기화 (필터 변경 시 사용)
 */
export const clearColorCache = () => {
  workColorCache.clear();
};

/**
 * 범례 데이터 생성
 */
export const getLegendData = () => [
  { color: 'bg-red-500', text: '지연', description: '마감일이 지난 업무' },
  { color: 'bg-orange-500', text: '오늘 마감', description: '오늘이 마감일인 업무' },
  { color: 'bg-yellow-500', text: '임박', description: '3일 이내 마감 업무' },
  { color: 'bg-green-500', text: '일반', description: '여유있는 업무' }
];