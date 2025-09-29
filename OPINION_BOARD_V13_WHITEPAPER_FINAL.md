# 의견 보드 시스템 v1.3 최종 개발 백서
## CUCKOO 제품 진척률 관리 시스템 (Supabase 전용 버전)

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
9. [성능 최적화](#성능-최적화)
10. [보안 시스템](#보안-시스템)
11. [오프라인 지원](#오프라인-지원)
12. [모니터링 및 로깅](#모니터링-및-로깅)
13. [기술 스택](#기술-스택)
14. [개발 가이드라인](#개발-가이드라인)
15. [배포 및 운영](#배포-및-운영)

---

## 🎯 프로젝트 개요

### 시스템 목적
CUCKOO 특화된 **3단계 제품 개발 진척률 관리 시스템**으로, 쿠쿠 고객만족팀의 실제 업무 프로세스를 디지털화한 완전한 클라우드 기반 관리 도구입니다.

### 핵심 특징
- **한국어 UI**: 모든 인터페이스가 한국어로 구성
- **제조업 프로세스**: 실제 제조업 워크플로우 반영
- **3단계 관리**: 기본정보 → 생산준비 → 양산준비
- **실시간 협업**: 다중 사용자 동시 편집 지원
- **진행률 추적**: 단계별 자동 진행률 계산
- **의견 시스템**: 프로젝트별 토론 및 피드백
- **오프라인 지원**: 네트워크 단절 시에도 제한적 기능 제공
- **고성능**: 대용량 데이터 처리 최적화

### v1.3의 혁신적 개선사항
- **완전한 Supabase 통합**: localStorage 의존성 100% 제거
- **실시간 연결 안정성**: 자동 재연결 및 오프라인 감지
- **성능 최적화**: 가상화된 리스트, 이미지 최적화, 캐싱
- **강화된 보안**: Rate limiting, 데이터 무결성 검증
- **포괄적 모니터링**: 상세한 활동 로그 및 성능 추적

### 주요 사용자
- **제품 개발팀**: 프로젝트 생성 및 관리
- **생산팀**: 생산 준비 과정 관리
- **품질팀**: 품질 검증 및 피드백
- **관리자**: 전체 시스템 관리 및 모니터링

---

## 🏗️ 시스템 아키텍처

### 전체 시스템 구조
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                     │
├─────────────────────────────────────────────────────────────┤
│  Pages          Components         Hooks          Utils     │
│  ├─ Auth        ├─ UI              ├─ Auth        ├─ API    │
│  ├─ Projects    ├─ Forms           ├─ Data        ├─ Utils  │
│  ├─ Admin       ├─ Layout          ├─ Realtime    ├─ Cache  │
│  └─ Dashboard   └─ Charts          └─ Validation  └─ Types  │
├─────────────────────────────────────────────────────────────┤
│                   State Management                         │
│  ├─ React Query (서버 상태 + 캐싱)                        │
│  ├─ Zustand (클라이언트 상태)                             │
│  ├─ IndexedDB (오프라인 저장소)                           │
│  └─ React Context (테마, 설정)                            │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                               │
│  ├─ Supabase Client (실시간 + 캐싱)                       │
│  ├─ Connection Monitor (연결 상태 감지)                   │
│  ├─ Rate Limiter (요청 제한)                              │
│  ├─ Offline Sync (오프라인 동기화)                        │
│  └─ Error Recovery (에러 복구)                            │
├─────────────────────────────────────────────────────────────┤
│                Backend (Supabase)                          │
│  ├─ PostgreSQL Database (고성능 쿼리)                     │
│  ├─ Row Level Security (RLS)                              │
│  ├─ Realtime Subscriptions (WebSocket)                   │
│  ├─ Auth (JWT + MFA 지원)                                 │
│  ├─ Storage (최적화된 파일 관리)                          │
│  ├─ Edge Functions (비즈니스 로직)                        │
│  └─ Triggers & Functions (데이터 무결성)                  │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 플로우 및 캐싱 전략
```
User Action → Component → Custom Hook → Cache Check → Supabase API → PostgreSQL
     ↑                                      ↓              ↓
UI Update ← State Update ← React Query Cache ← Response ← Database Result
     ↑                                      ↓
Optimistic Update ← IndexedDB (오프라인) ← Background Sync
```

### 연결 상태 관리
```
Online + Connected    → Full Functionality
Online + Disconnected → Retry Logic + Error UI
Offline              → IndexedDB + Limited Features
Recovery             → Sync Pending Changes
```

---

## 🗃️ 데이터베이스 설계

### ERD (Enhanced Entity Relationship Diagram)
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
│ mfa_enabled     │    │ is_active       │    │ updated_at      │
└─────────────────┘    │ preferences     │    │ cached_progress │
                       │ created_at      │    │ last_accessed   │
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
│ progress        │    │ parent_id (FK)  │    │ details         │
│ version         │    │ title           │    │ timestamp       │
│ created_at      │    │ content         │    │ ip_address      │
│ updated_at      │    │ category        │    │ user_agent      │
│ updated_by      │    │ priority        │    │ session_id      │
└─────────────────┘    │ tags            │    │ performance     │
                       │ status          │    └─────────────────┘
                       │ upvotes         │
                       │ downvotes       │    ┌─────────────────┐
                       │ views           │    │ system_metrics  │
                       │ created_at      │    ├─────────────────┤
                       │ updated_at      │    │ id (uuid) PK    │
                       │ resolved_at     │    │ metric_type     │
                       └─────────────────┘    │ value           │
                                             │ timestamp       │
┌─────────────────┐    ┌─────────────────┐    │ metadata        │
│ opinion_reactions│    │project_collabora│    └─────────────────┘
├─────────────────┤    ├─────────────────┤
│ id (uuid) PK    │    │ id (uuid) PK    │    ┌─────────────────┐
│ opinion_id (FK) │    │ project_id (FK) │    │ error_logs      │
│ user_id (FK)    │    │ user_id (FK)    │    ├─────────────────┤
│ reaction_type   │    │ role            │    │ id (uuid) PK    │
│ created_at      │    │ permissions     │    │ user_id (FK)    │
└─────────────────┘    │ added_by (FK)   │    │ error_type      │
                       │ added_at        │    │ error_message   │
                       │ last_accessed   │    │ stack_trace     │
                       └─────────────────┘    │ context         │
                                             │ timestamp       │
                                             │ resolved        │
                                             └─────────────────┘
```

### 핵심 테이블 정의

#### 1. profiles (사용자 프로필) - 확장
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
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 환경 설정 예시
-- preferences: {
--   "theme": "light",
--   "language": "ko",
--   "notifications": {
--     "email": true,
--     "browser": true,
--     "mentions": true
--   },
--   "dashboard": {
--     "layout": "grid",
--     "itemsPerPage": 20
--   }
-- }
```

#### 2. projects (프로젝트) - 성능 최적화
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
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 성능 최적화 필드
  cached_progress INTEGER DEFAULT 0 CHECK (cached_progress >= 0 AND cached_progress <= 100),
  search_vector TSVECTOR, -- 전문 검색 지원
  
  -- 메타데이터
  tags TEXT[],
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_completion_date DATE,
  actual_completion_date DATE,
  
  -- 협업 정보
  collaborator_count INTEGER DEFAULT 0,
  opinion_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 검색 성능을 위한 인덱스
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_last_activity ON projects(last_activity_at DESC);
```

#### 3. project_stages (프로젝트 단계) - 버전 관리
```sql
CREATE TABLE project_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_number INTEGER NOT NULL CHECK (stage_number IN (1, 2, 3)),
  stage_data JSONB NOT NULL DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  version INTEGER DEFAULT 1, -- 버전 관리
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- 변경 추적
  previous_data JSONB, -- 이전 버전 데이터
  change_summary TEXT, -- 변경 요약
  
  UNIQUE(project_id, stage_number)
);

-- 성능 인덱스
CREATE INDEX idx_project_stages_project ON project_stages(project_id, stage_number);
CREATE INDEX idx_project_stages_updated ON project_stages(updated_at DESC);
```

#### 4. opinions (의견/댓글) - 고성능 스레딩
```sql
CREATE TABLE opinions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES project_stages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES opinions(id) ON DELETE CASCADE, -- 답글 지원
  thread_path LTREE, -- 계층 구조 고성능 처리
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  is_private BOOLEAN DEFAULT false,
  notify_on_reply BOOLEAN DEFAULT true,
  
  -- 상호작용 메트릭
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- 시간 추적
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 검색 지원
  search_vector TSVECTOR
);

-- 고성능 인덱스
CREATE INDEX idx_opinions_project ON opinions(project_id, created_at DESC);
CREATE INDEX idx_opinions_author ON opinions(author_id);
CREATE INDEX idx_opinions_thread ON opinions USING GIST(thread_path);
CREATE INDEX idx_opinions_search ON opinions USING GIN(search_vector);
CREATE INDEX idx_opinions_status ON opinions(status, priority);
```

#### 5. activity_logs (활동 로그) - 상세 추적
```sql
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  opinion_id UUID REFERENCES opinions(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  -- 성능 메트릭
  response_time_ms INTEGER,
  memory_usage_mb FLOAT,
  
  -- 지리적 정보
  country_code CHAR(2),
  city VARCHAR(100)
);

-- 파티셔닝을 위한 인덱스 (월별)
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action);
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id, timestamp DESC);
```

#### 6. system_metrics (시스템 메트릭)
```sql
CREATE TABLE system_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- 집계 레벨
  aggregation_level VARCHAR(20) DEFAULT 'raw' CHECK (aggregation_level IN ('raw', 'hourly', 'daily', 'weekly'))
);

-- 메트릭 종류:
-- 'active_users', 'concurrent_sessions', 'api_response_time', 
-- 'database_connections', 'memory_usage', 'cpu_usage',
-- 'project_creation_rate', 'opinion_creation_rate'
```

#### 7. error_logs (에러 로그)
```sql
CREATE TABLE error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);
```

### Stage Data Structure (JSONB) - 확장

#### Stage 1 (기본정보) - 필드 정의
```typescript
interface Stage1Data {
  // 기본 정보
  productGroup: string;           // 제품군
  manufacturer: string;           // 제조사
  vendor: string;                // 공급업체
  derivativeModel: string;       // 파생 모델
  
  // 일정 관리
  launchDate: string;            // 출시 예정일
  launchDateExecuted: boolean;   // 출시 완료 여부
  massProductionDate: string;    // 양산 예정일
  massProductionDateExecuted: boolean; // 양산 완료 여부
  
  // 담당자 정보
  productManager: string;        // 제품 담당자
  mechanicalEngineer: string;    // 기구 담당자
  circuitEngineer: string;       // 회로 담당자
  
  // 추가 메타데이터
  notes: string;                 // 비고
  attachments: FileAttachment[]; // 첨부 파일
  estimatedBudget: number;       // 예상 예산
  targetMarket: string[];        // 목표 시장
  
  // 승인 프로세스
  approvals: {
    productPlanning: ApprovalStatus;
    engineering: ApprovalStatus;
    marketing: ApprovalStatus;
  };
}

interface ApprovalStatus {
  approved: boolean;
  approver: string;
  approvedAt: string;
  comments: string;
}
```

#### Stage 2 (생산준비) - 상세 확장
```typescript
interface Stage2Data {
  // 파일럿 생산
  pilotProductionDate: string;
  pilotProductionDateExecuted: boolean;
  pilotQuantity: number;
  pilotLocation: string;
  pilotResults: {
    quality: 'pass' | 'fail' | 'pending';
    yield: number;
    issues: string[];
    recommendations: string[];
  };
  
  // 기술 이전
  techTransferDate: string;
  techTransferDateExecuted: boolean;
  techTransferDocuments: FileAttachment[];
  installationParty: string;
  serviceParty: string;
  
  // 교육 및 매뉴얼
  trainingDate: string;
  trainingDateExecuted: boolean;
  trainingAttendees: string[];
  userManualUpload: string;
  techManualUpload: string;
  userManualUploaded: boolean;
  techManualUploaded: boolean;
  
  // 생산 준비도 검증
  equipmentReadiness: number;    // 설비 준비도 (0-100%)
  materialReadiness: number;     // 자재 준비도 (0-100%)
  personnelReadiness: number;    // 인력 준비도 (0-100%)
  
  notes: string;
}
```

#### Stage 3 (양산준비) - 통합 관리
```typescript
interface Stage3Data {
  // BOM 관리
  bomManager: string;
  bomCompletionDate: string;
  bomCompletionDateExecuted: boolean;
  bomVersion: string;
  bomStatus: 'draft' | 'review' | 'approved' | 'locked';
  
  // 단가 관리
  priceManager: string;
  priceRegistrationDate: string;
  priceRegistrationDateExecuted: boolean;
  targetPrice: number;
  actualPrice: number;
  priceVariance: number;
  
  // 부품 수급
  firstPartsOrderDate: string;
  firstPartsOrderDateExecuted: boolean;
  partsReceiptDate: string;
  partsReceiptDateExecuted: boolean;
  partsReceiptManager: string;
  supplierReadiness: {
    [supplierId: string]: {
      name: string;
      status: 'ready' | 'pending' | 'delayed';
      deliveryDate: string;
    };
  };
  
  // 지점 주문 가이드
  branchOrderGuideDate: string;
  branchOrderGuideDateExecuted: boolean;
  orderGuideDocuments: FileAttachment[];
  distributionChannels: string[];
  
  // 품질 관리
  qualityChecklist: {
    [checkItem: string]: {
      completed: boolean;
      completedBy: string;
      completedAt: string;
      notes: string;
    };
  };
  
  notes: string;
}

interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}
```

### 데이터베이스 함수 및 트리거

#### 자동 진행률 계산 트리거
```sql
-- 단계 데이터 업데이트 시 자동 진행률 계산
CREATE OR REPLACE FUNCTION update_stage_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress := calculate_stage_progress(NEW.stage_data, NEW.stage_number);
  NEW.updated_at := NOW();
  
  -- 프로젝트 전체 진행률 업데이트
  UPDATE projects 
  SET cached_progress = calculate_project_overall_progress(NEW.project_id),
      updated_at = NOW(),
      last_activity_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stage_progress
  BEFORE UPDATE ON project_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_progress();
