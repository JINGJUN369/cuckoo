import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSupabaseProjectStore } from '../../hooks/useSupabaseProjectStore';
import { Button } from '../../components/ui';
import { getProjectProgress } from '../../types/project';
import NewProjectModal_v11 from './components/NewProjectModal_v1.1';
import ProjectCard_v11 from '../../components/ui/ProjectCard_v1.1';
import * as XLSX from 'xlsx';

/**
 * ProjectListPage v1.2 - 프로젝트 목록 페이지 (localStorage 기반)
 */
const ProjectListPage_v1_2 = () => {
  const navigate = useNavigate();
  const { user: profile } = useSupabaseAuth();
  const { projects, createProject, deleteProject, moveToCompleted, setCurrentView } = useSupabaseProjectStore();
  
  console.log('📁 [v1.2] ProjectListPage rendered');
  console.log('📁 [v1.2] Current projects count:', projects?.length || 0);
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('updated');
  const [filterBy, setFilterBy] = useState('all');

  // 관리자 여부 확인
  const isAdmin = profile?.role === 'admin' || profile?.email === 'admin@cuckoo.co.kr';

  // 진행률 계산 (표준화된 함수 사용)
  const calculateProgress = (project) => {
    if (!project) return 0;
    const progress = getProjectProgress(project);
    return progress.overall;
  };

  // D-Day 계산
  const calculateDDays = (project) => {
    const targetDate = project.stage1?.massProductionDate;
    if (!targetDate) return 999;
    
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // 필터링 및 정렬된 프로젝트 목록
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // 필터링
    if (filterBy !== 'all') {
      filtered = projects.filter(project => {
        const progress = calculateProgress(project);
        switch (filterBy) {
          case 'planning':
            return progress < 30;
          case 'in_progress':
            return progress >= 30 && progress < 90;
          case 'near_completion':
            return progress >= 90;
          default:
            return true;
        }
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'progress':
          return calculateProgress(b) - calculateProgress(a);
        case 'dday':
          const aDDays = calculateDDays(a);
          const bDDays = calculateDDays(b);
          return aDDays - bDDays;
        case 'updated':
        default:
          return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      }
    });

    return filtered;
  }, [projects, filterBy, sortBy]);

  // 프로젝트 추가 핸들러
  const handleAddProject = async (projectData) => {
    console.log('📝 [v1.2] ProjectListPage: Creating project', projectData);
    try {
      const result = await createProject(projectData);
      console.log('✅ [v1.2] ProjectListPage: Project created successfully', result);
      setIsNewProjectModalOpen(false);
      return result;
    } catch (error) {
      console.error('❌ [v1.2] ProjectListPage: Project creation failed', error);
      throw error;
    }
  };

  // 프로젝트 클릭 핸들러
  const handleProjectClick = (project) => {
    navigate(`/projects/${project.id}`);
  };

  // 관리자 전용: 프로젝트 삭제 핸들러
  const handleDeleteProject = async (project) => {
    try {
      console.log('🗑️ [Admin] Deleting project:', project.name);
      const result = await deleteProject(project.id);
      
      if (result.success) {
        console.log('✅ [Admin] Project deleted successfully:', project.name);
        // 성공 알림은 이미 ProjectCard에서 처리
      } else {
        console.error('❌ [Admin] Project deletion failed:', result.error);
        alert('프로젝트 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('❌ [Admin] Project deletion error:', error);
      alert('프로젝트 삭제 중 오류가 발생했습니다.');
    }
  };

  // 관리자 전용: 프로젝트 완료 처리 핸들러
  const handleArchiveProject = async (project) => {
    try {
      console.log('📁 [Admin] Archiving project:', project.name);
      
      const completionData = {
        completedAt: new Date().toISOString(),
        completedBy: profile?.name || '관리자',
        finalProgress: calculateProgress(project),
        archiveReason: '관리자에 의한 완료 처리'
      };
      
      const result = await moveToCompleted(project.id, completionData);
      
      if (result.success) {
        console.log('✅ [Admin] Project archived successfully:', project.name);
        alert(`"${project.name}" 프로젝트가 완료 처리되었습니다.`);
        
        // 완료 프로젝트 페이지로 이동
        console.log('🚀 Navigating to completed projects view...');
        setCurrentView('completed');
      } else {
        console.error('❌ [Admin] Project archiving failed:', result.error);
        alert('프로젝트 완료 처리에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('❌ [Admin] Project archiving error:', error);
      alert('프로젝트 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 진행률 색상
  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    if (progress < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // D-Day 색상
  const getDDayColor = (ddays) => {
    if (ddays < 0) return 'text-red-600';
    if (ddays <= 7) return 'text-orange-600';
    if (ddays <= 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Excel 추출 함수
  const handleExportToExcel = () => {
    if (!projects || projects.length === 0) {
      alert('추출할 프로젝트가 없습니다.');
      return;
    }

    // 진행 중인 프로젝트만 필터링 (완료된 프로젝트 제외)
    const inProgressProjects = projects.filter(project => {
      const progress = calculateProgress(project);
      return progress < 100;
    });

    if (inProgressProjects.length === 0) {
      alert('진행 중인 프로젝트가 없습니다.');
      return;
    }

    // Excel 데이터 준비
    const excelData = inProgressProjects.map((project, index) => {
      const progress = getProjectProgress(project);
      const ddays = calculateDDays(project);
      
      return {
        '번호': index + 1,
        '프로젝트명': project.name || '',
        '모델명': project.stage1?.modelName || '모델명 미정',
        '전체진행률': `${progress.overall}%`,
        '1단계진행률': `${progress.stage1}%`,
        '2단계진행률': `${progress.stage2}%`,
        '3단계진행률': `${progress.stage3}%`,
        'D-Day': ddays < 0 ? `D+${Math.abs(ddays)}` : ddays === 0 ? 'D-Day' : `D-${ddays}`,
        
        // Stage 1 - 기본정보
        '제품군': project.stage1?.productGroup || '',
        '제조사': project.stage1?.manufacturer || '',
        '벤더사': project.stage1?.vendor || '',
        '출시예정일': project.stage1?.launchDate || '',
        '양산예정일': project.stage1?.massProductionDate || '',
        '프로젝트매니저': project.stage1?.projectManager || '',
        
        // Stage 2 - 생산준비
        '파일럿생산일': project.stage2?.pilotProductionDate || '',
        '파일럿생산완료': project.stage2?.pilotProductionExecuted ? 'Y' : 'N',
        '기술이전일': project.stage2?.techTransferDate || '',
        '기술이전완료': project.stage2?.techTransferExecuted ? 'Y' : 'N',
        '설치주체': project.stage2?.installationEntity || '',
        '서비스주체': project.stage2?.serviceEntity || '',
        '생산라인설치일': project.stage2?.productionLineInstallDate || '',
        '생산라인설치완료': project.stage2?.productionLineInstallExecuted ? 'Y' : 'N',
        '생산준비완료일': project.stage2?.productionReadyDate || '',
        '생산준비완료': project.stage2?.productionReadyExecuted ? 'Y' : 'N',
        
        // Stage 3 - 양산준비
        '최초양산일': project.stage3?.initialProductionDate || '',
        '최초양산완료': project.stage3?.initialProductionExecuted ? 'Y' : 'N',
        'BOM매니저': project.stage3?.bomManager || '',
        'BOM구성일': project.stage3?.bomSetupDate || '',
        'BOM구성완료': project.stage3?.bomSetupExecuted ? 'Y' : 'N',
        '단가등록일': project.stage3?.priceRegistrationDate || '',
        '단가등록완료': project.stage3?.priceRegistrationExecuted ? 'Y' : 'N',
        '부품입고일': project.stage3?.partsReceiptDate || '',
        '부품입고완료': project.stage3?.partsReceiptExecuted ? 'Y' : 'N',
        '품질검증일': project.stage3?.qualityValidationDate || '',
        '품질검증완료': project.stage3?.qualityValidationExecuted ? 'Y' : 'N',
        '양산준비완료일': project.stage3?.massProductionReadyDate || '',
        '양산준비완료': project.stage3?.massProductionReadyExecuted ? 'Y' : 'N',
        
        '생성일': new Date(project.created_at).toLocaleDateString(),
        '수정일': new Date(project.updated_at || project.created_at).toLocaleDateString()
      };
    });

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // 열 너비 설정
    const colWidths = [
      { wch: 5 },  // 번호
      { wch: 20 }, // 프로젝트명
      { wch: 15 }, // 모델명
      { wch: 12 }, // 전체진행률
      { wch: 12 }, // 1단계진행률
      { wch: 12 }, // 2단계진행률
      { wch: 12 }, // 3단계진행률
      { wch: 10 }, // D-Day
      { wch: 15 }, // 제품군
      { wch: 15 }, // 제조사
      { wch: 15 }, // 벤더사
      { wch: 15 }, // 출시예정일
      { wch: 15 }, // 양산예정일
      { wch: 15 }, // 프로젝트매니저
      { wch: 15 }, // 파일럿생산일
      { wch: 12 }, // 파일럿생산완료
      { wch: 15 }, // 기술이전일
      { wch: 12 }, // 기술이전완료
      { wch: 15 }, // 설치주체
      { wch: 15 }, // 서비스주체
      { wch: 20 }, // 생산라인설치일
      { wch: 18 }, // 생산라인설치완료
      { wch: 18 }, // 생산준비완료일
      { wch: 15 }, // 생산준비완료
      { wch: 15 }, // 최초양산일
      { wch: 15 }, // 최초양산완료
      { wch: 15 }, // BOM매니저
      { wch: 15 }, // BOM구성일
      { wch: 12 }, // BOM구성완료
      { wch: 15 }, // 단가등록일
      { wch: 12 }, // 단가등록완료
      { wch: 15 }, // 부품입고일
      { wch: 12 }, // 부품입고완료
      { wch: 15 }, // 품질검증일
      { wch: 12 }, // 품질검증완료
      { wch: 18 }, // 양산준비완료일
      { wch: 15 }, // 양산준비완료
      { wch: 12 }, // 생성일
      { wch: 12 }  // 수정일
    ];
    
    ws['!cols'] = colWidths;
    
    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, '진행중인프로젝트');
    
    // 파일명 생성 (현재 날짜 포함)
    const today = new Date();
    const dateStr = today.getFullYear() + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    const fileName = `프로젝트목록_${dateStr}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(wb, fileName);
    
    console.log(`📊 Excel export completed: ${inProgressProjects.length} projects exported`);
  };

  return (
    <div className="min-h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 목록</h1>
          <div className="flex space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📊 대시보드
            </Link>
            <Link
              to="/calendar"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📅 달력 보기
            </Link>
            <button
              onClick={handleExportToExcel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📊 엑셀 추출
            </button>
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              ➕ 새 프로젝트
            </Button>
          </div>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">필터:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">전체</option>
                <option value="planning">기획 단계 (&lt;30%)</option>
                <option value="in_progress">진행 중 (30-90%)</option>
                <option value="near_completion">완료 임박 (&gt;90%)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="updated">최근 수정</option>
                <option value="name">프로젝트명</option>
                <option value="progress">진행률</option>
                <option value="dday">D-Day</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            총 {filteredAndSortedProjects.length}개 프로젝트
          </div>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      <div className="p-6">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
            <p className="text-gray-600 mb-4">새로운 프로젝트를 생성해보세요.</p>
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              ➕ 첫 번째 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard_v11
                key={project.id}
                project={project}
                onClick={handleProjectClick}
                onView={() => navigate(`/projects/${project.id}`)}
                onEdit={() => navigate(`/projects/${project.id}/edit`)}
                onDelete={isAdmin ? handleDeleteProject : undefined}
                onArchive={isAdmin ? handleArchiveProject : undefined}
                showActions={true}
                isAdmin={isAdmin}
                mode="grid"
                className="h-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* 새 프로젝트 모달 */}
      {isNewProjectModalOpen && (
        <NewProjectModal_v11
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onSubmit={handleAddProject}
        />
      )}
    </div>
  );
};

export default ProjectListPage_v1_2;