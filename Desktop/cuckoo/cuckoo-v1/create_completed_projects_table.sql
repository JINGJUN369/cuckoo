-- 완료된 프로젝트를 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS completed_projects (
    id TEXT PRIMARY KEY,
    original_id TEXT NOT NULL, -- 원본 projects 테이블에서의 ID
    name TEXT NOT NULL,
    model_name TEXT,
    description TEXT,
    stage1 JSONB DEFAULT '{}',
    stage2 JSONB DEFAULT '{}',
    stage3 JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT now(),
    completed_by TEXT NOT NULL,
    status TEXT DEFAULT 'completed'
);

-- 완료된 프로젝트 테이블에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_completed_projects_completed_at ON completed_projects(completed_at);
CREATE INDEX IF NOT EXISTS idx_completed_projects_original_id ON completed_projects(original_id);
CREATE INDEX IF NOT EXISTS idx_completed_projects_completed_by ON completed_projects(completed_by);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE completed_projects ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 완료된 프로젝트를 볼 수 있도록 정책 생성
DROP POLICY IF EXISTS "Anyone can view completed projects" ON completed_projects;
CREATE POLICY "Anyone can view completed projects"
    ON completed_projects FOR SELECT
    USING (true);

-- 로그인한 사용자만 완료된 프로젝트를 수정할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Users can insert completed projects" ON completed_projects;
CREATE POLICY "Users can insert completed projects"
    ON completed_projects FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update completed projects" ON completed_projects;
CREATE POLICY "Users can update completed projects"
    ON completed_projects FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can delete completed projects" ON completed_projects;
CREATE POLICY "Users can delete completed projects"
    ON completed_projects FOR DELETE
    USING (true);

-- 완료된 프로젝트 테이블에 데이터 추가 권한 확인
GRANT ALL ON completed_projects TO anon;
GRANT ALL ON completed_projects TO authenticated;