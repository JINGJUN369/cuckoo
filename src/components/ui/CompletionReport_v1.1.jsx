import React, { useMemo, useState } from 'react';
import { getProjectProgress } from '../../types/project';
import { calculateProjectDDays } from '../../utils/dDayCalculator_v1.1';
import DDayBadge from './DDayBadge_v1.1';
import { Button } from './index';

/**
 * v1.1 CompletionReport - 완료 프로젝트 리포트 생성 컴포넌트
 * 
 * 주요 기능:
 * - 프로젝트 완료 요약 리포트
 * - 성과 분석 차트
 * - 완료 통계 대시보드
 * - 부서별/제조사별 성과 비교
 * - 월별 완료 추이 분석
 * - 리포트 내보내기 (PDF, Excel)
 */
const CompletionReport_v11 = ({ 
  completedProjects = [],
  period = 'all', // 'thisMonth', 'thisYear', 'all'
  groupBy = 'month', // 'month', 'department', 'manufacturer'
  onExport = null 
}) => {
  console.log('📊 [v1.1] CompletionReport rendering', { 
    projectCount: completedProjects.length, 
    period, 
    groupBy 
  });

  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('completion'); // 'completion', 'duration', 'progress'

  // 기간별 프로젝트 필터링
  const filteredProjects = useMemo(() => {
    if (period === 'all') return completedProjects;

    const now = new Date();
    return completedProjects.filter(project => {
      const completedDate = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
      
      switch (period) {
        case 'thisMonth':
          return completedDate.getFullYear() === now.getFullYear() && 
                 completedDate.getMonth() === now.getMonth();
        case 'thisYear':
          return completedDate.getFullYear() === now.getFullYear();
        case 'lastYear':
          return completedDate.getFullYear() === now.getFullYear() - 1;
        default:
          return true;
      }
    });
  }, [completedProjects, period]);

  // 종합 통계 계산
  const overallStats = useMemo(() => {
    if (filteredProjects.length === 0) {
      return {
        totalProjects: 0,
        averageDuration: 0,
        averageProgress: 0,
        successRate: 100,
        onTimeCompletion: 0,
        totalValue: 0
      };
    }

    let totalDuration = 0;
    let totalProgress = 0;
    let onTimeCount = 0;

    filteredProjects.forEach(project => {
      // 소요기간 계산
      const startDate = new Date(project.createdAt);
      const endDate = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
      const duration = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
      totalDuration += duration;

      // 진행률
      const progress = getProjectProgress(project);
      totalProgress += progress;

      // 정시 완료 체크 (양산예정일 기준)
      if (project.stage1?.massProductionDate) {
        const plannedDate = new Date(project.stage1.massProductionDate);
        const actualDate = new Date(project.completedAt || project.stage1.massProductionDate);
        if (actualDate <= plannedDate) {
          onTimeCount++;
        }
      }
    });

    return {
      totalProjects: filteredProjects.length,
      averageDuration: Math.round(totalDuration / filteredProjects.length),
      averageProgress: Math.round(totalProgress / filteredProjects.length),
      successRate: 100, // 완료된 프로젝트들이므로 100%
      onTimeCompletion: Math.round((onTimeCount / filteredProjects.length) * 100),
      totalValue: filteredProjects.length // 프로젝트 수를 가치로 대용
    };
  }, [filteredProjects]);

  // 그룹별 통계
  const groupedStats = useMemo(() => {
    const groups = {};

    filteredProjects.forEach(project => {
      let groupKey;

      switch (groupBy) {
        case 'month':
          const date = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
          groupKey = date.toISOString().substring(0, 7); // YYYY-MM
          break;
        case 'department':
          groupKey = project.stage1?.department || '미분류';
          break;
        case 'manufacturer':
          groupKey = project.stage1?.manufacturer || '미분류';
          break;
        case 'stage':
          const progress = getProjectProgress(project);
          if (progress === 100) groupKey = '3단계 완료';
          else if (project.stage2 && Object.values(project.stage2).some(v => v)) groupKey = '2단계 완료';
          else groupKey = '1단계 완료';
          break;
        default:
          groupKey = '전체';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: groupKey,
          projects: [],
          totalDuration: 0,
          averageDuration: 0,
          averageProgress: 0,
          count: 0
        };
      }

      groups[groupKey].projects.push(project);
      groups[groupKey].count++;

      // 소요기간 계산
      const startDate = new Date(project.createdAt);
      const endDate = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
      const duration = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
      groups[groupKey].totalDuration += duration;
    });

    // 평균값 계산
    Object.values(groups).forEach(group => {
      group.averageDuration = Math.round(group.totalDuration / group.count);
      group.averageProgress = Math.round(
        group.projects.reduce((sum, p) => sum + getProjectProgress(p), 0) / group.count
      );
    });

    return groups;
  }, [filteredProjects, groupBy]);

  // 상위 성과 프로젝트
  const topPerformingProjects = useMemo(() => {
    return [...filteredProjects]
      .sort((a, b) => {
        const aProgress = getProjectProgress(a);
        const bProgress = getProjectProgress(b);
        
        // 진행률 우선, 그 다음 완료 속도
        if (aProgress !== bProgress) {
          return bProgress - aProgress;
        }
        
        const aDuration = getDuration(a);
        const bDuration = getDuration(b);
        return aDuration - bDuration; // 빠른 완료가 우선
      })
      .slice(0, 5);
  }, [filteredProjects]);

  // 소요기간 계산 헬퍼
  const getDuration = (project) => {
    const startDate = new Date(project.createdAt);
    const endDate = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
    return Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
  };

  // 소요기간 포맷팅
  const formatDuration = (days) => {
    if (days < 30) return `${days}일`;
    if (days < 365) return `${Math.floor(days / 30)}개월`;
    return `${Math.floor(days / 365)}년 ${Math.floor((days % 365) / 30)}개월`;
  };

  // 월별 이름 변환
  const getMonthName = (monthStr) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">리포트 데이터가 없습니다</h3>
        <p className="text-gray-600">선택한 기간에 완료된 프로젝트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 종합 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료 프로젝트</p>
              <p className="text-3xl font-bold text-blue-600">{overallStats.totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 소요기간</p>
              <p className="text-3xl font-bold text-green-600">
                {formatDuration(overallStats.averageDuration)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 진행률</p>
              <p className="text-3xl font-bold text-purple-600">{overallStats.averageProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">정시 완료율</p>
              <p className="text-3xl font-bold text-orange-600">{overallStats.onTimeCompletion}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* 그룹별 통계 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {groupBy === 'month' && '월별 완료 현황'}
            {groupBy === 'department' && '부서별 완료 현황'}
            {groupBy === 'manufacturer' && '제조사별 완료 현황'}
            {groupBy === 'stage' && '단계별 완료 현황'}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '간단히' : '상세히'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(groupedStats)
            .sort((a, b) => {
              if (groupBy === 'month') {
                return b.name.localeCompare(a.name); // 최신 월 우선
              }
              return b.count - a.count; // 개수 많은 순
            })
            .map(group => (
              <div key={group.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {groupBy === 'month' ? getMonthName(group.name) : group.name}
                  </h4>
                  <span className="text-lg font-bold text-blue-600">{group.count}개</span>
                </div>
                
                {showDetails && (
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>평균 소요기간:</span>
                      <span className="font-medium">{formatDuration(group.averageDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>평균 진행률:</span>
                      <span className="font-medium">{group.averageProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 상위 성과 프로젝트 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">우수 완료 프로젝트 TOP 5</h3>
        <div className="space-y-3">
          {topPerformingProjects.map((project, index) => {
            const progress = getProjectProgress(project);
            const duration = getDuration(project);
            
            return (
              <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-600">
                      {project.modelName} | {project.stage1?.researcher1 || '담당자 미정'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">진행률</p>
                    <p className="font-semibold text-green-600">{progress}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">소요기간</p>
                    <p className="font-semibold text-blue-600">{formatDuration(duration)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">완료일</p>
                    <p className="font-semibold text-purple-600">
                      {(project.completedAt || project.stage1?.massProductionDate)?.split('T')[0] || '-'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 분석 (토글) */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 완료 사유 분석 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">완료 사유 분석</h3>
            <div className="space-y-3">
              {Object.entries(
                filteredProjects.reduce((acc, project) => {
                  const reason = project.archiveReason || 'normal_completion';
                  const reasonText = {
                    normal_completion: '정상 완료',
                    early_completion: '조기 완료',
                    forced_completion: '강제 완료',
                    milestone_completion: '마일스톤 완료'
                  }[reason] || reason;
                  
                  acc[reasonText] = (acc[reasonText] || 0) + 1;
                  return acc;
                }, {})
              ).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-gray-700">{reason}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{count}개</span>
                    <span className="text-sm text-gray-500">
                      ({Math.round((count / filteredProjects.length) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 단계별 완료 분포 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">단계별 완료 분포</h3>
            <div className="space-y-3">
              {Object.entries(
                filteredProjects.reduce((acc, project) => {
                  const progress = getProjectProgress(project);
                  if (progress === 100) acc['3단계 (100%)'] = (acc['3단계 (100%)'] || 0) + 1;
                  else if (progress >= 67) acc['2단계 (67%+)'] = (acc['2단계 (67%+)'] || 0) + 1;
                  else acc['1단계 (67% 미만)'] = (acc['1단계 (67% 미만)'] || 0) + 1;
                  return acc;
                }, {})
              ).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-gray-700">{stage}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{count}개</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / filteredProjects.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 내보내기 버튼 */}
      {onExport && (
        <div className="flex justify-center">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onExport('pdf', { 
                data: overallStats, 
                groups: groupedStats, 
                topProjects: topPerformingProjects 
              })}
            >
              📄 PDF 리포트
            </Button>
            <Button
              variant="outline"
              onClick={() => onExport('excel', { 
                data: overallStats, 
                groups: groupedStats, 
                projects: filteredProjects 
              })}
            >
              📊 Excel 리포트
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletionReport_v11;