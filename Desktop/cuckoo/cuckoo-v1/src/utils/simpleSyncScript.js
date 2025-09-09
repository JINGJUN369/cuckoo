// 간단한 Supabase 동기화 스크립트
import { supabase } from '../lib/supabase';

/**
 * LocalStorage 데이터를 Supabase에 직접 업로드
 */
export const syncToSupabase = async () => {
  console.log('🔄 Simple sync to Supabase starting...');
  
  try {
    // LocalStorage 데이터 가져오기
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    console.log(`📊 Syncing ${users.length} users and ${projects.length} projects`);
    
    // 사용자 데이터 업로드
    for (const user of users) {
      const userData = {
        id: user.id,
        name: user.name || '사용자',
        email: user.email,
        password_hash: user.password || (user.id + '_hash'),
        role: user.role || 'user',
        team: user.team || '',
        status: user.status === 'active' ? 'approved' : (user.status === 'pending' ? 'pending' : 'approved'),
        must_change_password: user.mustChangePassword || false,
        created_at: user.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ User ${user.id}:`, error.message);
      } else {
        console.log(`✅ User ${user.id} synced`);
      }
    }
    
    // 프로젝트 데이터 업로드
    for (const project of projects) {
      const projectData = {
        id: project.id,
        name: project.name,
        model_name: project.modelName || project.id || 'UNKNOWN',
        stage1: project.stage1 || {},
        stage2: project.stage2 || {},
        stage3: project.stage3 || {},
        status: project.status || 'active',
        created_at: project.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('projects')
        .upsert(projectData, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Project ${project.id}:`, error.message);
      } else {
        console.log(`✅ Project ${project.id} synced`);
      }
    }
    
    console.log('🎉 Sync completed successfully!');
    
    // 결과 확인
    const { data: syncedUsers } = await supabase.from('users').select('id, name, email');
    const { data: syncedProjects } = await supabase.from('projects').select('id, name, model_name');
    
    console.log(`📊 Final count: ${syncedUsers?.length || 0} users, ${syncedProjects?.length || 0} projects`);
    
    return { success: true, users: syncedUsers?.length || 0, projects: syncedProjects?.length || 0 };
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { success: false, error: error.message };
  }
};

// 브라우저 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.syncToSupabase = syncToSupabase;
}