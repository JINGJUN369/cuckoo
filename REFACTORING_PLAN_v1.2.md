# v1.2 리팩토링 계획서 📋

## 현재 구조 분석

### 기존 시스템 (v1.1)
- **라우팅 방식**: 상태 기반 뷰 전환 (`ui.currentView`)
- **인증 시스템**: Supabase 기반 인증
- **데이터 관리**: Context API + useReducer 패턴
- **페이지 구조**: 단일 AppRouter에서 모든 뷰 관리

### 주요 문제점
1. **URL과 뷰 상태 불일치**: 브라우저 새로고침 시 상태 손실
2. **SEO 문제**: SPA의 단점, URL 기반 페이지 분리 없음
3. **뒤로가기/앞으로가기**: 브라우저 히스토리 지원 부족
4. **직접 URL 접근**: 특정 페이지로 직접 접근 불가능

## v1.2 목표 아키텍처

### 새로운 URL 구조
```
/                   - 메인/대시보드 페이지
/login             - 로그인 페이지  
/dashboard         - 대시보드 페이지 (프로젝트 요약)
/projects          - 프로젝트 목록 페이지
/projects/:id      - 프로젝트 상세 페이지
/projects/:id/edit - 프로젝트 편집 페이지
/calendar          - 달력 페이지
/completed         - 완료된 프로젝트
/admin             - 관리자 대시보드
/admin/users       - 사용자 관리
/admin/logs        - 활동 로그
/admin/security    - 보안 설정
```

### 페이지별 기능 요구사항

#### 1. 로그인 페이지 (`/login`)
**기능**: 인증 관련 기능
- 사용자 로그인
- 회원가입 연결
- 비밀번호 초기화
- 자동 로그인 (Remember Me)

**컴포넌트**: `LoginPage_v1.2.jsx`

#### 2. 대시보드 페이지 (`/dashboard`)  
**기능**: 메인 데이터 표시 및 요약
- 전체 프로젝트 진행률 요약
- 마감일 임박 프로젝트 알림
- 최근 활동 피드
- 빠른 작업 버튼 (새 프로젝트 생성, 캘린더 보기)
- 중요 의견 및 알림

**컴포넌트**: `DashboardPage_v1.2.jsx`

#### 3. 프로젝트 목록 페이지 (`/projects`)
**기능**: 프로젝트 목록 및 관리
- 프로젝트 목록 표시 (카드 뷰)
- 검색 및 필터링
- 정렬 기능
- 새 프로젝트 생성
- 프로젝트 상태별 필터

**컴포넌트**: `ProjectListPage_v1.2.jsx`

#### 4. 프로젝트 상세 페이지 (`/projects/:id`)
**기능**: 개별 프로젝트 상세 정보
- 프로젝트 상세 정보 표시
- 3단계 진행 상황
- 의견 시스템 (댓글)
- 파일 첨부 관리
- 관련 일정 표시

**컴포넌트**: `ProjectDetailPage_v1.2.jsx`

#### 5. 프로젝트 편집 페이지 (`/projects/:id/edit`)
**기능**: 프로젝트 정보 수정
- 프로젝트 기본 정보 수정
- 단계별 데이터 입력/수정
- 실시간 유효성 검사
- 변경사항 추적

**컴포넌트**: `ProjectEditPage_v1.2.jsx`

#### 6. 달력 페이지 (`/calendar`)
**기능**: 일정/스케줄 관리
- 월간/주간 달력 뷰
- 프로젝트 마감일 표시
- 일정 추가/편집/삭제
- 알림 설정
- 이벤트 필터링

**컴포넌트**: `CalendarPage_v1.2.jsx`

## 기술적 구현 방안

### 1. React Router 도입
```bash
npm install react-router-dom
```

### 2. 새로운 라우팅 구조
```javascript
// App_v1.2.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        // ... 추가 라우트
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. 데이터 공유 방안
- **전역 상태**: Context API 유지 (프로젝트 데이터, 인증)
- **URL 파라미터**: 프로젝트 ID 등 동적 데이터
- **쿼리 스트링**: 필터, 검색어 등 UI 상태
- **Local Storage**: 사용자 설정, 임시 데이터

### 4. 인증 보호 라우트
```javascript
// ProtectedRoute_v1.2.jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSupabaseAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

## 마이그레이션 전략

### Phase 1: 기반 구조 준비
1. React Router 설치 및 기본 라우팅 구조 구축
2. 기존 v1.1 컴포넌트를 페이지 단위로 재구성
3. 인증 보호 시스템 구축

### Phase 2: 페이지별 마이그레이션
1. 로그인 페이지 (가장 독립적)
2. 대시보드 페이지 (데이터 요약)
3. 프로젝트 목록 페이지
4. 프로젝트 상세/편집 페이지
5. 달력 페이지

### Phase 3: 최적화 및 테스트
1. URL 동기화 및 브라우저 히스토리 지원
2. SEO 메타데이터 추가
3. 성능 최적화 (Code Splitting)
4. 전체 시스템 테스트

## 호환성 계획
- v1.1과 v1.2 병행 운영 가능한 구조
- 단계적 마이그레이션으로 서비스 중단 최소화
- 기존 데이터 구조 유지

## 예상 이익
1. **사용자 경험 개선**: 브라우저 네비게이션 지원
2. **SEO 향상**: 페이지별 URL 분리
3. **개발 생산성**: 페이지 단위 개발 및 테스트
4. **유지보수성**: 명확한 책임 분리
5. **확장성**: 새로운 페이지 추가 용이

## 위험 요소 및 대응
- **복잡성 증가**: 점진적 마이그레이션으로 대응
- **상태 관리 복잡화**: Context API 구조 최적화
- **번들 크기 증가**: Code Splitting으로 대응

## 일정 계획
- **주차 1**: Phase 1 (기반 구조)
- **주차 2-3**: Phase 2 (페이지 마이그레이션)  
- **주차 4**: Phase 3 (최적화 및 테스트)

이 계획을 통해 v1.2에서는 현대적인 SPA 구조를 유지하면서도 전통적인 웹 애플리케이션의 장점을 결합한 하이브리드 구조를 구축할 예정입니다.