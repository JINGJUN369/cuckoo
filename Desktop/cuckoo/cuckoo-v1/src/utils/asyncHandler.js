/**
 * 비동기 함수 처리를 위한 공통 유틸리티
 * 
 * 이 파일은 애플리케이션 전반에서 발생하는 로딩 상태 문제를 근본적으로 해결하기 위한
 * 공통 유틸리티 함수들을 제공합니다.
 * 
 * 주요 기능:
 * - 자동 로딩 상태 관리
 * - 에러 처리 표준화
 * - Promise 반환 보장
 * - 타임아웃 처리
 */

/**
 * 비동기 함수를 래핑하여 표준화된 에러 처리와 로딩 상태 관리를 제공
 * 
 * @param {Function} asyncFn - 실행할 비동기 함수
 * @param {Object} options - 설정 옵션
 * @param {Function} options.setLoading - 로딩 상태 설정 함수
 * @param {Function} options.setError - 에러 상태 설정 함수  
 * @param {number} options.timeout - 타임아웃 시간 (ms)
 * @param {boolean} options.showSuccess - 성공 시 콘솔 로그 표시 여부
 * @param {string} options.operationName - 작업명 (로깅용)
 * @returns {Function} 래핑된 비동기 함수
 */
export const withAsyncHandler = (asyncFn, options = {}) => {
  const {
    setLoading,
    setError,
    timeout = 30000, // 30초 기본 타임아웃
    showSuccess = true,
    operationName = 'Operation'
  } = options;

  return async (...args) => {
    // 로딩 시작
    if (setLoading) setLoading(true);
    if (setError) setError(null);

    try {
      console.log(`🚀 [AsyncHandler] ${operationName} started`);

      // 타임아웃 처리
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeout}ms`)), timeout);
      });

      // 실제 함수 실행 (타임아웃과 경쟁)
      const result = await Promise.race([
        asyncFn(...args),
        timeoutPromise
      ]);

      if (showSuccess) {
        console.log(`✅ [AsyncHandler] ${operationName} completed successfully`, result);
      }

      return result;

    } catch (error) {
      console.error(`❌ [AsyncHandler] ${operationName} failed:`, error);
      
      if (setError) {
        const errorMessage = error.message || `${operationName} 중 오류가 발생했습니다.`;
        setError(errorMessage);
      }
      
      // 에러를 다시 throw하여 호출자가 처리할 수 있도록 함
      throw error;
      
    } finally {
      // 로딩 종료
      if (setLoading) setLoading(false);
    }
  };
};

/**
 * useCallback과 함께 사용할 수 있는 비동기 핸들러
 * 
 * @param {Function} asyncFn - 실행할 비동기 함수
 * @param {Array} dependencies - useCallback 의존성 배열
 * @param {Object} options - withAsyncHandler 옵션
 * @returns {Function} useCallback으로 래핑된 비동기 함수
 */
export const useAsyncCallback = (asyncFn, dependencies, options = {}) => {
  const { useCallback } = require('react');
  
  return useCallback(
    withAsyncHandler(asyncFn, options),
    dependencies
  );
};

/**
 * 폼 제출용 특화된 비동기 핸들러
 * 
 * @param {Function} submitFn - 제출 함수
 * @param {Object} formState - 폼 상태 객체 { isSubmitting, setIsSubmitting, setErrors }
 * @param {Object} options - 추가 옵션
 * @returns {Function} 폼 제출 핸들러
 */
export const createFormSubmitHandler = (submitFn, formState, options = {}) => {
  const { isSubmitting, setIsSubmitting, setErrors } = formState;
  const { validateFn, onSuccess, onError, operationName = 'Form submission' } = options;

  return async (event, ...args) => {
    // 이벤트 처리
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    // 중복 제출 방지
    if (isSubmitting) {
      console.warn(`⚠️ [FormHandler] ${operationName} already in progress`);
      return;
    }

    // 유효성 검사
    if (validateFn && !validateFn()) {
      console.warn(`⚠️ [FormHandler] ${operationName} validation failed`);
      return;
    }

    setIsSubmitting(true);
    if (setErrors) setErrors({});

    try {
      console.log(`🚀 [FormHandler] ${operationName} started`);
      
      const result = await submitFn(...args);
      
      console.log(`✅ [FormHandler] ${operationName} completed successfully`);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;

    } catch (error) {
      console.error(`❌ [FormHandler] ${operationName} failed:`, error);
      
      if (setErrors) {
        setErrors({ submit: error.message || `${operationName} 중 오류가 발생했습니다.` });
      }
      
      if (onError) {
        onError(error);
      }
      
      throw error;
      
    } finally {
      setIsSubmitting(false);
    }
  };
};

/**
 * API 호출용 표준화된 래퍼
 * 
 * @param {Function} apiFn - API 호출 함수
 * @param {Object} options - 옵션
 * @returns {Function} 래핑된 API 함수
 */
export const withApiHandler = (apiFn, options = {}) => {
  const { retries = 3, retryDelay = 1000 } = options;

  return withAsyncHandler(
    async (...args) => {
      let lastError;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await apiFn(...args);
        } catch (error) {
          lastError = error;
          
          if (attempt < retries) {
            console.warn(`⚠️ [ApiHandler] Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      throw lastError;
    },
    {
      ...options,
      operationName: options.operationName || 'API call'
    }
  );
};

/**
 * 프로미스가 항상 반환되도록 보장하는 래퍼
 * 
 * @param {Function} fn - 래핑할 함수
 * @returns {Function} Promise를 반환하는 함수
 */
export const ensurePromise = (fn) => {
  return async (...args) => {
    try {
      const result = await fn(...args);
      // undefined나 null을 반환하는 경우 명시적으로 처리
      return result !== undefined ? result : null;
    } catch (error) {
      // 에러가 발생하면 반드시 throw
      throw error;
    }
  };
};

/**
 * 로딩 상태 디버깅을 위한 헬퍼
 */
export const debugAsyncState = (componentName, state) => {
  console.log(`🔍 [AsyncDebug] ${componentName} state:`, {
    loading: state.loading || state.isSubmitting || false,
    error: state.error,
    timestamp: new Date().toISOString()
  });
};

/**
 * 사용 예시:
 * 
 * // 1. 기본 사용법
 * const handleSubmit = withAsyncHandler(async (data) => {
 *   return await apiCall(data);
 * }, {
 *   setLoading: setIsSubmitting,
 *   setError: setErrors,
 *   operationName: 'Project creation'
 * });
 * 
 * // 2. 폼 제출용
 * const handleFormSubmit = createFormSubmitHandler(
 *   async (data) => await createProject(data),
 *   { isSubmitting, setIsSubmitting, setErrors },
 *   { validateFn: () => validateForm(), operationName: 'Create project' }
 * );
 * 
 * // 3. useCallback과 함께
 * const handleAsync = useAsyncCallback(
 *   async (id) => await updateProject(id),
 *   [updateProject],
 *   { operationName: 'Update project' }
 * );
 */