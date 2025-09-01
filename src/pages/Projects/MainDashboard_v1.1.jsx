import React from 'react';
import ProjectDashboard_v11 from './ProjectDashboard_v1.1';

/**
 * v1.1 MainDashboard - 전체 프로젝트 대시보드 래퍼
 * 
 * 주요 특징:
 * - ProjectDashboard_v1.1의 메인 대시보드 모드 활용
 * - 전체 프로젝트 통계 및 현황 표시
 * - 통합된 컴포넌트 재사용
 */
const MainDashboard_v11 = () => {
  console.log('🏠 [v1.1] MainDashboard rendering');

  return <ProjectDashboard_v11 type="main" />;
};

export default MainDashboard_v11;