```

#### 검색 벡터 업데이트
```sql
-- 프로젝트 검색 벡터 자동 업데이트
CREATE OR REPLACE FUNCTION update_project_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('korean', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('korean', COALESCE(NEW.model_name, '')), 'A') ||
    setweight(to_tsvector('korean', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('korean', array_to_string(NEW.tags, ' ')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_search
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_search_vector();
```

#### 의견 스레드 경로 관리
```sql
-- 의견 답글 계층 구조 자동 관리
CREATE OR REPLACE FUNCTION manage_opinion_thread_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- 최상위 의견
    NEW.thread_path := NEW.id::text::ltree;
  ELSE
    -- 답글인 경우 부모 경로에 추가
    SELECT thread_path || NEW.id::text::ltree
    INTO NEW.thread_path
    FROM opinions
    WHERE id = NEW.parent_id;
    
    -- 부모 의견의 답글 수 증가
    UPDATE opinions 
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
  END IF;
  
  -- 프로젝트 의견 수 업데이트
  UPDATE projects 
  SET opinion_count = opinion_count + 1,
      last_activity_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manage_opinion_thread
  BEFORE INSERT ON opinions
  FOR EACH ROW
  EXECUTE FUNCTION manage_opinion_thread_path();
```

---

## 🔐 Row Level Security (RLS) 정책 - 고도화

### 다층 보안 모델
```sql
-- 동적 권한 체크 함수
CREATE OR REPLACE FUNCTION check_user_project_access(project_uuid UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID := auth.uid();
  user_role TEXT;
  is_owner BOOLEAN := FALSE;
  is_collaborator BOOLEAN := FALSE;
  collaborator_role TEXT;
BEGIN
  -- 사용자 역할 확인
  SELECT role INTO user_role FROM profiles WHERE id = user_uuid;
  
  -- 관리자는 모든 권한
  IF user_role IN ('admin', 'manager') THEN
    RETURN TRUE;
  END IF;
  
  -- 프로젝트 소유자 확인
  SELECT created_by = user_uuid INTO is_owner FROM projects WHERE id = project_uuid;
  
  -- 협업자 권한 확인
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END,
    MAX(role)
  INTO is_collaborator, collaborator_role
  FROM project_collaborators 
  WHERE project_id = project_uuid AND user_id = user_uuid;
  
  -- 권한별 접근 제어
  CASE required_permission
    WHEN 'view' THEN
      RETURN is_owner OR is_collaborator OR user_role = 'manager';
    WHEN 'edit' THEN
      RETURN is_owner OR collaborator_role IN ('owner', 'editor') OR user_role = 'admin';
    WHEN 'delete' THEN
      RETURN is_owner OR user_role = 'admin';
    WHEN 'manage_collaborators' THEN
      RETURN is_owner OR user_role = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 세밀한 RLS 정책
```sql
-- 프로젝트 조회 정책
CREATE POLICY "Dynamic project access"
ON projects FOR SELECT
USING (check_user_project_access(id, 'view'));

-- 프로젝트 수정 정책
CREATE POLICY "Dynamic project update"
ON projects FOR UPDATE
USING (check_user_project_access(id, 'edit'))
WITH CHECK (check_user_project_access(id, 'edit'));

-- 의견 조회 정책 (비공개 의견 처리)
CREATE POLICY "Opinion access with privacy"
ON opinions FOR SELECT
USING (
  NOT is_private OR 
  author_id = auth.uid() OR 
  check_user_project_access(project_id, 'edit') OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- 활동 로그 정책 (관리자만)
CREATE POLICY "Admin only activity logs"
ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) OR
  user_id = auth.uid() -- 자신의 활동만 조회 가능
);
```

---

## 🧭 페이지 구조 및 라우팅

### 라우팅 시스템 (React Router v6)
```typescript
// 라우팅 구조
const routes = {
  // 인증
  '/auth/login': '로그인',
  '/auth/register': '회원가입',
  '/auth/forgot-password': '비밀번호 재설정',
  '/auth/verify-email': '이메일 인증',
  '/auth/mfa-setup': '2단계 인증 설정',
  
  // 메인 영역
  '/': '홈 (대시보드로 리다이렉트)',
  '/dashboard': '메인 대시보드',
  
  // 프로젝트 관리
  '/projects': '프로젝트 목록',
  '/projects/new': '새 프로젝트 생성',
  '/projects/:id': '프로젝트 상세보기',
  '/projects/:id/edit': '프로젝트 편집',
  '/projects/:id/stages/:stage': '특정 단계 편집',
  '/projects/:id/collaborators': '협업자 관리',
  '/projects/:id/history': '변경 이력',
  '/projects/completed': '완료된 프로젝트',
  '/projects/templates': '프로젝트 템플릿',
  
  // 의견 관리
  '/opinions': '전체 의견 목록',
  '/opinions/:id': '의견 상세보기',
  
  // 리포트 및 분석
  '/reports': '리포트 대시보드',
  '/reports/progress': '진행률 분석',
  '/reports/performance': '성능 분석',
  '/reports/export': '데이터 내보내기',
  
  // 달력 및 일정
  '/calendar': '캘린더 뷰',
  '/calendar/gantt': '간트 차트',
  
  // 관리자
  '/admin': '관리자 대시보드',
  '/admin/users': '사용자 관리',
  '/admin/audit': '감사 로그',
  '/admin/security': '보안 설정',
  '/admin/system': '시스템 모니터링',
  '/admin/backup': '백업 관리',
  
  // 사용자 설정
  '/profile': '프로필 관리',
  '/settings': '설정',
  '/settings/notifications': '알림 설정',
  '/settings/privacy': '개인정보 설정',
  
  // 도움말
  '/help': '도움말',
  '/help/getting-started': '시작하기',
  '/help/tutorials': '튜토리얼',
  '/help/faq': '자주 묻는 질문'
};
```

### 고급 라우터 구성
```typescript
// src/router/AppRouter.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AdminRoute } from '../components/auth/AdminRoute';

// 지연 로딩을 위한 컴포넌트 분할
const Dashboard = lazy(() => import('../pages/Dashboard'));
const ProjectList = lazy(() => import('../pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('../pages/projects/ProjectDetail'));
const ProjectEdit = lazy(() => import('../pages/projects/ProjectEdit'));
const AdminPanel = lazy(() => import('../pages/admin/AdminPanel'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <GlobalErrorPage />,
    children: [
      // 공개 라우트
      {
        path: 'auth',
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ]
      },
      
      // 보호된 라우트
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            )
          },
          {
            path: 'projects',
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProjectList />
                  </Suspense>
                )
              },
              {
                path: ':id',
                element: (
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProjectDetail />
                  </Suspense>
                )
              },
              {
                path: ':id/edit',
                element: (
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProjectEdit />
                  </Suspense>
                )
              }
            ]
          },
          
          // 관리자 전용 라우트
          {
            path: 'admin',
            element: <AdminRoute />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminPanel />
                  </Suspense>
                )
              }
            ]
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => (
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);
```

### 페이지별 상세 명세

#### 1. 향상된 대시보드 (/dashboard)
```typescript
interface DashboardProps {
  // 대시보드 구성 요소
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { data: stats } = useDashboardStats();
  const { data: recentProjects } = useRecentProjects(5);
  const { data: myTasks } = useMyTasks();
  const { data: notifications } = useNotifications();
  
  return (
    <div className="space-y-6">
      {/* 상단 메트릭 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="전체 프로젝트"
          value={stats?.totalProjects}
          change={stats?.projectsChange}
          trend="up"
          icon={FolderIcon}
        />
        <MetricCard
          title="진행중 프로젝트"
          value={stats?.activeProjects}
          change={stats?.activeChange}
          trend="stable"
          icon={PlayIcon}
        />
        <MetricCard
          title="평균 진행률"
          value={`${stats?.avgProgress}%`}
          change={stats?.progressChange}
          trend="up"
          icon={TrendingUpIcon}
        />
        <MetricCard
          title="이번 주 완료"
          value={stats?.weeklyCompleted}
          change={stats?.completedChange}
          trend="up"
          icon={CheckCircleIcon}
        />
      </div>
      
      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 진행률 차트 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 진행률 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart data={stats?.progressData} />
            </CardContent>
          </Card>
        </div>
        
        {/* 최근 활동 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={stats?.recentActivities} />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 내 프로젝트 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 프로젝트</CardTitle>
            <Link to="/projects" className="text-blue-600 hover:text-blue-800">
              모두 보기
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects?.map(project => (
                <ProjectMiniCard key={project.id} project={project} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 내 할일 */}
        <Card>
          <CardHeader>
            <CardTitle>내 할일</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={myTasks} />
          </CardContent>
        </Card>
      </div>
      
      {/* 알림 및 공지사항 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 및 공지사항</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList notifications={notifications} />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### 2. 고성능 프로젝트 목록 (/projects)
```typescript
const ProjectList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 무한 스크롤을 위한 React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteProjects({
    filters,
    sortBy,
    search: searchQuery,
    pageSize: 20
  });
  
  // 가상화된 리스트 (대량 데이터 처리)
  const allProjects = useMemo(() => {
    return data?.pages.flatMap(page => page.projects) || [];
  }, [data]);
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="text-gray-600">전체 {data?.pages[0]?.total || 0}개 프로젝트</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setViewMode('grid')} variant={viewMode === 'grid' ? 'default' : 'outline'}>
            <GridIcon className="w-4 h-4" />
          </Button>
          <Button onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'default' : 'outline'}>
            <ListIcon className="w-4 h-4" />
          </Button>
          <Button onClick={() => setViewMode('table')} variant={viewMode === 'table' ? 'default' : 'outline'}>
            <TableIcon className="w-4 h-4" />
          </Button>
          <Link to="/projects/new">
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 프로젝트
            </Button>
          </Link>
        </div>
      </div>
      
      {/* 필터링 및 검색 */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="프로젝트명, 모델명으로 검색..."
            debounceMs={300}
          />
        </div>
        <ProjectFilters
          filters={filters}
          onChange={setFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>
      
      {/* 프로젝트 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <VirtualizedProjectGrid
          projects={allProjects}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      ) : viewMode === 'list' ? (
        <VirtualizedProjectList
          projects={allProjects}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      ) : (
        <ProjectTable
          projects={allProjects}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      )}
      
      {/* 빈 상태 */}
      {!isLoading && allProjects.length === 0 && (
        <EmptyState
          title="프로젝트가 없습니다"
          description="첫 번째 프로젝트를 생성해보세요."
          action={
            <Link to="/projects/new">
              <Button>새 프로젝트 생성</Button>
            </Link>
          }
        />
      )}
    </div>
  );
};
```

---

## 🎨 UI/UX 컴포넌트 시스템

### 확장된 디자인 시스템

#### 다크 모드 지원
```css
:root {
  /* 라이트 모드 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-primary: #e5e7eb;
  
  /* 쿠쿠 브랜드 컬러 */
  --cuckoo-red: #dc2626;
  --cuckoo-red-light: #fee2e2;
  --cuckoo-red-dark: #991b1b;
}

[data-theme="dark"] {
  /* 다크 모드 */
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-primary: #374151;
  
  /* 다크 모드용 쿠쿠 컬러 */
  --cuckoo-red: #ef4444;
  --cuckoo-red-light: #fee2e2;
  --cuckoo-red-dark: #dc2626;
}

/* 애니메이션 */
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

#### 반응형 타이포그래피
```css
/* 유연한 타이포그래피 시스템 */
.text-responsive-xs { font-size: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem); }
.text-responsive-sm { font-size: clamp(0.875rem, 0.8rem + 0.375vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 1rem + 0.625vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem); }
.text-responsive-2xl { font-size: clamp(1.5rem, 1.3rem + 1vw, 2rem); }
.text-responsive-3xl { font-size: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem); }

/* 한국어 최적화 */
.korean-text {
  font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  word-break: keep-all;
  line-height: 1.7;
}
```

### 고성능 컴포넌트

#### 1. 가상화된 프로젝트 그리드
```typescript
// src/components/project/VirtualizedProjectGrid.tsx
import { FixedSizeGrid as Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';

interface VirtualizedProjectGridProps {
  projects: Project[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const VirtualizedProjectGrid: React.FC<VirtualizedProjectGridProps> = ({
  projects,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const COLUMN_COUNT = 3;
  const ITEM_HEIGHT = 320;
  const ITEM_WIDTH = 400;
  const GAP = 24;
  
  const rowCount = Math.ceil(projects.length / COLUMN_COUNT);
  const itemCount = hasMore ? projects.length + COLUMN_COUNT : projects.length;
  
  const isItemLoaded = (index: number) => !hasMore || index < projects.length;
  
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex;
    const project = projects[index];
    
    if (!project) {
      return (
        <div style={style}>
          {isLoadingMore && <ProjectCardSkeleton />}
        </div>
      );
    }
    
    return (
      <div
        style={{
          ...style,
          left: (style.left as number) + GAP / 2,
          top: (style.top as number) + GAP / 2,
          width: (style.width as number) - GAP,
          height: (style.height as number) - GAP
        }}
      >
        <ProjectCard
          project={project}
          mode="grid"
          showActions
          onView={handleProjectView}
          onEdit={handleProjectEdit}
        />
      </div>
    );
  };
  
  return (
    <div className="h-[800px]">
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={onLoadMore}
            threshold={3}
          >
            {({ onItemsRendered, ref }) => (
              <Grid
                ref={ref}
                height={height}
                width={width}
                columnCount={COLUMN_COUNT}
                columnWidth={ITEM_WIDTH + GAP}
                rowCount={rowCount}
                rowHeight={ITEM_HEIGHT + GAP}
                onItemsRendered={({
                  visibleColumnStartIndex,
                  visibleColumnStopIndex,
                  visibleRowStartIndex,
                  visibleRowStopIndex
                }) => {
                  onItemsRendered({
                    overscanStartIndex: visibleRowStartIndex * COLUMN_COUNT,
                    overscanStopIndex: visibleRowStopIndex * COLUMN_COUNT + COLUMN_COUNT - 1,
                    visibleStartIndex: visibleRowStartIndex * COLUMN_COUNT,
                    visibleStopIndex: visibleRowStopIndex * COLUMN_COUNT + COLUMN_COUNT - 1
                  });
                }}
              >
                {Cell}
              </Grid>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  );
};
```

#### 2. 최적화된 이미지 컴포넌트
```typescript
// src/components/ui/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'blur',
  blurDataURL
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;
    
    const img = imgRef.current;
    if (!img) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src!;
          observer.unobserve(img);
        }
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(img);
    
    return () => observer.disconnect();
  }, [priority]);
  
  // WebP 지원 감지
  const supportsWebP = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }, []);
  
  const getOptimizedSrc = (src: string, width: number, format?: string) => {
    const params = new URLSearchParams();
    params.set('width', width.toString());
    params.set('height', height.toString());
    params.set('fit', 'cover');
    params.set('quality', '85');
    
    if (format) {
      params.set('format', format);
    }
    
    return `${src}?${params.toString()}`;
  };
  
  const srcSet = useMemo(() => {
    const format = supportsWebP ? 'webp' : 'jpeg';
    return [
      `${getOptimizedSrc(src, width / 2, format)} ${width / 2}w`,
      `${getOptimizedSrc(src, width, format)} ${width}w`,
      `${getOptimizedSrc(src, width * 2, format)} ${width * 2}w`
    ].join(', ');
  }, [src, width, height, supportsWebP]);
  
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 블러 플레이스홀더 */}
      {placeholder === 'blur' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}
      
      {/* WebP 지원 시 picture 요소 사용 */}
      {supportsWebP ? (
        <picture>
          <source
            srcSet={srcSet.replace(/jpeg/g, 'webp')}
            sizes={sizes}
            type="image/webp"
          />
          <source
            srcSet={srcSet}
            sizes={sizes}
            type="image/jpeg"
          />
          <img
            ref={imgRef}
            src={priority ? getOptimizedSrc(src, width) : undefined}
            data-src={!priority ? getOptimizedSrc(src, width) : undefined}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      ) : (
        <img
          ref={imgRef}
          src={priority ? getOptimizedSrc(src, width) : undefined}
          data-src={!priority ? getOptimizedSrc(src, width) : undefined}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
```

#### 3. 고성능 의견 시스템
```typescript
// src/components/opinion/OpinionSystem.tsx
interface OpinionSystemProps {
  projectId: string;
  stageId?: string;
  currentUser: User;
  className?: string;
}

const OpinionSystem: React.FC<OpinionSystemProps> = ({
  projectId,
  stageId,
  currentUser,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showResolved, setShowResolved] = useState(false);
  
  // 실시간 의견 구독
  const { 
    data: opinions, 
    isLoading,
    hasNextPage,
    fetchNextPage 
  } = useInfiniteOpinions({
    projectId,
    stageId,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    sortBy,
    includeResolved: showResolved,
    pageSize: 20
  });
  
  // 실시간 업데이트 구독
  useRealtimeOpinions(projectId, {
    onOpinionAdded: (opinion) => {
      toast.success(`새 의견이 추가되었습니다: ${opinion.title}`);
    },
    onOpinionUpdated: (opinion) => {
      if (opinion.status === 'resolved') {
        toast.info(`의견이 해결되었습니다: ${opinion.title}`);
      }
    }
  });
  
  const allOpinions = useMemo(() => {
    return opinions?.pages.flatMap(page => page.opinions) || [];
  }, [opinions]);
  
  const opinionStats = useMemo(() => {
    const total = allOpinions.length;
    const open = allOpinions.filter(o => o.status === 'open').length;
    const inReview = allOpinions.filter(o => o.status === 'in_review').length;
    const resolved = allOpinions.filter(o => o.status === 'resolved').length;
    
    return { total, open, inReview, resolved };
  }, [allOpinions]);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 의견 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="전체 의견"
          value={opinionStats.total}
          icon={MessageSquareIcon}
          color="blue"
        />
        <StatCard
          title="미해결"
          value={opinionStats.open}
          icon={AlertCircleIcon}
          color="red"
        />
        <StatCard
          title="검토중"
          value={opinionStats.inReview}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title="해결됨"
          value={opinionStats.resolved}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>
      
      {/* 필터 및 정렬 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <OpinionCategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
          <ToggleSwitch
            checked={showResolved}
            onChange={setShowResolved}
            label="해결된 의견 포함"
          />
        </div>
        
        <div className="flex gap-2">
          <SortDropdown
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'newest', label: '최신순' },
              { value: 'oldest', label: '오래된순' },
              { value: 'popular', label: '인기순' }
            ]}
          />
          <OpinionFormModal
            projectId={projectId}
            stageId={stageId}
            currentUser={currentUser}
            trigger={
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                의견 작성
              </Button>
            }
          />
        </div>
      </div>
      
      {/* 의견 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <OpinionCardSkeleton key={i} />
          ))
        ) : allOpinions.length === 0 ? (
          <EmptyState
            title="의견이 없습니다"
            description="첫 번째 의견을 작성해보세요."
            icon={MessageSquareIcon}
          />
        ) : (
          <VirtualizedOpinionList
            opinions={allOpinions}
            currentUser={currentUser}
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 🔧 비즈니스 로직

### 고도화된 진행률 계산 시스템

#### 가중치 기반 진행률 계산
```typescript
// src/utils/progressCalculation.ts
interface FieldDefinition {
  key: string;
  type: 'date' | 'text' | 'checkbox' | 'file' | 'number';
  weight: number; // 가중치 (0.1 ~ 2.0)
  required: boolean;
  dependencies?: string[]; // 의존성 필드
  validationRules?: ValidationRule[];
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

// 단계별 필드 정의 (가중치 포함)
const STAGE_FIELD_DEFINITIONS: Record<number, FieldDefinition[]> = {
  1: [
    { key: 'productGroup', type: 'text', weight: 1.0, required: true },
    { key: 'manufacturer', type: 'text', weight: 1.0, required: true },
    { key: 'vendor', type: 'text', weight: 0.8, required: false },
    { key: 'derivativeModel', type: 'text', weight: 0.6, required: false },
    { 
      key: 'launchDate', 
      type: 'date', 
      weight: 1.5, 
      required: true,
      validationRules: [
        { type: 'min', value: new Date(), message: '출시일은 현재 날짜 이후여야 합니다' }
      ]
    },
    { key: 'launchDateExecuted', type: 'checkbox', weight: 1.5, required: false },
    { 
      key: 'massProductionDate', 
      type: 'date', 
      weight: 2.0, 
      required: true,
      dependencies: ['launchDate'],
      validationRules: [
        { type: 'custom', value: 'beforeLaunchDate', message: '양산일은 출시일보다 빨라야 합니다' }
      ]
    },
    { key: 'massProductionDateExecuted', type: 'checkbox', weight: 2.0, required: false },
    { key: 'productManager', type: 'text', weight: 1.2, required: true },
    { key: 'mechanicalEngineer', type: 'text', weight: 1.0, required: true },
    { key: 'circuitEngineer', type: 'text', weight: 1.0, required: true },
    { key: 'estimatedBudget', type: 'number', weight: 0.8, required: false },
    { key: 'targetMarket', type: 'text', weight: 0.6, required: false }
  ],
  2: [
    { key: 'pilotProductionDate', type: 'date', weight: 1.5, required: true },
    { key: 'pilotProductionDateExecuted', type: 'checkbox', weight: 1.5, required: false },
    { key: 'pilotQuantity', type: 'number', weight: 1.0, required: true },
    { key: 'techTransferDate', type: 'date', weight: 1.8, required: true },
    { key: 'techTransferDateExecuted', type: 'checkbox', weight: 1.8, required: false },
    { key: 'installationParty', type: 'text', weight: 1.0, required: true },
    { key: 'serviceParty', type: 'text', weight: 1.0, required: true },
    { key: 'trainingDate', type: 'date', weight: 1.2, required: true },
    { key: 'trainingDateExecuted', type: 'checkbox', weight: 1.2, required: false },
    { key: 'userManualUpload', type: 'file', weight: 1.5, required: true },
    { key: 'techManualUpload', type: 'file', weight: 1.5, required: true },
    { key: 'userManualUploaded', type: 'checkbox', weight: 1.5, required: false },
    { key: 'techManualUploaded', type: 'checkbox', weight: 1.5, required: false },
    { key: 'equipmentReadiness', type: 'number', weight: 1.3, required: true },
    { key: 'materialReadiness', type: 'number', weight: 1.3, required: true },
    { key: 'personnelReadiness', type: 'number', weight: 1.1, required: true }
  ],
  3: [
    { key: 'bomManager', type: 'text', weight: 1.2, required: true },
    { key: 'bomCompletionDate', type: 'date', weight: 2.0, required: true },
    { key: 'bomCompletionDateExecuted', type: 'checkbox', weight: 2.0, required: false },
    { key: 'bomVersion', type: 'text', weight: 1.0, required: true },
    { key: 'priceManager', type: 'text', weight: 1.2, required: true },
    { key: 'priceRegistrationDate', type: 'date', weight: 1.8, required: true },
    { key: 'priceRegistrationDateExecuted', type: 'checkbox', weight: 1.8, required: false },
    { key: 'targetPrice', type: 'number', weight: 1.5, required: true },
    { key: 'firstPartsOrderDate', type: 'date', weight: 1.6, required: true },
    { key: 'firstPartsOrderDateExecuted', type: 'checkbox', weight: 1.6, required: false },
    { key: 'partsReceiptDate', type: 'date', weight: 1.4, required: true },
    { key: 'partsReceiptDateExecuted', type: 'checkbox', weight: 1.4, required: false },
    { key: 'partsReceiptManager', type: 'text', weight: 1.0, required: true },
    { key: 'branchOrderGuideDate', type: 'date', weight: 1.3, required: true },
    { key: 'branchOrderGuideDateExecuted', type: 'checkbox', weight: 1.3, required: false }
  ]
};

export const calculateStageProgress = (stageData: any, stageNumber: number): number => {
  const fields = STAGE_FIELD_DEFINITIONS[stageNumber] || [];
  let totalWeight = 0;
  let achievedWeight = 0;
  let validationErrors: string[] = [];
  
  fields.forEach(field => {
    const value = stageData[field.key];
    totalWeight += field.weight;
    
    // 필드 유효성 검사
    const isValid = validateField(field, value, stageData);
    if (!isValid.valid) {
      validationErrors.push(isValid.error!);
    }
    
    // 진행률 계산
    switch (field.type) {
      case 'date':
        if (value && value.trim() !== '') {
          achievedWeight += field.weight * 0.5; // 날짜 입력 50%
          
          // 실행 완료 체크
          const executedKey = `${field.key}Executed`;
          if (stageData[executedKey] === true) {
            achievedWeight += field.weight * 0.5; // 실행 완료 50%
          }
        }
        break;
        
      case 'checkbox':
        if (value === true) {
          achievedWeight += field.weight;
        }
        break;
        
      case 'file':
        if (value && value.trim() !== '') {
          achievedWeight += field.weight * 0.7; // 파일 업로드 70%
          
          // 업로드 완료 체크
          const uploadedKey = `${field.key}ed`; // userManualUpload -> userManualUploaded
          if (stageData[uploadedKey] === true) {
            achievedWeight += field.weight * 0.3; // 업로드 확인 30%
          }
        }
        break;
        
      case 'number':
        if (typeof value === 'number' && value >= 0) {
          // 숫자 필드는 0-100% 범위로 계산
          const percentage = field.key.includes('Readiness') ? value / 100 : 1;
          achievedWeight += field.weight * Math.min(percentage, 1);
        }
        break;
        
      default: // text
        if (value && value.trim() !== '') {
          achievedWeight += field.weight;
        }
        break;
    }
  });
  
  const progress = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  
  // 유효성 검사 실패 시 진행률 페널티
  if (validationErrors.length > 0) {
    const penalty = Math.min(validationErrors.length * 5, 25); // 최대 25% 페널티
    return Math.max(progress - penalty, 0);
  }
  
  return Math.min(progress, 100);
};

// 필드 유효성 검사
const validateField = (field: FieldDefinition, value: any, allData: any): { valid: boolean; error?: string } => {
  // 필수 필드 검사
  if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: false, error: `${field.key}는 필수 입력 항목입니다.` };
  }
  
  // 의존성 검사
  if (field.dependencies) {
    for (const dep of field.dependencies) {
      if (!allData[dep] || (typeof allData[dep] === 'string' && allData[dep].trim() === '')) {
        return { valid: false, error: `${field.key}를 입력하려면 먼저 ${dep}를 입력해야 합니다.` };
      }
    }
  }
  
  // 커스텀 유효성 검사
  if (field.validationRules) {
    for (const rule of field.validationRules) {
      if (rule.type === 'custom' && rule.value === 'beforeLaunchDate') {
        const launchDate = new Date(allData.launchDate);
        const massDate = new Date(value);
        if (massDate >= launchDate) {
          return { valid: false, error: rule.message };
        }
      }
    }
  }
  
  return { valid: true };
};

// 프로젝트 전체 진행률 (가중 평균)
export const calculateProjectProgress = (project: Project): ProjectProgress => {
  const stage1Progress = calculateStageProgress(project.stage1 || {}, 1);
  const stage2Progress = calculateStageProgress(project.stage2 || {}, 2);
  const stage3Progress = calculateStageProgress(project.stage3 || {}, 3);
  
  // 단계별 가중치 (후반부 단계일수록 높은 가중치)
  const weights = { stage1: 0.2, stage2: 0.3, stage3: 0.5 };
  
  const overall = Math.round(
    (stage1Progress * weights.stage1 + 
     stage2Progress * weights.stage2 + 
     stage3Progress * weights.stage3) / 
    (weights.stage1 + weights.stage2 + weights.stage3) * 100
  ) / 100;
  
  return {
    overall: Math.round(overall),
    stage1: stage1Progress,
    stage2: stage2Progress,
    stage3: stage3Progress,
    breakdown: {
      stage1Weight: weights.stage1,
      stage2Weight: weights.stage2,
      stage3Weight: weights.stage3
    }
  };
};
```

### D-Day 및 일정 관리 시스템

#### 지능형 D-Day 계산
```typescript
// src/utils/dateCalculation.ts
interface DateCalculationOptions {
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  workingHoursOnly?: boolean;
  timeZone?: string;
}

interface DDayResult {
  dDay: number;
  status: DDayStatus;
  workingDays?: number;
  isOverdue: boolean;
  criticalPath?: CriticalPathInfo;
}

interface CriticalPathInfo {
  remainingTasks: string[];
  estimatedCompletionDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

// 한국 공휴일 데이터
const KOREAN_HOLIDAYS_2024: Record<string, string> = {
  '2024-01-01': '신정',
  '2024-02-09': '설날연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날연휴',
  '2024-02-12': '대체공휴일',
  '2024-03-01': '삼일절',
  '2024-04-10': '국회의원선거',
  '2024-05-05': '어린이날',
  '2024-05-06': '대체공휴일',
  '2024-05-15': '부처님오신날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-09-16': '추석연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석연휴',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '크리스마스'
};

export const calculateAdvancedDDay = (
  targetDate: string | Date,
  options: DateCalculationOptions = {}
): DDayResult => {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let workingDays = diffDays;
  
  // 영업일 계산
  if (options.excludeWeekends || options.excludeHolidays) {
    workingDays = calculateWorkingDays(today, target, options);
  }
  
  const status = getDDayStatus(diffDays);
  const isOverdue = diffDays < 0;
  
  return {
    dDay: diffDays,
    status,
    workingDays: options.excludeWeekends || options.excludeHolidays ? workingDays : undefined,
    isOverdue,
    criticalPath: calculateCriticalPath(target, diffDays)
  };
};

const calculateWorkingDays = (
  startDate: Date,
  endDate: Date,
  options: DateCalculationOptions
): number => {
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    
    // 주말 제외
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (options.excludeWeekends && isWeekend) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    
    // 공휴일 제외
    const isHoliday = KOREAN_HOLIDAYS_2024[dateStr];
    if (options.excludeHolidays && isHoliday) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    
    workingDays++;
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

const calculateCriticalPath = (targetDate: Date, daysRemaining: number): CriticalPathInfo => {
  // 남은 작업들의 우선순위와 예상 소요시간
  const remainingTasks = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  if (daysRemaining < 0) {
    riskLevel = 'high';
    remainingTasks.push('프로젝트가 이미 지연되었습니다');
  } else if (daysRemaining <= 7) {
    riskLevel = 'high';
    remainingTasks.push('즉시 완료 필요한 작업들을 확인하세요');
  } else if (daysRemaining <= 30) {
    riskLevel = 'medium';
    remainingTasks.push('주요 마일스톤 점검이 필요합니다');
  }
  
  const estimatedCompletionDate = new Date(targetDate);
  if (riskLevel === 'high') {
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 7); // 1주 지연 예상
  }
  
  return {
    remainingTasks,
    estimatedCompletionDate,
    riskLevel
  };
};

export const getDDayStatus = (dDay: number): DDayStatus => {
  if (dDay < 0) {
    return {
      type: 'overdue',
      text: `D+${Math.abs(dDay)}`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      emoji: '🚨',
      urgency: 'critical'
    };
  } else if (dDay === 0) {
    return {
      type: 'today',
      text: 'D-DAY',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      emoji: '⚡',
      urgency: 'critical'
    };
  } else if (dDay <= 3) {
    return {
      type: 'critical',
      text: `D-${dDay}`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      emoji: '🔥',
      urgency: 'high'
    };
  } else if (dDay <= 7) {
    return {
      type: 'urgent',
      text: `D-${dDay}`,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      emoji: '⚠️',
      urgency: 'high'
    };
  } else if (dDay <= 30) {
    return {
      type: 'soon',
      text: `D-${dDay}`,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      emoji: '📅',
      urgency: 'medium'
    };
  } else {
    return {
      type: 'normal',
      text: `D-${dDay}`,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      emoji: '📍',
      urgency: 'low'
    };
  }
};
```

---

## 🔐 인증 및 권한 시스템

### 고도화된 인증 시스템

#### 2단계 인증 (MFA) 지원
```typescript
// src/hooks/useAuth.ts
interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    mfaRequired: false,
    mfaSetupRequired: false
  });
  
  // 세션 지속성 관리
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;
    
    const setupSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user) {
        await handleUserSession(session.user);
        
        // 토큰 자동 갱신 설정
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000); // 5분 전 갱신
          refreshTimer = setTimeout(async () => {
            await supabase.auth.refreshSession();
          }, refreshTime);
        }
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
    };
    
    setupSession();
    
    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            mfaRequired: false,
            mfaSetupRequired: false
          });
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);
  
  const handleUserSession = async (user: any) => {
    try {
      // 사용자 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // 프로필이 없으면 생성
        const newProfile = await createUserProfile(user);
        setAuthState(prev => ({
          ...prev,
          user,
          profile: newProfile,
          mfaSetupRequired: !user.user_metadata?.mfa_enabled
        }));
      } else if (profile) {
        // 로그인 통계 업데이트
        await updateLoginStats(user.id);
        
        setAuthState(prev => ({
          ...prev,
          user,
          profile,
          mfaRequired: false,
          mfaSetupRequired: profile.role === 'admin' && !user.user_metadata?.mfa_enabled
        }));
      }
    } catch (error) {
      console.error('Session handling error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };
  
  const signIn = async (email: string, password: string, mfaCode?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes('MFA')) {
          setAuthState(prev => ({ ...prev, mfaRequired: true }));
          return { data: null, error, requiresMFA: true };
        }
        throw error;
      }
      
      // MFA 코드 검증
      if (mfaCode && data.user) {
        const { error: mfaError } = await supabase.auth.mfa.verify({
          factorId: data.user.user_metadata.mfa_factor_id,
          challengeId: data.user.user_metadata.mfa_challenge_id,
          code: mfaCode
        });
        
        if (mfaError) {
          throw mfaError;
        }
      }
      
      // 활동 로그 기록
      await logActivity('user_login', {
        method: 'email_password',
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });
      
      return { data, error: null, requiresMFA: false };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error, requiresMFA: false };
    }
  };
  
  const setupMFA = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });
      
      if (error) throw error;
      
      // QR 코드 생성을 위한 정보 반환
      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id
      };
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  };
  
  const verifyMFA = async (factorId: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: '', // 설정 중에는 빈 값
        code
      });
      
      if (error) throw error;
      
      // 사용자 메타데이터 업데이트
      await supabase.auth.updateUser({
        data: { mfa_enabled: true, mfa_factor_id: factorId }
      });
      
      setAuthState(prev => ({ ...prev, mfaSetupRequired: false }));
      
      return { success: true };
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      // 활동 로그 기록 (로그아웃 전)
      await logActivity('user_logout', {
        session_duration: calculateSessionDuration()
      });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // 로컬 상태 초기화
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        mfaRequired: false,
        mfaSetupRequired: false
      });
      
      // 캐시 정리
      queryClient.clear();
      
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  return {
    ...authState,
    signIn,
    signOut,
    setupMFA,
    verifyMFA,
    updateProfile: useCallback(async (updates: Partial<Profile>) => {
      // 프로필 업데이트 로직
    }, [])
  };
};

