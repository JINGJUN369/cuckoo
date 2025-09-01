/**
 * 엑셀 내보내기 유틸리티
 * 프로젝트 데이터를 CSV 형식으로 내보내기
 */

export const exportProjectsToCSV = (projects, filename = 'projects') => {
  if (!projects || projects.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  // CSV 헤더 정의 (모든 단계 포함)
  const headers = [
    'ID',
    '프로젝트명',
    '모델명',
    '전체 진행률(%)',
    'Stage1 진행률(%)',
    'Stage2 진행률(%)', 
    'Stage3 진행률(%)',
    
    // Stage1 필드들
    '제품군(Stage1)',
    '제조사(Stage1)',
    '벤더사(Stage1)',
    '담당자1(Stage1)',
    '담당자2(Stage1)',
    '부서(Stage1)',
    '출시예정일(Stage1)',
    '양산예정일(Stage1)',
    '출시완료(Stage1)',
    '양산완료(Stage1)',
    
    // Stage2 필드들
    '파일럿생산(Stage2)',
    '기술이전(Stage2)',
    '설치주체(Stage2)',
    '서비스주체(Stage2)',
    '기타사항(Stage2)',
    '파일럿생산완료(Stage2)',
    '기술이전완료(Stage2)',
    '설치완료(Stage2)',
    '서비스완료(Stage2)',
    
    // Stage3 필드들
    '최초양산(Stage3)',
    'BOM구성(Stage3)',
    '단가등록(Stage3)',
    '부품입고(Stage3)',
    '외주업체(Stage3)',
    '최초양산완료(Stage3)',
    'BOM구성완료(Stage3)',
    '단가등록완료(Stage3)',
    '부품입고완료(Stage3)',
    
    '생성일자',
    'D-Day',
    '상태'
  ];

  // 데이터 변환
  const csvData = projects.map(project => {
    const calculateDDay = (massProductionDate) => {
      if (!massProductionDate) return 'N/A';
      const targetDate = new Date(massProductionDate);
      const today = new Date();
      const dDay = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      return dDay > 0 ? `D-${dDay}` : dDay < 0 ? `D+${Math.abs(dDay)}` : 'D-Day';
    };

    const getFieldCount = (stage) => {
      if (!stage) return { filled: 0, total: 0 };
      const fields = Object.values(stage).filter(value => 
        value !== null && value !== undefined && value !== ''
      );
      const totalFields = Object.keys(stage).length;
      return { filled: fields.length, total: totalFields };
    };

    const stage1Progress = getFieldCount(project.stage1);
    const stage2Progress = getFieldCount(project.stage2);
    const stage3Progress = getFieldCount(project.stage3);

    const stage1Percent = stage1Progress.total > 0 ? Math.round((stage1Progress.filled / stage1Progress.total) * 100) : 0;
    const stage2Percent = stage2Progress.total > 0 ? Math.round((stage2Progress.filled / stage2Progress.total) * 100) : 0;
    const stage3Percent = stage3Progress.total > 0 ? Math.round((stage3Progress.filled / stage3Progress.total) * 100) : 0;
    const overallPercent = Math.round((stage1Percent + stage2Percent + stage3Percent) / 3);

    const getStatus = () => {
      if (overallPercent === 100) return '완료';
      if (overallPercent >= 70) return '높은 진행률';
      if (overallPercent >= 30) return '보통 진행률';
      return '낮은 진행률';
    };

    return [
      project.id || '',
      project.name || '',
      project.modelName || '',
      overallPercent,
      stage1Percent,
      stage2Percent,
      stage3Percent,
      
      // Stage1 필드들
      project.stage1?.productGroup || '',
      project.stage1?.manufacturer || '',
      project.stage1?.vendor || '',
      project.stage1?.researcher1 || '',
      project.stage1?.researcher2 || '',
      project.stage1?.department || '',
      project.stage1?.launchDate || '',
      project.stage1?.massProductionDate || '',
      project.stage1?.launchExecuted ? '완료' : '미완료',
      project.stage1?.massProductionExecuted ? '완료' : '미완료',
      
      // Stage2 필드들
      project.stage2?.pilotProduction || '',
      project.stage2?.techTransfer || '',
      project.stage2?.installationParty || '',
      project.stage2?.serviceParty || '',
      project.stage2?.etc || '',
      project.stage2?.pilotProductionExecuted ? '완료' : '미완료',
      project.stage2?.techTransferExecuted ? '완료' : '미완료',
      project.stage2?.installationExecuted ? '완료' : '미완료',
      project.stage2?.serviceExecuted ? '완료' : '미완료',
      
      // Stage3 필드들
      project.stage3?.initialProduction || '',
      project.stage3?.bomManager || '',
      project.stage3?.priceRegistration || '',
      project.stage3?.partsReceipt || '',
      project.stage3?.subcontractor || '',
      project.stage3?.initialProductionExecuted ? '완료' : '미완료',
      project.stage3?.bomManagerExecuted ? '완료' : '미완료',
      project.stage3?.priceRegistrationExecuted ? '완료' : '미완료',
      project.stage3?.partsReceiptExecuted ? '완료' : '미완료',
      
      project.createdAt ? new Date(project.createdAt).toLocaleDateString('ko-KR') : '',
      calculateDDay(project.stage1?.massProductionDate),
      getStatus()
    ];
  });

  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      row.map(field => {
        // 필드에 콤마나 줄바꿈이 있으면 따옴표로 감싸기
        const fieldStr = String(field || '');
        if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      }).join(',')
    )
  ].join('\n');

  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 파일 다운로드
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // URL 해제
  URL.revokeObjectURL(url);
  
  console.log(`📊 CSV 내보내기 완료: ${projects.length}개 프로젝트`);
};

// 엑셀 형식 추출 (CSV)
export const exportProjectsToExcel = (projects, filename = 'projects') => {
  exportProjectsToCSV(projects, filename);
};

// 완료된 프로젝트만 추출
export const exportCompletedProjectsToCSV = (projects, filename = 'completed_projects') => {
  const completedProjects = projects.filter(project => {
    const getFieldCount = (stage) => {
      if (!stage) return { filled: 0, total: 0 };
      const fields = Object.values(stage).filter(value => 
        value !== null && value !== undefined && value !== ''
      );
      const totalFields = Object.keys(stage).length;
      return { filled: fields.length, total: totalFields };
    };

    const stage1Progress = getFieldCount(project.stage1);
    const stage2Progress = getFieldCount(project.stage2);
    const stage3Progress = getFieldCount(project.stage3);

    const stage1Percent = stage1Progress.total > 0 ? (stage1Progress.filled / stage1Progress.total) * 100 : 0;
    const stage2Percent = stage2Progress.total > 0 ? (stage2Progress.filled / stage2Progress.total) * 100 : 0;
    const stage3Percent = stage3Progress.total > 0 ? (stage3Progress.filled / stage3Progress.total) * 100 : 0;
    const overallPercent = (stage1Percent + stage2Percent + stage3Percent) / 3;

    return overallPercent === 100;
  });

  if (completedProjects.length === 0) {
    alert('완료된 프로젝트가 없습니다.');
    return;
  }

  exportProjectsToCSV(completedProjects, filename);
};

export default {
  exportProjectsToCSV,
  exportProjectsToExcel,
  exportCompletedProjectsToCSV
};