import React, { useState, useEffect } from 'react';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * CreateWorkModal - 새 업무 추가 모달
 */
const CreateWorkModal = ({ isOpen, onClose }) => {
  const { user, profile } = useSupabaseAuth();
  const { createAdditionalWork, loading } = useWorkStatusStore();
  
  const [formData, setFormData] = useState({
    work_name: '',
    description: '',
    work_owner: profile?.name || user?.name || user?.email || '',
    department: profile?.team || '',
    start_date: '',
    end_date: '',
    duration_days: 0,
    status: '진행중', // 기본 상태
    priority: '보통', // 기본 우선순위
    project_id: null // 프로젝트 연결은 선택사항
  });

  const [errors, setErrors] = useState({});

  // 사용자 정보가 로드되면 폼 데이터 업데이트
  useEffect(() => {
    if (profile || user) {
      setFormData(prev => ({
        ...prev,
        work_owner: profile?.name || user?.name || user?.email || prev.work_owner,
        department: profile?.team || prev.department
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

    // 날짜 입력시 자동으로 기간 계산
    if (name === 'start_date' || name === 'end_date') {
      const startDate = name === 'start_date' ? new Date(value) : new Date(formData.start_date);
      const endDate = name === 'end_date' ? new Date(value) : new Date(formData.end_date);
      
      if (startDate && endDate && startDate <= endDate) {
        const timeDiff = endDate - startDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({
          ...prev,
          duration_days: daysDiff
        }));
      }
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.work_name.trim()) {
      newErrors.work_name = '업무명을 입력해주세요.';
    }
    
    if (!formData.work_owner.trim()) {
      newErrors.work_owner = '업무 담당자를 입력해주세요.';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요.';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = '시작일을 선택해주세요.';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = '종료일을 선택해주세요.';
    }
    
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (startDate > endDate) {
        newErrors.end_date = '종료일은 시작일보다 늦어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // duration_days는 generated column이므로 제외하고 전송
      const { duration_days, ...workDataToSend } = formData;
      await createAdditionalWork(workDataToSend);
      
      // 폼 초기화 및 모달 닫기
      setFormData({
        work_name: '',
        description: '',
        work_owner: profile?.name || user?.name || user?.email || '',
        department: profile?.team || '',
        start_date: '',
        end_date: '',
        duration_days: 0,
        status: '진행중',
        priority: '보통',
        project_id: null
      });
      setErrors({});
      onClose();
      
      console.log('✅ 새 업무가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('❌ 업무 추가 실패:', error);
      setErrors({ submit: error.message || '업무 추가 중 오류가 발생했습니다.' });
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setFormData({
      work_name: '',
      description: '',
      work_owner: profile?.name || user?.name || user?.email || '',
      department: profile?.team || '',
      start_date: '',
      end_date: '',
      duration_days: 0,
      status: '진행중',
      priority: '보통',
      project_id: null
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">➕</span>
              새 업무 추가
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
            {/* 업무명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업무명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="work_name"
                value={formData.work_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.work_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="업무명을 입력하세요"
                disabled={loading}
              />
              {errors.work_name && (
                <p className="mt-1 text-sm text-red-500">{errors.work_name}</p>
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
                placeholder="업무에 대한 자세한 설명을 입력하세요"
                disabled={loading}
              />
            </div>

            {/* 담당자와 부서 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업무 담당자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="work_owner"
                  value={formData.work_owner}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.work_owner ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="담당자 이름 또는 이메일"
                  disabled={loading}
                />
                {errors.work_owner && (
                  <p className="mt-1 text-sm text-red-500">{errors.work_owner}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  부서 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="부서명"
                  disabled={loading}
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-500">{errors.department}</p>
                )}
              </div>
            </div>

            {/* 시작일과 종료일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* 상태와 우선순위 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  <option value="계획중">계획중</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                  <option value="보류">보류</option>
                  <option value="취소">취소</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우선순위
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  <option value="낮음">낮음</option>
                  <option value="보통">보통</option>
                  <option value="높음">높음</option>
                  <option value="긴급">긴급</option>
                </select>
              </div>
            </div>

            {/* 소요 기간 (자동 계산) */}
            {formData.duration_days > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소요 기간
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  총 {formData.duration_days}일
                </div>
              </div>
            )}

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
                  <span className="mr-2">➕</span>
                  업무 추가
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkModal;