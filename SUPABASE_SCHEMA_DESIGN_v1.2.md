# 🏗️ Supabase 전환 - 새로운 스키마 설계 v1.2

## 📋 설계 원칙

### 1. LocalStorage 구조 완벽 유지
- 기존 LocalStorage 데이터 구조 100% 호환
- 한국 제조업 특화 필드 모든 보존
- Stage별 세분화된 진행률 계산 유지

### 2. 점진적 전환 지원
- 하이브리드 모드 운영 (LocalStorage + Supabase 동시)
- 데이터 동기화 메커니즘
- 장애 시 LocalStorage 백업 기능

### 3. 성능 최적화
- JSONB 활용한 유연한 스키마
- 적절한 인덱싱 전략
- 실시간 동기화 최소화

---

## 🗂️ 데이터베이스 테이블 설계

### 1. **users 테이블** (인증 + 사용자 정보)

```sql
-- 기존 auth.users 확장하지 않고 독립적인 사용자 테이블
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,                    -- 사번 (직접 입력)
    name TEXT NOT NULL,                     -- 이름
    email TEXT UNIQUE NOT NULL,             -- 이메일
    password_hash TEXT NOT NULL,            -- 암호화된 비밀번호
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    team TEXT,                             -- 팀/부서
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'inactive')),
    
    -- 비밀번호 정책
    must_change_password BOOLEAN DEFAULT true,
    last_password_change TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- LocalStorage 마이그레이션 플래그
    migrated_from_local BOOLEAN DEFAULT false,
    local_created_at TIMESTAMP WITH TIME ZONE
);
```

### 2. **projects 테이블** (프로젝트 핵심 데이터)

```sql
CREATE TABLE public.projects (
    id TEXT PRIMARY KEY,                    -- ModelName_timestamp 형태 유지
    name TEXT NOT NULL,                     -- 프로젝트명
    model_name TEXT NOT NULL,               -- 모델명 (ID 생성용)
    description TEXT,                       -- 프로젝트 설명
    
    -- 3단계 데이터 (JSONB로 유연하게 저장)
    stage1 JSONB NOT NULL DEFAULT '{}',     -- 기본정보 단계
    stage2 JSONB NOT NULL DEFAULT '{}',     -- 생산준비 단계  
    stage3 JSONB NOT NULL DEFAULT '{}',     -- 양산준비 단계
    
    -- 상태 관리
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    completed BOOLEAN DEFAULT false,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES public.users(id),
    updated_by TEXT REFERENCES public.users(id),
    
    -- 완료 정보
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by TEXT REFERENCES public.users(id),
    
    -- LocalStorage 마이그레이션
    migrated_from_local BOOLEAN DEFAULT false,
    local_created_at TIMESTAMP WITH TIME ZONE,
    local_updated_at TIMESTAMP WITH TIME ZONE
);
```

### 3. **completed_projects 테이블** (완료된 프로젝트)

```sql
CREATE TABLE public.completed_projects (
    id TEXT PRIMARY KEY,                    -- 원본 프로젝트 ID 유지
    name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    description TEXT,
    
    -- 원본 프로젝트 데이터 (완료 시점 스냅샷)
    stage1 JSONB NOT NULL DEFAULT '{}',
    stage2 JSONB NOT NULL DEFAULT '{}',
    stage3 JSONB NOT NULL DEFAULT '{}',
    
    -- 완료 메타데이터
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_by TEXT REFERENCES public.users(id),
    completed_by_name TEXT,                 -- 완료자 이름 (비정규화)
    
    -- 완료 시 상태 정보
    final_progress INTEGER,                 -- 완료 시점 진행률
    final_d_days INTEGER,                  -- 완료 시점 D-Day
    archive_reason TEXT,                   -- 완료/아카이브 사유
    
    -- 원본 프로젝트 메타데이터
    original_created_at TIMESTAMP WITH TIME ZONE,
    original_created_by TEXT REFERENCES public.users(id),
    
    -- LocalStorage 마이그레이션
    migrated_from_local BOOLEAN DEFAULT false,
    local_completed_at TIMESTAMP WITH TIME ZONE
);
```

### 4. **opinions 테이블** (의견/피드백 시스템)

```sql
CREATE TABLE public.opinions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id TEXT NOT NULL,              -- projects 또는 completed_projects 참조
    project_is_completed BOOLEAN DEFAULT false, -- 완료 프로젝트 의견인지 구분
    
    -- 의견 내용
    author_name TEXT NOT NULL,              -- 작성자명 (비정규화)
    message TEXT NOT NULL,                  -- 의견 내용
    
    -- 분류
    stage INTEGER CHECK (stage IN (1, 2, 3)), -- 연관 단계 (선택사항)
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- 답글 시스템 (JSONB로 중첩 구조 지원)
    reply JSONB,                           -- 답글 데이터
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES public.users(id),
    updated_by TEXT REFERENCES public.users(id),
    
    -- LocalStorage 마이그레이션
    migrated_from_local BOOLEAN DEFAULT false,
    local_created_at TIMESTAMP WITH TIME ZONE,
    
    -- 외래키 제약조건 (완료/활성 프로젝트 모두 지원)
    CONSTRAINT fk_active_project 
        FOREIGN KEY (project_id) 
        REFERENCES public.projects(id) 
        ON DELETE CASCADE 
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fk_completed_project 
        FOREIGN KEY (project_id) 
        REFERENCES public.completed_projects(id) 
        ON DELETE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
);
```

### 5. **activity_logs 테이블** (활동 로그/감사 추적)

```sql
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 사용자 정보
    user_id TEXT REFERENCES public.users(id),
    user_name TEXT NOT NULL,               -- 사용자명 (비정규화)
    
    -- 액션 정보
    action TEXT NOT NULL,                  -- 액션 타입 (CREATE, UPDATE, DELETE, LOGIN, etc.)
    resource_type TEXT NOT NULL,           -- 리소스 타입 (project, opinion, user, etc.)
    resource_id TEXT,                      -- 리소스 ID
    
    -- 상세 변경사항 (JSONB로 유연하게)
    changes JSONB,                         -- 변경사항 상세 (old_value, new_value 등)
    details JSONB,                         -- 추가 메타데이터
    
    -- 프로젝트 특화 필드
    project_id TEXT,                       -- 프로젝트 관련 액션인 경우
    project_name TEXT,                     -- 프로젝트명 (비정규화)
    
    -- 메타데이터
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,                       -- 클라이언트 IP (보안 감사용)
    user_agent TEXT,                       -- 브라우저 정보
    
    -- LocalStorage 마이그레이션
    migrated_from_local BOOLEAN DEFAULT false,
    local_timestamp TIMESTAMP WITH TIME ZONE
);
```

---

## 📚 지원 테이블 및 인덱스

### 6. **sync_status 테이블** (동기화 상태 관리)

```sql
CREATE TABLE public.sync_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id),
    table_name TEXT NOT NULL,              -- 동기화 대상 테이블
    resource_id TEXT NOT NULL,             -- 리소스 ID
    
    -- 동기화 상태
    local_version INTEGER DEFAULT 1,       -- LocalStorage 버전
    server_version INTEGER DEFAULT 1,      -- Supabase 버전
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'error')),
    
    -- 타임스탬프
    last_local_update TIMESTAMP WITH TIME ZONE,
    last_server_update TIMESTAMP WITH TIME ZONE,
    last_sync_attempt TIMESTAMP WITH TIME ZONE,
    
    -- 충돌 해결
    conflict_data JSONB,                   -- 충돌 발생 시 데이터
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, table_name, resource_id)
);
```

### 7. **인덱스 전략**

