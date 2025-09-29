# 📋 Supabase 단계적 전환 계획서

**현재 상황:** LocalStorage 기반 완전 작동 시스템  
**목표:** Supabase 백엔드로 안전한 단계적 전환  
**전략:** 이중 운영 → 점진적 전환 → 완전 이관  

---

## 🛡️ 0단계: 사전 준비 및 백업 (완료)
- [x] LocalStorage 완전 백업 생성
- [ ] 비상 복원 스크립트 준비  
- [ ] 현재 데이터 구조 완전 분석

---

## 🔍 1단계: 현재 시스템 분석 (1일)

### 1-1. LocalStorage 데이터 구조 분석
```javascript
// 분석할 데이터 타입들
- projects: 프로젝트 메인 데이터 (stage1, stage2, stage3)
- users: 사용자 계정 정보 (role, team, name)
- opinions: 프로젝트별 의견/댓글 시스템
- pendingUsers: 승인 대기 사용자
- publicReports: 공개 보고서 시스템
- completedProjects: 완료된 프로젝트
```

### 1-2. 기존 Supabase 테이블 정리
- [ ] 기존 테이블 구조 확인
- [ ] 불필요한 테이블/데이터 삭제
- [ ] 스키마 초기화

---

## 🗂️ 2단계: 새로운 스키마 설계 (1일)

### 2-1. LocalStorage → Supabase 매핑 설계
```sql
-- 새로운 테이블 구조 (LocalStorage 구조 기반)
profiles: 사용자 프로필 (role, name, team, status)
projects: 프로젝트 (stage1, stage2, stage3 JSONB)
opinions: 의견 시스템
public_reports: 공개 보고서
audit_logs: 활동 로그
```

### 2-2. 관계형 DB 변환 규칙
- LocalStorage 평면 구조 → 정규화된 테이블
- 복합 객체 → JSONB 컬럼 활용
- 사용자 관계 → Foreign Key 연결

---

## 🔧 3단계: Hybrid 시스템 구축 (2일)

### 3-1. 이중 운영 시스템 설정
```javascript
// 전환 모드 설정
const TRANSITION_MODE = {
  LOCALSTORAGE_ONLY: 'local',    // 현재 상태
  HYBRID: 'hybrid',              // 이중 운영
  SUPABASE_ONLY: 'supabase'      // 최종 목표
};

// 환경변수로 제어
REACT_APP_DATA_MODE=hybrid
```

### 3-2. Data Access Layer 생성
```javascript
// 통합 데이터 접근 레이어
class DataManager {
  async getProjects() {
    if (mode === 'local') return getFromLocalStorage();
    if (mode === 'hybrid') return await getFromBoth();
    if (mode === 'supabase') return await getFromSupabase();
  }
}
```

---

## 🔌 4단계: Supabase 연결 및 테스트 (1일)

### 4-1. Supabase 클라이언트 설정
- [ ] 환경변수 확인 (.env.local)
- [ ] Supabase 클라이언트 초기화
- [ ] 연결 테스트 스크립트 실행

### 4-2. RLS 정책 단계적 적용
```sql
-- 1차: RLS 비활성화로 시작
-- 2차: READ 권한만 활성화  
-- 3차: 전체 권한 활성화
```

---

## 👤 5단계: 인증 시스템 하이브리드 전환 (2일)

### 5-1. 인증 Fallback 시스템
```javascript
// 인증 우선순위: Supabase → LocalStorage
const useHybridAuth = () => {
  try {
    return await supabaseAuth.getUser();
  } catch (error) {
    console.warn('Supabase 실패, LocalStorage 사용');
    return getFromLocalStorage();
  }
};
```

### 5-2. 사용자 데이터 동기화
- LocalStorage 사용자 → Supabase profiles 테이블 이관
- 승인 시스템 (pendingUsers) → Supabase 연동
- 역할 관리 (admin/user) 유지

---

## 📊 6단계: 프로젝트 데이터 하이브리드 전환 (3일)

### 6-1. 프로젝트 CRUD 하이브리드 모드
```javascript
const useHybridProjectStore = () => {
  const createProject = async (data) => {
    // 1. Supabase에 저장 시도
    try {
      const result = await supabase.from('projects').insert(data);
      // 2. 성공 시 LocalStorage 동기화
      syncToLocalStorage(result.data);
      return result;
    } catch (error) {
      // 3. 실패 시 LocalStorage만 사용
      return saveToLocalStorage(data);
    }
  };
};
```

### 6-2. 데이터 동기화 시스템
- 양방향 동기화: LocalStorage ↔ Supabase
- 충돌 해결: 최신 updatedAt 우선
- 오프라인 지원: LocalStorage 우선 저장

---

## 💬 7단계: 의견 시스템 전환 (1일)

### 7-1. 의견 데이터 구조 변환
```javascript
// LocalStorage 구조
{
  id: 'uuid',
  projectId: 'project_id',  
  content: 'string',
  author: 'string',
  stage: 'stage1|stage2|stage3'
}

// Supabase 구조 (동일하게 유지)
opinions 테이블: 기존 구조 그대로 활용
```

---

## 🚀 8단계: 점진적 모드 전환 (3일)

### 8-1. 전환 단계별 검증
```javascript
// 1단계: READ 작업만 Supabase
// 2단계: CREATE 작업 추가  
// 3단계: UPDATE 작업 추가
// 4단계: DELETE 작업 추가
// 5단계: 완전 전환
```

### 8-2. 모니터링 시스템
- 에러율 추적
- 응답 속도 비교
- 사용자 피드백 수집

---

## ✅ 9단계: 완전 전환 및 LocalStorage 정리 (1일)

### 9-1. 최종 검증
- [ ] 모든 기능 정상 작동 확인
- [ ] 성능 비교 (LocalStorage vs Supabase)
- [ ] 데이터 무결성 검증

### 9-2. LocalStorage 정리
- [ ] 백업 데이터만 유지
- [ ] 운영 데이터 제거
- [ ] Fallback 코드 제거

---

## 🚨 비상 계획

### 즉시 롤백 조건
1. 사용자 로그인 불가능
2. 데이터 손실 발생  
3. 응답 속도 5초 이상
4. 에러율 10% 이상

### 롤백 방법
```javascript
// 환경변수 변경만으로 즉시 복원
REACT_APP_DATA_MODE=local

// 또는 비상 복원 스크립트 실행
npm run emergency-restore
```

---

## ⏰ 전체 일정

| 단계 | 소요 시간 | 누적 시간 | 위험도 |
|------|----------|-----------|--------|
| 0-1단계 | 1일 | 1일 | 낮음 |
| 2단계 | 1일 | 2일 | 낮음 |  
| 3단계 | 2일 | 4일 | 중간 |
| 4-5단계 | 3일 | 7일 | 높음 |
| 6-7단계 | 4일 | 11일 | 높음 |
| 8-9단계 | 4일 | 15일 | 중간 |

**총 예상 기간: 15일 (3주)**

---

**핵심 전략:** 
1. 🔄 **이중 운영**으로 안전성 확보
2. 🧪 **단계적 검증**으로 위험 최소화  
3. 🚨 **즉시 롤백** 가능한 구조 유지