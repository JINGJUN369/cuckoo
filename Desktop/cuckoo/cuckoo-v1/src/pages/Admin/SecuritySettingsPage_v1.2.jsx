import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

/**
 * SecuritySettingsPage v1.2 - 완전한 보안 설정 시스템
 * 
 * 주요 기능:
 * - 시스템 보안 정책 설정
 * - 로그인 시도 제한 관리
 * - 세션 타임아웃 설정
 * - 비밀번호 정책 설정
 * - 보안 이벤트 알림 설정
 * - 시스템 백업 설정
 */
const SecuritySettingsPage_v1_2 = () => {
  const { profile } = useSupabaseAuth();
  
  // 보안 설정 상태
  const [securitySettings, setSecuritySettings] = useState(() => {
    const saved = localStorage.getItem('securitySettings');
    return saved ? JSON.parse(saved) : {
      // 로그인 보안
      maxLoginAttempts: 5,
      lockoutDuration: 30, // 분
      sessionTimeout: 120, // 분
      forceLogoutInactive: true,
      
      // 비밀번호 정책
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiry: 90, // 일
      preventPasswordReuse: 3,
      
      // 알림 설정
      emailNotifications: true,
      securityAlerts: true,
      loginNotifications: false,
      adminNotifications: true,
      
      // 시스템 보안
      enableAuditLog: true,
      logRetentionDays: 90,
      autoBackup: true,
      backupInterval: 7, // 일
      dataEncryption: true,
      
      // 접근 제어
      ipWhitelist: [],
      restrictAdminAccess: false,
      requireTwoFactor: false
    };
  });

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // 설정 저장
  const saveSettings = useCallback(() => {
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
    
    // 활동 로그 추가
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const newLog = {
      id: Date.now().toString(),
      userId: profile?.id,
      userName: profile?.name,
      action: 'SECURITY_SETTINGS_UPDATED',
      details: '시스템 보안 설정이 업데이트되었습니다.',
      timestamp: new Date().toISOString(),
      type: 'security'
    };
    activityLogs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
    
    setShowSaveConfirm(false);
    alert('보안 설정이 저장되었습니다.');
  }, [securitySettings, profile]);

  // 기본값으로 초기화
  const resetToDefaults = useCallback(() => {
    const defaultSettings = {
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      sessionTimeout: 120,
      forceLogoutInactive: true,
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiry: 90,
      preventPasswordReuse: 3,
      emailNotifications: true,
      securityAlerts: true,
      loginNotifications: false,
      adminNotifications: true,
      enableAuditLog: true,
      logRetentionDays: 90,
      autoBackup: true,
      backupInterval: 7,
      dataEncryption: true,
      ipWhitelist: [],
      restrictAdminAccess: false,
      requireTwoFactor: false
    };
    
    setSecuritySettings(defaultSettings);
    setShowResetConfirm(false);
  }, []);

  // 설정 업데이트
  const updateSetting = useCallback((key, value) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // 관리자 권한 확인 (모든 hooks 실행 후)
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-6">관리자만 접근할 수 있는 페이지입니다.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 네비게이션 */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                📊 대시보드
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link 
                  to="/admin" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  ⚙️ 관리자
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500">🔒 보안 설정</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">보안 설정</h1>
          <p className="mt-2 text-gray-600">시스템 보안 정책을 설정하고 관리합니다.</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'login'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔑 로그인 보안
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔐 비밀번호 정책
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔔 알림 설정
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🛡️ 시스템 보안
              </button>
              <button
                onClick={() => setActiveTab('access')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'access'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🚫 접근 제어
              </button>
            </nav>
          </div>
        </div>

        {/* 설정 내용 */}
        <div className="bg-white rounded-lg shadow">
          {/* 로그인 보안 설정 */}
          {activeTab === 'login' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">로그인 보안 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 로그인 시도 횟수
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                  />
                  <p className="mt-1 text-sm text-gray-500">3-10회 사이에서 설정하세요.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    계정 잠금 시간 (분)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                  />
                  <p className="mt-1 text-sm text-gray-500">5분-24시간 사이에서 설정하세요.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    세션 타임아웃 (분)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  />
                  <p className="mt-1 text-sm text-gray-500">15분-8시간 사이에서 설정하세요.</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.forceLogoutInactive}
                    onChange={(e) => updateSetting('forceLogoutInactive', e.target.checked)}
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    비활성 사용자 자동 로그아웃
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 비밀번호 정책 */}
          {activeTab === 'password' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">비밀번호 정책 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 비밀번호 길이
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.minPasswordLength}
                    onChange={(e) => updateSetting('minPasswordLength', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 만료 기간 (일)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) => updateSetting('passwordExpiry', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 재사용 방지 개수
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.preventPasswordReuse}
                    onChange={(e) => updateSetting('preventPasswordReuse', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">비밀번호 복잡성 요구사항</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={securitySettings.requireUppercase}
                      onChange={(e) => updateSetting('requireUppercase', e.target.checked)}
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      대문자 포함 필수
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={securitySettings.requireLowercase}
                      onChange={(e) => updateSetting('requireLowercase', e.target.checked)}
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      소문자 포함 필수
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={securitySettings.requireNumbers}
                      onChange={(e) => updateSetting('requireNumbers', e.target.checked)}
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      숫자 포함 필수
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={securitySettings.requireSpecialChars}
                      onChange={(e) => updateSetting('requireSpecialChars', e.target.checked)}
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      특수문자 포함 필수
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 알림 설정 */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">알림 설정</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">이메일 알림</h4>
                    <p className="text-sm text-gray-500">중요한 보안 이벤트를 이메일로 알림</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.emailNotifications}
                    onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">보안 경고</h4>
                    <p className="text-sm text-gray-500">의심스러운 활동 감지 시 즉시 알림</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.securityAlerts}
                    onChange={(e) => updateSetting('securityAlerts', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">로그인 알림</h4>
                    <p className="text-sm text-gray-500">새로운 로그인 시도를 알림</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.loginNotifications}
                    onChange={(e) => updateSetting('loginNotifications', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">관리자 알림</h4>
                    <p className="text-sm text-gray-500">시스템 변경사항을 관리자에게 알림</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.adminNotifications}
                    onChange={(e) => updateSetting('adminNotifications', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 시스템 보안 */}
          {activeTab === 'system' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">시스템 보안 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    로그 보관 기간 (일)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.logRetentionDays}
                    onChange={(e) => updateSetting('logRetentionDays', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자동 백업 주기 (일)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.backupInterval}
                    onChange={(e) => updateSetting('backupInterval', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">활동 로그 수집</h4>
                    <p className="text-sm text-gray-500">모든 시스템 활동을 로그로 기록</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.enableAuditLog}
                    onChange={(e) => updateSetting('enableAuditLog', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">자동 백업</h4>
                    <p className="text-sm text-gray-500">정기적으로 시스템 데이터를 백업</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.autoBackup}
                    onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">데이터 암호화</h4>
                    <p className="text-sm text-gray-500">저장된 데이터를 암호화하여 보호</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.dataEncryption}
                    onChange={(e) => updateSetting('dataEncryption', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 접근 제어 */}
          {activeTab === 'access' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">접근 제어 설정</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">관리자 접근 제한</h4>
                    <p className="text-sm text-gray-500">특정 시간대에만 관리자 접근 허용</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.restrictAdminAccess}
                    onChange={(e) => updateSetting('restrictAdminAccess', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">2단계 인증 필수</h4>
                    <p className="text-sm text-gray-500">모든 사용자에게 2단계 인증 강제</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={securitySettings.requireTwoFactor}
                    onChange={(e) => updateSetting('requireTwoFactor', e.target.checked)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IP 화이트리스트
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="허용할 IP 주소를 한 줄씩 입력하세요&#10;예: 192.168.1.100&#10;예: 10.0.0.0/24"
                    value={securitySettings.ipWhitelist.join('\n')}
                    onChange={(e) => updateSetting('ipWhitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                  />
                  <p className="mt-1 text-sm text-gray-500">비어있으면 모든 IP에서 접근 가능합니다.</p>
                </div>
              </div>
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              기본값 복원
            </button>
            <button
              onClick={() => setShowSaveConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              설정 저장
            </button>
          </div>
        </div>

        {/* 저장 확인 모달 */}
        {showSaveConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">설정 저장</h3>
              <p className="text-sm text-gray-600 mb-6">
                보안 설정을 저장하시겠습니까?<br />
                변경사항이 즉시 적용됩니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 초기화 확인 모달 */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">설정 초기화</h3>
              <p className="text-sm text-gray-600 mb-6">
                모든 보안 설정을 기본값으로 초기화하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettingsPage_v1_2;