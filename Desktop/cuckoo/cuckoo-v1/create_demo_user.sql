-- 공개 배포용 데모 사용자 생성
INSERT INTO users (id, name, email, team, role, password_hash, status, must_change_password, created_at)
VALUES (
    'demo_user_public',
    '데모 사용자',
    'demo@cuckoo.co.kr',
    '데모팀',
    'user',
    'temp_hash', -- 실제로는 해시 필요하지만 데모용이므로 임시값
    'approved',
    false,
    now()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    team = EXCLUDED.team,
    role = EXCLUDED.role,
    updated_at = now();

-- 데모 사용자가 모든 프로젝트에 접근할 수 있도록 RLS 정책 확인
-- 이미 RLS가 설정되어 있다면 데모 사용자도 접근할 수 있는지 확인 필요