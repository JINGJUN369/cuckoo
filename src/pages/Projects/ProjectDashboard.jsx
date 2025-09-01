import React from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress, getStageProgress } from '../../types/project';
import { Button } from '../../components/ui';

const ProjectDashboard = () => {
  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { selectedProject } = state;
  
  console.log('ProjectDashboard rendered with selectedProject:', selectedProject?.name || 'None');

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            프로젝트를 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            선택된 프로젝트가 없거나 삭제되었습니다
          </p>
          <Button onClick={() => setCurrentView('list')}>
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const overallProgress = getProjectProgress(selectedProject);
  const stage1Progress = getStageProgress(selectedProject, 'stage1');
  const stage2Progress = getStageProgress(selectedProject, 'stage2');
  const stage3Progress = getStageProgress(selectedProject, 'stage3');

  // D-Day 계산
  const calculateDDay = () => {
    const massProductionDate = selectedProject.stage1?.massProductionDate;
    if (!massProductionDate) return null;
    
    const targetDate = new Date(massProductionDate);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const dDay = calculateDDay();

  // 프로젝트 상태 계산
  const getProjectStatus = () => {
    if (overallProgress === 100) return { text: '완료', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    if (overallProgress >= 70) return { text: '진행중 (고)', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
    if (overallProgress >= 30) return { text: '진행중 (중)', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    return { text: '시작단계', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
  };

  const projectStatus = getProjectStatus();

  // 임박한 일정들 계산
  const getUpcomingTasks = () => {
    const tasks = [];
    const today = new Date();

    // Stage1 일정들
    if (selectedProject.stage1?.launchDate && !selectedProject.stage1?.launchDateExecuted) {
      const date = new Date(selectedProject.stage1.launchDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '출시예정일',
        date: selectedProject.stage1.launchDate,
        daysUntil,
        stage: 'Stage 1',
        color: 'bg-blue-500'
      });
    }

    if (selectedProject.stage1?.massProductionDate && !selectedProject.stage1?.massProductionDateExecuted) {
      const date = new Date(selectedProject.stage1.massProductionDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '양산예정일',
        date: selectedProject.stage1.massProductionDate,
        daysUntil,
        stage: 'Stage 1',
        color: 'bg-red-500'
      });
    }

    // Stage2 일정들
    if (selectedProject.stage2?.pilotProductionDate && !selectedProject.stage2?.pilotProductionDateExecuted) {
      const date = new Date(selectedProject.stage2.pilotProductionDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '파일럿생산',
        date: selectedProject.stage2.pilotProductionDate,
        daysUntil,
        stage: 'Stage 2',
        color: 'bg-green-500'
      });
    }

    if (selectedProject.stage2?.pilotReceiveDate && !selectedProject.stage2?.pilotReceiveDateExecuted) {
      const date = new Date(selectedProject.stage2.pilotReceiveDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '파일럿수령',
        date: selectedProject.stage2.pilotReceiveDate,
        daysUntil,
        stage: 'Stage 2',
        color: 'bg-green-400'
      });
    }

    if (selectedProject.stage2?.techTransferDate && !selectedProject.stage2?.techTransferDateExecuted) {
      const date = new Date(selectedProject.stage2.techTransferDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '기술이전',
        date: selectedProject.stage2.techTransferDate,
        daysUntil,
        stage: 'Stage 2',
        color: 'bg-purple-500'
      });
    }

    // Stage3 일정들
    if (selectedProject.stage3?.initialProductionDate && !selectedProject.stage3?.initialProductionDateExecuted) {
      const date = new Date(selectedProject.stage3.initialProductionDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '최초양산',
        date: selectedProject.stage3.initialProductionDate,
        daysUntil,
        stage: 'Stage 3',
        color: 'bg-orange-500'
      });
    }

    if (selectedProject.stage3?.firstOrderDate && !selectedProject.stage3?.firstOrderDateExecuted) {
      const date = new Date(selectedProject.stage3.firstOrderDate);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        title: '1차부품발주',
        date: selectedProject.stage3.firstOrderDate,
        daysUntil,
        stage: 'Stage 3',
        color: 'bg-yellow-500'
      });
    }

    // 날짜순 정렬
    return tasks.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  };

  const upcomingTasks = getUpcomingTasks();

  // 완료된 작업들 계산
  const getCompletedTasks = () => {
    const completed = [];
    
    if (selectedProject.stage1?.launchDateExecuted) {
      completed.push({ title: '출시예정일', stage: 'Stage 1', date: selectedProject.stage1.launchDate });
    }
    if (selectedProject.stage1?.massProductionDateExecuted) {
      completed.push({ title: '양산예정일', stage: 'Stage 1', date: selectedProject.stage1.massProductionDate });
    }
    if (selectedProject.stage2?.pilotProductionDateExecuted) {
      completed.push({ title: '파일럿생산', stage: 'Stage 2', date: selectedProject.stage2.pilotProductionDate });
    }
    if (selectedProject.stage2?.pilotReceiveDateExecuted) {
      completed.push({ title: '파일럿수령', stage: 'Stage 2', date: selectedProject.stage2.pilotReceiveDate });
    }
    if (selectedProject.stage2?.techTransferDateExecuted) {
      completed.push({ title: '기술이전', stage: 'Stage 2', date: selectedProject.stage2.techTransferDate });
    }
    if (selectedProject.stage3?.initialProductionDateExecuted) {
      completed.push({ title: '최초양산', stage: 'Stage 3', date: selectedProject.stage3.initialProductionDate });
    }
    if (selectedProject.stage3?.firstOrderDateExecuted) {
      completed.push({ title: '1차부품발주', stage: 'Stage 3', date: selectedProject.stage3.firstOrderDate });
    }

    return completed;
  };

  const completedTasks = getCompletedTasks();

  // 차트 컴포넌트
  const ProgressChart = ({ data, labels, colors }) => {
    return (
      <div className="space-y-4">
        {data.map((value, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm font-medium text-gray-700">
              {labels[index]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-7 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                style={{
                  width: `${Math.max(value, 8)}%`, // 최소 8%로 텍스트가 보이도록
                  backgroundColor: colors[index]
                }}
              >
                <span className="text-xs font-medium text-white">
                  {value}%
                </span>
              </div>
              {value < 8 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs font-medium text-gray-600">{value}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const StatCard = ({ title, value, subtitle, color = 'bg-blue-500', icon, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                trend > 0 ? 'bg-green-100 text-green-700' :
                trend < 0 ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView('list')}
              className="text-sm"
            >
              ← 목록
            </Button>
            <span className="text-sm text-gray-500">프로젝트 대시보드</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h1>
          <div className="flex items-center flex-wrap gap-4 mt-3">
            {selectedProject.modelName && (
              <span className="text-blue-600 font-medium">모델: {selectedProject.modelName}</span>
            )}
            <span className="text-gray-600">ID: {selectedProject.id}</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${projectStatus.bgColor} ${projectStatus.textColor}`}>
              {projectStatus.text}
            </div>
            {dDay !== null && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dDay > 30 ? 'bg-green-100 text-green-700' :
                dDay > 7 ? 'bg-yellow-100 text-yellow-700' :
                dDay > 0 ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : `D+${Math.abs(dDay)}`}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Edit button clicked in ProjectDashboard');
              console.log('Current selectedProject:', selectedProject?.name);
              setSelectedProject(selectedProject);
              setCurrentView('edit');
              console.log('Navigating to edit view for editing');
            }}
          >
            📝 편집
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentView('calendar')}
          >
            📅 달력보기
          </Button>
          <Button 
            variant="primary"
          >
            📊 보고서 생성
          </Button>
        </div>
      </div>

      {/* 프로젝트 개요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="전체 진행률"
          value={`${overallProgress}%`}
          subtitle="3개 단계 평균"
          color="bg-blue-500"
          icon="📈"
          trend={overallProgress >= 50 ? 15 : overallProgress >= 25 ? 5 : -2}
        />
        <StatCard 
          title="완료된 작업"
          value={completedTasks.length}
          subtitle={`총 ${completedTasks.length + upcomingTasks.length}개 중`}
          color="bg-green-500"
          icon="✅"
        />
        <StatCard 
          title="남은 작업"
          value={upcomingTasks.length}
          subtitle="예정된 일정"
          color="bg-orange-500"
          icon="⏱️"
        />
        <StatCard 
          title="D-Day"
          value={dDay !== null ? (dDay > 0 ? `${dDay}일` : dDay === 0 ? 'Today' : `+${Math.abs(dDay)}일`) : '-'}
          subtitle="양산예정일까지"
          color={dDay !== null && dDay <= 7 ? 'bg-red-500' : 'bg-gray-500'}
          icon="🎯"
        />
      </div>

      {/* 단계별 진행률 차트 */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">📊 단계별 진행률</h2>
          <div className="text-sm text-gray-500">
            업데이트: {new Date(selectedProject.updatedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
        <ProgressChart
          data={[stage1Progress, stage2Progress, stage3Progress, overallProgress]}
          labels={['1단계 (기본정보)', '2단계 (생산준비)', '3단계 (양산준비)', '전체 평균']}
          colors={['#3B82F6', '#10B981', '#8B5CF6', '#6366F1']}
        />
      </div>

      {/* 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 임박한 일정 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 임박한 일정</h3>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-600">{task.stage}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      task.daysUntil <= 0 ? 'text-red-600' :
                      task.daysUntil <= 7 ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {task.daysUntil <= 0 ? '지연됨' : 
                       task.daysUntil === 1 ? '내일' :
                       `${task.daysUntil}일 후`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(task.date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>예정된 일정이 없습니다</p>
            </div>
          )}
        </div>

        {/* 완료된 작업 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 완료된 작업</h3>
          {completedTasks.length > 0 ? (
            <div className="space-y-3">
              {completedTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-green-600">{task.stage}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">완료</div>
                    <div className="text-xs text-gray-500">
                      {task.date ? new Date(task.date).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>완료된 작업이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 프로젝트 상세 정보 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">📋 프로젝트 상세 정보</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Stage 1 상세 */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-600">1단계: 기본 정보</h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  stage1Progress === 100 ? 'bg-green-100 text-green-700' :
                  stage1Progress >= 70 ? 'bg-blue-100 text-blue-700' :
                  stage1Progress >= 30 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {stage1Progress}% 완료
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">제품군</label>
                  <p className="text-gray-900">{selectedProject.stage1?.productGroup || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">제조사</label>
                  <p className="text-gray-900">{selectedProject.stage1?.manufacturer || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">벤더사</label>
                  <p className="text-gray-900">{selectedProject.stage1?.vendor || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">파생모델</label>
                  <p className="text-gray-900">{selectedProject.stage1?.derivativeModel || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">상품개발담당자</label>
                  <p className="text-gray-900">{selectedProject.stage1?.productManager || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">연구소담당자(기구)</label>
                  <p className="text-gray-900">{selectedProject.stage1?.mechanicalEngineer || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">연구소담당자(회로)</label>
                  <p className="text-gray-900">{selectedProject.stage1?.circuitEngineer || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">출시예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage1?.launchDate ? 
                        new Date(selectedProject.stage1.launchDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage1?.launchDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">양산예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage1?.massProductionDate ? 
                        new Date(selectedProject.stage1.massProductionDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage1?.massProductionDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
              </div>
            </div>
            
            {selectedProject.stage1?.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">비고</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedProject.stage1.notes}</p>
              </div>
            )}
          </div>

          {/* Stage 2 상세 */}
          <div className="border-l-4 border-green-500 pl-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-600">2단계: 생산 준비</h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  stage2Progress === 100 ? 'bg-green-100 text-green-700' :
                  stage2Progress >= 70 ? 'bg-blue-100 text-blue-700' :
                  stage2Progress >= 30 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {stage2Progress}% 완료
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">파일럿생산 예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage2?.pilotProductionDate ? 
                        new Date(selectedProject.stage2.pilotProductionDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage2?.pilotProductionDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">파일럿 수량</label>
                  <p className="text-gray-900">{selectedProject.stage2?.pilotQuantity || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">파일럿수령 예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage2?.pilotReceiveDate ? 
                        new Date(selectedProject.stage2.pilotReceiveDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage2?.pilotReceiveDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">기술이전 예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage2?.techTransferDate ? 
                        new Date(selectedProject.stage2.techTransferDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage2?.techTransferDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">설치 주체</label>
                  <p className="text-gray-900">{selectedProject.stage2?.installationEntity || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">서비스 주체</label>
                  <p className="text-gray-900">{selectedProject.stage2?.serviceEntity || '-'}</p>
                </div>
              </div>
            </div>
            
            {selectedProject.stage2?.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">비고</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedProject.stage2.notes}</p>
              </div>
            )}
          </div>

          {/* Stage 3 상세 */}
          <div className="border-l-4 border-purple-500 pl-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-600">3단계: 양산 준비</h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  stage3Progress === 100 ? 'bg-green-100 text-green-700' :
                  stage3Progress >= 70 ? 'bg-blue-100 text-blue-700' :
                  stage3Progress >= 30 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {stage3Progress}% 완료
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">최초양산 예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage3?.initialProductionDate ? 
                        new Date(selectedProject.stage3.initialProductionDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage3?.initialProductionDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">1차부품발주 예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage3?.firstOrderDate ? 
                        new Date(selectedProject.stage3.firstOrderDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage3?.firstOrderDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">BOM구성 담당자</label>
                  <p className="text-gray-900">{selectedProject.stage3?.bomManager || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">BOM구성 목표일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage3?.bomTargetDate ? 
                        new Date(selectedProject.stage3.bomTargetDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage3?.bomTargetDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">단가등록 담당자</label>
                  <p className="text-gray-900">{selectedProject.stage3?.priceManager || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">단가등록 목표일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage3?.priceTargetDate ? 
                        new Date(selectedProject.stage3.priceTargetDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage3?.priceTargetDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">부품입고 예정일</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">
                      {selectedProject.stage3?.partsDeliveryDate ? 
                        new Date(selectedProject.stage3.partsDeliveryDate).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    {selectedProject.stage3?.partsDeliveryDateExecuted && 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">완료</span>}
                  </div>
                </div>
              </div>
            </div>
            
            {selectedProject.stage3?.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">비고</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedProject.stage3.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 프로젝트 메타 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 프로젝트 메타 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">생성일</label>
            <p className="text-gray-900">
              {new Date(selectedProject.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">최종 수정일</label>
            <p className="text-gray-900">
              {new Date(selectedProject.updatedAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">생성자</label>
            <p className="text-gray-900">{selectedProject.createdBy || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">프로젝트 버전</label>
            <p className="text-gray-900">v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;