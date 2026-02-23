import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getProjectProgress } from '../../types/project';
import { Button } from '../../components/ui';

/**
 * CompletedProjectsPage v1.2 - 완전한 완료 프로젝트 관리 시스템
 * 
 * 주요 기능:
 * - 완료된 프로젝트 필터링
 * - 프로젝트 완료 처리 기능
 * - 완료 통계 및 차트
 * - 엑셀 내보내기 기능
 * - 프로젝트 복원 기능
 * - 성과 분석 대시보드
 */
const CompletedProjectsPage_v1_2 = () => {
  const navigate = useNavigate();
  const { user: profile } = useSupabaseAuth();
  const { projects, completedProjects, moveToCompleted, restoreProject } = useSupabaseProjectStore();

  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('completedDate');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showStats, setShowStats] = useState(true);
  const [processingProjectId, setProcessingProjectId] = useState(null);

  console.log('✅ [v1.2] CompletedProjectsPage rendered with', completedProjects.length, 'completed projects');

  // 완료 가능한 진행중 프로젝트들
  const completableProjects = useMemo(() => {
    return projects.filter(project => {
      const progress = getProjectProgress(project);
      
      // 양산예정일이 실행되었거나 진행률이 100%인 프로젝트
      const hasCompletedMassProduction = project.stage1?.massProductionDateExecuted;
      const hasAllStagesCompleted = progress.overall === 100;
      const hasHighProgress = progress.overall >= 90; // 90% 이상도 완료 후보로
      
      return hasCompletedMassProduction || hasAllStagesCompleted || hasHighProgress;
    });
  }, [projects]);

  // 완료된 프로젝트 통계
  const completedStats = useMemo(() => {
    const total = completedProjects.length;
    const thisYear = completedProjects.filter(p => {
      const completedDate = new Date(p.completed_at || p.created_at);
      return completedDate.getFullYear() === new Date().getFullYear();
    }).length;

    const thisMonth = completedProjects.filter(p => {
      const completedDate = new Date(p.completed_at || p.created_at);
      const now = new Date();
      return completedDate.getFullYear() === now.getFullYear() &&
             completedDate.getMonth() === now.getMonth();
    }).length;

    // 회사별 통계
    const byCompany = {};
    completedProjects.forEach(project => {
      const company = project.stage1?.manufacturer || '기타';
      byCompany[company] = (byCompany[company] || 0) + 1;
    });

    // 평균 완료 기간 계산
    const completionTimes = completedProjects
      .filter(p => p.created_at && p.completed_at)
      .map(p => {
        const start = new Date(p.created_at);
        const end = new Date(p.completed_at);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // 일 단위
      });
    
    const avgCompletionDays = completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    return {
      total,
      thisYear,
      thisMonth,
      byCompany,
      avgCompletionDays,
      completionTimes
    };
  }, [completedProjects]);

  // 회사 목록 추출
  const companies = useMemo(() => {
    const companySet = new Set();
    [...projects, ...completedProjects].forEach(project => {
      const company = project.stage1?.manufacturer;
      if (company) companySet.add(company);
    });
    return Array.from(companySet).sort();
  }, [projects, completedProjects]);

  // 필터링된 완료 프로젝트
  const filteredCompletedProjects = useMemo(() => {
    let filtered = [...completedProjects];

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchLower) ||
        project.model_name?.toLowerCase().includes(searchLower) ||
        project.stage1?.manufacturer?.toLowerCase().includes(searchLower) ||
        project.stage1?.researcher1?.toLowerCase().includes(searchLower)
      );
    }

    // 기간 필터
    if (selectedPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter(project => {
        const completedDate = new Date(project.completed_at || project.created_at);

        switch (selectedPeriod) {
          case 'thisYear':
            return completedDate.getFullYear() === now.getFullYear();
          case 'thisMonth':
            return completedDate.getFullYear() === now.getFullYear() && 
                   completedDate.getMonth() === now.getMonth();
          case 'lastYear':
            return completedDate.getFullYear() === now.getFullYear() - 1;
          case 'last3Months':
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return completedDate >= threeMonthsAgo;
          default:
            return true;
        }
      });
    }

    // 회사 필터
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(project => 
        project.stage1?.manufacturer === selectedCompany
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'completedDate':
          return new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'company':
          return (a.stage1?.manufacturer || '').localeCompare(b.stage1?.manufacturer || '');
        case 'duration':
          const getDuration = (project) => {
            if (!project.created_at || !project.completed_at) return 0;
            return new Date(project.completed_at) - new Date(project.created_at);
          };
          return getDuration(b) - getDuration(a);
        default:
          return new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at);
      }
    });

    return filtered;
  }, [completedProjects, searchTerm, selectedPeriod, selectedCompany, sortBy]);

  // 프로젝트 완료 처리
  const handleCompleteProject = useCallback(async (project) => {
    if (!profile || processingProjectId) return;

    const confirmed = window.confirm(
      `"${project.name}" 프로젝트를 완료 처리하시겠습니까?\n\n` +
      `완료된 프로젝트는 아카이브로 이동되며, 필요시 복원할 수 있습니다.`
    );

    if (!confirmed) return;

    setProcessingProjectId(project.id);

    try {
      const completedProject = {
        ...project,
        completed_at: new Date().toISOString(),
        completed_by: profile.id,
        status: 'completed'
      };

      await moveToCompleted(project.id, completedProject);
      
      console.log('✅ [v1.2] Project completed successfully:', project.id);

    } catch (error) {
      console.error('❌ [v1.2] Error completing project:', error);
      alert('프로젝트 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingProjectId(null);
    }
  }, [profile, processingProjectId, moveToCompleted]);

  // 프로젝트 복원
  const handleRestoreProject = useCallback(async (project) => {
    if (!profile || processingProjectId) return;

    const confirmed = window.confirm(
      `"${project.name}" 프로젝트를 진행중으로 복원하시겠습니까?`
    );

    if (!confirmed) return;

    setProcessingProjectId(project.id);

    try {
      await restoreProject(project.id);
      console.log('✅ [v1.2] Project restored successfully:', project.id);

    } catch (error) {
      console.error('❌ [v1.2] Error restoring project:', error);
      alert('프로젝트 복원 중 오류가 발생했습니다.');
    } finally {
      setProcessingProjectId(null);
    }
  }, [profile, processingProjectId, restoreProject]);

  // 엑셀 내보내기
  const handleExcelExport = useCallback(() => {
    const data = filteredCompletedProjects.map(project => ({
      '프로젝트명': project.name || '',
      '모델명': project.model_name || '',
      '제조사': project.stage1?.manufacturer || '',
      '연구원1': project.stage1?.researcher1 || '',
      '연구원2': project.stage1?.researcher2 || '',
      '출시예정일': project.stage1?.launchDate || '',
      '양산예정일': project.stage1?.massProductionDate || '',
      '완료일': project.completed_at ? new Date(project.completed_at).toLocaleDateString() : '',
      '완료자': project.completed_by || '',
      '생성일': project.created_at ? new Date(project.created_at).toLocaleDateString() : '',
      '프로젝트기간(일)': project.created_at && project.completed_at ?
        Math.ceil((new Date(project.completed_at) - new Date(project.created_at)) / (1000 * 60 * 60 * 24)) : 0
    }));

    // CSV 생성
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        `"${(row[header] || '').toString().replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');

    // 파일 다운로드
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `완료된_프로젝트_목록_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ [v1.2] Excel export completed:', data.length, 'projects');
  }, [filteredCompletedProjects]);

  return (
    <div className="min-h-full bg-gray-50">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">완료된 프로젝트</h1>
            <p className="text-sm text-gray-600 mt-1">
              성공적으로 완료된 프로젝트들을 관리하고 분석하세요
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📊 대시보드
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📁 진행 중 프로젝트
            </Link>
            <Button
              onClick={handleExcelExport}
              disabled={filteredCompletedProjects.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              📊 엑셀 내보내기
            </Button>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">전체 기간</option>
              <option value="thisMonth">이번 달</option>
              <option value="last3Months">최근 3개월</option>
              <option value="thisYear">올해</option>
              <option value="lastYear">작년</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">전체 회사</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="completedDate">완료일순</option>
              <option value="name">이름순</option>
              <option value="company">회사순</option>
              <option value="duration">프로젝트 기간순</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">통계 표시</span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 섹션 */}
        {showStats && (
          <div className="mb-8 space-y-6">
            {/* 주요 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 완료 프로젝트</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {completedStats.total}개
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">올해 완료</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {completedStats.thisYear}개
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">평균 완료 기간</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {completedStats.avgCompletionDays}일
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">완료 가능</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {completableProjects.length}개
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 회사별 완료 통계 */}
            {Object.keys(completedStats.byCompany).length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">회사별 완료 현황</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(completedStats.byCompany)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 12)
                    .map(([company, count]) => (
                    <div key={company} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{count}</div>
                      <div className="text-sm text-gray-600 truncate" title={company}>
                        {company}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 완료 가능한 프로젝트 섹션 */}
        {completableProjects.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                완료 가능한 프로젝트 ({completableProjects.length}개)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                90% 이상 진행되었거나 양산이 완료된 프로젝트들
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {completableProjects.slice(0, 5).map((project) => {
                  const progress = getProjectProgress(project);
                  return (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                          <span>모델: {project.model_name || 'N/A'}</span>
                          <span>진행률: {progress.overall}%</span>
                          <span>회사: {project.stage1?.manufacturer || 'N/A'}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progress.overall}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          보기
                        </Button>
                        <Button
                          onClick={() => handleCompleteProject(project)}
                          disabled={processingProjectId === project.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingProjectId === project.id ? '처리중...' : '완료 처리'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {completableProjects.length > 5 && (
                  <div className="text-center">
                    <Link 
                      to="/projects"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {completableProjects.length - 5}개 더 보기 →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 완료된 프로젝트 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                완료된 프로젝트 ({filteredCompletedProjects.length}개)
              </h3>
              <div className="text-sm text-gray-500">
                총 {completedStats.total}개 중 {filteredCompletedProjects.length}개 표시
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredCompletedProjects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📦</div>
                <p>조건에 맞는 완료된 프로젝트가 없습니다.</p>
              </div>
            ) : (
              filteredCompletedProjects.map((project) => {
                const progress = getProjectProgress(project);
                const completedDate = new Date(project.completed_at || project.created_at);
                const createdDate = new Date(project.created_at);
                const durationDays = Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24));

                return (
                  <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {project.name}
                          </h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            완료됨
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">모델명:</span> {project.model_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">회사:</span> {project.stage1?.manufacturer || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">완료일:</span> {completedDate.toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">소요기간:</span> {durationDays}일
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>완료자: {project.completed_by || 'N/A'}</span>
                          <span>•</span>
                          <span>진행률: {progress.overall}%</span>
                          <span>•</span>
                          <span>생성일: {createdDate.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="ml-4 flex space-x-2">
                        <Button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          상세보기
                        </Button>
                        {profile?.role === 'admin' && (
                          <Button
                            onClick={() => handleRestoreProject(project)}
                            disabled={processingProjectId === project.id}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {processingProjectId === project.id ? '복원 중...' : '복원'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedProjectsPage_v1_2;