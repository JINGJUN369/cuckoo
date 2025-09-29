# Supabase 데이터베이스 설정 가이드

## 1. 사전 준비

### 필요한 정보
- ✅ Supabase URL: `https://wuofrondwyzhacwcbkxe.supabase.co`
- ✅ Anon Key: 이미 `.env.local`에 설정됨
- ✅ Service Role Key: Supabase 대시보드에서 확인 필요

## 2. 데이터베이스 설정

### Step 1: Supabase 대시보드 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 `wuofrondwyzhacwcbkxe` 선택

### Step 2: SQL Editor에서 스키마 생성
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New Query** 클릭
3. `supabase_setup.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행

### Step 3: 테이블 생성 확인
다음 테이블들이 생성되었는지 확인:
- ✅ `profiles` - 사용자 프로필 정보
- ✅ `projects` - 프로젝트 데이터 
- ✅ `opinions` - 의견/피드백 시스템
- ✅ `activity_logs` - 활동 로그

## 3. 첫 번째 관리자 계정 설정

### Step 1: 회원가입
1. 애플리케이션에서 첫 번째 계정 생성
2. 이메일 인증 완료

### Step 2: 관리자 권한 부여
SQL Editor에서 다음 명령어 실행:
```sql
-- 첫 번째 사용자를 관리자로 설정
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 4. Row Level Security (RLS) 확인

다음 정책들이 적용되었는지 확인:

### 프로필 테이블
- ✅ 사용자는 자신의 프로필만 조회/수정
- ✅ 관리자는 모든 프로필 접근 가능

### 프로젝트 테이블  
- ✅ 인증된 사용자는 모든 프로젝트 조회 가능
- ✅ 사용자는 자신이 생성한 프로젝트만 수정 가능
- ✅ 관리자는 모든 프로젝트 수정/삭제 가능

### 의견 테이블
- ✅ 인증된 사용자는 의견 조회/생성 가능
- ✅ 사용자는 자신의 의견만 수정 가능
- ✅ 관리자는 모든 의견 관리 가능

## 5. 애플리케이션 테스트

### 기본 기능 테스트
1. **회원가입/로그인** ✅
2. **프로젝트 생성** - 새 프로젝트 만들기
3. **프로젝트 수정** - Stage 정보 업데이트
4. **프로젝트 완료** - 완료 상태로 변경

### 권한 테스트
1. **일반 사용자** - 자신의 프로젝트만 수정 가능한지 확인
2. **관리자** - 모든 기능 접근 가능한지 확인

## 6. 데이터 마이그레이션 (선택사항)

기존 localStorage 데이터를 Supabase로 이전하려면:

### Step 1: 데이터 내보내기
브라우저 개발자 도구에서:
```javascript
// 기존 데이터 추출
const projects = JSON.parse(localStorage.getItem('projects') || '[]');
const users = JSON.parse(localStorage.getItem('users') || '[]');
console.log('Projects:', projects);
console.log('Users:', users);
```

### Step 2: 수동 입력
- 중요한 프로젝트는 애플리케이션에서 수동으로 재생성
- 사용자는 회원가입을 통해 새로 등록

## 7. 모니터링 및 유지보수

### 성능 모니터링
- Supabase Dashboard > **Database** > **Performance** 확인
- 쿼리 성능 및 인덱스 효율성 모니터링

### 백업 설정
- Supabase Dashboard > **Settings** > **Database**
- 자동 백업 활성화 확인

### 활동 로그 확인
- `activity_logs` 테이블에서 사용자 활동 추적
- 비정상적인 접근 패턴 모니터링

## 8. 문제 해결

### 흔한 문제들

#### RLS 정책 오류
```sql
-- 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### 권한 문제
```sql
-- 사용자 역할 확인
SELECT id, email, name, role FROM public.profiles;
```

#### 연결 문제
- `.env.local` 파일의 URL과 Key 확인
- 네트워크 연결 상태 확인

## 9. 다음 단계

데이터베이스 설정 완료 후:

1. **의견 시스템 구현** - 현재 비활성화된 기능 활성화
2. **알림 시스템 구현** - 실시간 알림 기능 
3. **파일 업로드** - Supabase Storage 연동
4. **대시보드 확장** - 고급 분석 기능

## 10. 지원 및 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

🚀 **설정 완료 후 `localhost:3004`에서 애플리케이션 테스트를 진행하세요!**