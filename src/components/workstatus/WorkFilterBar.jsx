import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';

/**
 * WorkFilterBar - 업무 필터링 컴포넌트
 * 
 * 기능:
 * - 내 업무만 보기 / 전체 보기
 * - 특정 작성자별 업무 보기
 * - 필터 상태 관리
 */
const WorkFilterBar = ({ 
  onFilterChange, 
  totalCount = 0,
  filteredCount = 0,
  allUsers = [] 
}) => {
  const { user, profile } = useSupabaseAuth();
  const { setFilter } = useWorkStatusStore();
  const [filterType, setFilterType] = useState('my'); // 'my', 'all', 'user'
  const [selectedUser, setSelectedUser] = useState('');

  // 현재 사용자 이름 가져오기
  const getCurrentUserName = () => {
    return profile?.name || user?.name || user?.email || '';
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilterType, newSelectedUser = '') => {
    setFilterType(newFilterType);
    setSelectedUser(newSelectedUser);
    
    const filterConfig = {
      type: newFilterType,
      selectedUser: newSelectedUser,
      currentUser: getCurrentUserName()
    };
    
    // 부모 컴포넌트에 필터 정보 전달 (대시보드용 - 하위 호환성)
    if (onFilterChange) {
      onFilterChange(filterConfig);
    }
    
    // Store에 직접 필터 설정 (모든 페이지에서 동작)
    setFilter(filterConfig);
  };

  // 초기 필터 설정 (내 업무만 보기)
  useEffect(() => {
    handleFilterChange('my');
  }, []);

  // 고유한 사용자 목록 생성
  const uniqueUsers = Array.from(new Set(allUsers.filter(Boolean))).sort();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* 필터 옵션 */}
        <div className="flex flex-wrap gap-2">
          {/* 내 업무 */}
          <button
            onClick={() => handleFilterChange('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'my'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">👤</span>
            내 업무
          </button>

          {/* 전체 보기 */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">👥</span>
            전체 보기
          </button>

          {/* 특정 사용자 선택 */}
          {uniqueUsers.length > 1 && (
            <div className="relative">
              <select
                value={filterType === 'user' ? selectedUser : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleFilterChange('user', e.target.value);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filterType === 'user'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <option value="">특정 사용자</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user} className="text-gray-900">
                    {user}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 필터 결과 표시 */}
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {filterType === 'my' && (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                내 업무: {filteredCount}개
              </span>
            )}
            {filterType === 'all' && (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                전체: {filteredCount}개
              </span>
            )}
            {filterType === 'user' && selectedUser && (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                {selectedUser}: {filteredCount}개
              </span>
            )}
            <span className="text-gray-400">
              (총 {totalCount}개 중)
            </span>
          </div>
        </div>
      </div>

      {/* 현재 필터 상태 안내 */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {filterType === 'my' && (
            <>
              <span className="font-medium text-indigo-600">{getCurrentUserName()}</span>
              님이 작성한 업무만 표시됩니다.
            </>
          )}
          {filterType === 'all' && (
            '모든 구성원의 업무가 표시됩니다.'
          )}
          {filterType === 'user' && selectedUser && (
            <>
              <span className="font-medium text-purple-600">{selectedUser}</span>
              님이 작성한 업무만 표시됩니다.
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkFilterBar;