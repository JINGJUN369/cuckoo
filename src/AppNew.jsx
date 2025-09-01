import React from 'react';
import { useProjectStore } from './hooks/useProjectStore';
import { ProjectProvider } from './hooks/useProjectStore';
import { ToastProvider } from './components/ui/Toast';
import Dashboard from './pages/Dashboard/Dashboard';
import ProjectList from './pages/Projects/ProjectList';
import ProjectDetail from './pages/Projects/ProjectDetail';
import ProjectDashboard from './pages/Projects/ProjectDashboard';
import Calendar from './pages/Calendar/Calendar';
import CompletedProjects from './pages/Projects/CompletedProjects';
import './index.css';

const AppRouter = () => {
  const { state } = useProjectStore();
  const { ui } = state;

  const renderCurrentView = () => {
    switch (ui.currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'list':
        return <ProjectList />;
      case 'project-dashboard':
        return <ProjectDashboard />;
      case 'project':
        return <ProjectDetail />;
      case 'calendar':
        return <Calendar />;
      case 'completed':
        return <CompletedProjects />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderCurrentView()}
      </div>
    </div>
  );
};

function AppNew() {
  return (
    <div className="App">
      <ToastProvider>
        <ProjectProvider>
          <AppRouter />
        </ProjectProvider>
      </ToastProvider>
    </div>
  );
}

export default AppNew;