// 보조 함수들
const createUserProfile = async (user: any): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      team: user.user_metadata?.team || '',
      department: user.user_metadata?.department || '',
      role: 'user', // 기본 역할
      preferences: {
        theme: 'light',
        language: 'ko',
        notifications: {
          email: true,
          browser: true,
          mentions: true
        }
      }
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

const updateLoginStats = async (userId: string) => {
  await supabase
    .from('profiles')
    .update({
      last_login_at: new Date().toISOString(),
      login_count: supabase.raw('login_count + 1')
    })
    .eq('id', userId);
};
```

### 세밀한 권한 관리 시스템

#### 역할 기반 접근 제어 (RBAC)
```typescript
// src/hooks/usePermissions.ts
interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt';
  value: any;
}

interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[]; // 상속받는 역할들
}

// 역할별 권한 정의
const ROLE_DEFINITIONS: Record<string, Role> = {
  user: {
    name: 'user',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'projects', action: 'create' },
      { 
        resource: 'projects', 
        action: 'update',
        conditions: [{ field: 'created_by', operator: 'eq', value: 'current_user' }]
      },
      { resource: 'opinions', action: 'create' },
      { resource: 'opinions', action: 'read' },
      {
        resource: 'opinions',
        action: 'update',
        conditions: [{ field: 'author_id', operator: 'eq', value: 'current_user' }]
      }
    ]
  },
  
  manager: {
    name: 'manager',
    inherits: ['user'],
    permissions: [
      { resource: 'projects', action: 'update' }, // 모든 프로젝트 수정 가능
      { resource: 'projects', action: 'delete' },
      { resource: 'users', action: 'read' },
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'create' }
    ]
  },
  
  admin: {
    name: 'admin',
    inherits: ['manager'],
    permissions: [
      { resource: '*', action: 'create' },
      { resource: '*', action: 'read' },
      { resource: '*', action: 'update' },
      { resource: '*', action: 'delete' },
      { resource: '*', action: 'manage' }
    ]
  }
};

export const usePermissions = () => {
  const { profile } = useAuth();
  
  const hasPermission = useCallback((
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean => {
    if (!profile) return false;
    
    const userRole = ROLE_DEFINITIONS[profile.role];
    if (!userRole) return false;
    
    // 상속된 권한 포함하여 모든 권한 수집
    const allPermissions = collectPermissions(userRole);
    
    // 해당 리소스와 액션에 대한 권한 찾기
    const matchingPermissions = allPermissions.filter(permission => 
      (permission.resource === resource || permission.resource === '*') &&
      (permission.action === action || permission.action === 'manage')
    );
    
    if (matchingPermissions.length === 0) return false;
    
    // 조건부 권한 검사
    for (const permission of matchingPermissions) {
      if (!permission.conditions) return true; // 무조건 허용
      
      const conditionsMet = permission.conditions.every(condition => 
        evaluateCondition(condition, context, profile)
      );
      
      if (conditionsMet) return true;
    }
    
    return false;
  }, [profile]);
  
  const canAccess = useCallback((route: string): boolean => {
    const routePermissions: Record<string, { resource: string; action: string }> = {
      '/admin': { resource: 'admin', action: 'read' },
      '/admin/users': { resource: 'users', action: 'manage' },
      '/admin/audit': { resource: 'audit_logs', action: 'read' },
      '/reports': { resource: 'reports', action: 'read' },
      '/projects/new': { resource: 'projects', action: 'create' }
    };
    
    const required = routePermissions[route];
    if (!required) return true; // 제한 없는 라우트
    
    return hasPermission(required.resource, required.action);
  }, [hasPermission]);
  
  const getProjectPermissions = useCallback((project: Project) => {
    if (!profile) return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageCollaborators: false
    };
    
    const isOwner = project.created_by === profile.id;
    const isAdmin = profile.role === 'admin';
    const isManager = profile.role === 'manager';
    
    // 협업자 권한 확인 (실제로는 DB에서 조회)
    const collaboratorRole = getCollaboratorRole(project.id, profile.id);
    
    return {
      canView: hasPermission('projects', 'read', { project_id: project.id }),
      canEdit: isOwner || isAdmin || collaboratorRole === 'editor',
      canDelete: isOwner || isAdmin,
      canManageCollaborators: isOwner || isAdmin,
      canComment: hasPermission('opinions', 'create', { project_id: project.id })
    };
  }, [profile, hasPermission]);
  
  return {
    hasPermission,
    canAccess,
    getProjectPermissions,
    userRole: profile?.role,
    isAdmin: profile?.role === 'admin',
    isManager: ['admin', 'manager'].includes(profile?.role || '')
  };
};

