-- =====================================
-- 업무현황관리 시스템 v2.0 데이터베이스 스키마
-- =====================================

-- 1. 추가업무 테이블 (additional_works)
CREATE TABLE additional_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  work_name VARCHAR(255) NOT NULL,
  work_owner VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 세부업무 테이블 (detail_tasks)
CREATE TABLE detail_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  additional_work_id UUID REFERENCES additional_works(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  assignee VARCHAR(100),
  progress_content TEXT,
  status VARCHAR(20) DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '보류', '피드백')),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 업무 활동 로그 테이블 (work_activity_logs)
CREATE TABLE work_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS (Row Level Security) 정책 설정
-- 모든 인증된 사용자가 접근 가능 (투명한 모니터링 목적)

-- additional_works 테이블 RLS
ALTER TABLE additional_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "모든 사용자 전체 접근 가능" ON additional_works 
  FOR ALL USING (auth.role() = 'authenticated');

-- detail_tasks 테이블 RLS  
ALTER TABLE detail_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "모든 사용자 전체 접근 가능" ON detail_tasks 
  FOR ALL USING (auth.role() = 'authenticated');

-- work_activity_logs 테이블 RLS
ALTER TABLE work_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "모든 사용자 활동 로그 읽기 가능" ON work_activity_logs 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "인증된 사용자 활동 로그 생성 가능" ON work_activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_additional_works_project_id ON additional_works(project_id);
CREATE INDEX idx_additional_works_created_by ON additional_works(created_by);
CREATE INDEX idx_additional_works_dates ON additional_works(start_date, end_date);

CREATE INDEX idx_detail_tasks_additional_work_id ON detail_tasks(additional_work_id);
CREATE INDEX idx_detail_tasks_status ON detail_tasks(status);
CREATE INDEX idx_detail_tasks_assignee ON detail_tasks(assignee);

CREATE INDEX idx_work_activity_logs_user_id ON work_activity_logs(user_id);
CREATE INDEX idx_work_activity_logs_table_record ON work_activity_logs(table_name, record_id);
CREATE INDEX idx_work_activity_logs_created_at ON work_activity_logs(created_at);

-- 6. 트리거 함수 생성 (자동 updated_at 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 적용
CREATE TRIGGER update_additional_works_updated_at 
  BEFORE UPDATE ON additional_works 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detail_tasks_updated_at 
  BEFORE UPDATE ON detail_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 샘플 데이터 (개발/테스트용)
-- 실제 운영환경에서는 제거하거나 주석처리

/*
-- 샘플 추가업무 데이터
INSERT INTO additional_works (work_name, work_owner, department, start_date, end_date, description, created_by) VALUES
('신제품 마케팅 전략 수립', '김마케팅', '마케팅팀', '2025-01-15', '2025-02-28', '신제품 출시를 위한 종합 마케팅 전략 기획', (SELECT id FROM auth.users LIMIT 1)),
('품질 개선 프로젝트', '이품질', '품질관리팀', '2025-01-20', '2025-03-15', '제품 품질 향상을 위한 공정 개선', (SELECT id FROM auth.users LIMIT 1));

-- 샘플 세부업무 데이터  
INSERT INTO detail_tasks (additional_work_id, task_name, assignee, progress_content, status, sort_order, created_by) VALUES
((SELECT id FROM additional_works WHERE work_name = '신제품 마케팅 전략 수립'), '시장 조사 및 분석', '김분석', '경쟁사 분석 완료, 고객 설문 진행중', '진행', 1, (SELECT id FROM auth.users LIMIT 1)),
((SELECT id FROM additional_works WHERE work_name = '신제품 마케팅 전략 수립'), '브랜딩 전략 수립', '박브랜드', '브랜드 콘셉트 1차 검토 완료', '진행', 2, (SELECT id FROM auth.users LIMIT 1)),
((SELECT id FROM additional_works WHERE work_name = '품질 개선 프로젝트'), '현재 공정 분석', '최공정', '공정 매뉴얼 검토 중', '진행', 1, (SELECT id FROM auth.users LIMIT 1));
*/

-- =====================================
-- 스키마 생성 완료
-- =====================================