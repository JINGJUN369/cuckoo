// 실시간 의견 게시판 컴포넌트
import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeOpinions } from '../../hooks/useRealtimeOpinions';
import { useHybridAuth } from '../../hooks/useHybridAuth';

const RealtimeOpinionBoard = ({ projectId, isCompletedProject = false }) => {
  const { user } = useHybridAuth();
  const {
    opinions,
    isConnected,
    connectionStatus,
    activeUsers,
    typingUsers,
    addOpinion,
    updateOpinion,
    broadcastTyping,
    broadcastStopTyping,
    reconnect
  } = useRealtimeOpinions(projectId);

  // 폼 상태
  const [newOpinion, setNewOpinion] = useState({
    message: '',
    stage: 'general',
    priority: 'medium'
  });
  const [editingOpinion, setEditingOpinion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 타이핑 상태 관리
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // 입력 핸들러 (타이핑 알림 포함)
  const handleInputChange = (field, value) => {
    if (field === 'message') {
      setNewOpinion(prev => ({ ...prev, [field]: value }));
      
      // 타이핑 상태 브로드캐스트
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        broadcastTyping();
      }
      
      // 타이핑 중지 타이머 설정
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          broadcastStopTyping();
        }
      }, 1000);
    } else {
      setNewOpinion(prev => ({ ...prev, [field]: value }));
    }
  };

  // 의견 제출
  const handleSubmitOpinion = async (e) => {
    e.preventDefault();
    
    if (!newOpinion.message.trim()) {
      alert('의견 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const opinionData = {
        ...newOpinion,
        projectId: projectId,
        projectIsCompleted: isCompletedProject,
        authorName: user?.name || '익명',
        createdBy: user?.id || 'anonymous',
        updatedBy: user?.id || 'anonymous'
      };

      const result = await addOpinion(opinionData);
      
      if (result.success) {
        // 폼 리셋
        setNewOpinion({
          message: '',
          stage: 'general',
          priority: 'medium'
        });
        
        // 타이핑 중지 알림
        if (isTyping) {
          setIsTyping(false);
          broadcastStopTyping();
        }
        
        console.log('✅ 의견 작성 완료:', result.data.id);
      } else {
        alert('의견 작성에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('의견 작성 오류:', error);
      alert('의견 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 의견 상태 업데이트
  const handleUpdateOpinionStatus = async (opinionId, newStatus) => {
    try {
      const result = await updateOpinion(opinionId, { 
        status: newStatus,
        updatedBy: user?.id || 'anonymous'
      });
      
      if (result.success) {
        console.log('✅ 의견 상태 업데이트:', opinionId, newStatus);
      } else {
        alert('상태 업데이트에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      alert('상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 답변 추가
  const handleAddReply = async (opinionId, replyText) => {
    if (!replyText.trim()) return;
    
    try {
      const result = await updateOpinion(opinionId, {
        reply: replyText,
        status: 'resolved',
        updatedBy: user?.id || 'anonymous'
      });
      
      if (result.success) {
        setEditingOpinion(null);
        console.log('✅ 답변 추가 완료:', opinionId);
      } else {
        alert('답변 추가에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('답변 추가 오류:', error);
      alert('답변 추가 중 오류가 발생했습니다.');
    }
  };

  // 연결 상태 표시 컴포넌트
  const ConnectionStatus = () => (
    <div className={`flex items-center space-x-2 text-sm ${
      isConnected ? 'text-green-600' : 'text-red-600'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span>
        {connectionStatus === 'connected' ? '실시간 연결됨' : 
         connectionStatus === 'connecting' ? '연결 중...' :
         connectionStatus === 'error' ? '연결 오류' :
         connectionStatus === 'timeout' ? '연결 시간 초과' :
         '연결 끊김'}
      </span>
      {!isConnected && (
        <button
          onClick={reconnect}
          className="text-blue-600 hover:text-blue-800 underline ml-2"
        >
          재연결
        </button>
      )}
    </div>
  );

  // 활성 사용자 표시 컴포넌트
  const ActiveUsers = () => {
    if (activeUsers.length === 0) return null;
    
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>👥 현재 보고 있는 사용자:</span>
        <div className="flex items-center space-x-1">
          {activeUsers.slice(0, 5).map(activeUser => (
            <div
              key={activeUser.id}
              className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
              title={`${activeUser.name} (${activeUser.role})`}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs">{activeUser.name}</span>
            </div>
          ))}
          {activeUsers.length > 5 && (
            <span className="text-xs text-gray-500">
              +{activeUsers.length - 5}명
            </span>
          )}
        </div>
      </div>
    );
  };

  // 타이핑 상태 표시 컴포넌트
  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <div className="text-sm text-gray-500 italic flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <span>
          {typingUsers.length === 1 ? 
            `${typingUsers[0].name}님이 입력 중...` :
            `${typingUsers.length}명이 입력 중...`
          }
        </span>
      </div>
    );
  };

  // 의견 아이템 컴포넌트
  const OpinionItem = ({ opinion }) => {
    const [replyText, setReplyText] = useState(opinion.reply || '');
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const handleReplySubmit = (e) => {
      e.preventDefault();
      handleAddReply(opinion.id, replyText);
      setShowReplyForm(false);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
        {/* 의견 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">{opinion.authorName}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                opinion.stage === 'stage1' ? 'bg-blue-100 text-blue-800' :
                opinion.stage === 'stage2' ? 'bg-green-100 text-green-800' :
                opinion.stage === 'stage3' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {opinion.stage === 'general' ? '일반' : 
                 opinion.stage === 'stage1' ? 'Stage 1' :
                 opinion.stage === 'stage2' ? 'Stage 2' :
                 opinion.stage === 'stage3' ? 'Stage 3' : opinion.stage}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                opinion.priority === 'critical' ? 'bg-red-100 text-red-800' :
                opinion.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                opinion.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {opinion.priority === 'critical' ? '긴급' :
                 opinion.priority === 'high' ? '높음' :
                 opinion.priority === 'low' ? '낮음' : '보통'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {new Date(opinion.createdAt).toLocaleString()}
            </span>
            
            {/* 상태 변경 버튼 */}
            {user?.role === 'admin' || opinion.createdBy === user?.id ? (
              <select
                value={opinion.status || 'open'}
                onChange={(e) => handleUpdateOpinionStatus(opinion.id, e.target.value)}
                className={`text-xs px-2 py-1 rounded border ${
                  opinion.status === 'open' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  opinion.status === 'resolved' ? 'bg-green-50 border-green-200 text-green-800' :
                  'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <option value="open">진행중</option>
                <option value="resolved">해결됨</option>
                <option value="closed">종료됨</option>
              </select>
            ) : (
              <span className={`text-xs px-2 py-1 rounded ${
                opinion.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                opinion.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {opinion.status === 'open' ? '진행중' :
                 opinion.status === 'resolved' ? '해결됨' : '종료됨'}
              </span>
            )}
          </div>
        </div>

        {/* 의견 내용 */}
        <div className="mb-3">
          <p className="text-gray-900 whitespace-pre-wrap">{opinion.message}</p>
        </div>

        {/* 답변 영역 */}
        {opinion.reply && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
            <div className="text-sm text-blue-800 font-medium mb-1">답변:</div>
            <p className="text-blue-900 whitespace-pre-wrap">{opinion.reply}</p>
          </div>
        )}

        {/* 답변 작성 폼 */}
        {!opinion.reply && (user?.role === 'admin' || opinion.createdBy === user?.id) && (
          <div className="border-t pt-3">
            {!showReplyForm ? (
              <button
                onClick={() => setShowReplyForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                💬 답변 작성
              </button>
            ) : (
              <form onSubmit={handleReplySubmit} className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    답변 추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 상태 헤더 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">💬 실시간 의견 게시판</h3>
          <ConnectionStatus />
        </div>
        
        <ActiveUsers />
        {typingUsers.length > 0 && (
          <div className="mt-2">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* 의견 작성 폼 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-4">새 의견 작성</h4>
        
        <form onSubmit={handleSubmitOpinion} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단계
              </label>
              <select
                value={newOpinion.stage}
                onChange={(e) => handleInputChange('stage', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">일반</option>
                <option value="stage1">Stage 1 - 기본정보</option>
                <option value="stage2">Stage 2 - 생산준비</option>
                <option value="stage3">Stage 3 - 양산준비</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                우선순위
              </label>
              <select
                value={newOpinion.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="critical">긴급</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              의견 내용 *
            </label>
            <textarea
              ref={messageInputRef}
              value={newOpinion.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="의견을 입력하세요... (실시간으로 다른 사용자에게 타이핑 상태가 표시됩니다)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              required
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>작성 중...</span>
                </>
              ) : (
                <>
                  <span>💬</span>
                  <span>의견 작성</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 의견 목록 */}
      <div className="space-y-4">
        {opinions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <div className="text-gray-400 text-4xl mb-2">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 의견이 없습니다</h3>
            <p className="text-gray-600">첫 번째 의견을 작성해보세요!</p>
          </div>
        ) : (
          opinions.map(opinion => (
            <OpinionItem key={opinion.id} opinion={opinion} />
          ))
        )}
      </div>
    </div>
  );
};

export default RealtimeOpinionBoard;