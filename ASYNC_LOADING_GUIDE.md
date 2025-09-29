# 비동기 로딩 상태 관리 가이드

## 문제 상황

프로젝트 전반에서 비슷한 로딩 상태 문제가 반복적으로 발생하고 있었습니다:

1. **의견 등록 시 로딩 상태 해제 안됨**
2. **신규 프로젝트 등록 시 로딩 상태 해제 안됨**
3. **기타 비동기 작업에서 유사한 문제들**

## 근본적인 원인

### 1. Promise 반환 누락
```javascript
// ❌ 잘못된 패턴
const handleSubmit = useCallback(async (data) => {
  try {
    await someAsyncOperation(data);
    setModalOpen(false);
    // return 누락!
  } catch (error) {
    console.error(error);
    // throw 누락!
  }
}, []);
```

### 2. 에러 처리 불일치
- 일부 함수는 에러를 catch하고 throw하지 않음
- 상위 컴포넌트가 Promise 완료를 감지하지 못함
- 결과적으로 `isSubmitting` 상태가 `false`로 변경되지 않음

### 3. 비동기 패턴의 일관성 부족
- 각 컴포넌트마다 다른 에러 처리 방식
- 로딩 상태 관리의 표준화 부족
- Promise chain이 적절히 연결되지 않음

## 해결 방안

### 1. 표준화된 비동기 핸들러 사용

`src/utils/asyncHandler.js`에 공통 유틸리티 함수를 제공합니다:

```javascript
import { createFormSubmitHandler, withAsyncHandler } from '../utils/asyncHandler';

// 폼 제출용
const handleFormSubmit = createFormSubmitHandler(
  async (data) => await createProject(data),
  { isSubmitting, setIsSubmitting, setErrors },
  { 
    validateFn: () => validateForm(), 
    operationName: 'Create project' 
  }
);

// 일반적인 비동기 작업용
const handleAsync = withAsyncHandler(async (data) => {
  return await apiCall(data);
}, {
  setLoading: setIsLoading,
  setError: setError,
  operationName: 'API operation'
});
```

### 2. Promise 체인 올바르게 유지

모든 비동기 함수에서 다음 원칙을 따르세요:

```javascript
// ✅ 올바른 패턴
const handleSubmit = useCallback(async (data) => {
  try {
    const result = await onSubmit(data);
    // 성공 시 결과 반환
    return result;
  } catch (error) {
    // 에러 처리 후 다시 throw
    console.error('Error:', error);
    throw error;
  }
}, [onSubmit]);
```

### 3. 컴포넌트별 적용 가이드

#### 폼 컴포넌트 (Modal, Form 등)
```javascript
const handleSubmit = useCallback(async (e) => {
  e.preventDefault();
  
  if (isSubmitting) return;
  if (!validateForm()) return;

  setIsSubmitting(true);
  setErrors(prev => ({ ...prev, submit: null }));

  try {
    const result = await onSubmit(formData);
    
    // 성공 시 폼 초기화
    if (mode === 'create') {
      setFormData(initialFormState);
    }
    setErrors({});
    
    return result; // 중요: 결과 반환

  } catch (error) {
    setErrors({ submit: error.message });
    throw error; // 중요: 에러 다시 throw

  } finally {
    setIsSubmitting(false);
  }
}, [isSubmitting, validateForm, onSubmit, formData, mode]);
```

#### 상위 컴포넌트 (List, Detail 등)
```javascript
const handleCreateItem = useCallback(async (itemData) => {
  try {
    const createdItem = await createItem(itemData);
    
    if (createdItem) {
      setShowModal(false);
      setSelectedItem(createdItem);
      setCurrentView('detail');
      return createdItem; // 중요: 결과 반환
    } else {
      throw new Error('생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('Creation error:', error);
    throw error; // 중요: 에러 다시 throw
  }
}, [createItem, setSelectedItem, setCurrentView]);
```

## 체크리스트

새로운 비동기 함수를 작성할 때 다음을 확인하세요:

### ✅ Promise 반환
- [ ] 성공 시 `return result` 또는 명시적 값 반환
- [ ] 실패 시 `throw error` 로 에러 전파

### ✅ 에러 처리
- [ ] try-catch 블록 사용
- [ ] 에러 로깅 후 다시 throw
- [ ] 사용자에게 의미있는 에러 메시지 표시

### ✅ 로딩 상태
- [ ] 시작 시 `setIsLoading(true)` 또는 `setIsSubmitting(true)`
- [ ] finally 블록에서 `setIsLoading(false)` 또는 `setIsSubmitting(false)`

### ✅ 중복 실행 방지
- [ ] 로딩 중일 때 early return
- [ ] 유효성 검사 실패 시 early return

## 기존 코드 수정 방법

1. **문제가 있는 함수 찾기**: 로딩 상태가 해제되지 않는 함수들
2. **Promise 체인 확인**: `return`과 `throw` 누락 확인
3. **표준 패턴 적용**: 위의 가이드대로 수정
4. **테스트**: 성공/실패 케이스 모두 테스트

## 예시: 수정 전후 비교

### 수정 전 (문제가 있는 코드)
```javascript
const handleSubmit = useCallback(async (data) => {
  try {
    const result = await apiCall(data);
    if (result) {
      setModalOpen(false);
      console.log('Success');
      // return 누락!
    }
  } catch (error) {
    console.error(error);
    // throw 누락!
  }
}, []);
```

### 수정 후 (올바른 코드)
```javascript
const handleSubmit = useCallback(async (data) => {
  try {
    const result = await apiCall(data);
    if (result) {
      setModalOpen(false);
      console.log('Success');
      return result; // ✅ 결과 반환
    } else {
      throw new Error('API call failed');
    }
  } catch (error) {
    console.error(error);
    throw error; // ✅ 에러 다시 throw
  }
}, []);
```

이 가이드를 따르면 앞으로 비슷한 로딩 상태 문제가 발생하지 않을 것입니다.