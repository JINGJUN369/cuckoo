import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

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
  const { user, profile } = useSupabaseAuth();
  const {
    additionalWorks,
    users,
    loading,
    error,
    ui,
    fetchAdditionalWorks,
    fetchUsers,
    setSelectedUserId,
    setupRealtimeSubscriptions
  } = useWorkStatusStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchUsers();
    fetchAdditionalWorks();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // 사용자 필터 변경 핸들러
  const handleUserFilterChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  // 현재 선택된 사용자 이름 가져오기
  const getSelectedUserName = () => {
    const { selectedUserId } = ui;
    if (selectedUserId === 'current_user') {
      return profile?.name || user?.email || '현재 사용자';
    } else if (selectedUserId === 'all_users') {
      return '전체 사용자';
    } else {
      const selectedUser = users.find(u => u.id === selectedUserId);
      return selectedUser ? selectedUser.name : '선택된 사용자';
    }
  };

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
      const currentDateStr = current.toISOString().split('T')[0];
      
      // 프로젝트 기간 이벤트
      const projectEvents = additionalWorks.filter(work => {
        const startDate = new Date(work.start_date);
        const endDate = new Date(work.end_date);
        return current >= startDate && current <= endDate;
      }).map(work => ({ ...work, eventType: 'project' }));

      // 세부업무 마감일 이벤트
      const detailEvents = additionalWorks
        .flatMap(work => 
          (work.detail_tasks || [])
            .filter(task => task.due_date === currentDateStr)
            .map(task => ({
              id: `${work.id}_${task.id}`,
              work_name: task.task_name,
              work_owner: task.assigned_to || work.work_owner,
              department: work.department,
              parent_work: work,
              eventType: 'detail',
              end_date: task.due_date,
              start_date: task.due_date
            }))
        );

      const allEvents = [...projectEvents, ...detailEvents];

      days.push({
        date: new Date(current),
        events: allEvents,
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

  // 프로젝트별 색상 팔레트 (노션 스타일)
  const projectColorPalettes = [
    { light: 'bg-blue-200', medium: 'bg-blue-400', dark: 'bg-blue-600', text: 'text-blue-800' },
    { light: 'bg-green-200', medium: 'bg-green-400', dark: 'bg-green-600', text: 'text-green-800' },
    { light: 'bg-purple-200', medium: 'bg-purple-400', dark: 'bg-purple-600', text: 'text-purple-800' },
    { light: 'bg-pink-200', medium: 'bg-pink-400', dark: 'bg-pink-600', text: 'text-pink-800' },
    { light: 'bg-orange-200', medium: 'bg-orange-400', dark: 'bg-orange-600', text: 'text-orange-800' },
    { light: 'bg-teal-200', medium: 'bg-teal-400', dark: 'bg-teal-600', text: 'text-teal-800' },
    { light: 'bg-indigo-200', medium: 'bg-indigo-400', dark: 'bg-indigo-600', text: 'text-indigo-800' },
    { light: 'bg-red-200', medium: 'bg-red-400', dark: 'bg-red-600', text: 'text-red-800' },
    { light: 'bg-yellow-200', medium: 'bg-yellow-400', dark: 'bg-yellow-600', text: 'text-yellow-800' },
    { light: 'bg-cyan-200', medium: 'bg-cyan-400', dark: 'bg-cyan-600', text: 'text-cyan-800' },
  ];

  // 프로젝트 ID를 기반으로 색상 팔레트 할당
  const getProjectColorPalette = (workId) => {
    const hash = workId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const index = Math.abs(hash) % projectColorPalettes.length;
    return projectColorPalettes[index];
  };

  // 이벤트 색상 및 타입 결정
  const getEventStyle = (work, eventType = 'project') => {
    const palette = getProjectColorPalette(work.id);
    const today = new Date();
    const endDate = new Date(work.end_date);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    // 긴급도에 따른 색상 조정
    let colorIntensity = 'medium';
    if (daysLeft < 0) colorIntensity = 'dark'; // 지연 - 진한 색
    else if (daysLeft <= 3) colorIntensity = 'dark'; // 임박 - 진한 색
    else colorIntensity = 'light'; // 일반 - 연한 색

    // 이벤트 타입별 색상 강도 조정
    if (eventType === 'project') {
      // 프로젝트 전체 기간: 연한 색상
      return {
        bg: palette.light,
        border: palette.medium,
        text: palette.text
      };
    } else if (eventType === 'detail') {
      // 상세 일정 (하루하루): 진한 색상
      return {
        bg: palette.dark,
        border: palette.dark,
        text: 'text-white'
      };
    }

    return {
      bg: palette[colorIntensity],
      border: palette.dark,
      text: colorIntensity === 'dark' ? 'text-white' : palette.text
    };
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📅 업무달력</h1>
            <p className="text-gray-600 mt-2">팀 전체의 업무 일정을 한눈에 확인하세요.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 사용자 필터 드롭다운 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">👤 사용자 필터:</span>
              <select
                value={ui.selectedUserId}
                onChange={handleUserFilterChange}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="current_user">내 업무만</option>
                <option value="all_users">전체 사용자</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              현재 보기: <span className="font-medium text-gray-700">{getSelectedUserName()}</span>
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
              <div className="w-4 h-3 bg-blue-200 rounded border-l-2 border-blue-400"></div>
              <span>프로젝트 기간</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-3 bg-green-600 rounded"></div>
              <span>상세 일정</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-3 bg-red-600 rounded"></div>
              <span>긴급/지연</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-200 to-purple-200"></div>
              <span>프로젝트별 색상</span>
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
                  {day.events.slice(0, 3).map((event, eventIndex) => {
                    const style = getEventStyle(event.parent_work || event, event.eventType);
                    const isDetailEvent = event.eventType === 'detail';
                    
                    return (
                    <div
                      key={event.id}
                      className={`text-xs px-2 py-1 rounded truncate cursor-pointer ${style.bg} ${style.text} ${
                        isDetailEvent 
                          ? 'border border-white shadow-sm font-medium' 
                          : `border-l-2 ${style.border.replace('bg-', 'border-')}`
                      }`}
                      title={`${event.work_name} ${isDetailEvent ? '(세부업무)' : '(프로젝트)'} - ${event.department} - ${event.work_owner}`}
                    >
                      {isDetailEvent ? '📌 ' : ''}{event.work_name}
                    </div>
                    );
                  })}
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