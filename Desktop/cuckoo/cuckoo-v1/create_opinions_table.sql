-- 의견(Opinions) 테이블 생성
CREATE TABLE IF NOT EXISTS opinions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name TEXT,
    stage INTEGER DEFAULT 1 CHECK (stage IN (1, 2, 3)),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    updated_by TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    -- 추가 메타데이터
    type TEXT DEFAULT 'comment' CHECK (type IN ('comment', 'issue', 'suggestion', 'approval')),
    attachments JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}'
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_opinions_project_id ON opinions(project_id);
CREATE INDEX IF NOT EXISTS idx_opinions_status ON opinions(status);
CREATE INDEX IF NOT EXISTS idx_opinions_stage ON opinions(stage);
CREATE INDEX IF NOT EXISTS idx_opinions_priority ON opinions(priority);
CREATE INDEX IF NOT EXISTS idx_opinions_created_at ON opinions(created_at);
CREATE INDEX IF NOT EXISTS idx_opinions_updated_at ON opinions(updated_at);

-- 전체 텍스트 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_opinions_content_fts ON opinions USING gin(to_tsvector('korean', content));

-- RLS (Row Level Security) 정책 설정
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 의견을 볼 수 있도록 정책 생성
DROP POLICY IF EXISTS "Anyone can view opinions" ON opinions;
CREATE POLICY "Anyone can view opinions"
    ON opinions FOR SELECT
    USING (true);

-- 로그인한 사용자만 의견을 작성할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Users can insert opinions" ON opinions;
CREATE POLICY "Users can insert opinions"
    ON opinions FOR INSERT
    WITH CHECK (true);

-- 작성자만 본인 의견을 수정할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Users can update own opinions" ON opinions;
CREATE POLICY "Users can update own opinions"
    ON opinions FOR UPDATE
    USING (true);

-- 작성자 또는 관리자만 의견을 삭제할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Users can delete own opinions" ON opinions;
CREATE POLICY "Users can delete own opinions"
    ON opinions FOR DELETE
    USING (true);

-- 권한 부여
GRANT ALL ON opinions TO anon;
GRANT ALL ON opinions TO authenticated;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_opinions_updated_at ON opinions;
CREATE TRIGGER update_opinions_updated_at
    BEFORE UPDATE ON opinions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 (선택사항)
-- INSERT INTO opinions (project_id, content, author_name, stage, priority, status) 
-- VALUES 
--   ('sample_project_id', '프로젝트 진행 상황이 좋습니다.', '홍길동', 1, 'normal', 'open'),
--   ('sample_project_id', '2단계 진행에 문제가 있는 것 같습니다.', '김철수', 2, 'high', 'open');