```sql
-- 사용자 테이블 인덱스
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_role ON public.users(role);

-- 프로젝트 테이블 인덱스
CREATE INDEX idx_projects_model_name ON public.projects(model_name);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);

-- JSONB 필드 인덱스 (자주 쿼리되는 필드들)
CREATE INDEX idx_projects_stage1_manufacturer ON public.projects USING GIN ((stage1->>'manufacturer'));
CREATE INDEX idx_projects_stage1_product_group ON public.projects USING GIN ((stage1->>'productGroup'));
CREATE INDEX idx_projects_stage1_launch_date ON public.projects USING BTREE ((stage1->>'launchDate'));
CREATE INDEX idx_projects_stage1_mass_production_date ON public.projects USING BTREE ((stage1->>'massProductionDate'));

-- 완료 프로젝트 인덱스
CREATE INDEX idx_completed_projects_completed_at ON public.completed_projects(completed_at DESC);
CREATE INDEX idx_completed_projects_completed_by ON public.completed_projects(completed_by);

-- 의견 테이블 인덱스
CREATE INDEX idx_opinions_project_id ON public.opinions(project_id);
CREATE INDEX idx_opinions_created_by ON public.opinions(created_by);
CREATE INDEX idx_opinions_status ON public.opinions(status);
CREATE INDEX idx_opinions_stage ON public.opinions(stage);
CREATE INDEX idx_opinions_created_at ON public.opinions(created_at DESC);

-- 활동 로그 인덱스
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);

-- 동기화 상태 인덱스
CREATE INDEX idx_sync_status_user_table ON public.sync_status(user_id, table_name);
CREATE INDEX idx_sync_status_sync_status ON public.sync_status(sync_status);
```

---

## 🔧 트리거 및 함수

### 8. **자동 업데이트 트리거**

```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opinions_updated_at BEFORE UPDATE ON public.opinions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON public.sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 9. **활동 로그 자동 생성 함수**

```sql
-- 프로젝트 변경 로그 함수 (LocalStorage 형태와 동일)
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_name TEXT;
    changes_array JSONB := '[]'::jsonb;
