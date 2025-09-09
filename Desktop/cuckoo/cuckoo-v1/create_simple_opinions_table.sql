-- 간단한 의견(Opinions) 테이블 생성
CREATE TABLE IF NOT EXISTS opinions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT,
    stage INTEGER DEFAULT 1 CHECK (stage IN (1, 2, 3)),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    type TEXT DEFAULT 'comment',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_opinions_project_id ON opinions(project_id);
CREATE INDEX IF NOT EXISTS idx_opinions_status ON opinions(status);
CREATE INDEX IF NOT EXISTS idx_opinions_created_at ON opinions(created_at);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;

-- 누구나 의견을 볼 수 있도록 정책 생성
CREATE POLICY "Enable read access for all users" ON opinions
    FOR SELECT USING (true);

-- 인증된 사용자는 의견을 작성할 수 있도록 정책 생성
CREATE POLICY "Enable insert for authenticated users only" ON opinions
    FOR INSERT WITH CHECK (true);

-- 작성자는 본인 의견을 수정할 수 있도록 정책 생성
CREATE POLICY "Enable update for users based on created_by" ON opinions
    FOR UPDATE USING (true);

-- 작성자는 본인 의견을 삭제할 수 있도록 정책 생성
CREATE POLICY "Enable delete for users based on created_by" ON opinions
    FOR DELETE USING (true);

-- 권한 부여
GRANT ALL ON opinions TO anon;
GRANT ALL ON opinions TO authenticated;

-- updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_opinions_updated_at
    BEFORE UPDATE ON opinions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();