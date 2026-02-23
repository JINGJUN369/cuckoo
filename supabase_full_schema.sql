-- =====================================
-- 쿠쿠 프로젝트 관리 시스템 - 전체 데이터베이스 스키마
-- 새 Supabase 프로젝트 복구용 (2026-02-23)
-- =====================================

-- =====================
-- 1. users 테이블 (커스텀 인증)
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  team TEXT DEFAULT '일반팀',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'inactive')),
  must_change_password BOOLEAN DEFAULT false,
  last_password_change TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- =====================
-- 2. projects 테이블 (프로젝트 관리)
-- =====================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  model_name TEXT,
  description TEXT,
  stage1 JSONB DEFAULT '{}'::jsonb,
  stage2 JSONB DEFAULT '{}'::jsonb,
  stage3 JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  migrated_from_local BOOLEAN DEFAULT false,
  local_created_at TIMESTAMPTZ,
  local_updated_at TIMESTAMPTZ,
  "modelName" TEXT
);

-- =====================
-- 3. completed_projects 테이블 (완료 프로젝트 아카이브)
-- =====================
CREATE TABLE IF NOT EXISTS completed_projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  model_name TEXT,
  description TEXT,
  stage1 JSONB DEFAULT '{}'::jsonb,
  stage2 JSONB DEFAULT '{}'::jsonb,
  stage3 JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'completed',
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  migrated_from_local BOOLEAN DEFAULT false
);

-- =====================
-- 4. opinions 테이블 (의견/피드백 시스템)
-- =====================
CREATE TABLE IF NOT EXISTS opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  project_is_completed BOOLEAN DEFAULT false,
  author_name TEXT,
  message TEXT NOT NULL,
  stage INTEGER CHECK (stage IN (1, 2, 3)),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
  priority TEXT DEFAULT 'medium',
  reply JSONB,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_from_local BOOLEAN DEFAULT false
);

-- =====================
-- 5. additional_works 테이블 (업무현황 관리)
-- =====================
CREATE TABLE IF NOT EXISTS additional_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  work_name VARCHAR(255) NOT NULL,
  work_owner VARCHAR(100),
  department VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  description TEXT,
  status VARCHAR(50) DEFAULT '대기',
  priority VARCHAR(20) DEFAULT '보통',
  created_by UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 6. detail_tasks 테이블 (세부업무)
-- =====================
CREATE TABLE IF NOT EXISTS detail_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  additional_work_id UUID REFERENCES additional_works(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '보류', '피드백')),
  progress_content TEXT,
  assigned_to VARCHAR(100),
  assignee VARCHAR(100),
  due_date DATE,
  display_order INTEGER DEFAULT 0,
  created_by UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 7. work_activity_logs 테이블 (업무 활동 로그)
-- =====================
CREATE TABLE IF NOT EXISTS work_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  action_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  work_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 8. activity_logs 테이블 (프로젝트 감사 로그)
-- =====================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_name TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  details JSONB,
  project_id TEXT,
  project_name TEXT,
  "timestamp" TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  migrated_from_local BOOLEAN DEFAULT false
);

-- =====================
-- 9. 인덱스 생성
-- =====================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- completed_projects
CREATE INDEX IF NOT EXISTS idx_completed_projects_completed_at ON completed_projects(completed_at DESC);

-- opinions
CREATE INDEX IF NOT EXISTS idx_opinions_project_id ON opinions(project_id);
CREATE INDEX IF NOT EXISTS idx_opinions_status ON opinions(status);
CREATE INDEX IF NOT EXISTS idx_opinions_created_at ON opinions(created_at DESC);

-- additional_works
CREATE INDEX IF NOT EXISTS idx_additional_works_created_by ON additional_works(created_by);
CREATE INDEX IF NOT EXISTS idx_additional_works_dates ON additional_works(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_additional_works_status ON additional_works(status);

-- detail_tasks
CREATE INDEX IF NOT EXISTS idx_detail_tasks_additional_work_id ON detail_tasks(additional_work_id);
CREATE INDEX IF NOT EXISTS idx_detail_tasks_status ON detail_tasks(status);
CREATE INDEX IF NOT EXISTS idx_detail_tasks_display_order ON detail_tasks(display_order);

-- work_activity_logs
CREATE INDEX IF NOT EXISTS idx_work_activity_logs_user_id ON work_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_activity_logs_created_at ON work_activity_logs(created_at DESC);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs("timestamp" DESC);

-- =====================
-- 10. 트리거 함수 (자동 updated_at)
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_additional_works_updated_at
  BEFORE UPDATE ON additional_works
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detail_tasks_updated_at
  BEFORE UPDATE ON detail_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- 11. RLS 비활성화 (커스텀 인증 사용)
-- =====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 대해 anon/authenticated 전체 접근 허용
-- (커스텀 인증 시스템을 사용하므로 RLS를 열어둠)
CREATE POLICY "Allow all access for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON completed_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON opinions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON additional_works FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON detail_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON work_activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- 12. Realtime 활성화
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE additional_works;
ALTER PUBLICATION supabase_realtime ADD TABLE detail_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE work_activity_logs;

-- =====================
-- 13. 기본 관리자 계정 생성
-- =====================
INSERT INTO users (id, name, email, password_hash, role, team, status, must_change_password, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '시스템 관리자',
  'admin@cuckoo.com',
  'admin1234',
  'admin',
  'IT개발팀',
  'approved',
  false,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================
-- 스키마 생성 완료
-- =====================================
