import { supabase } from '../lib/supabase';

/**
 * localStorage 데이터를 Supabase로 마이그레이션하는 유틸리티
 */
export class DataMigration {
  
  // localStorage 데이터 백업
  static backupLocalStorage() {
    const backup = {
      projects: JSON.parse(localStorage.getItem('projects') || '[]'),
      completedProjects: JSON.parse(localStorage.getItem('completedProjects') || '[]'),
      opinions: JSON.parse(localStorage.getItem('opinions') || '[]'),
      users: JSON.parse(localStorage.getItem('users') || '[]'),
      activityLogs: JSON.parse(localStorage.getItem('activityLogs') || '[]')
    };
    
    console.log('📦 localStorage 백업 완료:', backup);
    return backup;
  }

  // 프로젝트 데이터 마이그레이션
  static async migrateProjects(projects = []) {
    try {
      if (projects.length === 0) return { success: true, count: 0 };
      
      console.log(`📊 ${projects.length}개 프로젝트 마이그레이션 시작...`);
      console.log('원본 프로젝트 데이터 샘플:', projects[0]);
      
      // 프로젝트 데이터 변환 (Supabase 스키마에 맞게)
      const projectsData = projects.map((project, index) => {
        try {
          // 각 필드를 안전하게 처리
          const transformedProject = {
            id: String(project.id || `PROJECT_${Date.now()}_${index}`),
            name: String(project.name || '이름 없는 프로젝트'),
            model_name: String(project.modelName || project.model_name || project.id || `MODEL_${Date.now()}_${index}`),
            stage1: typeof project.stage1 === 'object' ? project.stage1 : {},
            stage2: typeof project.stage2 === 'object' ? project.stage2 : {},
            stage3: typeof project.stage3 === 'object' ? project.stage3 : {},
            created_at: project.createdAt || project.created_at || new Date().toISOString()
          };
          
          // 데이터 유효성 검사
          if (!transformedProject.id || !transformedProject.name) {
            throw new Error(`프로젝트 ${index}번: 필수 필드 누락 (id: ${transformedProject.id}, name: ${transformedProject.name})`);
          }
          
          console.log(`변환된 프로젝트 ${index}:`, JSON.stringify(transformedProject, null, 2));
          return transformedProject;
        } catch (error) {
          console.error(`프로젝트 ${index} 변환 오류:`, error);
          throw error;
        }
      });

      console.log(`🔄 Supabase에 ${projectsData.length}개 프로젝트 업서트 시도...`);

      // 단일 프로젝트씩 안전하게 삽입 시도
      const results = [];
      const errors = [];
      
      for (let i = 0; i < projectsData.length; i++) {
        const project = projectsData[i];
        console.log(`🔄 프로젝트 ${i + 1}/${projectsData.length} 처리 중: ${project.name}`);
        
        try {
          // 단일 프로젝트 upsert 시도
          const { data, error } = await supabase
            .from('projects')
            .upsert([project], { onConflict: 'id' });
            
          if (error) {
            console.error(`❌ 프로젝트 ${project.name} 실패:`, error);
            errors.push({ project: project.name, error: error.message });
            
            // 특정 오류의 경우 대안 시도
            if (error.code === 'PGRST204' || error.message.includes('violates')) {
              console.log(`🔄 프로젝트 ${project.name} 대안 방법 시도...`);
              
              // 간소화된 데이터로 재시도
              const simpleProject = {
                id: project.id,
                name: project.name,
                model_name: project.model_name,
                stage1: {},
                stage2: {},
                stage3: {},
                created_at: project.created_at
              };
              
              const { data: retryData, error: retryError } = await supabase
                .from('projects')
                .upsert([simpleProject], { onConflict: 'id' });
                
              if (!retryError) {
                console.log(`✅ 프로젝트 ${project.name} 간소화 버전으로 성공`);
                results.push(retryData);
              } else {
                console.error(`❌ 프로젝트 ${project.name} 재시도도 실패:`, retryError);
                errors.push({ project: project.name, error: `재시도 실패: ${retryError.message}` });
              }
            }
          } else {
            console.log(`✅ 프로젝트 ${project.name} 성공`);
            results.push(data);
          }
        } catch (projectError) {
          console.error(`❌ 프로젝트 ${project.name} 처리 중 예외:`, projectError);
          errors.push({ project: project.name, error: projectError.message });
        }
      }
      
      // 결과 평가
      const successCount = results.length;
      const hasErrors = errors.length > 0;
      
      console.log(`📊 마이그레이션 결과: 성공 ${successCount}개, 실패 ${errors.length}개`);
      
      if (hasErrors) {
        console.error('실패한 프로젝트들:', errors);
      }
      
      // 부분 성공이라도 성공으로 처리 (일부 프로젝트라도 마이그레이션되면)
      const isSuccess = successCount > 0;
      
      if (!isSuccess && hasErrors) {
        return { 
          success: false, 
          error: `모든 프로젝트 마이그레이션 실패. 첫 번째 에러: ${errors[0]?.error}`,
          errors: errors
        };
      }

      console.log(`✅ ${successCount}개 프로젝트 마이그레이션 완료 (${errors.length}개 실패)`);
      console.log('성공한 프로젝트들:', results);
      return { 
        success: true, 
        count: successCount, 
        totalAttempted: projects.length,
        data: results,
        errors: hasErrors ? errors : undefined
      };

    } catch (error) {
      console.error('❌ 프로젝트 마이그레이션 오류:', error);
      console.error('오류 상세:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message || error };
    }
  }

  // 사용자 데이터 마이그레이션 (Supabase Auth와 연동)
  static async migrateUsers(users = []) {
    try {
      if (users.length === 0) return { success: true, count: 0 };
      
      console.log(`👥 ${users.length}명 사용자 마이그레이션 시작...`);
      
      const results = [];
      
      for (const user of users) {
        try {
          // 1. Supabase Auth에 사용자 생성 (관리자만 가능)
          // 일반적으로는 사용자가 직접 회원가입해야 하므로 프로필만 생성
          
          // 2. 프로필 데이터 준비
          const profileData = {
            // id는 실제 Supabase Auth 사용자 ID가 필요하므로 임시로 스킵
            // 실제로는 사용자가 다시 회원가입해야 함
            name: user.name,
            team: user.team,
            email: user.email,
            role: user.role || 'user',
            registered_at: user.registeredAt || new Date().toISOString()
          };
          
          console.log('⏳ 사용자 프로필 준비:', user.email);
          results.push({ email: user.email, status: 'prepared' });
          
        } catch (error) {
          console.error(`❌ 사용자 ${user.email} 처리 실패:`, error);
          results.push({ email: user.email, status: 'failed', error });
        }
      }

      console.log(`✅ ${users.length}명 사용자 데이터 준비 완료 (실제 가입은 별도 필요)`);
      return { success: true, count: users.length, results };

    } catch (error) {
      console.error('❌ 사용자 마이그레이션 오류:', error);
      return { success: false, error };
    }
  }

  // 데이터 분석 함수 추가
  static analyzeLocalStorage() {
    console.log('🔍 LocalStorage 데이터 분석 중...');
    
    const analysis = {
      projects: this.analyzeDataType('projects'),
      completedProjects: this.analyzeDataType('completedProjects'),
      opinions: this.analyzeDataType('opinions'),
      users: this.analyzeDataType('users'),
      activityLogs: this.analyzeDataType('activityLogs')
    };

    // 전체 요약
    const totalItems = Object.values(analysis).reduce((sum, data) => sum + data.count, 0);
    const totalSize = Object.values(analysis).reduce((sum, data) => sum + data.sizeBytes, 0);

    analysis.summary = {
      totalItems,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      dataTypes: Object.keys(analysis).length
    };

    console.log('📊 LocalStorage 데이터 분석 완료:', analysis);
    return analysis;
  }

  // 개별 데이터 타입 분석
  static analyzeDataType(key) {
    const data = localStorage.getItem(key);
    if (!data) {
      return { count: 0, sizeBytes: 0, sample: null, hasData: false };
    }

    try {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? 1 : 0);
      
      return {
        count,
        sizeBytes: new Blob([data]).size,
        sizeFormatted: this.formatBytes(new Blob([data]).size),
        sample: Array.isArray(parsed) ? parsed[0] : parsed,
        hasData: count > 0,
        structure: count > 0 ? this.analyzeStructure(Array.isArray(parsed) ? parsed[0] : parsed) : null
      };
    } catch (error) {
      return { count: 0, sizeBytes: 0, sample: null, hasData: false, error: error.message };
    }
  }

  // 데이터 구조 분석
  static analyzeStructure(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    const fields = Object.keys(obj);
    const fieldTypes = {};
    
    fields.forEach(field => {
      const value = obj[field];
      fieldTypes[field] = typeof value;
    });

    return { fields, fieldTypes, fieldCount: fields.length };
  }

  // 바이트 크기 포맷팅
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 의견 데이터 마이그레이션 추가
  static async migrateOpinions(opinions = []) {
    try {
      if (opinions.length === 0) return { success: true, count: 0 };
      
      console.log(`💬 ${opinions.length}개 의견 마이그레이션 시작...`);
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < opinions.length; i++) {
        const opinion = opinions[i];
        console.log(`🔄 의견 ${i + 1}/${opinions.length} 처리 중: ${opinion.id}`);
        
        try {
          const transformedOpinion = {
            id: String(opinion.id || `opinion_${Date.now()}_${i}`),
            project_id: String(opinion.projectId),
            project_is_completed: Boolean(opinion.projectIsCompleted || false),
            author_name: String(opinion.authorName || '익명'),
            message: String(opinion.message || ''),
            stage: String(opinion.stage || 'general'),
            status: String(opinion.status || 'open'),
            priority: String(opinion.priority || 'medium'),
            reply: opinion.reply || null,
            created_by: String(opinion.createdBy || opinion.authorName || 'system'),
            updated_by: String(opinion.updatedBy || opinion.createdBy || 'system'),
            migrated_from_local: true,
            local_created_at: opinion.createdAt || new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('opinions')
            .upsert([transformedOpinion], { onConflict: 'id' });

          if (error) {
            console.error(`❌ 의견 ${opinion.id} 실패:`, error);
            errors.push({ id: opinion.id, error: error.message });
          } else {
            console.log(`✅ 의견 ${opinion.id} 성공`);
            results.push(data);
          }
        } catch (opinionError) {
          console.error(`❌ 의견 ${opinion.id} 처리 중 예외:`, opinionError);
          errors.push({ id: opinion.id, error: opinionError.message });
        }
      }

      const successCount = results.length;
      console.log(`✅ ${successCount}개 의견 마이그레이션 완료 (${errors.length}개 실패)`);
      
      return { 
        success: true, 
        count: successCount, 
        totalAttempted: opinions.length,
        data: results,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ 의견 마이그레이션 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 활동 로그 마이그레이션 추가
  static async migrateActivityLogs(activityLogs = []) {
    try {
      if (activityLogs.length === 0) return { success: true, count: 0 };
      
      console.log(`📝 ${activityLogs.length}개 활동 로그 마이그레이션 시작...`);
      
      // 배치 처리로 성능 최적화
      const batchSize = 50;
      const results = [];
      const errors = [];
      
      for (let i = 0; i < activityLogs.length; i += batchSize) {
        const batch = activityLogs.slice(i, i + batchSize);
        console.log(`🔄 배치 ${Math.floor(i/batchSize) + 1}/${Math.ceil(activityLogs.length/batchSize)} 처리 중 (${batch.length}개)`);
        
        try {
          const transformedLogs = batch.map((log, index) => ({
            id: String(log.id || `log_${Date.now()}_${i + index}`),
            user_id: String(log.userId || 'system'),
            user_name: String(log.userName || '시스템'),
            action: String(log.action || 'unknown'),
            target_type: String(log.targetType || 'project'),
            target_id: String(log.targetId || ''),
            details: log.details || {},
            ip_address: String(log.ipAddress || '127.0.0.1'),
            user_agent: String(log.userAgent || 'LocalStorage Migration'),
            migrated_from_local: true,
            local_timestamp: log.timestamp || new Date().toISOString()
          }));

          const { data, error } = await supabase
            .from('activity_logs')
            .insert(transformedLogs);

          if (error) {
            console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 실패:`, error);
            errors.push({ batch: Math.floor(i/batchSize) + 1, error: error.message });
          } else {
            console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1} 성공`);
            results.push(...(data || transformedLogs));
          }
        } catch (batchError) {
          console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 처리 중 예외:`, batchError);
          errors.push({ batch: Math.floor(i/batchSize) + 1, error: batchError.message });
        }
      }

      const successCount = results.length;
      console.log(`✅ ${successCount}개 활동 로그 마이그레이션 완료 (${errors.length}개 배치 실패)`);
      
      return { 
        success: true, 
        count: successCount, 
        totalAttempted: activityLogs.length,
        data: results,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ 활동 로그 마이그레이션 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 전체 마이그레이션 실행 (개선된 버전)
  static async migrateAll() {
    try {
      console.log('🚀 데이터 마이그레이션 시작...');
      
      // 0. 환경 확인
      console.log('환경변수 확인:', {
        SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음',
        SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'
      });
      
      // 1. 데이터 분석
      console.log('1️⃣ LocalStorage 데이터 분석...');
      const analysis = this.analyzeLocalStorage();
      
      // 2. 백업
      console.log('2️⃣ 데이터 백업...');
      const backup = this.backupLocalStorage();
      console.log('백업된 데이터 요약:', {
        projects: backup.projects.length,
        completedProjects: backup.completedProjects.length,
        users: backup.users.length,
        opinions: backup.opinions.length,
        activityLogs: backup.activityLogs.length,
        totalSize: analysis.summary.totalSizeFormatted
      });
      
      // 3. 연결 테스트
      console.log('3️⃣ Supabase 연결 테스트 중...');
      const { count: testCount, error: connectError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      
      if (connectError) {
        console.error('❌ Supabase 연결 실패:', connectError);
        throw new Error(`Supabase 연결 오류: ${connectError.message}`);
      }
      console.log(`✅ Supabase 연결 성공! 현재 ${testCount || 0}개 프로젝트 존재`);
      
      // 4. 데이터 마이그레이션 실행
      console.log('4️⃣ 데이터 마이그레이션 실행...');
      
      const migrationResults = {};
      
      // 4-1. 사용자 먼저 마이그레이션 (다른 테이블의 참조용)
      if (backup.users.length > 0) {
        console.log('👥 사용자 데이터 마이그레이션...');
        migrationResults.users = await this.migrateUsers(backup.users);
      }
      
      // 4-2. 프로젝트 마이그레이션 (진행 중인 것들)
      if (backup.projects.length > 0) {
        console.log('📁 진행 중인 프로젝트 마이그레이션...');
        migrationResults.projects = await this.migrateProjects(backup.projects);
      }
      
      // 4-3. 완료된 프로젝트 마이그레이션
      if (backup.completedProjects.length > 0) {
        console.log('✅ 완료된 프로젝트 마이그레이션...');
        migrationResults.completedProjects = await this.migrateProjects(backup.completedProjects);
      }
      
      // 4-4. 의견 마이그레이션
      if (backup.opinions.length > 0) {
        console.log('💬 의견 데이터 마이그레이션...');
        migrationResults.opinions = await this.migrateOpinions(backup.opinions);
      }
      
      // 4-5. 활동 로그 마이그레이션
      if (backup.activityLogs.length > 0) {
        console.log('📝 활동 로그 마이그레이션...');
        migrationResults.activityLogs = await this.migrateActivityLogs(backup.activityLogs);
      }
      
      // 5. 마이그레이션 검증
      console.log('5️⃣ 마이그레이션 결과 검증...');
      const verification = await this.verifyMigration(backup, migrationResults);
      
      // 6. 최종 리포트 생성
      console.log('6️⃣ 최종 리포트 생성...');
      const report = {
        timestamp: new Date().toISOString(),
        analysis,
        backup: {
          created: true,
          itemCounts: {
            projects: backup.projects.length,
            completedProjects: backup.completedProjects.length,
            users: backup.users.length,
            opinions: backup.opinions.length,
            activityLogs: backup.activityLogs.length
          }
        },
        migrationResults,
        verification,
        summary: this.generateMigrationSummary(migrationResults, analysis)
      };

      console.log('📋 마이그레이션 완료 리포트:', report);
      
      // 마이그레이션 성공 시 localStorage에 플래그 설정
      if (migrationResults && migrationResults.projects && migrationResults.projects.success) {
        localStorage.setItem('migrated_to_supabase', 'true');
        localStorage.setItem('migration_report', JSON.stringify(report));
        console.log('✅ 마이그레이션 성공 플래그 설정 완료');
      }
      
      return report;

    } catch (error) {
      console.error('❌ 전체 마이그레이션 실패:', error);
      console.error('에러 스택:', error.stack);
      return { success: false, error: error.message || error };
    }
  }

  // 마이그레이션 상태 확인
  static isMigrated() {
    return localStorage.getItem('migrated_to_supabase') === 'true';
  }

  // 마이그레이션 검증
  static async verifyMigration(backup, migrationResults) {
    console.log('🔍 마이그레이션 검증 시작...');
    
    const verification = {
      status: 'success',
      issues: [],
      dataCounts: {}
    };

    try {
      // Supabase에서 실제 데이터 개수 확인
      const verificationPromises = [
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('completed_projects').select('*', { count: 'exact', head: true }),
        supabase.from('opinions').select('*', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true })
      ];

      const [projectsCount, completedCount, opinionsCount, logsCount] = await Promise.all(verificationPromises);

      verification.dataCounts = {
        projects: {
          expected: backup.projects.length,
          actual: projectsCount.count || 0,
          match: (backup.projects.length === (projectsCount.count || 0))
        },
        completedProjects: {
          expected: backup.completedProjects.length,
          actual: completedCount.count || 0,
          match: (backup.completedProjects.length === (completedCount.count || 0))
        },
        opinions: {
          expected: backup.opinions.length,
          actual: opinionsCount.count || 0,
          match: (backup.opinions.length === (opinionsCount.count || 0))
        },
        activityLogs: {
          expected: backup.activityLogs.length,
          actual: logsCount.count || 0,
          match: (backup.activityLogs.length === (logsCount.count || 0))
        }
      };

      // 불일치 항목 검사
      Object.entries(verification.dataCounts).forEach(([type, counts]) => {
        if (!counts.match) {
          verification.issues.push({
            type: 'count_mismatch',
            dataType: type,
            expected: counts.expected,
            actual: counts.actual,
            severity: 'warning'
          });
        }
      });

      // 마이그레이션 오류 확인
      Object.entries(migrationResults).forEach(([type, result]) => {
        if (result && result.errors && result.errors.length > 0) {
          verification.issues.push({
            type: 'migration_errors',
            dataType: type,
            errors: result.errors,
            severity: 'error'
          });
        }
      });

      // 전체 상태 결정
      const hasErrors = verification.issues.some(issue => issue.severity === 'error');
      const hasWarnings = verification.issues.some(issue => issue.severity === 'warning');
      
      if (hasErrors) {
        verification.status = 'error';
      } else if (hasWarnings) {
        verification.status = 'warning';
      } else {
        verification.status = 'success';
      }

      console.log('✅ 마이그레이션 검증 완료:', verification);
      return verification;

    } catch (error) {
      console.error('❌ 마이그레이션 검증 실패:', error);
      verification.status = 'error';
      verification.issues.push({
        type: 'verification_error',
        error: error.message,
        severity: 'error'
      });
      return verification;
    }
  }

  // 마이그레이션 요약 생성
  static generateMigrationSummary(migrationResults, analysis) {
    const summary = {
      totalOriginalItems: analysis.summary.totalItems,
      totalMigratedItems: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      migrationRate: 0,
      dataTypes: {}
    };

    // 각 데이터 타입별 요약
    Object.entries(migrationResults).forEach(([type, result]) => {
      if (result && typeof result === 'object') {
        const successful = result.count || 0;
        const failed = result.totalAttempted ? (result.totalAttempted - successful) : 0;
        
        summary.totalMigratedItems += successful;
        summary.successfulMigrations += successful;
        summary.failedMigrations += failed;
        
        summary.dataTypes[type] = {
          attempted: result.totalAttempted || 0,
          successful,
          failed,
          successRate: result.totalAttempted > 0 ? 
            Math.round((successful / result.totalAttempted) * 100) : 0
        };
      }
    });

    // 전체 마이그레이션 비율
    summary.migrationRate = summary.totalOriginalItems > 0 ? 
      Math.round((summary.totalMigratedItems / summary.totalOriginalItems) * 100) : 0;

    return summary;
  }

  // 마이그레이션 리포트 가져오기
  static getMigrationReport() {
    const report = localStorage.getItem('migration_report');
    return report ? JSON.parse(report) : null;
  }

  // 마이그레이션 복구 (필요시)
  static restoreFromBackup(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error(`백업 키 '${backupKey}'를 찾을 수 없습니다.`);
      }

      const backup = JSON.parse(backupData);
      
      // 백업 데이터 복원
      if (backup.data) {
        Object.entries(backup.data).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value);
          }
        });
      }

      console.log('✅ 백업 복원 완료:', backupKey);
      return { success: true, restoredFrom: backupKey };

    } catch (error) {
      console.error('❌ 백업 복원 실패:', error);
      return { success: false, error: error.message };
    }
  }
}