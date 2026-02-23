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
      allAdditionalWorks: [], // 전체 업무 목록 (필터링 전)
      selectedWork: null,
      loading: false,
      error: null,
      activityLogs: [],
      
      // 필터링 상태
      filter: {
        type: 'my', // 'my', 'all', 'user'
        selectedUser: '',
        currentUser: ''
      },
      
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
          
          // Supabase 클라이언트 검증
          if (!supabase) {
            throw new Error('Supabase client not initialized');
          }

          // 먼저 추가업무 조회
          const { data: worksData, error: worksError } = await supabase
            .from('additional_works')
            .select('*')
            .order('created_at', { ascending: false });

          if (worksError) throw worksError;

          // 각 추가업무에 대해 세부업무 조회하여 병합
          const worksWithTasks = await Promise.all(
            (worksData || []).map(async (work) => {
              try {
                const { data: tasks, error: tasksError } = await supabase
                  .from('detail_tasks')
                  .select('*')
                  .eq('additional_work_id', work.id)
                  .order('display_order', { ascending: true });
                
                if (tasksError) {
                  console.error('❌ [WorkStatus] Error fetching detail tasks for work:', work.id, tasksError);
                  // display_order 정렬이 실패하면 created_at으로 폴백
                  const { data: fallbackTasks, error: fallbackError } = await supabase
                    .from('detail_tasks')
                    .select('*')
                    .eq('additional_work_id', work.id)
                    .order('created_at', { ascending: true });
                  
                  if (fallbackError) {
                    console.error('❌ [WorkStatus] Fallback query also failed:', fallbackError);
                    return { ...work, detail_tasks: [] };
                  }
                  
                  // 로컬에서 display_order 추가
                  const tasksWithOrder = (fallbackTasks || []).map((task, index) => ({
                    ...task,
                    display_order: index
                  }));
                  
                  console.log('🔄 [WorkStatus] Using fallback query for work:', work.work_name, tasksWithOrder.length, 'tasks');
                  return { ...work, detail_tasks: tasksWithOrder };
                }
                
                console.log('✅ [WorkStatus] Fetched detail tasks for work:', work.work_name, (tasks || []).length, 'tasks');
                return {
                  ...work,
                  detail_tasks: tasks || []
                };
              } catch (error) {
                console.error('❌ [WorkStatus] Unexpected error fetching detail tasks:', error);
                return { ...work, detail_tasks: [] };
              }
            })
          );

          const data = worksWithTasks;

          set({ 
            allAdditionalWorks: data || [],
            loading: false 
          });

          // 필터 적용
          get().applyFilter();

          console.log('📋 [WorkStatus] Fetched additional works:', data?.length || 0);
          return data;
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
       * 새 추가업무 생성
       */
      createAdditionalWork: async (workData) => {
        try {
          set({ loading: true, error: null });
          
          // 세션 스토리지에서 사용자 정보 가져오기 (커스텀 인증 시스템)
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) throw new Error('로그인이 필요합니다.');
          
          const user = JSON.parse(savedUser);
          
          // created_by는 NOT NULL이므로 기존 테이블과 같은 UUID 사용
          const { data, error } = await supabase
            .from('additional_works')
            .insert({
              ...workData,
              created_by: '550e8400-e29b-41d4-a716-446655440000' // 기존 테이블과 같은 UUID 사용
            })
            .select('*')
            .single();

          if (error) throw error;

          // 새로 생성된 업무에는 detail_tasks가 없으므로 빈 배열로 설정
          const newWork = {
            ...data,
            detail_tasks: []
          };

          // 상태 업데이트
          set(state => ({
            allAdditionalWorks: [newWork, ...state.allAdditionalWorks],
            loading: false
          }));

          // 필터 다시 적용
          get().applyFilter();

          // 활동 로그 기록
          await get().logActivity('create', 'additional_works', data.id, null, data, data.work_name);

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

          // 해당 업무의 detail_tasks를 별도로 가져와서 병합
          const { data: tasks, error: tasksError } = await supabase
            .from('detail_tasks')
            .select('*')
            .eq('additional_work_id', workId);

          const updatedWork = {
            ...data,
            detail_tasks: tasksError ? [] : (tasks || [])
          };

          // 상태 업데이트
          set(state => ({
            allAdditionalWorks: state.allAdditionalWorks.map(work => 
              work.id === workId ? updatedWork : work
            ),
            selectedWork: state.selectedWork?.id === workId ? updatedWork : state.selectedWork,
            loading: false
          }));

          // 필터 다시 적용
          get().applyFilter();

          // 활동 로그 기록
          await get().logActivity('update', 'additional_works', workId, null, updates, updatedWork.work_name);

          console.log('📝 [WorkStatus] Updated additional work:', workId);
          return data;
        } catch (error) {
          console.error('❌ [WorkStatus] Error updating additional work:', error);
          console.error('❌ [WorkStatus] 오류 메시지:', error?.message);
          console.error('❌ [WorkStatus] 오류 상세:', error?.details);
          console.error('❌ [WorkStatus] 오류 코드:', error?.code);
          console.error('❌ [WorkStatus] 전체 오류 객체:', JSON.stringify(error, null, 2));
          console.error('❌ [WorkStatus] 업데이트 데이터:', JSON.stringify(updates, null, 2));
          set({ 
            error: error.message,
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 추가업무 삭제 (완전 삭제)
       */
      deleteAdditionalWork: async (workId) => {
        try {
          set({ loading: true, error: null });

          // 삭제하기 전에 업무 제목 가져오기
          const workToDelete = get().allAdditionalWorks.find(work => work.id === workId);
          const workName = workToDelete?.work_name || '업무';

          // 먼저 관련 세부업무들을 모두 삭제
          const { error: detailTasksError } = await supabase
            .from('detail_tasks')
            .delete()
            .eq('additional_work_id', workId);

          if (detailTasksError) {
            console.warn('Detail tasks deletion failed:', detailTasksError);
          }

          // 추가업무 삭제
          const { error } = await supabase
            .from('additional_works')
            .delete()
            .eq('id', workId);

          if (error) throw error;

          // 상태 업데이트
          set(state => ({
            allAdditionalWorks: state.allAdditionalWorks.filter(work => work.id !== workId),
            selectedWork: state.selectedWork?.id === workId ? null : state.selectedWork,
            loading: false
          }));

          // 필터 다시 적용
          get().applyFilter();

          // 활동 로그 기록
          await get().logActivity('delete', 'additional_works', workId, null, null, workName);

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

      /**
       * 추가업무 종료 (완료 처리)
       */
      completeAdditionalWork: async (workId) => {
        try {
          set({ loading: true, error: null });

          // 완료하기 전에 업무 제목 가져오기
          const workToComplete = get().allAdditionalWorks.find(work => work.id === workId);
          const workName = workToComplete?.work_name || '업무';

          // 업무 상태를 '종료'로 변경
          const { error } = await supabase
            .from('additional_works')
            .update({ 
              status: '종료',
              updated_at: new Date().toISOString()
            })
            .eq('id', workId);

          if (error) throw error;

          // 해당 업무의 detail_tasks를 별도로 가져와서 병합
          const { data: tasks, error: tasksError } = await supabase
            .from('detail_tasks')
            .select('*')
            .eq('additional_work_id', workId);

          // 상태 업데이트
          set(state => ({
            allAdditionalWorks: state.allAdditionalWorks.map(work => 
              work.id === workId 
                ? { 
                    ...work, 
                    status: '종료',
                    detail_tasks: tasksError ? work.detail_tasks : (tasks || [])
                  } 
                : work
            ),
            loading: false
          }));

          // 필터 다시 적용
          get().applyFilter();

          // 활동 로그 기록
          await get().logActivity('update', 'additional_works', workId, { status: '진행중' }, { status: '종료' }, workName);

          console.log('✅ [WorkStatus] Completed additional work:', workId);
        } catch (error) {
          console.error('❌ [WorkStatus] Error completing additional work:', error);
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
          
          // 세션 스토리지에서 사용자 정보 가져오기 (커스텀 인증 시스템)
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) throw new Error('로그인이 필요합니다.');
          
          const user = JSON.parse(savedUser);

          // 현재 업무의 세부업무 개수를 가져와서 display_order 설정
          const currentWork = get().allAdditionalWorks.find(w => w.id === additionalWorkId);
          const currentTaskCount = currentWork?.detail_tasks?.length || 0;

          // created_by가 필수인 경우를 위해 기본 UUID 사용
          // end_date 컬럼이 없을 수 있으므로 조건부로 처리
          const insertData = {
            ...taskData,
            additional_work_id: additionalWorkId,
            display_order: currentTaskCount,
            created_by: '550e8400-e29b-41d4-a716-446655440000' // 기본 UUID
          };

          // end_date가 비어있거나 undefined인 경우 제거
          if (!insertData.end_date) {
            delete insertData.end_date;
          }

          let { data, error } = await supabase
            .from('detail_tasks')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            // end_date 컬럼 관련 에러인 경우 해당 필드 제거하고 재시도
            if (error.message && error.message.includes('end_date')) {
              console.warn('⚠️ end_date 컬럼이 없어서 해당 필드를 제거하고 재시도합니다.');
              const { end_date, ...dataWithoutEndDate } = insertData;
              const retryResult = await supabase
                .from('detail_tasks')
                .insert(dataWithoutEndDate)
                .select()
                .single();
              
              if (retryResult.error) throw retryResult.error;
              data = retryResult.data;
            } else {
              throw error;
            }
          }

          // 상태 업데이트 - 해당 추가업무에 세부업무 추가
          set(state => ({
            allAdditionalWorks: state.allAdditionalWorks.map(work => 
              work.id === additionalWorkId 
                ? {
                    ...work,
                    detail_tasks: [...(work.detail_tasks || []), data]
                  }
                : work
            ),
            loading: false
          }));

          // 필터 다시 적용
          get().applyFilter();

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
            allAdditionalWorks: state.allAdditionalWorks.map(work => ({
              ...work,
              detail_tasks: work.detail_tasks?.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
              ) || []
            }))
          }));

          // 필터 다시 적용
          get().applyFilter();

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
            allAdditionalWorks: state.allAdditionalWorks.map(work => ({
              ...work,
              detail_tasks: work.detail_tasks?.map(task =>
                task.id === taskId ? { ...task, progress_content: progressContent } : task
              ) || []
            }))
          }));

          // 필터 다시 적용
          get().applyFilter();

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
       * 세부업무 순서 변경 (데이터베이스 업데이트)
       */
      reorderDetailTasks: async (workId, fromIndex, toIndex) => {
        try {
          // 현재 업무의 세부업무 목록 가져오기
          const work = get().allAdditionalWorks.find(w => w.id === workId);
          if (!work || !work.detail_tasks) return;

          const tasks = [...work.detail_tasks];
          const [movedTask] = tasks.splice(fromIndex, 1);
          tasks.splice(toIndex, 0, movedTask);

          // 데이터베이스에서 display_order 업데이트
          const updatePromises = tasks.map((task, index) =>
            supabase
              .from('detail_tasks')
              .update({ display_order: index })
              .eq('id', task.id)
          );

          const results = await Promise.all(updatePromises);
          
          // 에러 체크
          const hasError = results.some(result => result.error);
          if (hasError) {
            throw new Error('Failed to update task order in database');
          }

          // 로컬 상태 업데이트
          const reorderedTasks = tasks.map((task, index) => ({
            ...task,
            display_order: index
          }));

          set(state => ({
            allAdditionalWorks: state.allAdditionalWorks.map(w => 
              w.id === workId 
                ? { ...w, detail_tasks: reorderedTasks }
                : w
            )
          }));

          // 필터 다시 적용
          get().applyFilter();

          console.log('✅ [WorkStatus] Tasks reordered successfully in database');
          
        } catch (error) {
          console.error('❌ [WorkStatus] Failed to reorder tasks:', error);
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
            allAdditionalWorks: state.allAdditionalWorks.map(work => ({
              ...work,
              detail_tasks: work.detail_tasks?.filter(task => task.id !== taskId) || []
            }))
          }));

          // 필터 다시 적용
          get().applyFilter();

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
      logActivity: async (actionType, tableName, recordId, oldValues, newValues, workName = null) => {
        try {
          // 세션 스토리지에서 사용자 정보 가져오기 (커스텀 인증 시스템)
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) return; // 로그인 안된 경우 스킵
          
          const user = JSON.parse(savedUser);

          // 업무 이름 추출 (우선순위: 파라미터 -> newValues -> oldValues)
          const extractedWorkName = workName || 
                                   newValues?.work_name || 
                                   oldValues?.work_name ||
                                   '업무';

          // user_id가 필수인 경우를 위해 기본 UUID 사용
          await supabase
            .from('work_activity_logs')
            .insert({
              user_id: '550e8400-e29b-41d4-a716-446655440000', // 기본 UUID
              action_type: actionType,
              table_name: tableName,
              record_id: recordId,
              old_values: oldValues,
              new_values: newValues,
              work_name: extractedWorkName,
              description: `${extractedWorkName}에 대한 ${actionType} 작업`
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
      // FILTERING ACTIONS
      // ================================

      /**
       * 필터 설정
       */
      setFilter: (filterConfig) => {
        set(state => ({
          filter: {
            ...state.filter,
            ...filterConfig
          }
        }));
        
        // 필터 적용
        get().applyFilter();
        
        console.log('🔍 [WorkStatus] Filter updated:', filterConfig);
      },

      /**
       * 필터 적용 로직
       */
      applyFilter: () => {
        const { allAdditionalWorks, filter } = get();
        let filteredWorks = [...allAdditionalWorks];

        switch (filter.type) {
          case 'my':
            // 현재 사용자가 작성한 업무만 필터링
            filteredWorks = allAdditionalWorks.filter(work => 
              work.work_owner === filter.currentUser || 
              work.created_by === filter.currentUser
            );
            break;
            
          case 'user':
            // 특정 사용자가 작성한 업무만 필터링
            if (filter.selectedUser) {
              filteredWorks = allAdditionalWorks.filter(work => 
                work.work_owner === filter.selectedUser || 
                work.created_by === filter.selectedUser
              );
            }
            break;
            
          case 'all':
          default:
            // 모든 업무 표시
            filteredWorks = allAdditionalWorks;
            break;
        }

        set({ additionalWorks: filteredWorks });
        
        console.log('🔍 [WorkStatus] Filter applied:', {
          type: filter.type,
          totalWorks: allAdditionalWorks.length,
          filteredWorks: filteredWorks.length
        });
      },

      /**
       * 모든 작성자 목록 가져오기
       */
      getAllAuthors: () => {
        const { allAdditionalWorks } = get();
        const authors = new Set();
        
        allAdditionalWorks.forEach(work => {
          if (work.work_owner) authors.add(work.work_owner);
        });
        
        return Array.from(authors).sort();
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

        // 활동로그 변경 구독 (실시간 업데이트를 위함)
        const activityLogsChannel = supabase
          .channel('work_activity_logs_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'work_activity_logs'
          }, () => {
            console.log('🔄 [WorkStatus] Activity logs changed, refetching...');
            get().fetchActivityLogs();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(additionalWorksChannel);
          supabase.removeChannel(detailTasksChannel);
          supabase.removeChannel(activityLogsChannel);
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