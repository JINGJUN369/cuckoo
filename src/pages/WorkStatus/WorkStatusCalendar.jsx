import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';

/**
 * WorkStatusCalendar - 업무달력 페이지
 * 
 * 기능:
 * - 월/주/일 단위 업무 일정 보기
 * - 업무 마감일 및 시작일 시각적 표시
 * - 팀 전체 일정 실시간 공유
 * - 임박한 마감일 강조 표시
 */
const WorkStatusCalendar = () => {
  const {
    additionalWorks,
    loading,
    error,
    fetchAdditionalWorks,
    setupRealtimeSubscriptions
  } = useWorkStatusStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchAdditionalWorks();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // 달력 데이터 생성
  const calendarData = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayEvents = additionalWorks.filter(work => {
        const startDate = new Date(work.start_date);
        const endDate = new Date(work.end_date);
        return current >= startDate && current <= endDate;
      });

      days.push({
        date: new Date(current),
        events: dayEvents,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString()
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, additionalWorks]);

  // 월 변경
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 이벤트 색상 결정
  const getEventColor = (work) => {
    const today = new Date();
    const endDate = new Date(work.end_date);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'bg-red-500'; // 지연
    if (daysLeft === 0) return 'bg-orange-500'; // 오늘 마감
    if (daysLeft <= 3) return 'bg-yellow-500'; // 임박
    return 'bg-blue-500'; // 일반
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">달력 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📅 업무달력</h1>
            <p className="text-gray-600 mt-2">팀 전체의 업무 일정을 한눈에 확인하세요.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              오늘
            </button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="month">월 보기</option>
              <option value="week">주 보기</option>
              <option value="day">일 보기</option>
            </select>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-red-500 mr-2">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 달력 네비게이션 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              →
            </button>
          </div>
          
          {/* 범례 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>지연</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>오늘 마감</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>임박</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>일반</span>
            </div>
          </div>
        </div>

        {/* 달력 그리드 */}
        <div className="p-4">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`p-2 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] p-2 border rounded-lg ${
                  day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                } ${
                  day.isToday ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {/* 날짜 */}
                <div className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${
                  day.isToday ? 'text-indigo-600' : ''
                }`}>
                  {day.date.getDate()}
                </div>

                {/* 이벤트들 */}
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((work, eventIndex) => (
                    <div
                      key={work.id}
                      className={`text-xs px-2 py-1 rounded text-white truncate cursor-pointer ${getEventColor(work)}`}
                      title={`${work.work_name} (${work.department} - ${work.work_owner})`}
                    >
                      {work.work_name}
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{day.events.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이번 주 주요 일정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 주 주요 일정</h3>
        <div className="space-y-3">
          {additionalWorks
            .filter(work => {
              const today = new Date();
              const weekEnd = new Date(today);
              weekEnd.setDate(today.getDate() + 7);
              const endDate = new Date(work.end_date);
              return endDate >= today && endDate <= weekEnd;
            })
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 5)
            .map(work => {
              const daysLeft = Math.ceil((new Date(work.end_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={work.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">{work.work_name}</h4>
                    <p className="text-sm text-gray-600">{work.department} | {work.work_owner}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      daysLeft < 0 ? 'bg-red-100 text-red-800' :
                      daysLeft === 0 ? 'bg-orange-100 text-orange-800' :
                      daysLeft <= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {daysLeft < 0 ? '지연' : daysLeft === 0 ? '오늘 마감' : `${daysLeft}일 남음`}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{work.end_date}</p>
                  </div>
                </div>
              );
            })}
          
          {additionalWorks.filter(work => {
            const today = new Date();
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            const endDate = new Date(work.end_date);
            return endDate >= today && endDate <= weekEnd;
          }).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-3xl block mb-2">📅</span>
              <p>이번 주에 예정된 업무가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkStatusCalendar;