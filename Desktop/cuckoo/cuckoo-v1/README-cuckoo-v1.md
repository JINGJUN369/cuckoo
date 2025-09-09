# Cuckoo Project Management System v1.0

**백업 생성일**: 2025년 9월 8일  
**버전**: v1.0 (안정화된 무한 리렌더링 해결 버전)  
**백업 위치**: `C:\Users\jeung\Desktop\cuckoo\cuckoo-v1\`  

## 프로젝트 개요

한국 제조업 제품 개발 워크플로우를 위한 **Notion 스타일 디자인 시스템**을 사용하는 프로젝트 관리 시스템입니다.

### 주요 특징

- **3단계 워크플로우**: Stage1(기본정보), Stage2(생산준비), Stage3(양산준비)
- **Supabase 백엔드 통합**: 실시간 데이터 동기화
- **React Router 기반 네비게이션**: URL 기반 라우팅 시스템
- **무한 리렌더링 문제 해결**: React.memo, useCallback, useMemo 최적화 적용
- **한국어 UI**: 제조업 전용 용어 및 필드

## 기술 스택

- **Frontend**: React 18, React Router v6, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **State Management**: React Context API + useReducer
- **최적화**: React.memo, useCallback, useMemo

## 주요 해결된 문제들

### 1. 무한 리렌더링 해결
- `useSupabaseAuth.js`: `isInitialized` 상태 추가, 의존성 배열 최적화
- `Layout_v1.2.jsx`: React.memo, 콜백 함수 최적화
- `useSupabaseProjectStore.js`: useEffect 의존성 최적화

### 2. React Hook 규칙 준수
- JSX 내부 useCallback 사용 → 컴포넌트 상단에서 미리 정의
- "Rendered more hooks than during the previous render" 오류 해결

### 3. Supabase API 통합
- 새로운 API 키 적용: `wuofrondwyzhacwcbkxe.supabase.co`
- 환경 변수 최신화

## 파일 구조

```
cuckoo-v1/
├── src/
│   ├── components/
│   │   ├── layout/Layout_v1.2.jsx (최적화됨)
│   │   └── ui/ (UI 컴포넌트들)
│   ├── hooks/
│   │   ├── useSupabaseAuth.js (최적화됨)
│   │   └── useSupabaseProjectStore.js (최적화됨)
│   ├── pages/ (v1.2 페이지들)
│   └── lib/supabase.js
├── package.json
├── .env.local (Supabase 설정)
└── CLAUDE.md (개발 가이드)
```

## 실행 방법

1. 프로젝트 폴더로 이동:
   ```bash
   cd "C:\Users\jeung\Desktop\cuckoo\cuckoo-v1"
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 환경 변수 확인 (`.env.local`):
   ```
   REACT_APP_SUPABASE_URL=https://wuofrondwyzhacwcbkxe.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
   ```

4. 개발 서버 실행:
   ```bash
   npm start
   # 또는 특정 포트에서 실행
   PORT=3003 npm start
   ```

## 주요 컴포넌트

### 인증 시스템
- **useSupabaseAuth**: 사용자 인증, 세션 관리
- **LoginPage_v1.2**: 로그인 페이지 (React Router 기반)

### 프로젝트 관리
- **useSupabaseProjectStore**: 프로젝트 상태 관리
- **ProjectListPage_v1.2**: 프로젝트 목록
- **ProjectDetailPage_v1.2**: 프로젝트 상세보기
- **ProjectEditPage_v1.2**: 프로젝트 편집

### 레이아웃
- **Layout_v1.2**: 공통 레이아웃 (사이드바, 헤더, 푸터)
- **BrandHeader**: 브랜드 헤더
- **Footer_v1.1**: 푸터

## 데이터베이스 스키마

Supabase PostgreSQL 테이블:
- `projects`: 프로젝트 데이터
- `users`: 사용자 정보
- `opinions`: 의견 및 댓글

## 성능 최적화

- **React.memo**: 불필요한 리렌더링 방지
- **useCallback**: 함수 재생성 방지
- **useMemo**: 계산 결과 메모이제이션
- **의존성 배열 최적화**: useEffect 무한 루프 방지

## 향후 계획

- [ ] 실시간 협업 기능 개선
- [ ] 모바일 반응형 최적화
- [ ] PWA 적용
- [ ] 엑셀 내보내기 기능 개선

## 백업 정보

- **원본 경로**: `C:\Users\jeung\`
- **백업 경로**: `C:\Users\jeung\Desktop\cuckoo\cuckoo-v1\`
- **백업 제외**: `node_modules`, `.git`, `build`, `.cache`, `AppData`

이 백업은 안정적으로 동작하는 버전이며, 무한 리렌더링 및 Hook 규칙 위반 문제가 해결된 상태입니다.