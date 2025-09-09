// Notion-style 디자인 토큰
export const colors = {
  // 기본 색상
  background: '#ffffff',
  surface: '#f8f9fa',
  border: '#e5e5e5',
  divider: '#f1f3f4',
  
  // 텍스트 색상
  text: {
    primary: '#2d3748',
    secondary: '#718096',
    muted: '#a0aec0',
    disabled: '#cbd5e0'
  },
  
  // 포인트 색상 (최소 사용)
  primary: '#3182ce',    // 파란색 (버튼, 링크)
  success: '#38a169',    // 초록색 (완료, 성공)
  warning: '#ed8936',    // 주황색 (주의)
  error: '#e53e3e',      // 빨간색 (오류, 경고)
  
  // 단계별 색상 (아주 연하게)
  stage: {
    stage1: {
      bg: '#ebf8ff',      // 아주 연한 파란색
      text: '#2b6cb0',
      border: '#bee3f8'
    },
    stage2: {
      bg: '#f0fff4',      // 아주 연한 초록색
      text: '#2f855a',
      border: '#9ae6b4'
    },
    stage3: {
      bg: '#faf5ff',      // 아주 연한 보라색
      text: '#6b46c1',
      border: '#c3b5f7'
    }
  },
  
  // 상태별 색상
  status: {
    completed: {
      bg: '#f0fff4',
      text: '#2f855a',
      border: '#9ae6b4'
    },
    inProgress: {
      bg: '#ebf8ff',
      text: '#2b6cb0',
      border: '#bee3f8'
    },
    pending: {
      bg: '#fffaf0',
      text: '#c05621',
      border: '#fbd38d'
    },
    overdue: {
      bg: '#fed7d7',
      text: '#c53030',
      border: '#feb2b2'
    }
  }
};

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem'     // 64px
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Monaco', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem'  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px'
};

// Tailwind CSS 클래스 생성 도우미
export const tw = {
  // 배경색
  bg: {
    primary: 'bg-white',
    surface: 'bg-gray-50',
    muted: 'bg-gray-100'
  },
  
  // 텍스트 색상
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
    disabled: 'text-gray-400'
  },
  
  // 테두리
  border: {
    default: 'border border-gray-200',
    muted: 'border border-gray-100',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  },
  
  // 그림자
  shadow: {
    card: 'shadow-sm hover:shadow-md transition-shadow',
    elevated: 'shadow-lg'
  },
  
  // 버튼 스타일
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
  }
};

export default {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  tw
};