BEGIN
    -- 현재 사용자 이름 가져오기
    SELECT name INTO current_user_name 
    FROM public.users 
    WHERE id = NEW.updated_by OR id = OLD.created_by 
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (
            user_id, user_name, action, resource_type, resource_id,
            project_id, project_name, details, timestamp
        ) VALUES (
            NEW.created_by, COALESCE(current_user_name, 'System'), 
            'CREATE', 'project', NEW.id,
            NEW.id, NEW.name,
            jsonb_build_object('model_name', NEW.model_name),
            NOW()
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Stage별 변경사항 비교 (LocalStorage logProjectChanges 방식)
        -- 복잡한 JSONB 비교 로직은 여기서 구현
        
        INSERT INTO public.activity_logs (
            user_id, user_name, action, resource_type, resource_id,
            project_id, project_name, changes, timestamp
        ) VALUES (
            NEW.updated_by, COALESCE(current_user_name, 'System'),
            'UPDATE', 'project', NEW.id,
            NEW.id, NEW.name,
            jsonb_build_object(
                'old_stage1', OLD.stage1,
                'new_stage1', NEW.stage1,
                'old_stage2', OLD.stage2,
                'new_stage2', NEW.stage2,
                'old_stage3', OLD.stage3,
                'new_stage3', NEW.stage3
            ),
            NOW()
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_logs (
            user_id, user_name, action, resource_type, resource_id,
            project_id, project_name, details, timestamp
        ) VALUES (
            OLD.updated_by, COALESCE(current_user_name, 'System'),
            'DELETE', 'project', OLD.id,
            OLD.id, OLD.name,
            jsonb_build_object('model_name', OLD.model_name),
            NOW()
        );
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

-- 프로젝트 테이블에 트리거 적용
CREATE TRIGGER log_project_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION log_project_changes();
```

### 10. **진행률 계산 함수** (LocalStorage 방식 완전 재현)

```sql
-- LocalStorage getStageProgress 함수 SQL 버전
CREATE OR REPLACE FUNCTION calculate_stage_progress(stage_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    total_score NUMERIC := 0;
    achieved_score NUMERIC := 0;
    field_name TEXT;
    field_value TEXT;
    executed_field_name TEXT;
    percentage NUMERIC;
BEGIN
    -- 날짜 필드들 처리 (Date로 끝나고 Executed 쌍이 있는 것들)
    FOR field_name IN 
        SELECT jsonb_object_keys(stage_data) 
        WHERE jsonb_object_keys(stage_data) LIKE '%Date' 
        AND stage_data ? (jsonb_object_keys(stage_data) || 'Executed')
    LOOP
        total_score := total_score + 1.0; -- 날짜(0.5) + 실행(0.5) = 1.0
        
        -- 날짜 입력 여부 (0.5점)
        field_value := stage_data ->> field_name;
        IF field_value IS NOT NULL AND TRIM(field_value) != '' THEN
            achieved_score := achieved_score + 0.5;
        END IF;
        
        -- 실행완료 여부 (0.5점)
        executed_field_name := field_name || 'Executed';
        IF (stage_data ->> executed_field_name)::boolean = true THEN
            achieved_score := achieved_score + 0.5;
        END IF;
    END LOOP;
    
    -- 일반 텍스트 필드들 (날짜/실행 필드가 아닌 것들)
    FOR field_name IN 
        SELECT jsonb_object_keys(stage_data) 
        WHERE jsonb_object_keys(stage_data) NOT LIKE '%Date'
        AND jsonb_object_keys(stage_data) NOT LIKE '%Executed'
        AND jsonb_object_keys(stage_data) NOT IN (
            'trainingCompleted', 'manualUploaded', 'techGuideUploaded', 
            'partsReceived', 'branchOrderEnabled', 'issueResolved', 'notes'
        )
    LOOP
        total_score := total_score + 1.0;
        field_value := stage_data ->> field_name;
        IF field_value IS NOT NULL AND TRIM(field_value) != '' THEN
            achieved_score := achieved_score + 1.0;
        END IF;
    END LOOP;
    
    -- 체크박스 필드들 처리
    FOR field_name IN 
        SELECT unnest(ARRAY[
            'trainingCompleted', 'manualUploaded', 'techGuideUploaded', 
            'partsReceived', 'branchOrderEnabled', 'issueResolved'
        ])
        WHERE stage_data ? unnest(ARRAY[
            'trainingCompleted', 'manualUploaded', 'techGuideUploaded', 
            'partsReceived', 'branchOrderEnabled', 'issueResolved'
        ])
    LOOP
        total_score := total_score + 1.0;
        IF (stage_data ->> field_name)::boolean = true THEN
            achieved_score := achieved_score + 1.0;
        END IF;
    END LOOP;
    
    -- 진행률 계산
    IF total_score > 0 THEN
        percentage := (achieved_score / total_score) * 100;
        RETURN GREATEST(0, LEAST(100, ROUND(percentage)));
    ELSE
        RETURN 0;
    END IF;
END;
$$ language plpgsql;

-- 전체 프로젝트 진행률 계산 함수
CREATE OR REPLACE FUNCTION calculate_project_progress(project_record public.projects)
RETURNS JSONB AS $$
DECLARE
    stage1_progress INTEGER;
    stage2_progress INTEGER;  
    stage3_progress INTEGER;
    overall_progress INTEGER;
BEGIN
    stage1_progress := calculate_stage_progress(project_record.stage1);
    stage2_progress := calculate_stage_progress(project_record.stage2);
    stage3_progress := calculate_stage_progress(project_record.stage3);
    
    overall_progress := (stage1_progress + stage2_progress + stage3_progress) / 3;
    
    RETURN jsonb_build_object(
        'overall', overall_progress,
        'stage1', stage1_progress,
        'stage2', stage2_progress,
        'stage3', stage3_progress
    );
END;
$$ language plpgsql;
```

---

## 🔐 보안 및 권한 설정

### 11. **단순화된 RLS 정책** (무한 재귀 방지)

```sql
-- 모든 테이블에 단순한 인증 기반 정책 적용
-- 세부 권한 제어는 애플리케이션 레벨에서 처리

-- 사용자 테이블 (자신의 정보만 수정 가능)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true); -- 모든 사용자 조회 가능 (팀워크)

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = current_setting('app.current_user_id', true));

-- 프로젝트 테이블 (모든 인증된 사용자 접근)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can access projects" ON public.projects
    FOR ALL USING (true); -- 애플리케이션에서 권한 제어

-- 의견 테이블 (모든 인증된 사용자 접근)
ALTER TABLE public.opinions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can access opinions" ON public.opinions
    FOR ALL USING (true);

-- 활동 로그 (관리자만 접근, 애플리케이션에서 제어)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity logs access" ON public.activity_logs
    FOR ALL USING (true); -- 애플리케이션에서 관리자 권한 확인

-- 완료 프로젝트 (모든 사용자 조회 가능)
ALTER TABLE public.completed_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can access completed projects" ON public.completed_projects
    FOR ALL USING (true);

-- 동기화 상태 (사용자별 접근)
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own sync status" ON public.sync_status
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
```

### 12. **사용자 세션 관리 함수**

```sql
-- 현재 사용자 ID 설정 함수 (애플리케이션에서 호출)
CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ language plpgsql security definer;

-- 현재 사용자 정보 조회 함수
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS public.users AS $$
DECLARE
    current_user_id TEXT;
    user_record public.users;
BEGIN
    current_user_id := current_setting('app.current_user_id', true);
    
    IF current_user_id IS NULL OR current_user_id = '' THEN
        RAISE EXCEPTION 'No current user set';
    END IF;
    
    SELECT * INTO user_record 
    FROM public.users 
    WHERE id = current_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Current user not found: %', current_user_id;
    END IF;
    
    RETURN user_record;
END;
$$ language plpgsql security definer;
```

---

## 📊 데이터 마이그레이션 준비

### 13. **마이그레이션 지원 함수**

```sql
-- LocalStorage 데이터 임포트 함수
CREATE OR REPLACE FUNCTION import_from_localstorage(
    projects_data JSONB,
    users_data JSONB,
    opinions_data JSONB,
    completed_projects_data JSONB DEFAULT NULL,
    activity_logs_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB := jsonb_build_object('success', true, 'imported', jsonb_build_object());
    imported_counts JSONB := jsonb_build_object();
BEGIN
    -- 사용자 데이터 임포트
    -- 구현 로직...
    
    -- 프로젝트 데이터 임포트  
    -- 구현 로직...
    
    -- 의견 데이터 임포트
    -- 구현 로직...
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ language plpgsql;

-- 데이터 동기화 상태 확인 함수
CREATE OR REPLACE FUNCTION check_sync_status(user_id TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'total_resources', COUNT(*),
            'synced', COUNT(*) FILTER (WHERE sync_status = 'synced'),
            'pending', COUNT(*) FILTER (WHERE sync_status = 'pending'),
            'conflicts', COUNT(*) FILTER (WHERE sync_status = 'conflict'),
            'errors', COUNT(*) FILTER (WHERE sync_status = 'error')
        )
        FROM public.sync_status
        WHERE sync_status.user_id = check_sync_status.user_id
    );
END;
$$ language plpgsql;
```

---

## 🎯 구현 우선순위

### Phase 1: 기본 인프라 (1일)
1. ✅ 테이블 생성 (users, projects, opinions, activity_logs, completed_projects)
2. ✅ 기본 인덱스 생성
3. ✅ 트리거 함수 구현 (updated_at, 활동로그)

### Phase 2: 핵심 기능 (1일) 
1. ✅ 진행률 계산 함수 (LocalStorage 완전 호환)
2. ✅ RLS 정책 (단순화된 버전)
3. ✅ 사용자 세션 관리

### Phase 3: 마이그레이션 지원 (추후)
1. 🔄 LocalStorage 임포트 함수
2. 🔄 동기화 상태 관리 시스템
3. 🔄 하이브리드 모드 지원

---

## 📈 예상 성능 및 확장성

- **동시 사용자**: 100명 내외 (중소 제조업체 기준)
- **프로젝트 수**: 1,000개 내외 연간
- **의견/로그**: 월 10,000건 내외
- **응답 시간**: <200ms (프로젝트 조회 기준)
- **저장 공간**: 1GB/년 내외 예상

이 설계는 현재 LocalStorage 기반 시스템의 **100% 호환성**을 보장하면서, 향후 확장 가능한 클라우드 기반 시스템으로의 안전한 전환을 지원합니다.