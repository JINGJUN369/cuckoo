import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
<<<<<<< HEAD
=======
import WorkFilterBar from '../../components/workstatus/WorkFilterBar';
import Tooltip from '../../components/ui/Tooltip';
import { getWorkColor, getPriorityText, isDetailTask, clearColorCache } from '../../utils/colorUtils';
>>>>>>> 28f8e6c

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
<<<<<<< HEAD
    users,
=======
    allAdditionalWorks,
>>>>>>> 28f8e6c
    loading,
    error,
    ui,
    fetchAdditionalWorks,
<<<<<<< HEAD
    fetchUsers,
    setSelectedUserId,
    setupRealtimeSubscriptions
=======
    setupRealtimeSubscriptions,
    setFilter,
    getAllAuthors
>>>>>>> 28f8e6c
  } = useWorkStatusStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [expandedDays, setExpandedDays] = useState(new Set()); // 확장된 날짜들

  // 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchUsers();
    fetchAdditionalWorks();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

<<<<<<< HEAD
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
=======
  // 필터 변경시 색상 캐시 초기화
  useEffect(() => {
    clearColorCache();
  }, [additionalWorks]);

  // 디버깅: additionalWorks 데이터 구조 확인 (한 번만 실행)
  useEffect(() => {
    if (additionalWorks && additionalWorks.length > 0) {
      console.log('🔍 업무달력 데이터 로드:', additionalWorks.length + '개 업무');
      const firstWork = additionalWorks[0];
      if (firstWork?.detail_tasks?.length > 0) {
        console.log('✅ 세부업무가 포함된 업무:', firstWork.work_name, '- 세부업무', firstWork.detail_tasks.length + '개');
      }
    }
  }, [additionalWorks]);

  // 필터 변경 핸들러
  const handleFilterChange = (filterConfig) => {
    const currentUser = profile?.name || user?.name || user?.email || '';
    setFilter({
      ...filterConfig,
      currentUser: currentUser
    });
>>>>>>> 28f8e6c
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
<<<<<<< HEAD
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
=======
      // 업무와 세부업무를 모두 포함한 이벤트 목록 생성
      const workEvents = (additionalWorks || []).filter(work => {
        const startDate = new Date(work.start_date);
        const endDate = new Date(work.end_date);
        return current >= startDate && current <= endDate;
      }).map(work => ({ ...work, type: 'work' }));

      // 세부업무를 각각의 실제 마감일에 표시
      const detailEvents = [];
      (additionalWorks || []).forEach(work => {
        if (work.detail_tasks && Array.isArray(work.detail_tasks)) {
          work.detail_tasks.forEach(task => {
            if (task.end_date) {
              // 세부업무의 실제 마감일을 확인
              const taskEndDate = new Date(task.end_date);
              const currentDay = new Date(current);
              
              if (taskEndDate.toDateString() === currentDay.toDateString()) {
                detailEvents.push({ 
                  ...task, 
                  type: 'detail', 
                  additional_work_id: work.id,
                  parent_work_name: work.work_name
                  // task.end_date 그대로 사용 (덮어쓰지 않음)
                });
              }
            }
          });
        }
      });
      
      // 디버깅: 현재 날짜와 이벤트 수 확인
      if (detailEvents.length > 0) {
        console.log(`📅 ${current.toDateString()}: 세부업무 ${detailEvents.length}개, 업무 ${workEvents.length}개`);
      }

      const allEvents = [...workEvents, ...detailEvents];
>>>>>>> 28f8e6c

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

<<<<<<< HEAD
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
=======
  // 날짜 펼치기/접기 토글
  const toggleDayExpansion = (dayString) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayString)) {
        newSet.delete(dayString);
      } else {
        newSet.add(dayString);
      }
      return newSet;
    });
  };

  // 구글 캘린더 연한 색상 체계 적용
  const getProjectColor = (workName) => {
    const projectColors = {
      '실링팬': { 
        // 연한 파란색
        main: 'bg-blue-300', 
        light: 'bg-blue-50', 
        dark: 'bg-blue-400',
        text: 'text-blue-800',
        textLight: 'text-blue-600',
        border: 'border-blue-200'
      },
      '신제품': { 
        // 연한 초록색
        main: 'bg-green-300', 
        light: 'bg-green-50', 
        dark: 'bg-green-400',
        text: 'text-green-800',
        textLight: 'text-green-600',
        border: 'border-green-200'
      },
      '마케팅': { 
        // 연한 주황색
        main: 'bg-orange-300', 
        light: 'bg-orange-50', 
        dark: 'bg-orange-400',
        text: 'text-orange-800',
        textLight: 'text-orange-600',
        border: 'border-orange-200'
      },
      '기획': { 
        // 연한 보라색
        main: 'bg-purple-300', 
        light: 'bg-purple-50', 
        dark: 'bg-purple-400',
        text: 'text-purple-800',
        textLight: 'text-purple-600',
        border: 'border-purple-200'
      },
      '개발': { 
        // 연한 빨간색
        main: 'bg-red-300', 
        light: 'bg-red-50', 
        dark: 'bg-red-400',
        text: 'text-red-800',
        textLight: 'text-red-600',
        border: 'border-red-200'
      },
      '디자인': { 
        // 연한 노란색
        main: 'bg-yellow-300', 
        light: 'bg-yellow-50', 
        dark: 'bg-yellow-400',
        text: 'text-yellow-800',
        textLight: 'text-yellow-600',
        border: 'border-yellow-200'
      },
      '고객': { 
        // 연한 청록색
        main: 'bg-teal-300', 
        light: 'bg-teal-50', 
        dark: 'bg-teal-400',
        text: 'text-teal-800',
        textLight: 'text-teal-600',
        border: 'border-teal-200'
      },
      '품질': { 
        // 연한 분홍색
        main: 'bg-pink-300', 
        light: 'bg-pink-50', 
        dark: 'bg-pink-400',
        text: 'text-pink-800',
        textLight: 'text-pink-600',
        border: 'border-pink-200'
      },
      '영업': { 
        // 연한 인디고색
        main: 'bg-indigo-300', 
        light: 'bg-indigo-50', 
        dark: 'bg-indigo-400',
        text: 'text-indigo-800',
        textLight: 'text-indigo-600',
        border: 'border-indigo-200'
      }
    };

    // 업무명에서 프로젝트 키워드 찾기
    const projectKey = Object.keys(projectColors).find(key => 
      workName?.includes(key)
    );
    
    return projectKey ? projectColors[projectKey] : { 
      main: 'bg-gray-300', 
      light: 'bg-gray-50', 
      dark: 'bg-gray-400',
      text: 'text-gray-800',
      textLight: 'text-gray-600',
      border: 'border-gray-200'
    };
  };

  // 업무명 표시 함수 (요청서 기준 개선 - 100% 폭 활용)
  const formatWorkName = (workName, isDetail = false, cellWidth = 'normal') => {
    if (!workName) return '';
    
    // 셀 크기에 따른 최대 글자 수 설정
    const maxLength = cellWidth === 'expanded' ? 25 : isDetail ? 12 : 15;
    
    // 텍스트가 maxLength를 초과하면 중간 생략
    if (workName.length > maxLength) {
      const start = workName.substring(0, Math.floor(maxLength * 0.6));
      const end = workName.substring(workName.length - Math.floor(maxLength * 0.3));
      return `${start}...${end}`;
    }
    
    return workName;
  };

  // 이벤트 우선순위 계산
  const getEventPriority = (event) => {
    const isDetail = event.type === 'detail' || isDetailTask(event);
    const daysLeft = event.dday?.days || 999;
    
    // 우선순위 점수 (낮을수록 높은 우선순위)
    let priority = 100;
    
    if (daysLeft <= 0) priority = 1; // 마감 당일/지남
    else if (daysLeft <= 1) priority = 2; // 1일 남음
    else if (daysLeft <= 3) priority = 3; // 3일 남음
    else if (daysLeft <= 7) priority = 4; // 1주일 남음
    else if (!isDetail) priority = 5; // 메인 업무
    else priority = 10; // 세부 업무
    
    return priority;
  };

  // 이벤트 색상 및 스타일 결정 (개선됨)
  const getEventStyle = (event) => {
    const isDetail = event.type === 'detail' || isDetailTask(event);
    const workName = event.task_name || event.work_name || '';
    const projectColors = getProjectColor(workName);
    const priority = getEventPriority(event);
    
    // 우선순위에 따른 색상 강도
    let colorClass, borderClass, bgClass;
    
    if (priority <= 2) { // 긴급/임박
      colorClass = 'text-white';
      borderClass = 'border-red-500';
      bgClass = projectColors.dark;
    } else if (priority <= 4) { // 중요
      colorClass = projectColors.text;
      borderClass = priority <= 3 ? 'border-orange-400' : 'border-yellow-400';
      bgClass = projectColors.main;
    } else if (!isDetail) { // 메인 업무
      colorClass = projectColors.text;
      borderClass = projectColors.border;
      bgClass = projectColors.main;
    } else { // 세부 업무
      colorClass = projectColors.text;
      borderClass = projectColors.border;
      bgClass = projectColors.light;
    }
    
    const priorityText = getPriorityText(event);
    
    return {
      colorClass,
      borderClass,
      priorityText,
      isDetail,
      bgClass,
      projectColors,
      priority
>>>>>>> 28f8e6c
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

      {/* 필터 바 */}
      <WorkFilterBar
        onFilterChange={handleFilterChange}
        totalCount={allAdditionalWorks.length}
        filteredCount={additionalWorks.length}
        allUsers={getAllAuthors()}
      />


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
<<<<<<< HEAD
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
=======
          <div className="flex items-center space-x-6 text-sm">
            {/* 업무 타입 범례 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-3 bg-blue-300 rounded border"></div>
                <span>업무</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-3 bg-blue-600 rounded border"></div>
                <span>세부업무</span>
              </div>
            </div>
            {/* 우선순위 범례 */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-300">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>지연</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>오늘</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>임박</span>
              </div>
>>>>>>> 28f8e6c
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

          {/* 날짜 그리드 - 개선된 레이아웃 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-1 border rounded-lg transition-all duration-300 ${
                  day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                } ${
                  day.isToday ? 'ring-2 ring-indigo-500' : ''
                } ${
                  expandedDays.has(day.date.toDateString()) ? 'min-h-[280px]' : ''
                }`}
                style={{
                  minHeight: expandedDays.has(day.date.toDateString()) && day.events.length > 6 
                    ? `${Math.max(280, 120 + (day.events.length - 6) * 25)}px` 
                    : '120px'
                }}
              >
                {/* 날짜 */}
                <div className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${
                  day.isToday ? 'text-indigo-600' : ''
                }`}>
                  {day.date.getDate()}
                </div>

<<<<<<< HEAD
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
=======
                {/* 이벤트들 - 2열 그리드 레이아웃으로 공간 최적화 */}
                <div className="space-y-0.5">
                  {(() => {
                    const dayString = day.date.toDateString();
                    const isExpanded = expandedDays.has(dayString);
                    
                    // 이벤트 우선순위별 정렬
                    const sortedEvents = [...day.events].sort((a, b) => {
                      const aPriority = getEventPriority(a);
                      const bPriority = getEventPriority(b);
                      return aPriority - bPriority;
                    });
                    
                    // 표시할 이벤트 수 제한 (Level 1: 핵심만 표시)
                    const maxDisplayEvents = isExpanded ? 12 : 6;
                    const displayEvents = isExpanded ? sortedEvents : sortedEvents.slice(0, maxDisplayEvents);
                    const hiddenCount = sortedEvents.length - maxDisplayEvents;
                    
                    return (
                      <>
                        {displayEvents.map((event, eventIndex) => {
                          const { colorClass, borderClass, priorityText, isDetail, bgClass, projectColors, priority } = getEventStyle(event);
                          const eventName = event.task_name || event.work_name;
                          const owner = event.work_owner || event.assigned_to || '';
                          const department = event.department || '';
                          const startDate = event.start_date ? new Date(event.start_date).toLocaleDateString('ko-KR') : '';
                          const endDate = event.end_date ? new Date(event.end_date).toLocaleDateString('ko-KR') : '';
                          const description = event.description || event.work_description || '';
                          const progress = event.progress_percentage || 0;
                          
                          // 개선된 업무명 표시 (확장 상태에 따라 다른 길이)
                          const formattedName = formatWorkName(eventName, isDetail, isExpanded ? 'expanded' : 'normal');
                          
                          // 메인업무 정보 찾기 (세부업무인 경우)
                          const parentWork = isDetail ? 
                            (additionalWorks || []).find(work => work.id === event.additional_work_id) : null;
                          
                          const tooltipContent = (
                            <div className="text-left space-y-1 max-w-sm">
                              <div className="font-semibold text-yellow-300">
                                {isDetail ? '📋 세부업무' : '📁 업무'}: {eventName}
                              </div>
                              
                              {/* 세부업무인 경우 메인업무 정보 표시 */}
                              {isDetail && parentWork && (
                                <div className="text-blue-300 bg-blue-900 bg-opacity-30 px-2 py-1 rounded text-xs">
                                  📁 메인업무: {parentWork.work_name}
                                </div>
                              )}
                              
                              {department && <div className="text-gray-300">부서: {department}</div>}
                              {owner && <div className="text-gray-300">담당자: {owner}</div>}
                              {startDate && endDate && (
                                <div className="text-gray-300">
                                  기간: {startDate} ~ {endDate}
                                </div>
                              )}
                              {progress > 0 && (
                                <div className="text-gray-300">진행률: {progress}%</div>
                              )}
                              {description && (
                                <div className="text-gray-300 text-xs mt-2 border-t border-gray-600 pt-1">
                                  {description.length > 100 ? description.substring(0, 100) + '...' : description}
                                </div>
                              )}
                              {priorityText !== '일반' && (
                                <div className="text-red-300 font-medium">⚠️ {priorityText}</div>
                              )}
                            </div>
                          );
                          
                          return (
                            <Tooltip key={`${event.id}-${eventIndex}`} content={tooltipContent} position="right">
                              <div
                                className={`w-full text-xs px-1.5 py-1 rounded cursor-pointer transition-all hover:scale-105 hover:shadow-md border ${borderClass} ${bgClass} ${colorClass}`}
                                style={{
                                  padding: isExpanded ? '6px' : '4px 6px',
                                  fontSize: isExpanded ? '11px' : '10px',
                                  lineHeight: isExpanded ? '1.3' : '1.2'
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-1 flex-1 min-w-0">
                                    {/* 업무 유형 아이콘 */}
                                    <span className="text-xs opacity-80 flex-shrink-0 mt-0.5">
                                      {isDetail ? '●' : '■'}
                                    </span>
                                    
                                    {/* 개선된 업무명 표시 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="break-words leading-tight font-medium">
                                        {formattedName}
                                      </div>
                                      
                                      {/* 확장 모드에서 담당자 표시 */}
                                      {isExpanded && owner && (
                                        <div className="text-xs opacity-70 truncate">
                                          👤 {owner}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* 우선순위 표시 */}
                                  <div className="flex-shrink-0">
                                    {priority <= 2 && (
                                      <span className="text-xs font-bold">🔥</span>
                                    )}
                                    {priority === 3 && (
                                      <span className="text-xs">⚡</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* 진행률 바 (메인 업무만) */}
                                {!isDetail && progress > 0 && (
                                  <div className="mt-1">
                                    <div className="w-full bg-white bg-opacity-30 rounded-full h-1">
                                      <div 
                                        className="bg-white bg-opacity-80 h-1 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Tooltip>
                          );
                        })}
                        
                        {/* 더보기/접기 버튼 - 간소화된 디자인 */}
                        {!isExpanded && hiddenCount > 0 && (
                          <button
                            onClick={() => toggleDayExpansion(dayString)}
                            className="w-full text-xs text-gray-600 px-1.5 py-1 bg-gray-50 hover:bg-gray-100 rounded text-center transition-all duration-200 border border-gray-200 mt-0.5"
                            style={{ fontSize: '10px' }}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>▼</span>
                              <span className="font-medium">+{hiddenCount}</span>
                            </div>
                          </button>
                        )}
                        
                        {/* 접기 버튼 */}
                        {isExpanded && (
                          <button
                            onClick={() => toggleDayExpansion(dayString)}
                            className="w-full text-xs text-gray-600 px-1.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded text-center transition-all duration-200 border border-indigo-200 mt-0.5"
                            style={{ fontSize: '10px' }}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>▲</span>
                              <span className="font-medium">접기</span>
                            </div>
                          </button>
                        )}
                      </>
                    );
                  })()}
>>>>>>> 28f8e6c
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이번 주 주요 일정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 이번 주 주요 일정</h3>
        <div className="space-y-3">
          {(() => {
            // 업무와 세부업무를 합친 배열 생성
            const allItems = [];
            
            // 업무 추가
            (additionalWorks || []).forEach(work => {
              allItems.push({ ...work, type: 'work' });
              
              // 세부업무는 각자의 실제 마감일을 사용
              if (work.detail_tasks && Array.isArray(work.detail_tasks)) {
                work.detail_tasks.forEach(task => {
                  if (task.end_date) { // end_date가 있는 세부업무만 추가
                    allItems.push({ 
                      ...task, 
                      type: 'detail', 
                      // task.end_date 그대로 사용 (부모 업무 날짜로 덮어쓰지 않음)
                      additional_work_id: work.id,
                      parent_work_name: work.work_name
                    });
                  }
                });
              }
            });
            
            return allItems;
          })()
            .filter(item => {
              const today = new Date();
              const weekEnd = new Date(today);
              weekEnd.setDate(today.getDate() + 7);
              const endDate = new Date(item.end_date);
              return endDate >= today && endDate <= weekEnd;
            })
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 8)
            .map(item => {
              const { colorClass, borderClass, priorityText, isDetail } = getEventStyle(item.task_name ? { ...item, type: 'detail' } : { ...item, type: 'work' });
              const itemName = item.task_name || item.work_name;
              const owner = item.work_owner || item.assigned_to || '';
              const department = item.department || '';
              const daysLeft = Math.ceil((new Date(item.end_date) - new Date()) / (1000 * 60 * 60 * 24));
              const startDate = item.start_date ? new Date(item.start_date).toLocaleDateString('ko-KR') : '';
              const endDate = item.end_date ? new Date(item.end_date).toLocaleDateString('ko-KR') : '';
              const description = item.description || item.work_description || '';
              const progress = item.progress_percentage || 0;
              
              // 메인업무 정보 찾기 (세부업무인 경우)
              const weeklyParentWork = isDetail ? 
                (additionalWorks || []).find(work => work.id === item.additional_work_id) : null;
              
              const weeklyTooltipContent = (
                <div className="text-left space-y-1 max-w-sm">
                  <div className="font-semibold text-yellow-300">
                    {isDetail ? '📋 세부업무' : '📁 업무'}: {itemName}
                  </div>
                  
                  {/* 세부업무인 경우 메인업무 정보 표시 */}
                  {isDetail && weeklyParentWork && (
                    <div className="text-blue-300 bg-blue-900 bg-opacity-30 px-2 py-1 rounded text-xs">
                      📁 메인업무: {weeklyParentWork.work_name}
                    </div>
                  )}
                  
                  {department && <div className="text-gray-300">부서: {department}</div>}
                  {owner && <div className="text-gray-300">담당자: {owner}</div>}
                  {startDate && endDate && (
                    <div className="text-gray-300">
                      기간: {startDate} ~ {endDate}
                    </div>
                  )}
                  {progress > 0 && (
                    <div className="text-gray-300">진행률: {progress}%</div>
                  )}
                  {description && (
                    <div className="text-gray-300 text-xs mt-2 border-t border-gray-600 pt-1">
                      {description.length > 150 ? description.substring(0, 150) + '...' : description}
                    </div>
                  )}
                  <div className="text-blue-300 font-medium">
                    ⏰ {daysLeft < 0 ? `${Math.abs(daysLeft)}일 지연` : daysLeft === 0 ? '오늘 마감' : `${daysLeft}일 남음`}
                  </div>
                </div>
              );
              
              return (
                <Tooltip key={`${item.id}-${isDetail ? 'detail' : 'work'}`} content={weeklyTooltipContent} position="left">
                  <div 
                    className={`flex justify-between items-center p-3 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer ${colorClass} ${borderClass}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{isDetail ? '📋' : '📁'}</span>
                        <h4 className="font-medium">{itemName}</h4>
                        {isDetail && (
                          <span className="text-xs bg-black bg-opacity-20 px-2 py-0.5 rounded-full">
                            세부업무
                          </span>
                        )}
                      </div>
                      {(department || owner) && (
                        <p className="text-sm opacity-80">
                          {department}{department && owner ? ' | ' : ''}{owner}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        daysLeft < 0 ? 'bg-red-500 text-white' :
                        daysLeft === 0 ? 'bg-orange-500 text-white' :
                        daysLeft <= 3 ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {daysLeft < 0 ? '지연' : daysLeft === 0 ? '오늘 마감' : `${daysLeft}일 남음`}
                      </div>
                      <p className="text-xs opacity-70 mt-1">{item.end_date}</p>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          
          {(() => {
            const allItems = [];
            (additionalWorks || []).forEach(work => {
              allItems.push(work);
              if (work.detail_tasks && Array.isArray(work.detail_tasks)) {
                work.detail_tasks.forEach(task => allItems.push(task));
              }
            });
            return allItems;
          })().filter(item => {
            const today = new Date();
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            const endDate = new Date(item.end_date);
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