# Supabase 테이블 수동 생성 가이드

## 개요
404 오류 해결을 위해 Supabase 프로젝트에 필요한 테이블들을 생성해야 합니다.

## 생성해야 할 테이블
1. **additional_works** - 추가업무 테이블
2. **detail_tasks** - 세부업무 테이블  
3. **work_activity_logs** - 활동로그 테이블

## 접속 방법

### 방법 1: Supabase 대시보드 직접 접속
1. https://app.supabase.com 접속
2. 프로젝트 선택: `wuofrondwyzhacwcbkxe`
3. SQL Editor 메뉴 선택
4. 아래 SQL 스크립트 실행

### 방법 2: HTML 도구 사용
- `execute_supabase_schema_v2.html` 파일 열기
- "📥 스키마 실행하기" 버튼 클릭

## 실행할 SQL 스크립트

```sql
-- 1. 추가업무 테이블 생성
CREATE TABLE IF NOT EXISTS additional_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    work_name VARCHAR(255) NOT NULL,
    work_owner VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    description TEXT,
    status VARCHAR(20) DEFAULT '진행중',
    priority VARCHAR(10) DEFAULT '보통',
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 세부업무 테이블 생성
CREATE TABLE IF NOT EXISTS detail_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    additional_work_id UUID REFERENCES additional_works(id) ON DELETE CASCADE NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT '대기',
    progress_content TEXT,
    assigned_to VARCHAR(100),
    due_date DATE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 업무 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS work_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_additional_works_created_by ON additional_works(created_by);
CREATE INDEX IF NOT EXISTS idx_additional_works_department ON additional_works(department);
CREATE INDEX IF NOT EXISTS idx_additional_works_dates ON additional_works(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_detail_tasks_additional_work ON detail_tasks(additional_work_id);
CREATE INDEX IF NOT EXISTS idx_detail_tasks_status ON detail_tasks(status);
CREATE INDEX IF NOT EXISTS idx_detail_tasks_assigned ON detail_tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_work_activity_logs_user ON work_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_activity_logs_table ON work_activity_logs(table_name, record_id);

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE additional_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_activity_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 모든 업무를 볼 수 있도록 설정 (투명한 협업)
CREATE POLICY "모든 사용자가 추가업무를 볼 수 있음" ON additional_works FOR SELECT USING (true);
CREATE POLICY "인증된 사용자가 추가업무를 생성할 수 있음" ON additional_works FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "생성자가 추가업무를 수정할 수 있음" ON additional_works FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "생성자가 추가업무를 삭제할 수 있음" ON additional_works FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "모든 사용자가 세부업무를 볼 수 있음" ON detail_tasks FOR SELECT USING (true);
CREATE POLICY "인증된 사용자가 세부업무를 생성할 수 있음" ON detail_tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "생성자가 세부업무를 수정할 수 있음" ON detail_tasks FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "생성자가 세부업무를 삭제할 수 있음" ON detail_tasks FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "모든 사용자가 활동로그를 볼 수 있음" ON work_activity_logs FOR SELECT USING (true);
CREATE POLICY "인증된 사용자가 활동로그를 생성할 수 있음" ON work_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 설정
DROP TRIGGER IF EXISTS update_additional_works_updated_at ON additional_works;
CREATE TRIGGER update_additional_works_updated_at
    BEFORE UPDATE ON additional_works
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_detail_tasks_updated_at ON detail_tasks;
CREATE TRIGGER update_detail_tasks_updated_at
    BEFORE UPDATE ON detail_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 실행 확인
테이블 생성 후 다음 명령으로 확인:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('additional_works', 'detail_tasks', 'work_activity_logs');
```

## 테스트 데이터 삽입 (선택사항)
```sql
-- 샘플 데이터 (사용자 ID가 있을 때만)
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        INSERT INTO additional_works (work_name, work_owner, department, start_date, end_date, description, created_by) VALUES
        ('신제품 출시 준비', '김철수', '개발팀', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '새로운 제품 출시를 위한 전체적인 준비 작업', current_user_id),
        ('마케팅 캠페인 기획', '이영희', '마케팅팀', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '45 days', '신제품 런칭을 위한 마케팅 전략 수립 및 실행', current_user_id);
    END IF;
END $$;
```

## 주의사항
- 반드시 `auth.users` 테이블에 사용자가 있어야 함
- RLS 정책으로 인해 로그인하지 않으면 데이터 접근 제한
- 테이블 생성 후 애플리케이션 새로고침 필요