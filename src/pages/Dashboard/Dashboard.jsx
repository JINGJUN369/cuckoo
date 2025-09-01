import React, { useMemo } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress } from '../../types/project';
import { Button, LoadingSpinner } from '../../components/ui';
import StatCard from './components/StatCard';
import ProgressChart from './components/ProgressChart';
import RecentActivity from './components/RecentActivity';
import UpcomingTasks from './components/UpcomingTasks';
import OverdueAlerts from './components/OverdueAlerts';

const Dashboard = () => {
  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { projects, ui } = state;

  // Move all hooks to the top before any conditional returns
  // Memoize expensive calculations
  const { activeProjects, totalProjects, avgProgress } = useMemo(() => {
    const active = projects.filter(p => !p.completed);
    const total = active.length;
    const avg = total > 0 
      ? Math.round(active.reduce((sum, project) => sum + getProjectProgress(project), 0) / total)
      : 0;
    return { activeProjects: active, totalProjects: total, avgProgress: avg };
  }, [projects]);

  // Memoize date fields array to avoid recreation
  const dateFields = useMemo(() => [
    // 1단계
    { stage: 'stage1', field: 'launchDate', name: '출시예정일' },
    { stage: 'stage1', field: 'massProductionDate', name: '양산예정일' },
    // 2단계
    { stage: 'stage2', field: 'pilotProductionDate', name: '파일럿생산예정일' },
    { stage: 'stage2', field: 'pilotReceiveDate', name: '파일럿수령예정일' },
    { stage: 'stage2', field: 'techTransferDate', name: '기술이전예정일' },
    { stage: 'stage2', field: 'trainingDate', name: '교육예정일' },
    { stage: 'stage2', field: 'manualUploadDate', name: '사용설명서업로드예정일' },
    { stage: 'stage2', field: 'techGuideUploadDate', name: '기술교본업로드예정일' },
    // 3단계
    { stage: 'stage3', field: 'initialProductionDate', name: '최초양산예정일' },
    { stage: 'stage3', field: 'firstOrderDate', name: '1차부품발주예정일' },
    { stage: 'stage3', field: 'bomTargetDate', name: 'BOM구성목표예정일' },
    { stage: 'stage3', field: 'priceTargetDate', name: '단가등록목표예정일자' },
    { stage: 'stage3', field: 'partsDeliveryDate', name: '부품입고예정일' }
  ], []);

  // Memoize overdue tasks calculation
  const overdueTasks = useMemo(() => {
    const today = new Date();
    const tasks = [];
    
    projects.forEach(project => {
      dateFields.forEach(({ stage, field, name }) => {
        const executed = project[stage][field + 'Executed'];
        const dateValue = project[stage][field];
        if (dateValue && !executed) {
          const taskDate = new Date(dateValue);
          const daysDiff = Math.ceil((today - taskDate) / (1000 * 60 * 60 * 24));
          
          // 지연된 작업 (날짜가 지났지만 실행 완료되지 않음)
          if (taskDate < today) {
            tasks.push({
              projectId: project.id,
              projectName: project.name,
              taskName: name,
              date: dateValue,
              daysOverdue: daysDiff,
              type: 'overdue',
              priority: 'high'
            });
          }
          // 당일 또는 임박한 작업 (1일 이내)
          else if (daysDiff >= -1) {
            tasks.push({
              projectId: project.id,
              projectName: project.name,
              taskName: name,
              date: dateValue,
              daysOverdue: daysDiff,
              type: daysDiff === 0 ? 'today' : 'upcoming',
              priority: daysDiff === 0 ? 'high' : 'medium'
            });
          }
        }
        // 날짜는 설정되었지만 아직 미래인 경우도 체크 필요 여부 알림 (3일 이내)
        else if (dateValue && !executed) {
          const taskDate = new Date(dateValue);
          const daysDiff = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 3 && daysDiff > 1) {
            tasks.push({
              projectId: project.id,
              projectName: project.name,
              taskName: name,
              date: dateValue,
              daysOverdue: -daysDiff,
              type: 'reminder',
              priority: 'low'
            });
          }
        }
      });
    });
    
    return tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [projects, dateFields]);
  const completedProjectsCount = state.completedProjects.length;

  // Memoize progress ranges calculation
  const progressRanges = useMemo(() => {
    const ranges = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0
    };

    activeProjects.forEach(project => {
      const progress = getProjectProgress(project);
      if (progress <= 25) ranges['0-25%']++;
      else if (progress <= 50) ranges['26-50%']++;
      else if (progress <= 75) ranges['51-75%']++;
      else ranges['76-100%']++;
    });

    return ranges;
  }, [activeProjects]);

  // Memoize upcoming deadlines calculation
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = [];

    // Use subset of important date fields for upcoming deadlines
    const importantDateFields = [
      { stage: 'stage1', field: 'launchDate', name: '출시예정일' },
      { stage: 'stage1', field: 'massProductionDate', name: '양산예정일' },
      { stage: 'stage2', field: 'pilotProductionDate', name: '파일럿생산예정일' },
      { stage: 'stage2', field: 'techTransferDate', name: '기술이전예정일' },
      { stage: 'stage3', field: 'firstOrderDate', name: '1차부품발주예정일' }
    ];

    projects.forEach(project => {
      importantDateFields.forEach(({ stage, field, name }) => {
        const executed = project[stage][field + 'Executed'];
        const dateValue = project[stage][field];
        if (dateValue && !executed) {
          const taskDate = new Date(dateValue);
          if (taskDate >= today && taskDate <= nextWeek) {
            upcoming.push({
              projectId: project.id,
              projectName: project.name,
              taskName: name,
              date: dateValue,
              daysUntil: Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24))
            });
          }
        }
      });
    });

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [projects]);

  const handleProjectClick = (projectId) => {
    console.log('Dashboard handleProjectClick called with projectId:', projectId);
    const project = projects.find(p => p.id === projectId);
    console.log('Found project:', project);
    if (project) {
      setSelectedProject(project);
      setCurrentView('project-dashboard');
      console.log('Navigating to project-dashboard with project:', project.name);
    } else {
      console.error('Project not found with id:', projectId);
    }
  };

  // Conditional return after all hooks
  if (ui.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">프로젝트 진행 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('completed')}
          >
            📦 완료 프로젝트
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('calendar')}
          >
            📅 캘린더
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('list')}
          >
            프로젝트 목록
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setCurrentView('create')}
          >
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="활성 프로젝트"
          value={totalProjects}
          icon="📊"
          color="blue"
          trend={totalProjects > 0 ? '+12%' : null}
        />
        <StatCard
          title="완료된 프로젝트"
          value={completedProjectsCount}
          icon="✅"
          color="green"
          trend={completedProjectsCount > 0 ? '+8%' : null}
        />
        <StatCard
          title="평균 진행률"
          value={`${avgProgress}%`}
          icon="📈"
          color="indigo"
          trend={avgProgress > 50 ? '+5%' : null}
        />
        <StatCard
          title="지연된 작업"
          value={overdueTasks.length}
          icon="⚠️"
          color="red"
          trend={overdueTasks.length > 0 ? `${overdueTasks.length}건` : null}
        />
      </div>

      {/* Alerts Section */}
      {overdueTasks.length > 0 && (
        <OverdueAlerts 
          tasks={overdueTasks.slice(0, 5)} 
          onProjectClick={handleProjectClick}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">프로젝트 진행률 분포</h3>
          <ProgressChart data={progressRanges} />
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">다가오는 마감일</h3>
          <UpcomingTasks 
            tasks={upcomingDeadlines.slice(0, 5)} 
            onProjectClick={handleProjectClick}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 활동</h3>
        <RecentActivity 
          projects={activeProjects.slice(0, 6)} 
          onProjectClick={handleProjectClick}
        />
      </div>
    </div>
  );
};

export default Dashboard;