import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectProgress } from '../../types/project';

/**
 * PublicReportViewer - 로그인 없이 볼 수 있는 공개 보고서 페이지
 * 
 * 주요 기능:
 * - 프로젝트 기본 정보 표시
 * - Stage별 진행률과 상세 내용 표시
 * - 프로젝트 일정 달력 표시
 * - 로그인 불필요
 */
const PublicReportViewer = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // localStorage에서 해당 보고서 찾기
    const reports = JSON.parse(localStorage.getItem('publicReports') || '[]');
    const report = reports.find(r => r.id === reportId && r.isActive);
    
    if (report) {
      setReportData(report);
    } else {
      setError('보고서를 찾을 수 없거나 더 이상 유효하지 않습니다.');
    }
    setLoading(false);
  }, [reportId]);

  // 프로젝트 진행률 계산
  const projectProgress = useMemo(() => {
    return reportData?.projectData ? getProjectProgress(reportData.projectData) : { overall: 0, stage1: 0, stage2: 0, stage3: 0 };
  }, [reportData?.projectData]);

  // 달력용 날짜 데이터 추출
  const calendarEvents = useMemo(() => {
    if (!reportData?.projectData) return [];
    
    const project = reportData.projectData;
    const events = [];
    
    // Stage1 날짜들
    const stage1 = project.stage1 || {};
    if (stage1.launchDate) {
      events.push({
        date: stage1.launchDate,
        title: '출시예정일',
        stage: 'Stage 1',
        executed: stage1.launchExecuted,
        color: 'blue'
      });
    }
    if (stage1.massProductionDate) {
      events.push({
        date: stage1.massProductionDate,
        title: '양산예정일',
        stage: 'Stage 1', 
        executed: stage1.massProductionExecuted,
        color: 'blue'
      });
    }
    
    // Stage2 날짜들
    const stage2 = project.stage2 || {};
    if (stage2.pilotProductionDate) {
      events.push({
        date: stage2.pilotProductionDate,
        title: '파일럿생산',
        stage: 'Stage 2',
        executed: stage2.pilotProductionExecuted,
        color: 'green'
      });
    }
    if (stage2.techTransferDate) {
      events.push({
        date: stage2.techTransferDate,
        title: '기술이전',
        stage: 'Stage 2',
        executed: stage2.techTransferExecuted,
        color: 'green'
      });
    }
    
    // Stage3 날짜들
    const stage3 = project.stage3 || {};
    if (stage3.initialProductionDate) {
      events.push({
        date: stage3.initialProductionDate,
        title: '최초양산',
        stage: 'Stage 3',
        executed: stage3.initialProductionExecuted,
        color: 'purple'
      });
    }
    
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [reportData?.projectData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">보고서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">보고서를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <p className="text-sm text-gray-500">보고서 링크가 올바른지 확인하거나 관리자에게 문의하세요.</p>
        </div>
      </div>
    );
  }

  const project = reportData.projectData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">쿠쿠</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">프로젝트 보고서</h1>
                <p className="text-sm text-gray-500">공개 보고서 뷰어</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              생성일: {new Date(reportData.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 프로젝트 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
              <span>전체 진행률: {projectProgress.overall}%</span>
              <span>•</span>
              <span>모델명: {project.modelName || 'N/A'}</span>
              <span>•</span>
              <span>생성자: {reportData.createdBy}</span>
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>전체 진행률</span>
                  <span>{projectProgress.overall}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectProgress.overall}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>1단계 (기본정보)</span>
                  <span>{projectProgress.stage1}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectProgress.stage1}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>2단계 (생산준비)</span>
                  <span>{projectProgress.stage2}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectProgress.stage2}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>3단계 (양산준비)</span>
                  <span>{projectProgress.stage3}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectProgress.stage3}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: '프로젝트 개요', icon: '📋' },
                { id: 'stages', name: '단계별 상세', icon: '📊' },
                { id: 'schedule', name: '프로젝트 일정', icon: '📅' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 프로젝트 개요 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</label>
                      <div className="p-3 bg-gray-50 rounded-md border">{project.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
                      <div className="p-3 bg-gray-50 rounded-md border">{project.modelName || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">제품군</label>
                      <div className="p-3 bg-gray-50 rounded-md border">{project.stage1?.productGroup || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
                      <div className="p-3 bg-gray-50 rounded-md border">{project.stage1?.manufacturer || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 설명</h3>
                  <div className="p-4 bg-gray-50 rounded-md border min-h-[100px]">
                    {project.description || '프로젝트 설명이 없습니다.'}
                  </div>
                </div>
              </div>
            )}

            {/* 단계별 상세 탭 */}
            {activeTab === 'stages' && (
              <div className="space-y-8">
                {/* Stage 1 */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">1단계: 기본정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(project.stage1 || {}).map(([key, value]) => {
                      if (!value || key.includes('Executed')) return null;
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel(key)}
                          </label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {key.includes('Date') 
                              ? new Date(value).toLocaleDateString('ko-KR')
                              : value
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">2단계: 생산준비</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(project.stage2 || {}).map(([key, value]) => {
                      if (!value || key.includes('Executed')) return null;
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel(key)}
                          </label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {key.includes('Date') 
                              ? new Date(value).toLocaleDateString('ko-KR')
                              : value
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">3단계: 양산준비</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(project.stage3 || {}).map(([key, value]) => {
                      if (!value || key.includes('Executed')) return null;
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel(key)}
                          </label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {key.includes('Date') 
                              ? new Date(value).toLocaleDateString('ko-KR')
                              : value
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 프로젝트 일정 탭 */}
            {activeTab === 'schedule' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">프로젝트 일정</h3>
                {calendarEvents.length > 0 ? (
                  <div className="space-y-4">
                    {calendarEvents.map((event, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          event.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                          event.color === 'green' ? 'border-green-500 bg-green-50' :
                          'border-purple-500 bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{event.title}</div>
                            <div className="text-sm text-gray-600">{event.stage}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(event.date).toLocaleDateString('ko-KR')}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              event.executed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.executed ? '완료' : '예정'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    등록된 일정이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center text-sm text-gray-500">
          <p>이 보고서는 {new Date(reportData.createdAt).toLocaleDateString('ko-KR')}에 생성되었습니다.</p>
          <p className="mt-1">쿠쿠 고객만족팀 제품 진척률 관리 시스템</p>
        </div>
      </div>
    </div>
  );
};

// 필드명 한국어 매핑
const getFieldLabel = (key) => {
  const labels = {
    productGroup: '제품군',
    modelName: '모델명',
    manufacturer: '제조사',
    vendor: '벤더사',
    derivativeModel: '파생모델',
    launchDate: '출시예정일',
    productManager: '상품개발 담당자',
    mechanicalEngineer: '연구소 담당자(기구)',
    circuitEngineer: '연구소 담당자(회로)',
    massProductionDate: '양산예정일',
    pilotProductionDate: '파일럿생산',
    techTransferDate: '기술이전',
    installationDate: '설치일정',
    serviceDate: '서비스일정',
    initialProductionDate: '최초양산',
    bomDate: 'BOM구성',
    unitPriceDate: '단가등록',
    partReceiptDate: '부품입고'
  };
  return labels[key] || key;
};

export default PublicReportViewer;