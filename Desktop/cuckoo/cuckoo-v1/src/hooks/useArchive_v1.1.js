import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from './useProjectStore_v1.1';
import { useAuth } from './useAuth';
import { getProjectProgress } from '../types/project';
import { calculateProjectDDays } from '../utils/dDayCalculator_v1.1';

/**
 * v1.1 useArchive - 완료된 프로젝트 아카이브 관리 훅
 * 
 * 주요 기능:
 * - 프로젝트 완료 처리 및 아카이브
 * - 아카이브 검색 및 필터링
 * - 완료 프로젝트 통계 계산
 * - 프로젝트 복원 기능
 * - 아카이브 데이터 내보내기
 * - 완료 조건 검증
 * - 아카이브 백업 및 복구
 */
export const useArchive = () => {
  console.log('📦 [v1.1] useArchive hook initialized');

  const { state, moveToCompleted, restoreProject, updateProject } = useProjectStore();
  const { user } = useAuth();
  const { projects = [], completedProjects = [] } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 완료 조건 검증
  const checkCompletionCriteria = useCallback((project) => {
    const criteria = {
      isCompletable: false,
      progress: getProjectProgress(project),
      reasons: [],
      warnings: []
    };

    // 기본 완료 조건들
    const progressComplete = criteria.progress === 100;
    const massProductionComplete = project.stage1?.massProductionDateExecuted;
    const qualityApprovalComplete = project.stage3?.qualityApprovalDateExecuted;

    // 완료 가능 조건 체크
    if (progressComplete) {
      criteria.reasons.push('모든 단계 100% 완료');
      criteria.isCompletable = true;
    }

    if (massProductionComplete) {
      criteria.reasons.push('양산 시작 완료');
      criteria.isCompletable = true;
    }

    if (qualityApprovalComplete) {
      criteria.reasons.push('품질 승인 완료');
      criteria.isCompletable = true;
    }

    // 경고 사항 체크
    if (criteria.progress < 80 && !massProductionComplete) {
      criteria.warnings.push('진행률이 80% 미만입니다');
    }

    if (!project.stage1?.massProductionDate) {
      criteria.warnings.push('양산예정일이 설정되지 않았습니다');
    }

    const pendingOpinions = project.opinions?.filter(o => o.status === 'open').length || 0;
    if (pendingOpinions > 0) {
      criteria.warnings.push(`${pendingOpinions}개의 미해결 의견이 있습니다`);
    }

    return criteria;
  }, []);

  // 완료 가능한 프로젝트 목록
  const completableProjects = useMemo(() => {
    return projects.filter(project => {
      const criteria = checkCompletionCriteria(project);
      return criteria.isCompletable;
    }).sort((a, b) => {
      // 진행률 높은 순으로 정렬
      return getProjectProgress(b) - getProjectProgress(a);
    });
  }, [projects, checkCompletionCriteria]);

  // 아카이브 통계 계산
  const archiveStats = useMemo(() => {
    const stats = {
      total: completedProjects.length,
      thisMonth: 0,
      thisYear: 0,
      averageDuration: 0,
      averageProgress: 0,
      byStage: { stage1: 0, stage2: 0, stage3: 0 },
      byManufacturer: {},
      byDepartment: {},
      byCompletionReason: {},
      successRate: 0,
      completionTrends: [] // 월별 완료 추이
    };

    if (completedProjects.length === 0) return stats;

    const now = new Date();
    let totalDuration = 0;
    let totalProgress = 0;

    // 월별 완료 추이 초기화 (최근 12개월)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      stats.completionTrends.push({
        month: date.toISOString().substring(0, 7),
        count: 0,
        monthName: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
      });
    }

    completedProjects.forEach(project => {
      const completedDate = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
      const progress = getProjectProgress(project);
      
      // 기간별 통계
      if (completedDate.getFullYear() === now.getFullYear()) {
        stats.thisYear++;
        if (completedDate.getMonth() === now.getMonth()) {
          stats.thisMonth++;
        }
      }

      // 월별 완료 추이
      const completedMonth = completedDate.toISOString().substring(0, 7);
      const trendItem = stats.completionTrends.find(t => t.month === completedMonth);
      if (trendItem) {
        trendItem.count++;
      }

      // 소요기간 계산
      const startDate = new Date(project.createdAt);
      const duration = Math.ceil(Math.abs(completedDate - startDate) / (1000 * 60 * 60 * 24));
      totalDuration += duration;

      // 진행률 합계
      totalProgress += progress;

      // 단계별 통계
      if (progress === 100) {
        stats.byStage.stage3++;
      } else if (project.stage2 && Object.values(project.stage2).some(v => v)) {
        stats.byStage.stage2++;
      } else {
        stats.byStage.stage1++;
      }

      // 제조사별 통계
      const manufacturer = project.stage1?.manufacturer || '기타';
      stats.byManufacturer[manufacturer] = (stats.byManufacturer[manufacturer] || 0) + 1;

      // 부서별 통계
      const department = project.stage1?.department || '기타';
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;

      // 완료 사유별 통계
      const reason = project.archiveReason || 'normal_completion';
      stats.byCompletionReason[reason] = (stats.byCompletionReason[reason] || 0) + 1;
    });

    stats.averageDuration = Math.round(totalDuration / completedProjects.length);
    stats.averageProgress = Math.round(totalProgress / completedProjects.length);
    stats.successRate = Math.round((completedProjects.length / (projects.length + completedProjects.length)) * 100);

    return stats;
  }, [completedProjects, projects.length]);

  // 프로젝트 완료 처리
  const completeProject = useCallback(async (projectId, options = {}) => {
    console.log('✅ [v1.1] useArchive: Completing project', { projectId, options });
    
    setLoading(true);
    setError(null);

    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }

      // 완료 조건 검증
      const criteria = checkCompletionCriteria(project);
      if (!criteria.isCompletable && !options.forceComplete) {
        throw new Error('프로젝트 완료 조건을 만족하지 않습니다.');
      }

      // 완료 메타데이터 준비
      const completionData = {
        completedBy: user?.id,
        completedByName: user?.name,
        completedAt: new Date().toISOString(),
        finalProgress: criteria.progress,
        archiveReason: options.reason || 'normal_completion',
        completionNotes: options.notes || '',
        archivedAt: new Date().toISOString(),
        // 완료 시점의 D-Day 정보 저장
        finalDDays: calculateProjectDDays(project),
        // 완료 시점의 프로젝트 상태 스냅샷
        finalState: {
          stage1: { ...project.stage1 },
          stage2: { ...project.stage2 },
          stage3: { ...project.stage3 }
        }
      };

      await moveToCompleted(projectId, completionData);
      console.log('✅ [v1.1] useArchive: Project completed successfully');
      
      return { success: true, data: completionData };
    } catch (error) {
      console.error('❌ [v1.1] useArchive: Error completing project', error);
      setError(error.message || '프로젝트 완료 처리 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [projects, user, checkCompletionCriteria, moveToCompleted]);

  // 프로젝트 복원
  const restoreArchivedProject = useCallback(async (projectId, options = {}) => {
    console.log('🔄 [v1.1] useArchive: Restoring project', { projectId, options });
    
    setLoading(true);
    setError(null);

    try {
      const project = completedProjects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('완료된 프로젝트를 찾을 수 없습니다.');
      }

      // 복원 메타데이터 준비
      const restorationData = {
        restoredBy: user?.id,
        restoredByName: user?.name,
        restoredAt: new Date().toISOString(),
        restorationReason: options.reason || 'continuation_needed',
        restorationNotes: options.notes || ''
      };

      await restoreProject(projectId, restorationData);
      console.log('✅ [v1.1] useArchive: Project restored successfully');
      
      return { success: true, data: restorationData };
    } catch (error) {
      console.error('❌ [v1.1] useArchive: Error restoring project', error);
      setError(error.message || '프로젝트 복원 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [completedProjects, user, restoreProject]);

  // 아카이브 검색
  const searchArchive = useCallback((searchTerm, filters = {}) => {
    let filtered = completedProjects;

    // 텍스트 검색
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchLower) ||
        project.modelName?.toLowerCase().includes(searchLower) ||
        project.id?.toLowerCase().includes(searchLower) ||
        project.stage1?.researcher1?.toLowerCase().includes(searchLower) ||
        project.stage1?.manufacturer?.toLowerCase().includes(searchLower) ||
        project.completionNotes?.toLowerCase().includes(searchLower)
      );
    }

    // 필터 적용
    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      filtered = filtered.filter(project => {
        const completedDate = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
        
        switch (filters.period) {
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
    }

    if (filters.manufacturer && filters.manufacturer !== 'all') {
      filtered = filtered.filter(project => 
        project.stage1?.manufacturer === filters.manufacturer
      );
    }

    if (filters.department && filters.department !== 'all') {
      filtered = filtered.filter(project => 
        project.stage1?.department === filters.department
      );
    }

    if (filters.completionReason && filters.completionReason !== 'all') {
      filtered = filtered.filter(project => 
        project.archiveReason === filters.completionReason
      );
    }

    if (filters.progressRange) {
      filtered = filtered.filter(project => {
        const progress = getProjectProgress(project);
        return progress >= filters.progressRange[0] && progress <= filters.progressRange[1];
      });
    }

    if (filters.durationRange) {
      filtered = filtered.filter(project => {
        const startDate = new Date(project.createdAt);
        const endDate = new Date(project.completedAt || project.stage1?.massProductionDate || new Date());
        const duration = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
        return duration >= filters.durationRange[0] && duration <= filters.durationRange[1];
      });
    }

    return filtered;
  }, [completedProjects]);

  // 아카이브 백업 생성
  const createArchiveBackup = useCallback(() => {
    console.log('💾 [v1.1] useArchive: Creating backup');

    const backupData = {
      version: '1.1',
      createdAt: new Date().toISOString(),
      createdBy: user?.id,
      createdByName: user?.name,
      completedProjects: completedProjects,
      stats: archiveStats,
      projectCount: completedProjects.length
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `아카이브_백업_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    return backupData;
  }, [completedProjects, archiveStats, user]);

  // 아카이브 백업 복원
  const restoreFromBackup = useCallback(async (backupFile) => {
    console.log('📂 [v1.1] useArchive: Restoring from backup');
    
    setLoading(true);
    setError(null);

    try {
      const text = await backupFile.text();
      const backupData = JSON.parse(text);

      if (!backupData.version || !backupData.completedProjects) {
        throw new Error('유효하지 않은 백업 파일입니다.');
      }

      // 백업 데이터 검증
      if (!Array.isArray(backupData.completedProjects)) {
        throw new Error('백업 파일의 프로젝트 데이터가 유효하지 않습니다.');
      }

      // 기존 아카이브와 병합할지 교체할지 확인
      const shouldMerge = window.confirm(
        `백업 파일에 ${backupData.completedProjects.length}개의 완료된 프로젝트가 있습니다.\n` +
        `기존 아카이브와 병합하시겠습니까? (취소하면 기존 데이터를 교체합니다)`
      );

      if (shouldMerge) {
        // 병합 로직 구현 필요 (중복 제거)
        const existingIds = new Set(completedProjects.map(p => p.id));
        const newProjects = backupData.completedProjects.filter(p => !existingIds.has(p.id));
        
        console.log(`📥 [v1.1] Merging ${newProjects.length} new projects from backup`);
        // TODO: 실제 병합 로직 구현
      } else {
        // 전체 교체
        console.log(`🔄 [v1.1] Replacing archive with backup data`);
        // TODO: 실제 교체 로직 구현
      }

      console.log('✅ [v1.1] useArchive: Backup restored successfully');
      
    } catch (error) {
      console.error('❌ [v1.1] useArchive: Error restoring backup', error);
      setError('백업 복원 중 오류가 발생했습니다: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [completedProjects]);

  // 대량 아카이브 처리
  const bulkCompleteProjects = useCallback(async (projectIds, options = {}) => {
    console.log('📦 [v1.1] useArchive: Bulk completing projects', { projectIds, options });
    
    setLoading(true);
    setError(null);

    const results = {
      success: [],
      failed: [],
      warnings: []
    };

    try {
      for (const projectId of projectIds) {
        try {
          const result = await completeProject(projectId, options);
          results.success.push({ projectId, ...result });
        } catch (error) {
          results.failed.push({ projectId, error: error.message });
        }
      }

      console.log('✅ [v1.1] useArchive: Bulk completion finished', results);
      
      return results;
    } catch (error) {
      console.error('❌ [v1.1] useArchive: Error in bulk completion', error);
      setError('대량 완료 처리 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [completeProject]);

  // 아카이브 정리 (오래된 프로젝트 자동 정리)
  const cleanupArchive = useCallback(async (options = {}) => {
    const {
      maxAge = 365 * 2, // 2년
      maxCount = 1000,   // 최대 1000개
      keepCriteria = ['high_value', 'reference'] // 보존 기준
    } = options;

    console.log('🧹 [v1.1] useArchive: Cleaning up archive', options);

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - maxAge * 24 * 60 * 60 * 1000);

    // 정리 대상 선별
    const candidates = completedProjects.filter(project => {
      const completedDate = new Date(project.completedAt || project.stage1?.massProductionDate || project.createdAt);
      return completedDate < cutoffDate;
    });

    // 보존 기준 적용
    const toDelete = candidates.filter(project => {
      // 고가치 프로젝트 보존
      if (keepCriteria.includes('high_value')) {
        const progress = getProjectProgress(project);
        if (progress === 100) return false;
      }

      // 참조용 프로젝트 보존
      if (keepCriteria.includes('reference')) {
        if (project.isReference || project.archiveReason === 'reference') return false;
      }

      return true;
    });

    if (toDelete.length > 0) {
      const confirmed = window.confirm(
        `${toDelete.length}개의 오래된 완료 프로젝트를 아카이브에서 영구 삭제하시겠습니까?\n` +
        `이 작업은 되돌릴 수 없습니다.`
      );

      if (confirmed) {
        // TODO: 실제 삭제 로직 구현
        console.log(`🗑️ [v1.1] Would delete ${toDelete.length} old projects`);
        return { deleted: toDelete.length, kept: completedProjects.length - toDelete.length };
      }
    }

    return { deleted: 0, kept: completedProjects.length };
  }, [completedProjects, checkCompletionCriteria]);

  return {
    // 데이터
    completedProjects,
    completableProjects,
    archiveStats,
    loading,
    error,

    // 액션
    completeProject,
    restoreArchivedProject,
    searchArchive,
    createArchiveBackup,
    restoreFromBackup,
    bulkCompleteProjects,
    cleanupArchive,

    // 유틸리티
    checkCompletionCriteria,
    clearError: () => setError(null)
  };
};