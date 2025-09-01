import React from 'react';

const StatCard = ({ title, value, icon, color = 'blue', trend, onClick }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  const trendColorStyles = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trendColorStyles[color]}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorStyles[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;