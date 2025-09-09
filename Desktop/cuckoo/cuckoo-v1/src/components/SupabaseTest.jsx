import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { DataMigration } from '../utils/dataMigration';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('테스트 중...');
  const [projects, setProjects] = useState([]);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [migrationReport, setMigrationReport] = useState(null);
  const { user, profile, signIn, signOut, loading } = useSupabaseAuth();

  // Supabase 연결 테스트
  useEffect(() => {
    const testConnection = async () => {
      try {
        // 간단한 쿼리로 연결 테스트
        const { count, error } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });

        if (error) {
          setConnectionStatus(`❌ 연결 실패: ${error.message}`);
        } else {
          setConnectionStatus(`✅ Supabase 연결 성공! (총 ${count || 0}개 프로젝트)`);
          
          // 프로젝트 데이터 가져오기
          const { data: projectsData } = await supabase
            .from('projects')
            .select('*')
            .limit(5);
          
          setProjects(projectsData || []);
        }
      } catch (error) {
        setConnectionStatus(`❌ 연결 오류: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  // 테스트 로그인
  const handleTestLogin = async () => {
    const result = await signIn('test@example.com', 'password123');
    if (result.error) {
      alert(`로그인 실패: ${result.error.message}`);
    }
  };

  // 테스트 데이터 생성
  const createTestData = () => {
    const testProjects = [
      {
        id: 'TEST_001_' + Date.now(),
        name: '테스트 프로젝트 1',
        modelName: 'TEST_MODEL_001',
        stage1: {
          productGroup: '가전제품',
          manufacturer: '테스트 제조사',
          vendor: '테스트 벤더',
          releaseDate: '2024-12-01',
          massProductionDate: '2024-11-01'
        },
        stage2: {
          pilotProduction: '2024-09-01',
          techTransfer: '2024-09-15'
        },
        stage3: {
          initialProduction: '2024-10-01',
          bomManager: '김테스트'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'TEST_002_' + Date.now(),
        name: '테스트 프로젝트 2',
        modelName: 'TEST_MODEL_002',
        stage1: {
          productGroup: '생활가전',
          manufacturer: '테스트 제조사 2',
          vendor: '테스트 벤더 2',
          releaseDate: '2025-01-01',
          massProductionDate: '2024-12-15'
        },
        stage2: {
          pilotProduction: '2024-10-01',
          techTransfer: '2024-10-15'
        },
        stage3: {
          initialProduction: '2024-11-01',
          bomManager: '이테스트'
        },
        createdAt: new Date().toISOString()
      }
    ];

    const testUsers = [
      {
        id: 'test-user-1',
        email: 'test@example.com',
        name: '테스트 사용자',
        team: '개발팀',
        role: 'user',
        registeredAt: new Date().toISOString()
      }
    ];

    // localStorage에 테스트 데이터 저장
    localStorage.setItem('projects', JSON.stringify(testProjects));
    localStorage.setItem('users', JSON.stringify(testUsers));
    localStorage.setItem('completedProjects', JSON.stringify([]));
    localStorage.setItem('opinions', JSON.stringify([]));
    localStorage.setItem('activityLogs', JSON.stringify([]));

    setMigrationStatus(`📦 테스트 데이터 생성 완료 (${testProjects.length}개 프로젝트)`);
    console.log('테스트 데이터 생성됨:', { testProjects, testUsers });
  };

  // 마이그레이션 실행
  const handleMigration = async () => {
    setMigrationStatus('🚀 마이그레이션 시작 중...');
    
    try {
      const report = await DataMigration.migrateAll();
      setMigrationReport(report);
      
      if (report.projects?.success) {
        setMigrationStatus('✅ 마이그레이션 성공!');
        
        // 프로젝트 데이터 다시 로드
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .limit(10);
        
        setProjects(projectsData || []);
      } else {
        setMigrationStatus('❌ 마이그레이션 실패');
      }
    } catch (error) {
      setMigrationStatus(`❌ 마이그레이션 오류: ${error.message}`);
    }
  };

  // 마이그레이션 상태 확인
  useEffect(() => {
    if (DataMigration.isMigrated()) {
      setMigrationStatus('✅ 이미 마이그레이션 완료');
      const report = DataMigration.getMigrationReport();
      if (report) setMigrationReport(report);
    } else {
      const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      if (localProjects.length > 0) {
        setMigrationStatus(`📦 localStorage에 ${localProjects.length}개 프로젝트 발견`);
      } else {
        setMigrationStatus('📭 마이그레이션할 데이터가 없습니다');
      }
    }
  }, []);

  if (loading) {
    return <div className="p-4">인증 상태 확인 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">🧪 Supabase 연결 테스트</h2>
      
      {/* 연결 상태 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">연결 상태</h3>
        <p className="text-sm">{connectionStatus}</p>
      </div>

      {/* 인증 상태 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">인증 상태</h3>
        {user ? (
          <div className="space-y-2">
            <p className="text-green-600">✅ 로그인됨</p>
            <p className="text-sm">이메일: {user.email}</p>
            {profile && (
              <>
                <p className="text-sm">이름: {profile.name}</p>
                <p className="text-sm">팀: {profile.team}</p>
                <p className="text-sm">역할: {profile.role}</p>
              </>
            )}
            <button 
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-red-600">❌ 로그인되지 않음</p>
            <button 
              onClick={handleTestLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              테스트 로그인
            </button>
          </div>
        )}
      </div>

      {/* 프로젝트 데이터 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">프로젝트 데이터</h3>
        {projects.length > 0 ? (
          <div className="space-y-2">
            <p className="text-green-600">✅ {projects.length}개 프로젝트 로드됨</p>
            {projects.map(project => (
              <div key={project.id} className="text-sm bg-gray-100 p-2 rounded">
                <strong>{project.name}</strong> - {project.model_name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">프로젝트 데이터가 없습니다.</p>
        )}
      </div>

      {/* 데이터 마이그레이션 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📦 데이터 마이그레이션</h3>
        <div className="space-y-3">
          <p className="text-sm">{migrationStatus}</p>
          
          <div className="space-y-2">
            {!DataMigration.isMigrated() && (
              <>
                <button 
                  onClick={createTestData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                >
                  테스트 데이터 생성
                </button>
                <button 
                  onClick={handleMigration}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  localStorage → Supabase 마이그레이션 실행
                </button>
              </>
            )}
          </div>
          
          {migrationReport && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <strong>마이그레이션 리포트:</strong>
              <div className="mt-2 space-y-1">
                <p>• 프로젝트: {migrationReport.projects?.count || 0}개 {migrationReport.projects?.success ? '✅' : '❌'}</p>
                <p>• 사용자: {migrationReport.users?.count || 0}명 준비됨</p>
                <p>• 시간: {migrationReport.timestamp ? new Date(migrationReport.timestamp).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 환경변수 확인 */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">환경변수 확인</h3>
        <div className="space-y-1 text-sm font-mono">
          <p>SUPABASE_URL: {process.env.REACT_APP_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}</p>
          <p>SUPABASE_ANON_KEY: {process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;