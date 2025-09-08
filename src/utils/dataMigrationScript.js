// 수동 데이터 마이그레이션 스크립트
import { supabase } from '../lib/supabase';

/**
 * LocalStorage 데이터를 Supabase로 마이그레이션
 * 브라우저 콘솔에서 window.migrateAllData() 실행
 */
export const migrateAllData = async () => {
  console.log('🚀 데이터 마이그레이션 시작...');
  
  try {
    // 1. 사용자 데이터 마이그레이션
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log(`👥 마이그레이션할 사용자: ${users.length}명`);
    
    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: user.name || '사용자',
          email: user.email,
          password_hash: user.password || 'migrated',
          role: user.role || 'user',
          team: user.team || '',
          status: user.status || 'approved',
          must_change_password: user.mustChangePassword || false,
          migrated_from_local: true,
          local_created_at: user.createdAt ? new Date(user.createdAt) : new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ 사용자 ${user.id} 마이그레이션 실패:`, error);
      } else {
        console.log(`✅ 사용자 ${user.id} 마이그레이션 성공`);
      }
    }

    // 2. 프로젝트 데이터 마이그레이션
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    console.log(`📁 마이그레이션할 프로젝트: ${projects.length}개`);
    
    for (const project of projects) {
      const { data, error } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          name: project.name,
          model_name: project.modelName,
          stage1: project.stage1 || {},
          stage2: project.stage2 || {},
          stage3: project.stage3 || {},
          progress: project.progress || 0,
          stage1_progress: project.stage1Progress || 0,
          stage2_progress: project.stage2Progress || 0,
          stage3_progress: project.stage3Progress || 0,
          status: project.status || 'active',
          migrated_from_local: true,
          local_created_at: project.createdAt ? new Date(project.createdAt) : new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ 프로젝트 ${project.id} 마이그레이션 실패:`, error);
      } else {
        console.log(`✅ 프로젝트 ${project.id} 마이그레이션 성공`);
      }
    }

    // 3. 의견 데이터 마이그레이션 (있다면)
    const opinions = JSON.parse(localStorage.getItem('opinions') || '[]');
    console.log(`💬 마이그레이션할 의견: ${opinions.length}개`);
    
    for (const opinion of opinions) {
      const { data, error } = await supabase
        .from('opinions')
        .upsert({
          id: opinion.id,
          project_id: opinion.projectId,
          user_id: opinion.userId,
          content: opinion.content,
          stage: opinion.stage,
          status: opinion.status || 'open',
          migrated_from_local: true,
          local_created_at: opinion.createdAt ? new Date(opinion.createdAt) : new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ 의견 ${opinion.id} 마이그레이션 실패:`, error);
      } else {
        console.log(`✅ 의견 ${opinion.id} 마이그레이션 성공`);
      }
    }

    console.log('🎉 데이터 마이그레이션 완료!');
    return {
      success: true,
      migrated: {
        users: users.length,
        projects: projects.length,
        opinions: opinions.length
      }
    };
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    return { success: false, error };
  }
};

/**
 * Supabase 테이블 상태 확인
 */
export const checkSupabaseData = async () => {
  try {
    console.log('🔍 Supabase 데이터 확인 중...');
    
    // 사용자 수 확인
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role', { count: 'exact' });
    
    // 프로젝트 수 확인
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, model_name', { count: 'exact' });
    
    // 의견 수 확인
    const { data: opinions, error: opinionsError } = await supabase
      .from('opinions')
      .select('id, project_id', { count: 'exact' });
    
    console.log('📊 Supabase 데이터 현황:');
    console.log(`👥 사용자: ${users?.length || 0}명`);
    console.log(`📁 프로젝트: ${projects?.length || 0}개`);
    console.log(`💬 의견: ${opinions?.length || 0}개`);
    
    if (users) console.table(users);
    if (projects) console.table(projects);
    
    return {
      users: users?.length || 0,
      projects: projects?.length || 0,
      opinions: opinions?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Supabase 데이터 확인 실패:', error);
    return { error };
  }
};

// 브라우저 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.migrateAllData = migrateAllData;
  window.checkSupabaseData = checkSupabaseData;
}