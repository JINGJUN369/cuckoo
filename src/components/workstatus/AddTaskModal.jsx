import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * AddTaskModal - 세부업무 추가 모달
 */
const AddTaskModal = ({ isOpen, onClose, workId }) => {
  const { user, profile } = useSupabaseAuth();
  const { addDetailTask, loading } = useWorkStatusStore();
  
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    assigned_to: profile?.name || user?.name || user?.email || '',
    status: '대기',
    progress_content: '',
    end_date: ''
  });

  const [errors, setErrors] = useState({});

  // 사용자 정보가 로드되면 담당자 자동 설정
  useEffect(() => {
    if (profile || user) {
      setFormData(prev => ({
        ...prev,
        assigned_to: profile?.name || user?.name || user?.email || prev.assigned_to
      }));
    }
  }, [profile, user]);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.task_name.trim()) {
      newErrors.task_name = '세부업무명을 입력해주세요.';
    }
    
    // assignee 필드 제거됨
    // if (!formData.assignee.trim()) {
    //   newErrors.assignee = '담당자를 입력해주세요.';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await addDetailTask(workId, formData);
      
      // 폼 초기화 및 모달 닫기
      setFormData({
        task_name: '',
        description: '',
        assigned_to: profile?.name || user?.name || user?.email || '',
        status: '대기',
        progress_content: '',
        end_date: ''
      });
      setErrors({});
      onClose();
      
      console.log('✅ 새 세부업무가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('❌ 세부업무 추가 실패:', error);
      setErrors({ submit: error.message || '세부업무 추가 중 오류가 발생했습니다.' });
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setFormData({
      task_name: '',
      description: '',
      assigned_to: profile?.name || user?.name || user?.email || '',
      status: '대기',
      progress_content: '',
      end_date: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📝</span>
              세부업무 추가
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* 세부업무명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세부업무명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="task_name"
                value={formData.task_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.task_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="세부업무명을 입력하세요"
                disabled={loading}
              />
              {errors.task_name && (
                <p className="mt-1 text-sm text-red-500">{errors.task_name}</p>
              )}
            </div>

            {/* 업무 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업무 설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="세부업무에 대한 자세한 설명을 입력하세요"
                disabled={loading}
              />
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                초기 상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              >
                <option value="대기">대기</option>
                <option value="진행">진행</option>
                <option value="완료">완료</option>
                <option value="보류">보류</option>
                <option value="피드백">피드백</option>
              </select>
            </div>

            {/* 담당자와 마감일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="담당자 이름"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  마감일
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 초기 진행현황 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                초기 진행현황
              </label>
              <textarea
                name="progress_content"
                value={formData.progress_content}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="현재 진행현황을 입력하세요 (선택사항)"
                disabled={loading}
              />
            </div>

            {/* 전체 에러 메시지 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              </div>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={`px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  추가 중...
                </>
              ) : (
                <>
                  <span className="mr-2">📝</span>
                  세부업무 추가
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;