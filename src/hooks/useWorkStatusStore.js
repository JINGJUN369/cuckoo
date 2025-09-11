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
          
          // 실제 additional_works 테이블 사용
          const { data, error } = await supabase
            .from('additional_works')
            .select('*')
            .neq('status', '종결') // 종결된 업무 제외
            .order('created_at', { ascending: false });

          console.log('📋 [WorkStatus] Fetching all works without server-side user filtering');

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

          // 클라이언트 사이드 필터링 적용
          let filteredWorks = additionalWorksWithTasks;
          
          if (targetUserId === 'current_user' && currentUser) {
            // 사용자 목록 로드
            let users = get().users;
            if (users.length === 0) {
              console.log('👥 [WorkStatus] Users not loaded, fetching...');
              users = await get().fetchUsers();
            }
            
            // 현재 사용자로 필터링
            const currentUserProfile = users.find(u => u.id === currentUser.id || u.email === currentUser.email);
            console.log('👤 [WorkStatus] Current user profile:', currentUserProfile);
            
            if (currentUserProfile) {
              filteredWorks = additionalWorksWithTasks.filter(work => 
                work.work_owner === currentUserProfile.name || 
                work.created_by === currentUser.id
              );
              console.log('📋 [WorkStatus] Client-side filtering by user:', currentUserProfile.name);
            } else {
              console.warn('⚠️ [WorkStatus] Current user profile not found, showing all works');
            }
          } else if (targetUserId && targetUserId !== 'all_users' && targetUserId !== 'current_user') {
            // 선택된 사용자로 필터링
            let users = get().users;
            if (users.length === 0) {
              users = await get().fetchUsers();
            }
            
            const selectedUser = users.find(u => u.id === targetUserId);
            if (selectedUser) {
              filteredWorks = additionalWorksWithTasks.filter(work => 
                work.work_owner === selectedUser.name
              );
              console.log('📋 [WorkStatus] Client-side filtering by selected user:', selectedUser.name);
            }
          } else {
            console.log('📋 [WorkStatus] No filtering applied (all users)');
          }

          set({ 
            additionalWorks: filteredWorks,
            loading: false 
          });

          console.log('📋 [WorkStatus] Fetched additional works:', filteredWorks?.length || 0, 'for user:', targetUserId);
          return filteredWorks;
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

          // 사용자 목록에서 현재 사용자 정보 찾기
          let users = get().users;
          if (users.length === 0) {
            users = await get().fetchUsers();
          }

          // 현재 사용자의 이름 자동 설정
          const currentUserProfile = users.find(u => u.id === user.id || u.email === user.email);
          const userName = currentUserProfile?.name || user.email || '알 수 없음';

          // created_by 필드는 NOT NULL이므로 기본값 사용
          const workDataToInsert = {
            ...workData,
            work_owner: userName // 현재 로그인한 사용자 이름으로 자동 설정
          };

          // UUID 형식인지 확인 (간단한 체크)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (user.id && uuidRegex.test(user.id)) {
            workDataToInsert.created_by = user.id;
          } else {
            // UUID가 아닌 경우 기본 UUID 사용 (시스템 사용자)
            workDataToInsert.created_by = '00000000-0000-0000-0000-000000000000';
            console.log('⚠️ [WorkStatus] User ID is not UUID format, using default UUID for created_by');
          }

          const { data, error } = await supabase
            .from('additional_works')
            .insert(workDataToInsert)
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

          console.log('✅ [WorkStatus] Created additional work:', data.work_name, 'for user:', userName);
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

          // created_by 필드 처리 (NOT NULL)
          const taskDataToInsert = {
            ...taskData,
            additional_work_id: additionalWorkId
          };

          // UUID 형식인지 확인
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (user.id && uuidRegex.test(user.id)) {
            taskDataToInsert.created_by = user.id;
          } else {
            // UUID가 아닌 경우 기본 UUID 사용
            taskDataToInsert.created_by = '00000000-0000-0000-0000-000000000000';
            console.log('⚠️ [WorkStatus] User ID is not UUID format for task, using default UUID');
          }

          const { data, error } = await supabase
            .from('detail_tasks')
            .insert(taskDataToInsert)
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

          // 전체 시스템 활동로그에 기록
          const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
          
          // 액션 타입을 활동로그 형식으로 변환
          let action = '';
          let description = '';
          
          if (tableName === 'additional_works') {
            if (actionType === 'create') {
              action = 'WORK_CREATE';
              description = `업무 생성: ${newValues?.work_name || '새 업무'}`;
            } else if (actionType === 'update') {
              action = 'WORK_UPDATE';
              description = `업무 수정: ${newValues?.work_name || recordId}`;
            } else if (actionType === 'delete') {
              action = 'WORK_DELETE';
              description = `업무 삭제: ${recordId}`;
            }
          } else if (tableName === 'detail_tasks') {
            if (actionType === 'create') {
              action = 'TASK_CREATE';
              description = `세부업무 생성: ${newValues?.task_name || '새 세부업무'}`;
            } else if (actionType === 'update') {
              if (newValues?.status) {
                action = 'TASK_STATUS_CHANGE';
                description = `세부업무 상태 변경: ${newValues.task_name || recordId} → ${newValues.status}`;
              } else if (newValues?.progress_content) {
                action = 'PROGRESS_UPDATE';
                description = `진행현황 업데이트: ${newValues.task_name || recordId}`;
              } else {
                action = 'TASK_UPDATE';
                description = `세부업무 수정: ${newValues?.task_name || recordId}`;
              }
            } else if (actionType === 'delete') {
              action = 'TASK_DELETE';
              description = `세부업무 삭제: ${recordId}`;
            }
          }

          // 업무 종결의 경우 특별 처리
          if (actionType === 'update' && tableName === 'additional_works' && newValues?.status === '종결') {
            action = 'WORK_COMPLETE';
            description = `업무 종결: ${newValues?.work_name || recordId}`;
          }

          const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: user.id || user.email || 'unknown',
            action,
            description,
            timestamp: new Date().toISOString(),
            ip: 'localhost',
            userAgent: navigator.userAgent
          };

          activityLogs.push(newLog);
          
          // 최대 1000개의 로그만 보관 (성능 고려)
          if (activityLogs.length > 1000) {
            activityLogs.splice(0, activityLogs.length - 1000);
          }

          localStorage.setItem('activityLogs', JSON.stringify(activityLogs));

          console.log('✅ [WorkStatus] Activity logged:', action, description);

          // 기존 work_activity_logs 테이블에도 기록 (중복 로그이지만 호환성 유지)
          const logData = {
            action_type: actionType,
            table_name: tableName,
            record_id: recordId,
            old_values: oldValues,
            new_values: newValues
          };

          // UUID 형식인지 확인
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (user.id && uuidRegex.test(user.id)) {
            logData.user_id = user.id;
          } else {
            logData.user_id = '00000000-0000-0000-0000-000000000000';
          }

          // activity_logs 테이블에 기록 시도 (실패해도 메인 기능에 영향 안줌)
          try {
            await supabase
              .from('activity_logs')
              .insert(logData);
            console.log('📝 [WorkStatus] Activity logged to Supabase:', { actionType, tableName, recordId });
          } catch (supabaseLogError) {
            console.warn('⚠️ [WorkStatus] Supabase activity logging failed (non-critical):', supabaseLogError.message);
          }
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
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) {
            // 테이블이 존재하지 않거나 권한이 없는 경우 조용히 처리
            if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
              console.warn('⚠️ [WorkStatus] activity_logs 테이블이 존재하지 않습니다. 빈 로그로 처리합니다.');
              set({ activityLogs: [] });
              return [];
            }
            throw error;
          }

          set({ activityLogs: data || [] });
          console.log('📋 [WorkStatus] Fetched activity logs:', data?.length || 0);
          return data;
        } catch (error) {
          console.warn('⚠️ [WorkStatus] Activity logs fetch failed (non-critical):', error.message);
          set({ activityLogs: [] });
          // Don't re-throw to prevent app crashes - activity logs are not critical
          return [];
        }
      },

      // ================================
      // USER MANAGEMENT ACTIONS
      // ================================

      /**
       * 사용자 목록 조회 (캐싱 적용)
       */
      fetchUsers: async () => {
        try {
          // 이미 사용자 데이터가 있으면 캐시된 데이터 사용
          const currentUsers = get().users;
          if (currentUsers && currentUsers.length > 0) {
            return currentUsers;
          }

          if (!supabase) {
            console.warn('⚠️ [WorkStatus] Supabase client not initialized');
            set({ users: [] });
            return [];
          }

          // 먼저 profiles 테이블 시도 (경고 메시지는 한 번만)
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .order('name');

          if (!profilesError && profilesData && profilesData.length > 0) {
            set({ users: profilesData });
            console.log('👥 [WorkStatus] Fetched users from profiles:', profilesData.length);
            return profilesData;
          }

          // profiles 실패시 한 번만 경고 (localStorage에 경고 기록)
          const profilesWarningShown = localStorage.getItem('profiles_warning_shown');
          if (!profilesWarningShown) {
            console.warn('⚠️ [WorkStatus] profiles 테이블이 없습니다. users 테이블을 사용합니다.');
            localStorage.setItem('profiles_warning_shown', 'true');
          }

          // 대안: users 테이블 시도
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .order('name');

          if (!usersError && usersData) {
            set({ users: usersData });
            console.log('👥 [WorkStatus] Fetched users from users table:', usersData.length);
            return usersData;
          }

          console.warn('⚠️ [WorkStatus] users 테이블도 접근 실패:', usersError?.message);

          // 최소한의 더미 데이터로 진행 (현재 로그인 사용자만)
          const savedUser = sessionStorage.getItem('supabase_user');
          const dummyUsers = savedUser ? [JSON.parse(savedUser)] : [];
          set({ users: dummyUsers });
          console.log('👥 [WorkStatus] 사용자 데이터 없음, 현재 로그인 사용자로 진행');
          return dummyUsers;

        } catch (error) {
          console.error('❌ [WorkStatus] Error fetching users:', error);
          
          // 에러 발생시에도 현재 로그인 사용자라도 유지
          const savedUser = sessionStorage.getItem('supabase_user');
          const fallbackUsers = savedUser ? [JSON.parse(savedUser)] : [];
          set({ users: fallbackUsers });
          
          return fallbackUsers;
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