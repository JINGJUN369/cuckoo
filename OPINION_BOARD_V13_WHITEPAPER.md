# 의견 보드 시스템 v1.3 개발 백서
## 한국 제조업 제품 진척률 관리 시스템 (Supabase 버전)

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 설계](#데이터베이스-설계)
4. [페이지 구조 및 라우팅](#페이지-구조-및-라우팅)
5. [UI/UX 컴포넌트 시스템](#uiux-컴포넌트-시스템)
6. [비즈니스 로직](#비즈니스-로직)
7. [인증 및 권한 시스템](#인증-및-권한-시스템)
8. [실시간 기능](#실시간-기능)
9. [기술 스택](#기술-스택)
10. [개발 가이드라인](#개발-가이드라인)

---

## 🎯 프로젝트 개요

### 시스템 목적
한국 제조업 특화된 **3단계 제품 개발 진척률 관리 시스템**으로, 쿠쿠 고객만족팀의 실제 업무 프로세스를 디지털화한 Notion 스타일 관리 도구입니다.

### 핵심 특징
- **한국어 UI**: 모든 인터페이스가 한국어로 구성
- **제조업 프로세스**: 실제 제조업 워크플로우 반영
- **3단계 관리**: 기본정보 → 생산준비 → 양산준비
- **실시간 협업**: 다중 사용자 동시 편집 지원
- **진행률 추적**: 단계별 자동 진행률 계산
- **의견 시스템**: 프로젝트별 토론 및 피드백

### 주요 사용자
- **제품 개발팀**: 프로젝트 생성 및 관리
- **생산팀**: 생산 준비 과정 관리
- **품질팀**: 품질 검증 및 피드백
- **관리자**: 전체 시스템 관리 및 모니터링

---

## 🏗️ 시스템 아키텍처

### 기술 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                     │
├─────────────────────────────────────────────────────────────┤
│  Pages          Components         Hooks          Utils     │
│  ├─ Auth        ├─ UI              ├─ Auth        ├─ API    │
│  ├─ Projects    ├─ Forms           ├─ Data        ├─ Utils  │
│  ├─ Admin       ├─ Layout          ├─ Realtime    └─ Types  │
│  └─ Dashboard   └─ Charts          └─ Validation           │
├─────────────────────────────────────────────────────────────┤
│                   State Management                         │
│  ├─ React Query (서버 상태)                               │
│  ├─ Zustand (클라이언트 상태)                             │
│  └─ React Context (테마, 설정)                            │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                               │
│  ├─ Supabase Client                                       │
│  ├─ Auth API                                              │
│  ├─ Database API                                          │
│  └─ Realtime API                                          │
├─────────────────────────────────────────────────────────────┤
│                Backend (Supabase)                          │
│  ├─ PostgreSQL Database                                   │
│  ├─ Row Level Security (RLS)                              │
│  ├─ Realtime Subscriptions                               │
│  ├─ Auth (with JWT)                                       │
│  └─ Storage (파일 업로드)                                 │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 플로우
```
User Action → React Component → Custom Hook → Supabase API → PostgreSQL
     ↑                                                           ↓
UI Update ← State Update ← React Query ← Response ← Database Result
```

---

## 🗃️ 데이터베이스 설계

### ERD (Entity Relationship Diagram)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     users       │    │    profiles     │    │   projects      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (uuid) PK    │←──→│ id (uuid) PK    │    │ id (uuid) PK    │
│ email           │    │ user_id (uuid)FK│    │ name            │
│ created_at      │    │ name            │    │ model_name      │
│ updated_at      │    │ team            │    │ description     │
│ email_confirmed │    │ role            │    │ status          │
│ phone           │    │ department      │    │ created_by (FK) │
│ last_sign_in    │    │ avatar_url      │    │ created_at      │
└─────────────────┘    │ created_at      │    │ updated_at      │
                       │ updated_at      │    └─────────────────┘
                       └─────────────────┘             │
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ project_stages  │    │    opinions     │    │ activity_logs   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (uuid) PK    │    │ id (uuid) PK    │    │ id (uuid) PK    │
│ project_id (FK) │←──→│ project_id (FK) │    │ user_id (FK)    │
│ stage_number    │    │ stage_id (FK)   │    │ project_id (FK) │
│ stage_data      │    │ author_id (FK)  │    │ action          │
│ progress        │    │ title           │    │ details         │
│ created_at      │    │ content         │    │ timestamp       │
│ updated_at      │    │ category        │    │ ip_address      │
└─────────────────┘    │ priority        │    │ user_agent      │
                       │ tags            │    └─────────────────┘
                       │ status          │
                       │ created_at      │
                       │ updated_at      │
                       └─────────────────┘
```

### 주요 테이블 정의

#### 1. users (Supabase Auth 테이블 확장)
```sql
-- Supabase Auth 기본 테이블 활용
-- 추가 필드는 profiles 테이블에서 관리
```

#### 2. profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  team VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
  department VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. projects (프로젝트)
```sql
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  model_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  -- 메타데이터
  tags TEXT[],
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);
```

#### 4. project_stages (프로젝트 단계 데이터)
```sql
CREATE TABLE project_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_number INTEGER NOT NULL CHECK (stage_number IN (1, 2, 3)),
  stage_data JSONB NOT NULL DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, stage_number)
);
```

#### 5. opinions (의견/댓글)
```sql
CREATE TABLE opinions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES project_stages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES opinions(id) ON DELETE CASCADE, -- 답글용
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  is_private BOOLEAN DEFAULT false,
  notify_on_reply BOOLEAN DEFAULT true,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. activity_logs (활동 로그)
```sql
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

#### 7. opinion_reactions (의견 반응)
```sql
CREATE TABLE opinion_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  opinion_id UUID REFERENCES opinions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opinion_id, user_id)
);
```

#### 8. project_collaborators (프로젝트 협업자)
```sql
CREATE TABLE project_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}',
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

### 스키마 세부사항

#### Stage Data Structure (JSONB)
각 단계별 데이터는 JSONB 형태로 저장:

**Stage 1 (기본정보)**
```json
{
  "productGroup": "정수기시리즈",
  "manufacturer": "LG전자",
  "vendor": "삼성전자",
  "derivativeModel": "WT-PRO-V2",
  "launchDate": "2024-12-01",
  "launchDateExecuted": false,
  "productManager": "김상품",
  "mechanicalEngineer": "김기구",
  "circuitEngineer": "이회로",
  "massProductionDate": "2024-11-15",
  "massProductionDateExecuted": false,
  "notes": "특별 요구사항"
}
```

**Stage 2 (생산준비)**
```json
{
  "pilotProductionDate": "2024-10-01",
  "pilotProductionDateExecuted": true,
  "techTransferDate": "2024-10-10",
  "techTransferDateExecuted": false,
  "installationParty": "기술팀",
  "serviceParty": "A/S팀",
  "trainingDate": "2024-10-15",
  "trainingDateExecuted": false,
  "userManualUpload": "파일명.pdf",
  "techManualUpload": "기술매뉴얼.pdf",
  "userManualUploaded": true,
  "techManualUploaded": false,
  "notes": "추가 메모"
}
```

**Stage 3 (양산준비)**
```json
{
  "firstPartsOrderDate": "2024-11-10",
  "firstPartsOrderDateExecuted": false,
  "bomManager": "박부품",
  "bomCompletionDate": "2024-10-25",
  "bomCompletionDateExecuted": false,
  "priceManager": "정단가",
  "priceRegistrationDate": "2024-10-30",
  "priceRegistrationDateExecuted": false,
  "partsReceiptDate": "2024-11-05",
  "partsReceiptDateExecuted": false,
  "partsReceiptManager": "최입고",
  "branchOrderGuideDate": "2024-11-12",
  "branchOrderGuideDateExecuted": false,
  "notes": "양산 관련 메모"
}
```

---

## 🔐 Row Level Security (RLS) 정책

### 기본 보안 원칙
- **프로젝트 접근**: 프로젝트 생성자, 협업자, 관리자만 접근 가능
- **의견 보안**: 비공개 의견은 작성자와 관리자만 조회 가능
- **프로필 보안**: 자신의 프로필만 수정 가능
- **활동 로그**: 관리자만 조회 가능

### RLS 정책 예시

#### profiles 테이블
```sql
-- 모든 사용자는 승인된 프로필 조회 가능
CREATE POLICY "Anyone can view active profiles"
ON profiles FOR SELECT
USING (is_active = true);

-- 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 관리자는 모든 프로필 관리 가능
CREATE POLICY "Admins can manage all profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### projects 테이블
```sql
-- 활성 프로젝트 조회 (협업자이거나 관리자)
CREATE POLICY "View accessible projects"
ON projects FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_id = projects.id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- 프로젝트 생성 (인증된 사용자)
CREATE POLICY "Authenticated users can create projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 프로젝트 수정 (소유자, 편집자, 관리자)
CREATE POLICY "Authorized users can update projects"
ON projects FOR UPDATE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_id = projects.id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  ) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### opinions 테이블
```sql
-- 의견 조회 (공개 의견이거나 작성자이거나 관리자)
CREATE POLICY "View accessible opinions"
ON opinions FOR SELECT
USING (
  is_private = false OR
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- 의견 작성 (프로젝트 접근 권한이 있는 사용자)
CREATE POLICY "Authorized users can create opinions"
ON opinions FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_collaborators
        WHERE project_id = projects.id AND user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  )
);
```

---

## 🧭 페이지 구조 및 라우팅

### 라우팅 시스템
React Router v6를 사용한 선언적 라우팅:

```
/                           → 홈/대시보드 (인증 후 자동 리다이렉트)
/auth
  /login                    → 로그인
  /register                 → 회원가입
  /forgot-password          → 비밀번호 재설정

/dashboard                  → 메인 대시보드

/projects                   → 프로젝트 관리
  /                         → 프로젝트 목록
  /new                      → 새 프로젝트 생성
  /:id                      → 프로젝트 상세보기
  /:id/edit                 → 프로젝트 편집
  /:id/stages/:stage        → 특정 단계 편집
  /completed                → 완료된 프로젝트

/calendar                   → 캘린더 뷰

/admin                      → 관리자 (관리자만 접근)
  /users                    → 사용자 관리
  /audit                    → 활동 로그
  /security                 → 보안 설정
  /reports                  → 공개 보고서 관리

/profile                    → 프로필 관리
```

### 페이지별 상세 명세

#### 1. 로그인 페이지 (/auth/login)
**목적**: 사용자 인증

**UI 구성**:
- 쿠쿠 브랜드 로고 및 타이틀
- 이메일/비밀번호 입력 폼
- "로그인 상태 유지" 체크박스
- 소셜 로그인 옵션 (구글, 카카오)
- 회원가입, 비밀번호 찾기 링크

**기능**:
- 이메일/비밀번호 유효성 검사
- 로그인 실패 횟수 제한
- 자동 로그인 (Remember Me)
- 로그인 후 이전 페이지로 리다이렉트

**상태 관리**:
```javascript
const [loginForm, setLoginForm] = useState({
  email: '',
  password: '',
  rememberMe: false
});
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);
```

#### 2. 회원가입 페이지 (/auth/register)
**목적**: 신규 사용자 등록

**UI 구성**:
- 개인정보 입력 폼 (이름, 이메일, 부서, 연락처)
- 비밀번호 설정 (확인 포함)
- 약관 동의 체크박스
- 회원가입 버튼

**기능**:
- 실시간 유효성 검사
- 이메일 중복 확인
- 비밀번호 강도 표시
- 이메일 인증 발송

#### 3. 메인 대시보드 (/dashboard)
**목적**: 프로젝트 현황 한눈에 보기

**UI 구성**:
- **상단**: 브랜드 헤더 + 네비게이션
- **메인 섹션**:
  - 프로젝트 현황 요약 카드
  - 진행률 차트 (도넛 차트)
  - 최근 활동 타임라인
  - 임박한 마감일 알림
- **사이드바**: 빠른 액션 메뉴

**데이터**:
- 전체/진행중/완료 프로젝트 수
- 평균 진행률
- 지연 프로젝트 수
- D-Day 임박 프로젝트

#### 4. 프로젝트 목록 (/projects)
**목적**: 모든 프로젝트 관리

**UI 구성**:
- **필터링 바**: 상태별, 담당자별, 날짜별 필터
- **정렬 옵션**: 생성일, 진행률, D-Day 순
- **뷰 토글**: 그리드 뷰 / 리스트 뷰
- **프로젝트 카드**: 
  - 진행률 시각화
  - D-Day 표시
  - 빠른 액션 버튼

**기능**:
- 실시간 검색
- 무한 스크롤 페이지네이션
- 벌크 액션 (일괄 상태 변경)
- 엑셀 내보내기

#### 5. 프로젝트 상세 (/projects/:id)
**목적**: 프로젝트 상세 정보 확인

**UI 구성**:
- **헤더**: 프로젝트명, 진행률, 액션 버튼
- **탭 네비게이션**:
  - 개요: 기본 정보 + 전체 진행률
  - 1단계: 기본정보 (읽기 전용)
  - 2단계: 생산준비 (읽기 전용)  
  - 3단계: 양산준비 (읽기 전용)
  - 의견: 의견 목록 + 새 의견 작성
  - 이력: 변경 이력 + 활동 로그

**기능**:
- 단계별 진행률 시각화
- 실시간 의견 시스템
- 파일 첨부 다운로드
- 공개 보고서 생성

#### 6. 프로젝트 편집 (/projects/:id/edit)
**목적**: 프로젝트 데이터 수정

**UI 구성**:
- **스텝 네비게이션**: 1단계 → 2단계 → 3단계
- **현재 단계 폼**: 해당 단계의 입력 폼
- **진행률 표시**: 실시간 진행률 계산
- **자동저장 알림**: 3초마다 자동저장
- **변경사항 추적**: 수정된 필드 하이라이트

**기능**:
- 실시간 유효성 검사
- 자동저장 (debounced)
- 단계별 진행률 계산
- 변경 이력 기록
- 동시편집 충돌 방지

#### 7. 캘린더 뷰 (/calendar)
**목적**: 프로젝트 일정 시각화

**UI 구성**:
- 월간 캘린더 그리드
- 일정 종류별 색상 구분
- 날짜별 일정 목록
- 필터 사이드바

**기능**:
- 드래그 앤 드롭 일정 이동
- 일정 클릭 시 상세 정보
- iCal 내보내기
- 프로젝트별 필터링

---

## 🎨 UI/UX 컴포넌트 시스템

### 디자인 시스템

#### 컬러 팔레트
```css
:root {
  /* Primary Colors (쿠쿠 브랜드) */
  --cuckoo-red: #DC2626;
  --cuckoo-red-50: #FEF2F2;
  --cuckoo-red-100: #FEE2E2;
  --cuckoo-red-600: #DC2626;
  --cuckoo-red-700: #B91C1C;

  /* Stage Colors */
  --stage1-blue: #3B82F6;
  --stage1-blue-50: #EFF6FF;
  --stage2-green: #10B981;
  --stage2-green-50: #ECFDF5;
  --stage3-purple: #8B5CF6;
  --stage3-purple-50: #F5F3FF;

  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* Status Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
```

#### 타이포그래피
```css
/* 폰트 패밀리 */
--font-primary: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Consolas', monospace;

/* 폰트 크기 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

#### 간격 시스템
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 핵심 컴포넌트

#### 1. BrandHeader
**위치**: `src/components/layout/BrandHeader.tsx`
**목적**: 전역 헤더 및 네비게이션

```typescript
interface BrandHeaderProps {
  showNav?: boolean;
  currentUser?: User;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({
  showNav = true,
  currentUser,
  onNavigate,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 쿠쿠 브랜드 로고 */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cuckoo-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">쿠쿠</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">고객만족팀</h1>
              <p className="text-sm text-gray-500">제품 진척률 관리 시스템</p>
            </div>
          </div>

          {/* 네비게이션 및 사용자 메뉴 */}
          {showNav && currentUser && (
            <nav className="flex items-center space-x-6">
              {/* 네비게이션 메뉴들 */}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
```

#### 2. ProjectCard
**위치**: `src/components/project/ProjectCard.tsx`  
**목적**: 프로젝트 정보 카드 표시

```typescript
interface ProjectCardProps {
  project: Project;
  mode?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  mode = 'grid',
  showActions = false,
  onView,
  onEdit,
  onDelete
}) => {
  const progress = calculateProjectProgress(project);
  const dDay = calculateDDay(project.stage1.massProductionDate);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all ${
      mode === 'grid' ? 'p-6' : 'p-4'
    }`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {project.name}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-gray-100 rounded">{project.modelName}</span>
            {project.stage1.manufacturer && (
              <span>{project.stage1.manufacturer}</span>
            )}
          </div>
        </div>
        {dDay !== null && (
          <DDayBadge dDay={dDay} />
        )}
      </div>

      {/* 전체 진행률 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">전체 진행률</span>
          <span className="text-2xl font-bold text-blue-600">
            {progress.overall}%
          </span>
        </div>
        <ProgressBar value={progress.overall} />
      </div>

      {/* 단계별 미니 진행률 */}
      <div className="space-y-2 mb-4">
        <MiniProgressBar label="1단계" value={progress.stage1} />
        <MiniProgressBar label="2단계" value={progress.stage2} />
        <MiniProgressBar label="3단계" value={progress.stage3} />
      </div>

      {/* 액션 버튼들 */}
      {showActions && (
        <div className="flex space-x-2 pt-2 border-t">
          <Button onClick={() => onView?.(project)} variant="outline" size="sm">
            보기
          </Button>
          <Button onClick={() => onEdit?.(project)} variant="outline" size="sm">
            편집
          </Button>
          {onDelete && (
            <Button 
              onClick={() => onDelete(project)} 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              삭제
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 3. StageForm
**위치**: `src/components/project/StageForm.tsx`
**목적**: 단계별 데이터 입력 폼

```typescript
interface StageFormProps {
  project: Project;
  stage: 1 | 2 | 3;
  mode?: 'edit' | 'view';
  onUpdate?: (stageData: StageData) => void;
  onSave?: () => void;
}

const StageForm: React.FC<StageFormProps> = ({
  project,
  stage,
  mode = 'edit',
  onUpdate,
  onSave
}) => {
  const stageData = project[`stage${stage}`];
  const progress = getStageProgress(project, `stage${stage}`);

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${getStageColor(stage)}`} />
          <h3 className={`text-xl font-semibold ${getStageTextColor(stage)}`}>
            {getStageTitle(stage)}
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            진행률: <span className="font-medium">{progress}%</span>
          </span>
          <ProgressBar value={progress} className="w-24" />
        </div>
      </div>

      {/* 폼 필드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getStageFields(stage).map(field => (
          <FormField
            key={field.key}
            field={field}
            value={stageData[field.key]}
            onChange={(value) => handleFieldChange(field.key, value)}
            disabled={mode === 'view'}
          />
        ))}
      </div>

      {/* 비고 영역 */}
      <div className="mt-6 pt-6 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          비고 (공용 메모)
        </label>
        <textarea
          value={stageData.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-md"
          disabled={mode === 'view'}
          placeholder="프로젝트 관련 중요 사항, 변경 내용, 특이사항 등을 작성해주세요..."
        />
      </div>
    </div>
  );
};
```

#### 4. OpinionSystem
**위치**: `src/components/opinion/OpinionSystem.tsx`
**목적**: 의견 작성 및 관리 시스템

```typescript
interface OpinionSystemProps {
  projectId: string;
  stageId?: string;
  currentUser: User;
}

const OpinionSystem: React.FC<OpinionSystemProps> = ({
  projectId,
  stageId,
  currentUser
}) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<OpinionFilter>('all');

  return (
    <div className="space-y-6">
      {/* 의견 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="전체 의견" value={opinions.length} />
        <StatCard title="미해결" value={getOpenOpinionsCount(opinions)} />
        <StatCard title="검토중" value={getInReviewCount(opinions)} />
        <StatCard title="해결됨" value={getResolvedCount(opinions)} />
      </div>

      {/* 필터 및 액션 */}
      <div className="flex items-center justify-between">
        <OpinionFilter current={filter} onChange={setFilter} />
        <Button onClick={() => setShowForm(true)}>
          ✏️ 의견 작성
        </Button>
      </div>

      {/* 의견 목록 */}
      <div className="space-y-4">
        {filteredOpinions.map(opinion => (
          <OpinionCard
            key={opinion.id}
            opinion={opinion}
            currentUser={currentUser}
            onReply={(opinionId) => handleReply(opinionId)}
            onResolve={(opinionId) => handleResolve(opinionId)}
          />
        ))}
      </div>

      {/* 의견 작성 폼 모달 */}
      {showForm && (
        <OpinionFormModal
          projectId={projectId}
          stageId={stageId}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSubmit={handleOpinionSubmit}
        />
      )}
    </div>
  );
};
```

### 공통 컴포넌트

#### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### Input
```typescript
interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'date' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

#### Modal
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}
```

#### ProgressBar
```typescript
interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}
```

---

## 🔧 비즈니스 로직

### 진행률 계산 시스템

#### 전체 진행률 계산
```typescript
export const calculateProjectProgress = (project: Project): ProjectProgress => {
  const stage1Progress = calculateStageProgress(project.stage1, 1);
  const stage2Progress = calculateStageProgress(project.stage2, 2);
  const stage3Progress = calculateStageProgress(project.stage3, 3);
  
  const overall = Math.round((stage1Progress + stage2Progress + stage3Progress) / 3);
  
  return {
    overall,
    stage1: stage1Progress,
    stage2: stage2Progress,
    stage3: stage3Progress
  };
};
```

#### 단계별 진행률 계산
각 단계는 다음과 같은 비중으로 계산:
- **날짜 필드**: 입력 완료 시 0.5점, 실행 완료 시 0.5점 (총 1.0점)
- **텍스트 필드**: 입력 완료 시 1.0점
- **체크박스 필드**: 체크 시 1.0점

```typescript
export const calculateStageProgress = (stageData: StageData, stageNumber: number): number => {
  const fields = getStageFieldDefinitions(stageNumber);
  let totalScore = 0;
  let achievedScore = 0;

  fields.forEach(field => {
    if (field.type === 'date') {
      totalScore += 1.0; // 날짜(0.5) + 실행완료(0.5)
      
      if (stageData[field.key] && stageData[field.key].trim() !== '') {
        achievedScore += 0.5;
      }
      
      if (stageData[`${field.key}Executed`] === true) {
        achievedScore += 0.5;
      }
    } else if (field.type === 'checkbox') {
      totalScore += 1.0;
      if (stageData[field.key] === true) {
        achievedScore += 1.0;
      }
    } else {
      totalScore += 1.0;
      if (stageData[field.key] && stageData[field.key].trim() !== '') {
        achievedScore += 1.0;
      }
    }
  });

  return totalScore > 0 ? Math.round((achievedScore / totalScore) * 100) : 0;
};
```

### D-Day 계산

```typescript
export const calculateDDay = (massProductionDate: string | null): number | null => {
  if (!massProductionDate) return null;
  
  const targetDate = new Date(massProductionDate);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDDayStatus = (dDay: number | null): DDayStatus => {
  if (dDay === null) return { type: 'none', text: '', color: 'gray' };
  
  if (dDay < 0) {
    return {
      type: 'overdue',
      text: `D+${Math.abs(dDay)}`,
      color: 'red',
      emoji: '🚨'
    };
  } else if (dDay === 0) {
    return {
      type: 'today',
      text: 'D-DAY',
      color: 'orange',
      emoji: '⚡'
    };
  } else if (dDay <= 7) {
    return {
      type: 'urgent',
      text: `D-${dDay}`,
      color: 'yellow',
      emoji: '⚠️'
    };
  } else if (dDay <= 30) {
    return {
      type: 'soon',
      text: `D-${dDay}`,
      color: 'blue',
      emoji: '📅'
    };
  } else {
    return {
      type: 'normal',
      text: `D-${dDay}`,
      color: 'gray',
      emoji: '📍'
    };
  }
};
```

### 데이터 유효성 검사

#### 프로젝트 유효성 검사
```typescript
export const validateProject = (project: Partial<Project>): ValidationResult => {
  const errors: ValidationErrors = {};

  // 기본 정보 검사
  if (!project.name || project.name.trim().length < 3) {
    errors.name = '프로젝트명은 3자 이상 입력해주세요';
  }

  if (!project.modelName || project.modelName.trim().length < 2) {
    errors.modelName = '모델명은 2자 이상 입력해주세요';
  }

  // 날짜 검사
  if (project.stage1) {
    const { launchDate, massProductionDate } = project.stage1;
    
    if (launchDate && massProductionDate) {
      const launch = new Date(launchDate);
      const mass = new Date(massProductionDate);
      
      if (launch >= mass) {
        errors['stage1.launchDate'] = '출시 예정일은 양산 예정일보다 빨라야 합니다';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

#### 실시간 데이터 동기화

```typescript
export const useRealtimeProject = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = supabase
      .channel(`project:${projectId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          console.log('Project updated:', payload);
          handleProjectUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const handleProjectUpdate = useCallback((payload: any) => {
    switch (payload.eventType) {
      case 'UPDATE':
        setProject(payload.new);
        break;
      case 'DELETE':
        setProject(null);
        break;
    }
  }, []);

  return { project, loading, error };
};
```

---

## 🔐 인증 및 권한 시스템

### Supabase Auth 통합

#### 인증 설정
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

#### 인증 훅
```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
    if (error) console.error('Profile fetch error:', error);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut
  };
};
```

### 권한 시스템

#### 권한 레벨
- **user**: 일반 사용자 (기본)
- **manager**: 관리자 (팀 매니저)
- **admin**: 시스템 관리자

#### 권한 체크 컴포넌트
```typescript
// src/components/auth/PermissionGuard.tsx
interface PermissionGuardProps {
  requiredRole: 'user' | 'manager' | 'admin';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredRole,
  children,
  fallback = <div>권한이 없습니다.</div>
}) => {
  const { profile } = useAuth();

  if (!profile) return <div>로그인이 필요합니다.</div>;

  const hasPermission = checkPermission(profile.role, requiredRole);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

const checkPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'user': 1,
    'manager': 2,
    'admin': 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
```

#### 프로젝트 접근 권한
```typescript
export const useProjectPermissions = (projectId: string) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchPermissions = async () => {
      // 프로젝트 소유자인지 확인
      const { data: project } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', projectId)
        .single();

      // 협업자인지 확인
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, permissions')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      // 관리자인지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isOwner = project?.created_by === user.id;
      const isAdmin = profile?.role === 'admin';
      const isManager = profile?.role === 'manager';
      const collaboratorRole = collaborator?.role;

      setPermissions({
        canView: isOwner || isAdmin || isManager || !!collaborator,
        canEdit: isOwner || isAdmin || collaboratorRole === 'editor',
        canDelete: isOwner || isAdmin,
        canManageCollaborators: isOwner || isAdmin,
        isOwner,
        isAdmin,
        collaboratorRole
      });
    };

    fetchPermissions();
  }, [user, projectId]);

  return permissions;
};
```

---

## ⚡ 실시간 기능

### Supabase Realtime 설정

#### 실시간 프로젝트 업데이트
```typescript
export const useRealtimeProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    // 초기 데이터 로드
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:created_by(name, team),
          project_stages(*),
          opinions(count)
        `)
        .order('created_at', { ascending: false });
      
      setProjects(data || []);
    };

    fetchProjects();

    // 실시간 구독 설정
    const subscription = supabase
      .channel('projects-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Project change detected:', payload);
          handleProjectChange(payload);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'project_stages' },
        (payload) => {
          console.log('Stage change detected:', payload);
          handleStageChange(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleProjectChange = useCallback((payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setProjects(prev => [payload.new, ...prev]);
        break;
      case 'UPDATE':
        setProjects(prev => prev.map(p => 
          p.id === payload.new.id ? { ...p, ...payload.new } : p
        ));
        break;
      case 'DELETE':
        setProjects(prev => prev.filter(p => p.id !== payload.old.id));
        break;
    }
  }, []);

  const handleStageChange = useCallback((payload: any) => {
    if (payload.eventType === 'UPDATE') {
      setProjects(prev => prev.map(project => {
        if (project.id === payload.new.project_id) {
          return {
            ...project,
            [`stage${payload.new.stage_number}`]: payload.new.stage_data
          };
        }
        return project;
      }));
    }
  }, []);

  return projects;
};
```

#### 실시간 의견 시스템
```typescript
export const useRealtimeOpinions = (projectId: string) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);

  useEffect(() => {
    if (!projectId) return;

    // 초기 의견 로드
    const fetchOpinions = async () => {
      const { data } = await supabase
        .from('opinions')
        .select(`
          *,
          profiles:author_id(name, avatar_url),
          replies:opinions!parent_id(*)
        `)
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      setOpinions(data || []);
    };

    fetchOpinions();

    // 실시간 의견 구독
    const subscription = supabase
      .channel(`opinions:${projectId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'opinions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          handleOpinionChange(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const handleOpinionChange = useCallback((payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        if (!payload.new.parent_id) {
          // 새로운 의견
          setOpinions(prev => [payload.new, ...prev]);
        } else {
          // 답글
          setOpinions(prev => prev.map(opinion => {
            if (opinion.id === payload.new.parent_id) {
              return {
                ...opinion,
                replies: [...(opinion.replies || []), payload.new]
              };
            }
            return opinion;
          }));
        }
        break;
      case 'UPDATE':
        setOpinions(prev => prev.map(opinion =>
          opinion.id === payload.new.id ? payload.new : opinion
        ));
        break;
      case 'DELETE':
        setOpinions(prev => prev.filter(opinion => opinion.id !== payload.old.id));
        break;
    }
  }, []);

  return opinions;
};
```

#### 온라인 사용자 추적
```typescript
export const useOnlineUsers = (projectId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users');
    
    // 현재 사용자 온라인 상태 설정
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as OnlineUser[];
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 자신의 온라인 상태 등록
          await channel.track({
            user_id: user.id,
            name: user.user_metadata?.name || user.email,
            project_id: projectId,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, projectId]);

  return onlineUsers;
};
```

### 동시 편집 충돌 방지

```typescript
export const useCollaborativeEditing = (projectId: string, stageNumber: number) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingUsers, setEditingUsers] = useState<EditingUser[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const channel = supabase.channel(`editing:${projectId}:${stageNumber}`);

    channel
      .on('broadcast', { event: 'editing-started' }, (payload) => {
        setEditingUsers(prev => {
          const existing = prev.find(u => u.userId === payload.userId);
          if (!existing) {
            return [...prev, {
              userId: payload.userId,
              userName: payload.userName,
              field: payload.field,
              startedAt: payload.startedAt
            }];
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'editing-stopped' }, (payload) => {
        setEditingUsers(prev => prev.filter(u => u.userId !== payload.userId));
      })
      .subscribe();

    return () => {
      if (isEditing) {
        // 편집 중단 신호 전송
        channel.send({
          type: 'broadcast',
          event: 'editing-stopped',
          payload: { userId: user?.id }
        });
      }
      channel.unsubscribe();
    };
  }, [projectId, stageNumber, user]);

  const startEditing = useCallback((fieldKey: string) => {
    if (!user) return;

    setIsEditing(true);
    
    const channel = supabase.channel(`editing:${projectId}:${stageNumber}`);
    channel.send({
      type: 'broadcast',
      event: 'editing-started',
      payload: {
        userId: user.id,
        userName: user.user_metadata?.name || user.email,
        field: fieldKey,
        startedAt: new Date().toISOString()
      }
    });
  }, [user, projectId, stageNumber]);

  const stopEditing = useCallback(() => {
    if (!user) return;

    setIsEditing(false);
    
    const channel = supabase.channel(`editing:${projectId}:${stageNumber}`);
    channel.send({
      type: 'broadcast',
      event: 'editing-stopped',
      payload: { userId: user.id }
    });
  }, [user, projectId, stageNumber]);

  return {
    isEditing,
    editingUsers,
    startEditing,
    stopEditing
  };
};
```

---

## 🛠️ 기술 스택

### Frontend
- **React 18.2.0**: 최신 React (Concurrent Features 포함)
- **TypeScript 5.0+**: 타입 안전성 및 개발자 경험 향상
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **React Router v6**: 선언적 라우팅
- **React Query (TanStack Query)**: 서버 상태 관리
- **Zustand**: 경량 클라이언트 상태 관리
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **HeadlessUI + Radix UI**: 접근성이 좋은 UI 컴포넌트
- **React Hook Form**: 성능 좋은 폼 관리
- **Zod**: 스키마 검증

### Backend (Supabase)
- **PostgreSQL**: 메인 데이터베이스
- **Supabase Auth**: 인증 및 세션 관리
- **Row Level Security (RLS)**: 데이터 보안
- **Realtime**: WebSocket 기반 실시간 업데이트
- **Storage**: 파일 업로드 및 관리
- **Edge Functions**: 서버리스 함수 (필요시)

### 개발 도구
- **ESLint + Prettier**: 코드 품질 및 포매팅
- **Husky + lint-staged**: Git 훅 관리
- **Commitlint**: 커밋 메시지 규칙
- **Jest + React Testing Library**: 단위 테스트
- **Cypress**: E2E 테스트
- **Storybook**: 컴포넌트 문서화

### 배포 및 모니터링
- **Vercel**: 프론트엔드 배포
- **Supabase Cloud**: 백엔드 호스팅
- **Sentry**: 에러 모니터링
- **Google Analytics**: 사용자 분석

---

## 📋 개발 가이드라인

### 프로젝트 구조
```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트
│   ├── forms/           # 폼 관련 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── project/         # 프로젝트 관련 컴포넌트
├── hooks/               # 커스텀 훅
│   ├── api/            # API 관련 훅
│   ├── auth/           # 인증 관련 훅
│   └── utils/          # 유틸리티 훅
├── lib/                 # 외부 라이브러리 설정
├── pages/               # 페이지 컴포넌트
├── store/               # 상태 관리 (Zustand)
├── types/               # TypeScript 타입 정의
├── utils/               # 유틸리티 함수
└── styles/              # CSS 및 스타일 파일
```

### 네이밍 컨벤션

#### 파일명
- **컴포넌트**: `PascalCase.tsx` (예: `ProjectCard.tsx`)
- **훅**: `camelCase.ts` (예: `useAuth.ts`)
- **유틸리티**: `camelCase.ts` (예: `dateUtils.ts`)
- **타입**: `camelCase.types.ts` (예: `project.types.ts`)

#### 변수명
- **상수**: `SCREAMING_SNAKE_CASE`
- **함수**: `camelCase`
- **컴포넌트**: `PascalCase`
- **타입/인터페이스**: `PascalCase`

### 코딩 규칙

#### TypeScript
```typescript
// 인터페이스 정의
interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  className?: string;
}

// 함수형 컴포넌트 (React.FC 사용)
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  className = ''
}) => {
  // 컴포넌트 로직
};

// 커스텀 훅
export const useProjectData = (projectId: string) => {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 훅 로직
  
  return { data, loading };
};
```

#### 스타일링
```typescript
// Tailwind CSS 클래스 사용
const ProjectCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {project.name}
    </h3>
  </div>
);

// 조건부 스타일링
const buttonClass = cn(
  'px-4 py-2 rounded-md font-medium transition-colors',
  variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  disabled && 'opacity-50 cursor-not-allowed'
);
```

### API 호출 패턴

#### React Query 사용
```typescript
// API 함수 정의
export const fetchProject = async (id: string): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:created_by(name),
      project_stages(*),
      opinions(count)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// 훅에서 사용
export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    enabled: !!id
  });
};

// 컴포넌트에서 사용
const ProjectDetail = ({ projectId }: { projectId: string }) => {
  const { data: project, isLoading, error } = useProject(projectId);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!project) return <NotFound />;
  
  return <ProjectInfo project={project} />;
};
```

### 에러 처리

#### 전역 에러 처리
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Sentry 또는 다른 에러 리포팅 서비스로 전송
    // reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              페이지를 새로고침해 주세요
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 테스트 가이드라인

#### 컴포넌트 테스트
```typescript
// ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

const mockProject = {
  id: '1',
  name: 'Test Project',
  modelName: 'TEST-001',
  // ... 기타 필드들
};

describe('ProjectCard', () => {
  it('프로젝트 이름을 표시한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('클릭 시 onView 콜백을 호출한다', () => {
    const onView = jest.fn();
    render(<ProjectCard project={mockProject} onView={onView} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onView).toHaveBeenCalledWith(mockProject);
  });
});
```

#### 훅 테스트
```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('로그인 상태를 관리한다', async () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeTruthy();
  });
});
```

### Git 워크플로우

#### 브랜치 전략
```
main              # 프로덕션 브랜치
├── develop       # 개발 브랜치
├── feature/*     # 기능 개발 브랜치
├── hotfix/*      # 긴급 수정 브랜치
└── release/*     # 릴리즈 준비 브랜치
```

#### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포매팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 과정 또는 보조 도구 변경

예시:
feat: 프로젝트 진행률 계산 로직 추가
fix: 의견 작성 시 태그 중복 제거 버그 수정
docs: API 문서 업데이트
```

### 성능 최적화

#### React 최적화
```typescript
// 메모이제이션 활용
export const ProjectCard = React.memo<ProjectCardProps>(({ project, onView }) => {
  const progress = useMemo(() => calculateProgress(project), [project]);
  const handleClick = useCallback(() => onView?.(project), [onView, project]);
  
  return (
    <div onClick={handleClick}>
      {/* 컴포넌트 내용 */}
    </div>
  );
});

// 무거운 계산은 useMemo로 최적화
const Dashboard = () => {
  const { data: projects } = useProjects();
  
  const statistics = useMemo(() => {
    return {
      total: projects.length,
      completed: projects.filter(p => p.status === 'completed').length,
      avgProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
    };
  }, [projects]);
  
  return <DashboardStats stats={statistics} />;
};
```

#### 이미지 최적화
```typescript
// 지연 로딩 이미지 컴포넌트
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
```

---

## 📊 데이터 마이그레이션 전략

### localStorage에서 Supabase로 데이터 이전

#### 1. 마이그레이션 스크립트
```typescript
// src/utils/dataMigration.ts
export const migrateLocalStorageToSupabase = async () => {
  try {
    // 1. localStorage 데이터 추출
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const localOpinions = JSON.parse(localStorage.getItem('opinions') || '[]');
    
    console.log('Migration started:', {
      projects: localProjects.length,
      users: localUsers.length,
      opinions: localOpinions.length
    });

    // 2. 프로젝트 데이터 변환 및 이전
    for (const localProject of localProjects) {
      const migratedProject = await migrateProject(localProject);
      console.log('Project migrated:', migratedProject.name);
    }

    // 3. 의견 데이터 이전
    for (const localOpinion of localOpinions) {
      const migratedOpinion = await migrateOpinion(localOpinion);
      console.log('Opinion migrated:', migratedOpinion.id);
    }

    console.log('Migration completed successfully');
    
    // 4. 백업 및 localStorage 정리
    backupLocalStorage();
    // localStorage.clear(); // 주의: 마이그레이션 확인 후 수행
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

const migrateProject = async (localProject: any) => {
  // 프로젝트 기본 정보
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: localProject.name,
      model_name: localProject.modelName || localProject.id,
      description: localProject.description || '',
      status: localProject.status || 'active',
      created_at: localProject.createdAt,
      updated_at: localProject.updatedAt,
      created_by: getCurrentUser().id // 현재 로그인 사용자로 설정
    })
    .select()
    .single();

  if (error) throw error;

  // 각 단계 데이터 이전
  for (let stageNum = 1; stageNum <= 3; stageNum++) {
    const stageData = localProject[`stage${stageNum}`];
    if (stageData) {
      await supabase
        .from('project_stages')
        .insert({
          project_id: project.id,
          stage_number: stageNum,
          stage_data: stageData,
          progress: calculateStageProgress(stageData, stageNum)
        });
    }
  }

  return project;
};

const migrateOpinion = async (localOpinion: any) => {
  // 프로젝트 ID 매핑 필요 (localStorage ID → Supabase UUID)
  const projectId = await findSupabaseProjectId(localOpinion.projectId);
  
  const { data, error } = await supabase
    .from('opinions')
    .insert({
      project_id: projectId,
      title: localOpinion.title || '',
      content: localOpinion.message || localOpinion.content,
      category: localOpinion.category || 'general',
      priority: localOpinion.priority || 'medium',
      status: localOpinion.status || 'open',
      created_at: localOpinion.createdAt,
      author_id: getCurrentUser().id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

#### 2. 백업 시스템
```typescript
// 마이그레이션 전 전체 localStorage 백업
const backupLocalStorage = () => {
  const backup = {
    timestamp: new Date().toISOString(),
    data: {
      projects: localStorage.getItem('projects'),
      users: localStorage.getItem('users'),
      opinions: localStorage.getItem('opinions'),
      completedProjects: localStorage.getItem('completedProjects'),
      activityLogs: localStorage.getItem('activityLogs')
    }
  };
  
  // JSON 파일로 다운로드
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `localStorage-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

---

## 🚀 배포 및 운영

### 환경 변수 설정
```env
# .env.local (개발환경)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_NODE_ENV=development

# .env.production (프로덕션)
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_supabase_anon_key
REACT_APP_NODE_ENV=production
```

### 빌드 및 배포
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 테스트 실행
npm run test
```

---

## 📝 결론

이 백서는 **의견 보드 시스템 v1.3**의 완전한 개발 가이드입니다. 

### 주요 특징
- ✅ **완전한 Supabase 통합**: localStorage 의존성 완전 제거
- ✅ **실시간 협업**: 다중 사용자 동시 작업 지원
- ✅ **한국 제조업 특화**: 실제 업무 프로세스 반영
- ✅ **모던 기술 스택**: React 18 + TypeScript + Tailwind
- ✅ **강력한 보안**: RLS 기반 데이터 보호
- ✅ **확장 가능한 아키텍처**: 대규모 팀에서도 사용 가능

### 개발 순서
1. **Supabase 프로젝트 설정** 및 데이터베이스 스키마 구축
2. **인증 시스템** 구현 (Supabase Auth 통합)
3. **핵심 페이지** 개발 (대시보드, 프로젝트 관리)
4. **실시간 기능** 구현 (협업, 의견 시스템)
5. **UI/UX 완성** 및 모바일 최적화
6. **테스트 및 최적화**
7. **배포 및 모니터링**

이 백서의 모든 명세를 정확히 따라 구현하면, 기존 localStorage 기반 시스템의 모든 한계를 극복하고 실제 업무 환경에서 사용 가능한 완전한 협업 도구를 구축할 수 있습니다.

---

**작성일**: 2024년 12월  
**버전**: v1.3  
**작성자**: Claude Code Development Team