import React from 'react';

const ProgressChart = ({ data }) => {
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
  const labels = Object.keys(data);
  const values = Object.values(data);
  const total = values.reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>프로젝트가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Bar Chart */}
      <div className="space-y-3">
        {labels.map((label, index) => {
          const value = values[index];
          const percentage = total > 0 ? (value / total) * 100 : 0;
          
          return (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-16 text-sm font-medium text-gray-700">
                  {label}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colors[index],
                    }}
                  />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900">
                  {value}개
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
        {labels.map((label, index) => (
          <div key={label} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">{total}개</span>의 활성 프로젝트
        </p>
      </div>
    </div>
  );
};

export default ProgressChart;