// 보조 함수들
const collectPermissions = (role: Role): Permission[] => {
  let permissions = [...role.permissions];
  
  if (role.inherits) {
    for (const inheritedRoleName of role.inherits) {
      const inheritedRole = ROLE_DEFINITIONS[inheritedRoleName];
      if (inheritedRole) {
        permissions = [...permissions, ...collectPermissions(inheritedRole)];
      }
    }
  }
  
  return permissions;
};

const evaluateCondition = (
  condition: PermissionCondition,
  context: Record<string, any> = {},
  profile: Profile
): boolean => {
  let contextValue = context[condition.field];
  
  // 특수 값 처리
  if (condition.value === 'current_user') {
    condition.value = profile.id;
  }
  
  switch (condition.operator) {
    case 'eq':
      return contextValue === condition.value;
    case 'ne':
      return contextValue !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(contextValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(contextValue);
    case 'gt':
      return contextValue > condition.value;
    case 'lt':
      return contextValue < condition.value;
    default:
      return false;
  }
};

// 협업자 역할 조회 (캐시됨)
const collaboratorRoleCache = new Map<string, string>();

const getCollaboratorRole = (projectId: string, userId: string): string | null => {
  const cacheKey = `${projectId}:${userId}`;
  return collaboratorRoleCache.get(cacheKey) || null;
};
```

---

## ⚡ 실시간 기능

### 고도화된 실시간 시스템

#### 연결 상태 모니터링 및 자동 복구
```typescript
// src/hooks/useConnectionStatus.ts
interface ConnectionStatus {
  isOnline: boolean;
  supabaseConnected: boolean;
  lastDisconnectTime?: Date;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    supabaseConnected: true,
    reconnectAttempts: 0,
    connectionQuality: 'excellent'
  });
  
  const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // 온라인 복귀 시 Supabase 연결 상태 확인
      checkSupabaseConnection();
    };
    
    const handleOffline = () => {
      setStatus(prev => ({ 
        ...prev, 
        isOnline: false,
        lastDisconnectTime: new Date(),
        connectionQuality: 'disconnected'
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Supabase 연결 상태 정기 체크
  const checkSupabaseConnection = useCallback(async () => {
    try {
      const startTime = Date.now();
      
      // 간단한 쿼리로 연결 상태 확인
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();
      
      const responseTime = Date.now() - startTime;
      
      if (!error) {
        // 연결 품질 평가
        let quality: ConnectionStatus['connectionQuality'];
        if (responseTime < 100) quality = 'excellent';
        else if (responseTime < 500) quality = 'good';
        else if (responseTime < 2000) quality = 'poor';
        else quality = 'disconnected';
        
        setStatus(prev => ({
          ...prev,
          supabaseConnected: true,
          reconnectAttempts: 0,
          connectionQuality: quality
        }));
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      
      setStatus(prev => ({
        ...prev,
        supabaseConnected: false,
        connectionQuality: 'disconnected'
      }));
      
      // 자동 재연결 시도
      scheduleReconnection();
    }
  }, []);
  
  // 재연결 스케줄링
  const scheduleReconnection = useCallback(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    
    setStatus(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    // 지수적 백오프 (1초, 2초, 4초, 8초, 최대 30초)
    const delay = Math.min(1000 * Math.pow(2, status.reconnectAttempts), 30000);
    
    const timer = setTimeout(() => {
      checkSupabaseConnection();
    }, delay);
    
    setReconnectTimer(timer);
  }, [status.reconnectAttempts, checkSupabaseConnection]);
  
  // 정기적인 연결 상태 체크
  useEffect(() => {
    const interval = setInterval(checkSupabaseConnection, 30000); // 30초마다
    
    // 초기 체크
    checkSupabaseConnection();
    
    return () => {
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [checkSupabaseConnection]);
  
  return {
    ...status,
    forceReconnect: checkSupabaseConnection
  };
};
```

#### 최적화된 실시간 구독 시스템
```typescript
// src/hooks/useRealtimeSubscription.ts
interface SubscriptionOptions {
  filter?: string;
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  throttleMs?: number;
}

interface SubscriptionManager {
  subscribe: (options?: SubscriptionOptions) => void;
  unsubscribe: () => void;
  isSubscribed: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  dependencies: any[] = []
): SubscriptionManager => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const subscriptionRef = useRef<any>(null);
  const throttledCallbackRef = useRef<any>(null);
  
  const { supabaseConnected } = useConnectionStatus();
  
  const subscribe = useCallback((options: SubscriptionOptions = {}) => {
    if (subscriptionRef.current || !supabaseConnected) return;
    
    setConnectionStatus('connecting');
    
    // 스로틀링 적용
    const throttleMs = options.throttleMs || 100;
    throttledCallbackRef.current = throttle((payload: any) => {
      callback(payload);
    }, throttleMs);
    
    const channelName = `${table}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    // PostgreSQL 변경 사항 구독
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: options.filter
      },
      (payload) => {
        console.log(`Realtime update for ${table}:`, payload);
        throttledCallbackRef.current(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for ${table}:`, status);
      
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
        setIsSubscribed(true);
        options.onConnect?.();
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionStatus('error');
        setIsSubscribed(false);
        options.onError?.(new Error('Channel subscription failed'));
      } else if (status === 'CLOSED') {
        setConnectionStatus('disconnected');
        setIsSubscribed(false);
        options.onDisconnect?.();
      }
    });
    
    subscriptionRef.current = channel;
  }, [table, callback, supabaseConnected]);
  
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      setIsSubscribed(false);
      setConnectionStatus('disconnected');
    }
  }, []);
  
  // 의존성 변경 시 재구독
  useEffect(() => {
    unsubscribe();
    if (supabaseConnected) {
      subscribe();
    }
    
    return unsubscribe;
  }, [supabaseConnected, ...dependencies]);
  
  return {
    subscribe,
    unsubscribe,
    isSubscribed,
    connectionStatus
  };
};
```

#### 협업 충돌 방지 시스템
```typescript
// src/hooks/useCollaborativeEditing.ts
interface EditingUser {
  userId: string;
  userName: string;
  field: string;
  startedAt: Date;
  cursorPosition?: number;
}

