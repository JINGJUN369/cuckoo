import React, { useState } from 'react';
import { Button } from '../../../components/ui';

const OpinionList = ({ opinions, onUpdateStatus, onReply }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'reviewed', 'resolved'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'category'

  const categories = {
    general: { label: '일반', color: 'bg-gray-100 text-gray-700' },
    technical: { label: '기술', color: 'bg-blue-100 text-blue-700' },
    schedule: { label: '일정', color: 'bg-yellow-100 text-yellow-700' },
    quality: { label: '품질', color: 'bg-red-100 text-red-700' }
  };

  const statusConfig = {
    open: { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
    reviewed: { label: '검토됨', color: 'bg-blue-100 text-blue-700' },
    resolved: { label: '완료', color: 'bg-green-100 text-green-700' }
  };

  // 의견 필터링 및 정렬
  const filteredAndSortedOpinions = opinions
    .filter(opinion => {
      if (filter === 'all') return true;
      return opinion.status === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (opinions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          등록된 의견이 없습니다
        </h3>
        <p className="text-gray-600">
          이 프로젝트에 대한 첫 번째 의견을 남겨보세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 및 정렬 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">상태:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '전체' },
                { key: 'open', label: '대기중' },
                { key: 'reviewed', label: '검토됨' },
                { key: 'resolved', label: '완료' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="category">카테고리순</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          총 {opinions.length}개 의견 중 {filteredAndSortedOpinions.length}개 표시
        </div>
      </div>

      {/* 의견 목록 */}
      <div className="space-y-4">
        {filteredAndSortedOpinions.map((opinion) => (
          <div key={opinion.id} className="bg-white rounded-lg shadow-sm border">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {opinion.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {opinion.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${categories[opinion.category].color}`}>
                        {categories[opinion.category].label}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[opinion.status].color}`}>
                        {statusConfig[opinion.status].label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span>{opinion.department}</span>
                      <span>•</span>
                      <span>{formatDate(opinion.createdAt)}</span>
                      {opinion.stage && (
                        <>
                          <span>•</span>
                          <span>
                            {opinion.stage === 'stage1' ? '1차 단계' :
                             opinion.stage === 'stage2' ? '2차 단계' :
                             '3차 단계'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center space-x-2">
                  {onUpdateStatus && opinion.status !== 'resolved' && (
                    <div className="flex space-x-1">
                      {opinion.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(opinion.id, 'reviewed')}
                          className="text-xs"
                        >
                          검토완료
                        </Button>
                      )}
                      {opinion.status === 'reviewed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(opinion.id, 'resolved')}
                          className="text-xs"
                        >
                          해결완료
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {onReply && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReply(opinion)}
                      className="text-xs"
                    >
                      답변
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="px-6 py-4">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {opinion.content}
              </div>
            </div>

            {/* 답변이 있는 경우 */}
            {opinion.reply && (
              <div className="px-6 pb-4">
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-indigo-700">관리자 답변</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(opinion.reply.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {opinion.reply.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAndSortedOpinions.length === 0 && filter !== 'all' && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            해당 조건의 의견이 없습니다
          </h3>
          <p className="text-gray-600">
            다른 필터 조건을 시도해보세요
          </p>
        </div>
      )}
    </div>
  );
};

export default OpinionList;