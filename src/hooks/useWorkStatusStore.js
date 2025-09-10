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
      users: [], // 사용자 목록
      
      // UI 상태 + 필터링
      ui: {
        currentView: 'work-status', // 'work-status', 'work-status-dashboard', 'work-status-calendar'
        showCreateModal: false,
        showTaskModal: false,
        selectedTaskId: null,
        selectedUserId: 'current_user', // 'current_user', 'all_users', 또는 특정 사용자 ID
      },

      // ================================
      // ADDITIONAL WORKS ACTIONS
      // ================================
      
      /**
       * 모든 추가업무 조회 (관련 세부업무 포함) - 종결된 업무 제외
       */
      fetchAdditionalWorks: async (userId = null) => {
        try {
          set({ loading: true, error: null });
          
          // Supabase 클라이언트 검증
          if (!supabase) {
            throw new Error('Supabase client not initialized');
          }

          // 현재 로그인한 사용자 정보 가져오기
          const savedUser = sessionStorage.getItem('supabase_user');
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          
          // 필터링할 사용자 ID 결정
          const { selectedUserId } = get().ui;
          let targetUserId = userId || selectedUserId;
          
          console.log('🔍 [WorkStatus] Filtering works for:', { targetUserId, currentUser: currentUser?.email });
          
          // 쿼리 빌드
          let query = supabase
            .from('additional_works')
            .select('*')
            .neq('status', '종결'); // 종결된 업무 제외

          // 사용자 필터링 적용
          if (targetUserId === 'current_user' && currentUser) {
            // 사용자 목록이 로드되지 않았다면 먼저 로드
            let users = get().users;
            if (users.length === 0) {
              console.log('👥 [WorkStatus] Users not loaded, fetching...');
              users = await get().fetchUsers();
            }
            
            // 현재 사용자의 이름으로 필터링 (work_owner가 사용자 이름으로 저장됨)
            const currentUserProfile = users.find(u => u.id === currentUser.id);
            console.log('👤 [WorkStatus] Current user profile:', currentUserProfile);
            
            if (currentUserProfile) {
              query = query.eq('work_owner', currentUserProfile.name);
              console.log('📋 [WorkStatus] Filtering by work_owner:', currentUserProfile.name);
            } else {
              console.warn('⚠️ [WorkStatus] Current user profile not found in users list');
              // 대안: 이메일로 매칭 시도
              const profileByEmail = users.find(u => u.email === currentUser.email);
              if (profileByEmail) {
                query = query.eq('work_owner', profileByEmail.name);
                console.log('📋 [WorkStatus] Filtering by email match, work_owner:', profileByEmail.name);
              } else {
                // 마지막 대안: created_by 필드로 매칭
                query = query.eq('created_by', currentUser.id);
                console.log('📋 [WorkStatus] Filtering by created_by:', currentUser.id);
              }
            }
          } else if (targetUserId && targetUserId !== 'all_users' && targetUserId !== 'current_user') {
            // 선택된 사용자의 이름으로 필터링
            let users = get().users;
            if (users.length === 0) {
              users = await get().fetchUsers();
            }
            
            const selectedUser = users.find(u => u.id === targetUserId);
            if (selectedUser) {
              query = query.eq('work_owner', selectedUser.name);
              console.log('📋 [WorkStatus] Filtering by selected user:', selectedUser.name);
            }
          } else {
            console.log('📋 [WorkStatus] No filtering applied (all users)');
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) throw error;

          // 세부업무도 별도로 가져오기
          const additionalWorksWithTasks = await Promise.all(
            (data || []).map(async (work) => {
              const { data: tasks } = await supabase
                .from('detail_tasks')
                .select('*')
                .eq('additional_work_id', work.id);
              
              return {
                ...work,
                detail_tasks: tasks || []
              };
            })
          );

          set({ 
            additionalWorks: additionalWorksWithTasks,
            loading: false 
          });

          console.log('📋 [WorkStatus] Fetched additional works:', additionalWorksWithTasks?.length || 0, 'for user:', targetUserId);
          return additionalWorksWithTasks;
        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching additional works:', error);
          set({ 
            error: error.message || 'Failed to fetch additional works',
            loading: false 
          });
          // Don't re-throw to prevent app crashes
          return [];
        }
      },

      /**
       * 종결된 추가업무 조회 (관련 세부업무 포함)
       */
      fetchCompletedWorks: async (userId = null) => {
        try {
          set({ loading: true, error: null });
          
          // Supabase 클라이언트 검증
          if (!supabase) {
            throw new Error('Supabase client not initialized');
          }

          // 현재 로그인한 사용자 정보 가져오기
          const savedUser = sessionStorage.getItem('supabase_user');
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          
          // 필터링할 사용자 ID 결정
          const { selectedUserId } = get().ui;
          let targetUserId = userId || selectedUserId;
          
          console.log('🔍 [WorkStatus] Filtering completed works for:', { targetUserId, currentUser: currentUser?.email });
          
          // 쿼리 빌드
          let query = supabase
            .from('additional_works')
            .select('*')
            .eq('status', '종결'); // 종결된 업무만 조회

          // 사용자 필터링 적용
          if (targetUserId === 'current_user' && currentUser) {
            // 사용자 목록이 로드되지 않았다면 먼저 로드
            let users = get().users;
            if (users.length === 0) {
              console.log('👥 [WorkStatus] Users not loaded for completed works, fetching...');
              users = await get().fetchUsers();
            }
            
            // 현재 사용자의 이름으로 필터링 (work_owner가 사용자 이름으로 저장됨)
            const currentUserProfile = users.find(u => u.id === currentUser.id);
            console.log('👤 [WorkStatus] Current user profile for completed works:', currentUserProfile);
            
            if (currentUserProfile) {
              query = query.eq('work_owner', currentUserProfile.name);
              console.log('📋 [WorkStatus] Filtering completed works by work_owner:', currentUserProfile.name);
            } else {
              console.warn('⚠️ [WorkStatus] Current user profile not found in users list for completed works');
              // 대안: 이메일로 매칭 시도
              const profileByEmail = users.find(u => u.email === currentUser.email);
              if (profileByEmail) {
                query = query.eq('work_owner', profileByEmail.name);
                console.log('📋 [WorkStatus] Filtering completed works by email match, work_owner:', profileByEmail.name);
              } else {
                // 마지막 대안: created_by 필드로 매칭
                query = query.eq('created_by', currentUser.id);
                console.log('📋 [WorkStatus] Filtering completed works by created_by:', currentUser.id);
              }
            }
          } else if (targetUserId && targetUserId !== 'all_users' && targetUserId !== 'current_user') {
            // 선택된 사용자의 이름으로 필터링
            let users = get().users;
            if (users.length === 0) {
              users = await get().fetchUsers();
            }
            
            const selectedUser = users.find(u => u.id === targetUserId);
            if (selectedUser) {
              query = query.eq('work_owner', selectedUser.name);
              console.log('📋 [WorkStatus] Filtering completed works by selected user:', selectedUser.name);
            }
          } else {
            console.log('📋 [WorkStatus] No filtering applied for completed works (all users)');
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) throw error;

          // 세부업무도 별도로 가져오기
          const completedWorksWithTasks = await Promise.all(
            (data || []).map(async (work) => {
              const { data: tasks } = await supabase
                .from('detail_tasks')
                .select('*')
                .eq('additional_work_id', work.id);
              
              return {
                ...work,
                detail_tasks: tasks || []
              };
            })
          );

          set({ 
            loading: false 
          });

          console.log('📋 [WorkStatus] Fetched completed works:', completedWorksWithTasks?.length || 0, 'for user:', targetUserId);
          return completedWorksWithTasks;
        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching completed works:', error);
          set({ 
            error: error.message || 'Failed to fetch completed works',
            loading: false 
          });
          // Don't re-throw to prevent app crashes
          return [];
        }
      },

      /**
       * 새 추가업무 생성
       */
      createAdditionalWork: async (workData) => {
        try {
          set({ loading: true, error: null });
          
          // 세션 스토리지에서 현재 로그인된 사용자 정보 가져오기
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) throw new Error('로그인이 필요합니다.');
          
          const user = JSON.parse(savedUser);

          const { data, error } = await supabase
            .from('additional_works')
            .insert({
              ...workData,
              created_by: '550e8400-e29b-41d4-a716-446655440000' // 관리자 UUID
            })
            .select('*')
            .single();

          if (error) throw error;

          // 생성된 업무에 빈 detail_tasks 배열 추가
          const workWithTasks = {
            ...data,
            detail_tasks: []
          };

          // 상태 업데이트
          set(state => ({
            additionalWorks: [workWithTasks, ...state.additionalWorks],
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
            .select('*')
            .single();

          if (error) throw error;

          // 상태 업데이트 (기존 detail_tasks 보존)
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => 
              work.id === workId ? { ...data, detail_tasks: work.detail_tasks || [] } : work
            ),
            selectedWork: state.selectedWork?.id === workId ? { ...data, detail_tasks: state.selectedWork.detail_tasks || [] } : state.selectedWork,
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
          
          // 세션 스토리지에서 현재 로그인된 사용자 정보 가져오기
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) throw new Error('로그인이 필요합니다.');
          
          const user = JSON.parse(savedUser);

          const { data, error } = await supabase
            .from('detail_tasks')
            .insert({
              ...taskData,
              additional_work_id: additionalWorkId,
              created_by: '550e8400-e29b-41d4-a716-446655440000' // 관리자 UUID
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
          // 세션 스토리지에서 현재 로그인된 사용자 정보 가져오기
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) return; // 로그인 안된 경우 스킵
          
          const user = JSON.parse(savedUser);

          await supabase
            .from('work_activity_logs')
            .insert({
              user_id: '550e8400-e29b-41d4-a716-446655440000', // 관리자 UUID
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
          // Supabase 클라이언트 검증
          if (!supabase) {
            console.warn('⚠️ [WorkStatus] Supabase client not initialized');
            set({ activityLogs: [] });
            return [];
          }

          const { data, error } = await supabase
            .from('work_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) throw error;

          set({ activityLogs: data || [] });
          console.log('📋 [WorkStatus] Fetched activity logs:', data?.length || 0);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching activity logs:', error);
          set({ 
            error: error.message || 'Failed to fetch activity logs',
            activityLogs: []
          });
          // Don't re-throw to prevent app crashes
          return [];
        }
      },

      // ================================
      // USER MANAGEMENT ACTIONS
      // ================================

      /**
       * 사용자 목록 조회
       */
      fetchUsers: async () => {
        try {
          if (!supabase) {
            throw new Error('Supabase client not initialized');
          }

          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .order('name');

          if (error) throw error;

          set({ users: data || [] });
          console.log('👥 [WorkStatus] Fetched users:', data?.length || 0);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching users:', error);
          set({ 
            error: error.message || 'Failed to fetch users',
            users: []
          });
          return [];
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
       * 사용자 필터 변경
       */
      setSelectedUserId: (userId) => {
        set(state => ({
          ui: { ...state.ui, selectedUserId: userId }
        }));
        console.log('👤 [WorkStatus] User filter changed to:', userId);
        
        // 필터 변경시 데이터 다시 로드
        setTimeout(() => {
          get().fetchAdditionalWorks(userId);
        }, 0);
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