interface CollaborativeState {
  isEditing: boolean;
  editingUsers: EditingUser[];
  conflictWarnings: string[];
  lockOwner?: string;
}

export const useCollaborativeEditing = (
  resourceType: 'project' | 'stage' | 'opinion',
  resourceId: string
) => {
  const [state, setState] = useState<CollaborativeState>({
    isEditing: false,
    editingUsers: [],
    conflictWarnings: []
  });
  
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 편집 세션 시작
  const startEditing = useCallback(async (fieldKey: string, lockDuration?: number) => {
    if (!user || state.isEditing) return false;
    
    try {
      // 낙관적 잠금 시도
      const { data: lockResult, error } = await supabase.rpc('acquire_edit_lock', {
        resource_type: resourceType,
        resource_id: resourceId,
        field_key: fieldKey,
        user_id: user.id,
        lock_duration: lockDuration || 300 // 5분 기본값
      });
      
      if (error || !lockResult.success) {
        setState(prev => ({
          ...prev,
          conflictWarnings: [
            ...prev.conflictWarnings,
            `${lockResult.current_editor}님이 이미 편집 중입니다.`
          ]
        }));
        return false;
      }
      
      // 편집 상태 브로드캐스트
      if (!channelRef.current) {
        channelRef.current = supabase.channel(`editing:${resourceType}:${resourceId}`);
        
        channelRef.current
          .on('broadcast', { event: 'editing-started' }, (payload: any) => {
            setState(prev => ({
              ...prev,
              editingUsers: [
                ...prev.editingUsers.filter(u => u.userId !== payload.userId),
                {
                  userId: payload.userId,
                  userName: payload.userName,
                  field: payload.field,
                  startedAt: new Date(payload.startedAt)
                }
              ]
            }));
          })
          .on('broadcast', { event: 'editing-stopped' }, (payload: any) => {
            setState(prev => ({
              ...prev,
              editingUsers: prev.editingUsers.filter(u => u.userId !== payload.userId)
            }));
          })
          .on('broadcast', { event: 'cursor-moved' }, (payload: any) => {
            setState(prev => ({
              ...prev,
              editingUsers: prev.editingUsers.map(u => 
                u.userId === payload.userId 
                  ? { ...u, cursorPosition: payload.position }
                  : u
              )
            }));
          })
          .subscribe();
      }
      
      // 편집 시작 알림
      channelRef.current.send({
        type: 'broadcast',
        event: 'editing-started',
        payload: {
          userId: user.id,
          userName: user.user_metadata?.name || user.email,
          field: fieldKey,
          startedAt: new Date().toISOString()
        }
      });
      
      // 하트비트 시작 (편집 세션 유지)
      heartbeatIntervalRef.current = setInterval(async () => {
        await supabase.rpc('extend_edit_lock', {
          resource_type: resourceType,
          resource_id: resourceId,
          field_key: fieldKey,
          user_id: user.id
        });
      }, 60000); // 1분마다
      
      setState(prev => ({
        ...prev,
        isEditing: true,
        lockOwner: user.id
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to start editing:', error);
      return false;
    }
  }, [user, resourceType, resourceId, state.isEditing]);
  
  // 편집 종료
  const stopEditing = useCallback(async (fieldKey: string) => {
    if (!user || !state.isEditing) return;
    
    try {
      // 잠금 해제
      await supabase.rpc('release_edit_lock', {
        resource_type: resourceType,
        resource_id: resourceId,
        field_key: fieldKey,
        user_id: user.id
      });
      
      // 편집 종료 알림
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'editing-stopped',
          payload: { userId: user.id }
        });
      }
      
      // 하트비트 중지
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      setState(prev => ({
        ...prev,
        isEditing: false,
        lockOwner: undefined
      }));
    } catch (error) {
      console.error('Failed to stop editing:', error);
    }
  }, [user, resourceType, resourceId, state.isEditing]);
  
  // 커서 위치 공유
  const updateCursorPosition = useCallback((position: number) => {
    if (channelRef.current && state.isEditing) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-moved',
        payload: {
          userId: user?.id,
          position
        }
      });
    }
  }, [user, state.isEditing]);
  
  // 정리
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);
  
  return {
    ...state,
    startEditing,
    stopEditing,
    updateCursorPosition,
    canEdit: !state.lockOwner || state.lockOwner === user?.id
  };
};
```

---

## 🚀 성능 최적화

### 메모리 및 렌더링 최적화

#### 지능형 캐싱 시스템
```typescript
// src/lib/cacheManager.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  version: string;
  dependencies: string[];
}

