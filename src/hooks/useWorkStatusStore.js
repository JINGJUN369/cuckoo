import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

/**
 * useWorkStatusStore - 업무현황관리 시스템 v2.0 상태 관리
 * 
 * 주요 기능:
 * - Supabase 중앙집중식 데이터 저장
 * - 추가업무(additional_works) 및 세부업무(detail_tasks) 관리
 * - 실시간 협업 및 모니터링
 * - 활동 로그 시스템
 * - 전체 구성원 접근 가능
 */

const useWorkStatusStore = create(
  devtools(
    (set, get) => ({
      // ================================
      // STATE
      // ================================
      additionalWorks: [],
      selectedWork: null,
      loading: false,
      error: null,
      activityLogs: [],
      
      // UI 상태
      ui: {
        currentView: 'work-status', // 'work-status', 'work-status-dashboard', 'work-status-calendar'
        showCreateModal: false,
        showTaskModal: false,
        selectedTaskId: null,
      },

      // ================================
      // ADDITIONAL WORKS ACTIONS
      // ================================
      
      /**
       * 모든 추가업무 조회 (관련 세부업무 포함)
       */
      fetchAdditionalWorks: async () => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await supabase
            .from('additional_works')
            .select(`
              *,
              detail_tasks (*),
              projects (name),
              profiles!created_by (name, email)
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ 
            additionalWorks: data || [],
            loading: false 
          });

          console.log('📋 [WorkStatus] Fetched additional works:', data?.length || 0);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching additional works:', error);
          set({ 
            error: error.message,
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 새 추가업무 생성
       */
      createAdditionalWork: async (workData) => {
        try {
          set({ loading: true, error: null });
          
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('로그인이 필요합니다.');

          const { data, error } = await supabase
            .from('additional_works')
            .insert({
              ...workData,
              created_by: user.id
            })
            .select(`
              *,
              detail_tasks (*),
              projects (name),
              profiles!created_by (name, email)
            `)
            .single();

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            additionalWorks: [data, ...state.additionalWorks],
            loading: false
          }));

          // 활동 로그 기록
          await get().logActivity('create', 'additional_works', data.id, null, data);

          console.log('✅ [WorkStatus] Created additional work:', data.work_name);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error creating additional work:', error);
          set({ 
            error: error.message,
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 추가업무 수정
       */
      updateAdditionalWork: async (workId, updates) => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase
            .from('additional_works')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', workId)
            .select(`
              *,
              detail_tasks (*),
              projects (name),
              profiles!created_by (name, email)
            `)
            .single();

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => 
              work.id === workId ? data : work
            ),
            selectedWork: state.selectedWork?.id === workId ? data : state.selectedWork,
            loading: false
          }));

          // 활동 로그 기록
          await get().logActivity('update', 'additional_works', workId, null, updates);

          console.log('📝 [WorkStatus] Updated additional work:', workId);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error updating additional work:', error);
          set({ 
            error: error.message,
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 추가업무 삭제
       */
      deleteAdditionalWork: async (workId) => {
        try {
          set({ loading: true, error: null });

          const { error } = await supabase
            .from('additional_works')
            .delete()
            .eq('id', workId);

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            additionalWorks: state.additionalWorks.filter(work => work.id !== workId),
            selectedWork: state.selectedWork?.id === workId ? null : state.selectedWork,
            loading: false
          }));

          // 활동 로그 기록
          await get().logActivity('delete', 'additional_works', workId, null, null);

          console.log('🗑️ [WorkStatus] Deleted additional work:', workId);
        } catch (error) {
          console.error('❌ [WorkStatus] Error deleting additional work:', error);
          set({ 
            error: error.message,
            loading: false 
          });
          throw error;
        }
      },

      // ================================
      // DETAIL TASKS ACTIONS
      // ================================

      /**
       * 세부업무 추가
       */
      addDetailTask: async (additionalWorkId, taskData) => {
        try {
          set({ loading: true, error: null });
          
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('로그인이 필요합니다.');

          const { data, error } = await supabase
            .from('detail_tasks')
            .insert({
              ...taskData,
              additional_work_id: additionalWorkId,
              created_by: user.id
            })
            .select()
            .single();

          if (error) throw error;

          // 상태 업데이트 - 해당 추가업무에 세부업무 추가
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => 
              work.id === additionalWorkId 
                ? {
                    ...work,
                    detail_tasks: [...(work.detail_tasks || []), data]
                  }
                : work
            ),
            loading: false
          }));

          // 활동 로그 기록
          await get().logActivity('create', 'detail_tasks', data.id, null, data);

          console.log('✅ [WorkStatus] Added detail task:', data.task_name);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error adding detail task:', error);
          set({ 
            error: error.message,
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 세부업무 상태 변경
       */
      updateTaskStatus: async (taskId, newStatus) => {
        try {
          // 현재 태스크 찾기
          const currentTask = get().additionalWorks
            .flatMap(work => work.detail_tasks || [])
            .find(task => task.id === taskId);
          
          if (!currentTask) throw new Error('태스크를 찾을 수 없습니다.');

          const { error } = await supabase
            .from('detail_tasks')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', taskId);

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => ({
              ...work,
              detail_tasks: work.detail_tasks?.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
              ) || []
            }))
          }));

          // 활동 로그 기록
          await get().logActivity('update', 'detail_tasks', taskId, 
            { status: currentTask.status }, 
            { status: newStatus }
          );

          console.log('📝 [WorkStatus] Updated task status:', taskId, newStatus);
        } catch (error) {
          console.error('❌ [WorkStatus] Error updating task status:', error);
          set({ error: error.message });
          throw error;
        }
      },

      /**
       * 세부업무 진행현황 업데이트
       */
      updateProgressContent: async (taskId, progressContent) => {
        try {
          // 현재 태스크 찾기
          const currentTask = get().additionalWorks
            .flatMap(work => work.detail_tasks || [])
            .find(task => task.id === taskId);
          
          if (!currentTask) throw new Error('태스크를 찾을 수 없습니다.');

          const { error } = await supabase
            .from('detail_tasks')
            .update({ 
              progress_content: progressContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', taskId);

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => ({
              ...work,
              detail_tasks: work.detail_tasks?.map(task =>
                task.id === taskId ? { ...task, progress_content: progressContent } : task
              ) || []
            }))
          }));

          // 활동 로그 기록
          await get().logActivity('update', 'detail_tasks', taskId,
            { progress_content: currentTask.progress_content },
            { progress_content: progressContent }
          );

          console.log('📝 [WorkStatus] Updated progress content:', taskId);
        } catch (error) {
          console.error('❌ [WorkStatus] Error updating progress content:', error);
          set({ error: error.message });
          throw error;
        }
      },

      /**
       * 세부업무 삭제
       */
      deleteDetailTask: async (taskId) => {
        try {
          const { error } = await supabase
            .from('detail_tasks')
            .delete()
            .eq('id', taskId);

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => ({
              ...work,
              detail_tasks: work.detail_tasks?.filter(task => task.id !== taskId) || []
            }))
          }));

          // 활동 로그 기록
          await get().logActivity('delete', 'detail_tasks', taskId, null, null);

          console.log('🗑️ [WorkStatus] Deleted detail task:', taskId);
        } catch (error) {
          console.error('❌ [WorkStatus] Error deleting detail task:', error);
          set({ error: error.message });
          throw error;
        }
      },

      // ================================
      // ACTIVITY LOGGING
      // ================================

      /**
       * 활동 로그 기록
       */
      logActivity: async (actionType, tableName, recordId, oldValues, newValues) => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) return; // 로그인 안된 경우 스킵

          await supabase
            .from('work_activity_logs')
            .insert({
              user_id: user.id,
              action_type: actionType,
              table_name: tableName,
              record_id: recordId,
              old_values: oldValues,
              new_values: newValues
            });

          console.log('📝 [WorkStatus] Activity logged:', { actionType, tableName, recordId });
        } catch (error) {
          console.error('❌ [WorkStatus] Error logging activity:', error);
          // 활동 로그 실패는 메인 기능에 영향주지 않음
        }
      },

      /**
       * 활동 로그 조회
       */
      fetchActivityLogs: async (limit = 50) => {
        try {
          const { data, error } = await supabase
            .from('work_activity_logs')
            .select(`
              *,
              profiles!user_id (name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) throw error;

          set({ activityLogs: data || [] });
          console.log('📋 [WorkStatus] Fetched activity logs:', data?.length || 0);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching activity logs:', error);
          set({ error: error.message });
          throw error;
        }
      },

      // ================================
      // UI ACTIONS
      // ================================

      /**
       * 현재 뷰 변경
       */
      setCurrentView: (view) => {
        set(state => ({
          ui: { ...state.ui, currentView: view }
        }));
        console.log('🚀 [WorkStatus] View changed to:', view);
      },

      /**
       * 선택된 업무 설정
       */
      setSelectedWork: (work) => {
        set({ selectedWork: work });
        console.log('📋 [WorkStatus] Selected work:', work?.work_name || 'None');
      },

      /**
       * 모달 상태 관리
       */
      setShowCreateModal: (show) => {
        set(state => ({
          ui: { ...state.ui, showCreateModal: show }
        }));
      },

      setShowTaskModal: (show) => {
        set(state => ({
          ui: { ...state.ui, showTaskModal: show }
        }));
      },

      /**
       * 에러 클리어
       */
      clearError: () => {
        set({ error: null });
      },

      // ================================
      // REAL-TIME SUBSCRIPTIONS
      // ================================

      /**
       * 실시간 구독 설정
       */
      setupRealtimeSubscriptions: () => {
        // 추가업무 변경 구독
        const additionalWorksChannel = supabase
          .channel('additional_works_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'additional_works'
          }, () => {
            console.log('🔄 [WorkStatus] Additional works changed, refetching...');
            get().fetchAdditionalWorks();
          })
          .subscribe();

        // 세부업무 변경 구독
        const detailTasksChannel = supabase
          .channel('detail_tasks_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'detail_tasks'
          }, () => {
            console.log('🔄 [WorkStatus] Detail tasks changed, refetching...');
            get().fetchAdditionalWorks();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(additionalWorksChannel);
          supabase.removeChannel(detailTasksChannel);
        };
      }
    }),
    {
      name: 'work-status-store',
      version: 1,
    }
  )
);

export default useWorkStatusStore;