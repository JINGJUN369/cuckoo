// completed_projects 테이블 상태 확인 및 생성 스크립트
import { supabase, executeSupabaseQuery } from '../lib/supabase'

export const checkAndCreateCompletedProjectsTable = async () => {
  console.log('🔍 Checking completed_projects table...')
  
  try {
    // 테이블 존재 여부 확인
    const { data, error } = await executeSupabaseQuery(
      () => supabase.from('completed_projects').select('*').limit(1)
    )
    
    if (error) {
      console.error('❌ completed_projects table access error:', error)
      
      // 테이블이 없는 경우 SQL로 생성 시도
      console.log('🔧 Attempting to create completed_projects table...')
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS completed_projects (
          id text PRIMARY KEY,
          name text NOT NULL,
          model_name text,
          modelName text,
          stage1 jsonb,
          stage2 jsonb,
          stage3 jsonb,
          completed boolean DEFAULT true,
          completed_at timestamp with time zone,
          completed_by text,
          completed_by_name text,
          archive_reason text,
          final_progress integer,
          final_d_days integer,
          final_state text,
          archived_at timestamp with time zone DEFAULT now(),
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          migrated_from_local boolean DEFAULT false,
          local_created_at timestamp with time zone
        );
        
        -- RLS 정책 생성
        ALTER TABLE completed_projects ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "completed_projects_policy" ON completed_projects 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
      `
      
      const { error: createError } = await executeSupabaseQuery(
        () => supabase.rpc('execute_sql', { sql: createTableSQL })
      )
      
      if (createError) {
        console.error('❌ Failed to create completed_projects table:', createError)
        return { success: false, error: createError }
      } else {
        console.log('✅ completed_projects table created successfully')
      }
    } else {
      console.log('✅ completed_projects table exists')
      console.log('📊 Current rows:', data?.length || 0)
    }
    
    return { success: true }
    
  } catch (err) {
    console.error('❌ Check completed_projects table error:', err)
    return { success: false, error: err }
  }
}

// 완료된 프로젝트 수동 동기화
export const syncCompletedProjects = async () => {
  console.log('🔄 Manual completed projects sync...')
  
  try {
    // LocalStorage에서 completedProjects 가져오기
    const localCompleted = JSON.parse(localStorage.getItem('completedProjects') || '[]')
    console.log('📦 Local completed projects:', localCompleted.length)
    
    if (localCompleted.length === 0) {
      console.log('💭 No local completed projects to sync')
      return { success: true, message: 'No data to sync' }
    }
    
    // Supabase에서 기존 완료된 프로젝트 가져오기
    const { data: supabaseCompleted, error } = await executeSupabaseQuery(
      () => supabase.from('completed_projects').select('*')
    )
    
    if (error) {
      console.error('❌ Failed to fetch Supabase completed projects:', error)
      return { success: false, error }
    }
    
    console.log('📊 Supabase completed projects:', supabaseCompleted?.length || 0)
    
    // 동기화할 프로젝트 찾기 (Supabase에 없는 것들)
    const existingIds = (supabaseCompleted || []).map(p => p.id)
    const toSync = localCompleted.filter(p => !existingIds.includes(p.id))
    
    console.log('🚀 Projects to sync:', toSync.length)
    
    if (toSync.length > 0) {
      // 데이터 변환 (camelCase -> snake_case)
      const transformedData = toSync.map(project => ({
        ...project,
        model_name: project.modelName || project.model_name || project.id,
        created_at: project.createdAt || project.created_at || new Date().toISOString(),
        updated_at: project.updatedAt || project.updated_at || new Date().toISOString(),
        completed_at: project.completedAt || new Date().toISOString(),
        archived_at: project.archivedAt || new Date().toISOString(),
        migrated_from_local: true
      }))
      
      const { data: insertData, error: insertError } = await executeSupabaseQuery(
        () => supabase.from('completed_projects').insert(transformedData).select()
      )
      
      if (insertError) {
        console.error('❌ Failed to insert completed projects:', insertError)
        return { success: false, error: insertError }
      }
      
      console.log('✅ Successfully synced completed projects:', insertData?.length || 0)
    }
    
    return { 
      success: true, 
      localCount: localCompleted.length,
      supabaseCount: (supabaseCompleted?.length || 0) + toSync.length,
      synced: toSync.length
    }
    
  } catch (err) {
    console.error('❌ Sync completed projects error:', err)
    return { success: false, error: err }
  }
}

// 개발 환경에서 실행
if (typeof window !== 'undefined') {
  window.checkCompletedProjectsTable = checkAndCreateCompletedProjectsTable
  window.syncCompletedProjects = syncCompletedProjects
}