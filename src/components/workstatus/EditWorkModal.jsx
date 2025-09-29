import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import useWorkStatusStore from '../../hooks/useWorkStatusStore';

/**
 * EditWorkModal - 업무 수정 모달
 * 
 * 기능:
 * - 업무 기본 정보 수정
 * - 날짜, 설명, 우선순위 등 변경
 * - 권한 확인 (작성자 본인 또는 관리자만)
 */
const EditWorkModal = ({ isOpen, onClose, work }) => {
  const { user, profile } = useSupabaseAuth();
  const { updateAdditionalWork, loading } = useWorkStatusStore();

  const [formData, setFormData] = useState({
    work_name: '',
    description: '',
    work_owner: '',
    department: '',
    start_date: '',
    end_date: '',
    status: '진행중',
    priority: '보통'
  });

  const [errors, setErrors] = useState({});

  // 폼 초기화
  useEffect(() => {
    if (work && isOpen) {
      setFormData({
        work_name: work.work_name || '',
        description: work.description || '',
        work_owner: work.work_owner || '',
        department: work.department || '',
        start_date: work.start_date || '',
        end_date: work.end_date || '',
        status: work.status || '진행중',
        priority: work.priority || '보통'
      });
      setErrors({});
    }
  }, [work, isOpen]);

  // 폼 데이터 변경 핸들러
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
        [name]: ''
      }));
    }
  };

  // 날짜 유효성 검사
  const validateDates = () => {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (formData.start_date && formData.end_date && startDate > endDate) {
      return '시작일은 종료일보다 이전이어야 합니다.';
    }
    return null;
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.work_name.trim()) {
      newErrors.work_name = '업무명을 입력해주세요.';
    }

    if (!formData.work_owner.trim()) {
      newErrors.work_owner = '담당자를 입력해주세요.';
    }

    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요.';
    }

    const dateError = validateDates();
    if (dateError) {
      newErrors.date_range = dateError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 수정 저장 핸들러
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // duration_days는 Supabase에서 자동 계산되는 generated column이므로 제외
      const updateData = {
        ...formData
      };
      
      // generated column들을 업데이트 데이터에서 제거
      delete updateData.duration_days;

      await updateAdditionalWork(work.id, updateData);
      onClose();
    } catch (error) {
      console.error('업무 수정 실패:', error);
      console.error('오류 메시지:', error?.message);
      console.error('오류 상세:', error?.details);
      console.error('오류 코드:', error?.code);
      console.error('전체 오류 객체:', JSON.stringify(error, null, 2));
      setErrors({ submit: `업무 수정에 실패했습니다: ${error?.message || '알 수 없는 오류'}` });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">업무 수정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSave} className="p-6">
          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 업무명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업무명 *
              </label>
              <input
                type="text"
                name="work_name"
                value={formData.work_name}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.work_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="수정할 업무명을 입력하세요"
              />
              {errors.work_name && (
                <p className="mt-1 text-sm text-red-600">{errors.work_name}</p>
              )}
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자 *
              </label>
              <input
                type="text"
                name="work_owner"
                value={formData.work_owner}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.work_owner ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="담당자명"
              />
              {errors.work_owner && (
                <p className="mt-1 text-sm text-red-600">{errors.work_owner}</p>
              )}
            </div>

            {/* 부서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서 *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.department ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">부서 선택</option>
                <option value="IT개발팀">IT개발팀</option>
                <option value="마케팅팀">마케팅팀</option>
                <option value="영업팀">영업팀</option>
                <option value="관리팀">관리팀</option>
                <option value="고객지원팀">고객지원팀</option>
                <option value="기획팀">기획팀</option>
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>

            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 종료일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="진행중">진행중</option>
                <option value="대기">대기</option>
                <option value="보류">보류</option>
                <option value="완료">완료</option>
              </select>
            </div>

            {/* 우선순위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="낮음">낮음</option>
                <option value="보통">보통</option>
                <option value="높음">높음</option>
                <option value="긴급">긴급</option>
              </select>
            </div>

            {/* 설명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="업무에 대한 상세 설명을 입력하세요"
              />
            </div>

            {/* 날짜 범위 에러 */}
            {errors.date_range && (
              <div className="md:col-span-2">
                <p className="text-sm text-red-600">{errors.date_range}</p>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkModal;