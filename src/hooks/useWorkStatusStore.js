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
      users: [], // 사용자 목록
      
<<<<<<< HEAD
      // UI 상태 + 필터링
=======
      // 필터링 상태
      filter: {
        type: 'my', // 'my', 'all', 'user'
        selectedUser: '',
        currentUser: ''
      },
      
      // UI 상태
>>>>>>> 28f8e6c
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

<<<<<<< HEAD
          // 현재 로그인한 사용자 정보 가져오기
          const savedUser = sessionStorage.getItem('supabase_user');
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          
          // 필터링할 사용자 ID 결정
          const { selectedUserId } = get().ui;
          let targetUserId = userId || selectedUserId;
          
          console.log('🔍 [WorkStatus] Filtering works for:', { targetUserId, currentUser: currentUser?.email });
          
          // 기본 쿼리 - 서버 사이드 필터링 제거하여 400 오류 방지
          const { data, error } = await supabase
            .from('additional_works')
            .select('*')
            .neq('status', '종결') // 종결된 업무 제외
            .order('created_at', { ascending: false });

          console.log('📋 [WorkStatus] Fetching all works without server-side user filtering');

          if (error) throw error;
=======
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
>>>>>>> 28f8e6c

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
<<<<<<< HEAD
            additionalWorks: filteredWorks,
            loading: false 
          });

          console.log('📋 [WorkStatus] Fetched additional works:', filteredWorks?.length || 0, 'for user:', targetUserId);
          return filteredWorks;
=======
            allAdditionalWorks: data || [],
            loading: false 
          });

          // 필터 적용
          get().applyFilter();

          console.log('📋 [WorkStatus] Fetched additional works:', data?.length || 0);
          return data;
>>>>>>> 28f8e6c
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
          
<<<<<<< HEAD
          // 세션 스토리지에서 현재 로그인된 사용자 정보 가져오기
=======
          // 세션 스토리지에서 사용자 정보 가져오기 (커스텀 인증 시스템)
>>>>>>> 28f8e6c
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) throw new Error('로그인이 필요합니다.');
          
          const user = JSON.parse(savedUser);
<<<<<<< HEAD

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
=======
          
          // created_by는 NOT NULL이므로 기존 테이블과 같은 UUID 사용
          const { data, error } = await supabase
            .from('additional_works')
            .insert({
              ...workData,
              created_by: '550e8400-e29b-41d4-a716-446655440000' // 기존 테이블과 같은 UUID 사용
            })
>>>>>>> 28f8e6c
            .select('*')
            .single();

          if (error) throw error;

<<<<<<< HEAD
          // 생성된 업무에 빈 detail_tasks 배열 추가
          const workWithTasks = {
=======
          // 새로 생성된 업무에는 detail_tasks가 없으므로 빈 배열로 설정
          const newWork = {
>>>>>>> 28f8e6c
            ...data,
            detail_tasks: []
          };

          // 상태 업데이트
          set(state => ({
<<<<<<< HEAD
            additionalWorks: [workWithTasks, ...state.additionalWorks],
=======
            allAdditionalWorks: [newWork, ...state.allAdditionalWorks],
>>>>>>> 28f8e6c
            loading: false
          }));

          // 필터 다시 적용
          get().applyFilter();

          // 활동 로그 기록
          await get().logActivity('create', 'additional_works', data.id, null, data, data.work_name);

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

<<<<<<< HEAD
          // 상태 업데이트 (기존 detail_tasks 보존)
          set(state => ({
            additionalWorks: state.additionalWorks.map(work => 
              work.id === workId ? { ...data, detail_tasks: work.detail_tasks || [] } : work
            ),
            selectedWork: state.selectedWork?.id === workId ? { ...data, detail_tasks: state.selectedWork.detail_tasks || [] } : state.selectedWork,
=======
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
>>>>>>> 28f8e6c
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
          
<<<<<<< HEAD
          // 세션 스토리지에서 현재 로그인된 사용자 정보 가져오기
=======
          // 세션 스토리지에서 사용자 정보 가져오기 (커스텀 인증 시스템)
>>>>>>> 28f8e6c
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) throw new Error('로그인이 필요합니다.');
          
          const user = JSON.parse(savedUser);
<<<<<<< HEAD

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
=======
>>>>>>> 28f8e6c

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
<<<<<<< HEAD
            .insert(taskDataToInsert)
=======
            .insert(insertData)
>>>>>>> 28f8e6c
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
<<<<<<< HEAD
          // 세션 스토리지에서 현재 로그인된 사용자 정보 가져오기
=======
          // 세션 스토리지에서 사용자 정보 가져오기 (커스텀 인증 시스템)
>>>>>>> 28f8e6c
          const savedUser = sessionStorage.getItem('supabase_user');
          if (!savedUser) return; // 로그인 안된 경우 스킵
          
          const user = JSON.parse(savedUser);
<<<<<<< HEAD

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
=======
>>>>>>> 28f8e6c

          // 업무 이름 추출 (우선순위: 파라미터 -> newValues -> oldValues)
          const extractedWorkName = workName || 
                                   newValues?.work_name || 
                                   oldValues?.work_name ||
                                   '업무';

          // user_id가 필수인 경우를 위해 기본 UUID 사용
          await supabase
            .from('work_activity_logs')
<<<<<<< HEAD
            .insert(logData);
=======
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
>>>>>>> 28f8e6c

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
<<<<<<< HEAD
      // USER MANAGEMENT ACTIONS
      // ================================

      /**
       * 사용자 목록 조회
       */
      fetchUsers: async () => {
        try {
          if (!supabase) {
            console.warn('⚠️ [WorkStatus] Supabase client not initialized');
            set({ users: [] });
            return [];
          }

          // 먼저 profiles 테이블 시도
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .order('name');

          if (!profilesError && profilesData && profilesData.length > 0) {
            set({ users: profilesData });
            console.log('👥 [WorkStatus] Fetched users from profiles:', profilesData.length);
            return profilesData;
          }

          console.warn('⚠️ [WorkStatus] profiles 테이블 접근 실패 또는 데이터 없음:', profilesError?.message);

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
=======
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
>>>>>>> 28f8e6c
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