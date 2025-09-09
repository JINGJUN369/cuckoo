import React from 'react';

const ProjectFilters = ({ sortBy, setSortBy, filterStatus, setFilterStatus }) => {
  const sortOptions = [
    { value: 'dday', label: '마감일 순', icon: '📅' },
    { value: 'progress', label: '진행률 순', icon: '📈' },
    { value: 'name', label: '이름 순', icon: '🔤' },
    { value: 'created', label: '생성일 순', icon: '🆕' },
  ];

  const filterOptions = [
    { value: 'all', label: '전체', icon: '📋', count: null },
    { value: 'high-progress', label: '높은 진행률', icon: '🎯', description: '70% 이상' },
    { value: 'low-progress', label: '낮은 진행률', icon: '🔄', description: '30% 미만' },
    { value: 'overdue', label: '지연된 작업', icon: '⚠️', description: '마감일 초과' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
      {/* Sort By */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">정렬:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter By Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">필터:</span>
        <div className="flex gap-1 flex-wrap">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filterStatus === option.value
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
              title={option.description}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
              {option.count !== null && (
                <span className="ml-1 bg-white bg-opacity-50 px-1.5 py-0.5 rounded-full text-xs">
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => {
            setSortBy('dday');
            setFilterStatus('overdue');
          }}
          className="text-xs px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
        >
          🚨 긴급 작업만
        </button>
        <button
          onClick={() => {
            setSortBy('progress');
            setFilterStatus('high-progress');
          }}
          className="text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md border border-green-200 transition-colors"
        >
          ✨ 완료 임박
        </button>
      </div>
    </div>
  );
};

export default ProjectFilters;