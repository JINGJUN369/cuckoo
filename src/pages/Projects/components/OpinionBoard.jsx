import React, { useState } from 'react';
import { Button, Input } from '../../../components/ui';
import { useProjectStore } from '../../../hooks/useProjectStore';

const OpinionBoard = () => {
  const { state, updateOpinion, setSelectedProject, setCurrentView } = useProjectStore();
  const { projects, opinions } = state;
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyDepartment, setReplyDepartment] = useState('');

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

  // 프로젝트 이름을 가져오는 함수
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '알 수 없는 프로젝트';
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
        case 'project':
          return getProjectName(a.projectId).localeCompare(getProjectName(b.projectId));
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

  const handleProjectClick = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setCurrentView('project-dashboard');
    }
  };

  const handleReplySubmit = (opinionId) => {
    if (!replyContent.trim() || !replyAuthor.trim() || !replyDepartment.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const reply = {
      id: Date.now().toString(),
      content: replyContent.trim(),
      author: replyAuthor.trim(),
      department: replyDepartment.trim(),
      createdAt: new Date().toISOString()
    };

    const opinion = opinions.find(o => o.id === opinionId);
    const updatedReplies = opinion.replies ? [...opinion.replies, reply] : [reply];

    updateOpinion(opinionId, { 
      replies: updatedReplies,
      status: 'reviewed' // 답변이 달리면 검토됨으로 상태 변경
    });

    // 폼 초기화
    setReplyContent('');
    setReplyAuthor('');
    setReplyDepartment('');
    setReplyingTo(null);
  };

  const handleNestedReply = (parentOpinionId, parentReplyId, content, author, department) => {
    const opinion = opinions.find(o => o.id === parentOpinionId);
    const updatedReplies = opinion.replies.map(reply => {
      if (reply.id === parentReplyId) {
        const nestedReplies = reply.nestedReplies ? [...reply.nestedReplies] : [];
        nestedReplies.push({
          id: Date.now().toString(),
          content: content.trim(),
          author: author.trim(),
          department: department.trim(),
          createdAt: new Date().toISOString()
        });
        return { ...reply, nestedReplies };
      }
      return reply;
    });

    updateOpinion(parentOpinionId, { replies: updatedReplies });
  };

  if (opinions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          등록된 의견이 없습니다
        </h3>
        <p className="text-gray-600">
          프로젝트에서 의견을 등록해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">프로젝트 의견 게시판</h2>
            <p className="text-gray-600 mt-1">
              모든 프로젝트의 의견을 한곳에서 확인하고 소통하세요
            </p>
          </div>
        </div>

        {/* 필터 및 정렬 */}
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
              <option value="project">프로젝트순</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          총 {opinions.length}개 의견 중 {filteredAndSortedOpinions.length}개 표시
        </div>
      </div>

      {/* 의견 목록 */}
      <div className="space-y-6">
        {filteredAndSortedOpinions.map((opinion) => (
          <div key={opinion.id} className="bg-white rounded-lg shadow-sm border">
            {/* 의견 헤더 */}
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
                      <span className="text-xs text-gray-500">
                        ({opinion.department})
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${categories[opinion.category].color}`}>
                        {categories[opinion.category].label}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[opinion.status].color}`}>
                        {statusConfig[opinion.status].label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <button
                        onClick={() => handleProjectClick(opinion.projectId)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {getProjectName(opinion.projectId)}
                      </button>
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
              </div>
            </div>

            {/* 의견 내용 */}
            <div className="px-6 py-4">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {opinion.content}
              </div>
            </div>

            {/* 답변 목록 */}
            {opinion.replies && opinion.replies.length > 0 && (
              <div className="px-6 py-2 bg-gray-50 border-t border-gray-200">
                <div className="space-y-4">
                  {opinion.replies.map((reply) => (
                    <div key={reply.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{reply.author}</span>
                          <span className="text-xs text-gray-500">({reply.department})</span>
                          <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const content = window.prompt('답글 내용을 입력하세요:');
                            const author = window.prompt('작성자 이름을 입력하세요:');
                            const department = window.prompt('부서명을 입력하세요:');
                            if (content && author && department) {
                              handleNestedReply(opinion.id, reply.id, content, author, department);
                            }
                          }}
                          className="text-xs"
                        >
                          답글
                        </Button>
                      </div>
                      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </div>
                      
                      {/* 중첩 답글 */}
                      {reply.nestedReplies && reply.nestedReplies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                          {reply.nestedReplies.map((nestedReply) => (
                            <div key={nestedReply.id} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium text-gray-800">{nestedReply.author}</span>
                                <span className="text-xs text-gray-500">({nestedReply.department})</span>
                                <span className="text-xs text-gray-500">{formatDate(nestedReply.createdAt)}</span>
                              </div>
                              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {nestedReply.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 답변 작성 영역 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              {replyingTo === opinion.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="작성자 이름"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      size="sm"
                    />
                    <Input
                      placeholder="부서명"
                      value={replyDepartment}
                      onChange={(e) => setReplyDepartment(e.target.value)}
                      size="sm"
                    />
                  </div>
                  <textarea
                    placeholder="답변을 입력하세요..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                        setReplyAuthor('');
                        setReplyDepartment('');
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleReplySubmit(opinion.id)}
                    >
                      답변 등록
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {opinion.replies ? `${opinion.replies.length}개의 답변` : '답변이 없습니다'}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyingTo(opinion.id)}
                  >
                    답변 작성
                  </Button>
                </div>
              )}
            </div>
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

export default OpinionBoard;