interface CacheConfig {
  defaultTTL: number; // 기본 만료 시간 (ms)
  maxSize: number; // 최대 캐시 크기
  persistToIndexedDB: boolean;
  compressionEnabled: boolean;
}

class IntelligentCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private accessTimes = new Map<string, number>();
  private config: CacheConfig;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5분
      maxSize: 1000,
      persistToIndexedDB: true,
      compressionEnabled: true,
      ...config
    };
    
    // 주기적 정리
    setInterval(() => this.cleanup(), 60000); // 1분마다
  }
  
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      dependencies?: string[];
      version?: string;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (options.ttl || this.config.defaultTTL),
      version: options.version || '1.0',
      dependencies: options.dependencies || []
    };
    
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.config.maxSize) {
      await this.evictLRU();
    }
    
    this.cache.set(key, entry);
    this.accessTimes.set(key, Date.now());
    
    // IndexedDB에 지속화
    if (this.config.persistToIndexedDB && options.priority !== 'low') {
      await this.persistToIndexedDB(key, entry);
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // IndexedDB에서 복원 시도
      if (this.config.persistToIndexedDB) {
        const restored = await this.restoreFromIndexedDB<T>(key);
        if (restored) {
          this.cache.set(key, restored);
          return restored.data;
        }
      }
      return null;
    }
    
    // 만료 확인
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }
    
    // 의존성 확인
    if (entry.dependencies.length > 0) {
      const dependenciesValid = await this.validateDependencies(entry.dependencies);
      if (!dependenciesValid) {
        this.cache.delete(key);
        return null;
      }
    }
    
    // 액세스 시간 업데이트
    this.accessTimes.set(key, Date.now());
    
    return entry.data;
  }
  
  invalidate(pattern: string | string[]): void {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    
    for (const [key] of this.cache) {
      if (patterns.some(p => key.includes(p))) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
      }
    }
  }
  
  private async evictLRU(): Promise<void> {
    // LRU 알고리즘으로 캐시 항목 제거
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }
  
  private async validateDependencies(dependencies: string[]): Promise<boolean> {
    // 의존성 검증 로직 (예: 다른 캐시 키의 버전 확인)
    for (const dep of dependencies) {
      const depEntry = this.cache.get(dep);
      if (!depEntry || Date.now() > depEntry.expiry) {
        return false;
      }
    }
    return true;
  }
  
  private async persistToIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      let dataToStore = entry;
      
      // 압축 적용
      if (this.config.compressionEnabled) {
        dataToStore = {
          ...entry,
          data: await this.compress(JSON.stringify(entry.data))
        };
      }
      
      await store.put({ key, ...dataToStore });
    } catch (error) {
      console.warn('Failed to persist to IndexedDB:', error);
    }
  }
  
  private async restoreFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const result = await store.get(key);
      
      if (!result) return null;
      
      // 압축 해제
      if (this.config.compressionEnabled && typeof result.data === 'string') {
        result.data = JSON.parse(await this.decompress(result.data));
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to restore from IndexedDB:', error);
      return null;
    }
  }
  
  private async compress(data: string): Promise<string> {
    // 간단한 압축 로직 (실제로는 더 고도화된 압축 알고리즘 사용)
    return btoa(data);
  }
  
  private async decompress(data: string): Promise<string> {
    return atob(data);
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
      }
    }
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }
  
  private calculateHitRate(): number {
    // 실제 구현에서는 히트/미스 카운터 필요
    return 0.85; // 예시값
  }
  
  private estimateMemoryUsage(): number {
    // 대략적인 메모리 사용량 계산
    let totalSize = 0;
    for (const [key, entry] of this.cache) {
      totalSize += JSON.stringify({ key, entry }).length * 2; // UTF-16
    }
    return totalSize;
  }
}

// 전역 캐시 인스턴스
export const cacheManager = new IntelligentCacheManager();

// React Query와 통합
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: (failureCount, error: any) => {
        // 네트워크 오류가 아닌 경우 재시도 안함
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)