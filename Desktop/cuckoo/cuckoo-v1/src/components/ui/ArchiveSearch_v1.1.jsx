import React, { useState, useCallback, useMemo } from 'react';
import { Button } from './index';

/**
 * v1.1 ArchiveSearch - 아카이브 고급 검색 및 필터링 컴포넌트
 * 
 * 주요 기능:
 * - 다중 조건 검색
 * - 기간별 필터링 
 * - 진행률/소요기간 범위 필터
 * - 제조사/부서별 필터
 * - 완료 사유별 필터
 * - 저장된 검색 조건
 * - 빠른 필터 프리셋
 */
const ArchiveSearch_v11 = ({
  onSearch = () => {},
  onFilterChange = () => {},
  manufacturers = [],
  departments = [],
  className = ''
}) => {
  console.log('🔍 [v1.1] ArchiveSearch rendering');

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    period: 'all',
    manufacturer: 'all',
    department: 'all',
    completionReason: 'all',
    progressRange: [0, 100],
    durationRange: [0, 1000], // 최대 1000일
    sortBy: 'completedDate',
    sortOrder: 'desc'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);

  // 빠른 필터 프리셋
  const quickFilters = useMemo(() => [
    {
      name: '이번 달 완료',
      icon: '📅',
      filters: { period: 'thisMonth', progressRange: [0, 100] }
    },
    {
      name: '올해 완료',
      icon: '🗓️',
      filters: { period: 'thisYear', progressRange: [0, 100] }
    },
    {
      name: '100% 완료',
      icon: '✅',
      filters: { progressRange: [100, 100], period: 'all' }
    },
    {
      name: '조기 완료',
      icon: '⚡',
      filters: { durationRange: [0, 90], period: 'all' } // 90일 이내
    },
    {
      name: '지연 완료',
      icon: '⏰',
      filters: { durationRange: [180, 1000], period: 'all' } // 180일 이상
    },
    {
      name: '최근 완료',
      icon: '🆕',
      filters: { period: 'thisMonth', sortBy: 'completedDate', sortOrder: 'desc' }
    }
  ], []);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange({
      searchTerm,
      ...updatedFilters
    });
  }, [filters, searchTerm, onFilterChange]);

  // 검색어 업데이트
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
    onSearch(term, filters);
  }, [filters, onSearch]);

  // 빠른 필터 적용
  const applyQuickFilter = useCallback((quickFilter) => {
    const newFilters = { ...filters, ...quickFilter.filters };
    setFilters(newFilters);
    onFilterChange({
      searchTerm,
      ...newFilters
    });
  }, [filters, searchTerm, onFilterChange]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      period: 'all',
      manufacturer: 'all',
      department: 'all',
      completionReason: 'all',
      progressRange: [0, 100],
      durationRange: [0, 1000],
      sortBy: 'completedDate',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    setSearchTerm('');
    onFilterChange({
      searchTerm: '',
      ...defaultFilters
    });
  }, [onFilterChange]);

  // 검색 조건 저장
  const saveCurrentSearch = useCallback(() => {
    const searchName = prompt('검색 조건의 이름을 입력하세요:');
    if (searchName) {
      const newSavedSearch = {
        id: Date.now().toString(),
        name: searchName,
        searchTerm,
        filters,
        createdAt: new Date().toISOString()
      };
      
      const updated = [...savedSearches, newSavedSearch];
      setSavedSearches(updated);
      
      // localStorage에 저장
      try {
        localStorage.setItem('archiveSearches', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save search:', error);
      }
    }
  }, [searchTerm, filters, savedSearches]);

  // 저장된 검색 불러오기
  const loadSavedSearch = useCallback((savedSearch) => {
    setSearchTerm(savedSearch.searchTerm);
    setFilters(savedSearch.filters);
    onFilterChange({
      searchTerm: savedSearch.searchTerm,
      ...savedSearch.filters
    });
  }, [onFilterChange]);

  // 컴포넌트 마운트 시 저장된 검색 조건 로드
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('archiveSearches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="space-y-4">
        {/* 기본 검색 */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="프로젝트명, 모델명, 담당자, 제조사 검색..."
              value={searchTerm}
              onChange={(e) => updateSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '간단히' : '고급검색'}
            </Button>
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              초기화
            </Button>
          </div>
        </div>

        {/* 빠른 필터 */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map(filter => (
            <button
              key={filter.name}
              onClick={() => applyQuickFilter(filter)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center space-x-1"
            >
              <span>{filter.icon}</span>
              <span>{filter.name}</span>
            </button>
          ))}
        </div>

        {/* 고급 검색 옵션 */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* 기간 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">완료 기간</label>
              <select
                value={filters.period}
                onChange={(e) => updateFilters({ period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체 기간</option>
                <option value="thisMonth">이번 달</option>
                <option value="thisYear">올해</option>
                <option value="lastYear">작년</option>
              </select>
            </div>

            {/* 제조사 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
              <select
                value={filters.manufacturer}
                onChange={(e) => updateFilters({ manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>

            {/* 부서 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
              <select
                value={filters.department}
                onChange={(e) => updateFilters({ department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                {departments.map(department => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            {/* 완료 사유 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">완료 사유</label>
              <select
                value={filters.completionReason}
                onChange={(e) => updateFilters({ completionReason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="normal_completion">정상 완료</option>
                <option value="early_completion">조기 완료</option>
                <option value="forced_completion">강제 완료</option>
                <option value="milestone_completion">마일스톤 완료</option>
              </select>
            </div>

            {/* 진행률 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                진행률 범위: {filters.progressRange[0]}% - {filters.progressRange[1]}%
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.progressRange[0]}
                  onChange={(e) => updateFilters({ 
                    progressRange: [parseInt(e.target.value), filters.progressRange[1]]
                  })}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.progressRange[1]}
                  onChange={(e) => updateFilters({ 
                    progressRange: [filters.progressRange[0], parseInt(e.target.value)]
                  })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* 소요기간 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소요기간: {filters.durationRange[0]}일 - {filters.durationRange[1]}일
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={filters.durationRange[0]}
                  onChange={(e) => updateFilters({ 
                    durationRange: [parseInt(e.target.value), filters.durationRange[1]]
                  })}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={filters.durationRange[1]}
                  onChange={(e) => updateFilters({ 
                    durationRange: [filters.durationRange[0], parseInt(e.target.value)]
                  })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* 정렬 옵션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">정렬:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="completedDate">완료일</option>
                <option value="name">프로젝트명</option>
                <option value="progress">진행률</option>
                <option value="duration">소요기간</option>
                <option value="manufacturer">제조사</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">순서:</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilters({ sortOrder: e.target.value })}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>

          {/* 검색 저장 */}
          <div className="flex items-center space-x-2">
            {savedSearches.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const savedSearch = savedSearches.find(s => s.id === e.target.value);
                    if (savedSearch) {
                      loadSavedSearch(savedSearch);
                    }
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue=""
              >
                <option value="">저장된 검색</option>
                {savedSearches.map(saved => (
                  <option key={saved.id} value={saved.id}>
                    {saved.name}
                  </option>
                ))}
              </select>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveCurrentSearch}
            >
              💾 저장
            </Button>
          </div>
        </div>

        {/* 활성 필터 표시 */}
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              <span>검색: "{searchTerm}"</span>
              <button
                onClick={() => updateSearchTerm('')}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </div>
          )}
          
          {filters.period !== 'all' && (
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <span>기간: {
                filters.period === 'thisMonth' ? '이번 달' :
                filters.period === 'thisYear' ? '올해' :
                filters.period === 'lastYear' ? '작년' : filters.period
              }</span>
              <button
                onClick={() => updateFilters({ period: 'all' })}
                className="hover:text-green-900"
              >
                ×
              </button>
            </div>
          )}
          
          {filters.manufacturer !== 'all' && (
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span>제조사: {filters.manufacturer}</span>
              <button
                onClick={() => updateFilters({ manufacturer: 'all' })}
                className="hover:text-purple-900"
              >
                ×
              </button>
            </div>
          )}
          
          {(filters.progressRange[0] !== 0 || filters.progressRange[1] !== 100) && (
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              <span>진행률: {filters.progressRange[0]}%-{filters.progressRange[1]}%</span>
              <button
                onClick={() => updateFilters({ progressRange: [0, 100] })}
                className="hover:text-orange-900"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveSearch_v11;