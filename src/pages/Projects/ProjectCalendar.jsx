import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getProjectProgress } from '../../types/project';

const ProjectCalendar = () => {
  const { state, setCurrentView, setSelectedProject } = useProjectStore();
  const { projects } = state;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month', 'week'

  // 현재 월의 첫 번째 날과 마지막 날
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 달력 표시를 위한 시작일 (이전 달의 일요일부터)
  const startOfCalendar = new Date(startOfMonth);
  startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());

  // 달력 표시를 위한 종료일 (다음 달의 토요일까지)
  const endOfCalendar = new Date(endOfMonth);
  endOfCalendar.setDate(endOfCalendar.getDate() + (6 - endOfCalendar.getDay()));

  // 달력에 표시할 날짜들 생성
  const calendarDays = [];
  const currentCalendarDate = new Date(startOfCalendar);
  while (currentCalendarDate <= endOfCalendar) {
    calendarDays.push(new Date(currentCalendarDate));
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
  }

  // 각 날짜에 해당하는 프로젝트 이벤트들
  const getProjectEventsForDate = (date) => {
    const events = [];
    const dateString = date.toISOString().split('T')[0];

    projects.forEach(project => {
      // Stage1 일정들
      // 양산예정일
      if (project.stage1?.massProductionDate) {
        const massProductionDate = new Date(project.stage1.massProductionDate).toISOString().split('T')[0];
        if (massProductionDate === dateString) {
          events.push({
            type: 'mass-production',
            project,
            title: '양산예정일',
            color: 'bg-red-500'
          });
        }
      }

      // 출시예정일 (launchDate)
      if (project.stage1?.launchDate) {
        const launchDate = new Date(project.stage1.launchDate).toISOString().split('T')[0];
        if (launchDate === dateString) {
          events.push({
            type: 'launch',
            project,
            title: '출시예정일',
            color: 'bg-blue-500'
          });
        }
      }

      // Stage2 일정들
      // 파일럿 생산 예정일
      if (project.stage2?.pilotProductionDate) {
        const pilotProductionDate = new Date(project.stage2.pilotProductionDate).toISOString().split('T')[0];
        if (pilotProductionDate === dateString) {
          events.push({
            type: 'pilot-production',
            project,
            title: '파일럿생산',
            color: 'bg-green-500'
          });
        }
      }

      // 파일럿 수령 예정일
      if (project.stage2?.pilotReceiveDate) {
        const pilotReceiveDate = new Date(project.stage2.pilotReceiveDate).toISOString().split('T')[0];
        if (pilotReceiveDate === dateString) {
          events.push({
            type: 'pilot-receive',
            project,
            title: '파일럿수령',
            color: 'bg-green-400'
          });
        }
      }

      // 기술이전 예정일
      if (project.stage2?.techTransferDate) {
        const techTransferDate = new Date(project.stage2.techTransferDate).toISOString().split('T')[0];
        if (techTransferDate === dateString) {
          events.push({
            type: 'tech-transfer',
            project,
            title: '기술이전',
            color: 'bg-purple-500'
          });
        }
      }

      // Stage3 일정들
      // 최초양산 예정일
      if (project.stage3?.initialProductionDate) {
        const initialProductionDate = new Date(project.stage3.initialProductionDate).toISOString().split('T')[0];
        if (initialProductionDate === dateString) {
          events.push({
            type: 'initial-production',
            project,
            title: '최초양산',
            color: 'bg-orange-500'
          });
        }
      }

      // 1차부품발주 예정일
      if (project.stage3?.firstOrderDate) {
        const firstOrderDate = new Date(project.stage3.firstOrderDate).toISOString().split('T')[0];
        if (firstOrderDate === dateString) {
          events.push({
            type: 'first-order',
            project,
            title: '1차부품발주',
            color: 'bg-yellow-500'
          });
        }
      }

      // BOM 구성 목표 예정일
      if (project.stage3?.bomTargetDate) {
        const bomTargetDate = new Date(project.stage3.bomTargetDate).toISOString().split('T')[0];
        if (bomTargetDate === dateString) {
          events.push({
            type: 'bom-target',
            project,
            title: 'BOM구성',
            color: 'bg-indigo-500'
          });
        }
      }

      // 단가등록 목표 예정일
      if (project.stage3?.priceTargetDate) {
        const priceTargetDate = new Date(project.stage3.priceTargetDate).toISOString().split('T')[0];
        if (priceTargetDate === dateString) {
          events.push({
            type: 'price-target',
            project,
            title: '단가등록',
            color: 'bg-pink-500'
          });
        }
      }

      // 부품 입고 예정일
      if (project.stage3?.partsDeliveryDate) {
        const partsDeliveryDate = new Date(project.stage3.partsDeliveryDate).toISOString().split('T')[0];
        if (partsDeliveryDate === dateString) {
          events.push({
            type: 'parts-delivery',
            project,
            title: '부품입고',
            color: 'bg-teal-500'
          });
        }
      }
    });

    return events;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트 달력</h1>
              <p className="text-gray-600">
                프로젝트 일정을 달력 형태로 확인하세요
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setCurrentView('list')}
                className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                📋 목록 보기
              </button>
              <button 
                onClick={() => setCurrentView('project-dashboard')}
                className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                📊 대시보드
              </button>
            </div>
          </div>
        </div>

        {/* 달력 컨트롤 */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                오늘
              </button>
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-800">일정 범례</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Stage 1 */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">출시예정일</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-700">양산예정일</span>
            </div>
            
            {/* Stage 2 */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">파일럿생산</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-700">파일럿수령</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">기술이전</span>
            </div>
            
            {/* Stage 3 */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">최초양산</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">부품발주</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span className="text-sm text-gray-700">BOM구성</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span className="text-sm text-gray-700">단가등록</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-sm text-gray-700">부품입고</span>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-4 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 날짜들 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const events = getProjectEventsForDate(date);
              const isCurrentMonthDate = isCurrentMonth(date);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                    !isCurrentMonthDate ? 'bg-gray-50' : ''
                  } ${isTodayDate ? 'bg-blue-50' : ''}`}
                >
                  {/* 날짜 숫자 */}
                  <div className={`text-sm font-medium mb-2 ${
                    !isCurrentMonthDate ? 'text-gray-400' :
                    isTodayDate ? 'text-blue-600' :
                    index % 7 === 0 ? 'text-red-600' :
                    index % 7 === 6 ? 'text-blue-600' :
                    'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>

                  {/* 이벤트들 */}
                  <div className="space-y-1">
                    {events.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        onClick={() => {
                          setSelectedProject(event.project);
                          setCurrentView('detail');
                        }}
                        className={`
                          ${event.color} text-white text-xs px-2 py-1 rounded cursor-pointer
                          hover:opacity-80 transition-opacity
                        `}
                        title={`${event.project.name}${event.project.modelName ? ` (${event.project.modelName})` : ''} - ${event.title}`}
                      >
                        <div className="truncate">
                          {event.project.modelName || event.project.name}
                        </div>
                        <div className="text-xs opacity-90">
                          {event.title}
                        </div>
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{events.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 이달의 중요 일정 */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">이달의 중요 일정</h3>
          </div>
          <div className="p-6">
            {(() => {
              const monthEvents = [];
              calendarDays.forEach(date => {
                if (isCurrentMonth(date)) {
                  const events = getProjectEventsForDate(date);
                  events.forEach(event => {
                    monthEvents.push({ ...event, date });
                  });
                }
              });

              monthEvents.sort((a, b) => a.date - b.date);

              if (monthEvents.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📅</div>
                    <p>이달에 예정된 일정이 없습니다</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {monthEvents.slice(0, 10).map((event, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedProject(event.project);
                        setCurrentView('detail');
                      }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {event.project.name}
                            {event.project.modelName && (
                              <span className="text-blue-600 ml-2">({event.project.modelName})</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{event.title}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.date.getMonth() + 1}/{event.date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCalendar;