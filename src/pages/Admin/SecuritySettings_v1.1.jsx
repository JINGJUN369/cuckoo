import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth_v1.1';
import { PermissionGuard } from '../../components/ui/PermissionGuard_v1.1';

const SecuritySettings_v11 = () => {
  const { user, logActivity } = useAuth();
  const [settings, setSettings] = useState({
    // 비밀번호 정책
    passwordPolicy: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      maxAge: 0, // 0 = 무제한
      historyCount: 3,
      preventReuse: true
    },
    // 세션 관리
    sessionManagement: {
      maxSessionTime: 8, // 시간
      idleTimeout: 2, // 시간
      maxConcurrentSessions: 3,
      forceLogoutOnPolicyChange: false
    },
    // 계정 보안
    accountSecurity: {
      maxLoginAttempts: 5,
      lockoutDuration: 30, // 분
      autoUnlock: true,
      requireEmailVerification: false,
      twoFactorAuth: false
    },
    // 데이터 보안
    dataSecurity: {
      enableAuditLogging: true,
      logRetentionDays: 90,
      enableDataEncryption: false,
      backupFrequency: 'daily', // daily, weekly, monthly
      autoBackup: true
    },
    // 접근 제어
    accessControl: {
      ipWhitelist: [],
      restrictedHours: {
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
        restrictedDays: [] // 0-6 (일-토)
      },
      deviceRestriction: {
        enabled: false,
        allowedDevices: []
      }
    }
  });

  const [originalSettings, setOriginalSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('password');

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  useEffect(() => {
    if (originalSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  const loadSecuritySettings = () => {
    try {
      const savedSettings = localStorage.getItem('securitySettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setOriginalSettings(parsed);
      } else {
        setOriginalSettings(settings);
      }
    } catch (error) {
      console.error('Security settings loading error:', error);
      setOriginalSettings(settings);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (category, parentKey, childKey, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parentKey]: {
          ...prev[category][parentKey],
          [childKey]: value
        }
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // 설정 유효성 검증
      const validationErrors = validateSettings(settings);
      if (validationErrors.length > 0) {
        alert('설정 오류:\n' + validationErrors.join('\n'));
        return;
      }

      // 설정 저장
      localStorage.setItem('securitySettings', JSON.stringify(settings));
      setOriginalSettings(settings);
      
      // 로그 기록
      logActivity('SECURITY_SETTINGS_UPDATED', '보안 설정이 업데이트됨');

      // 세션 정책 변경시 강제 로그아웃 처리
      if (settings.sessionManagement.forceLogoutOnPolicyChange) {
        if (window.confirm('세션 정책이 변경되었습니다. 모든 사용자를 로그아웃시키겠습니까?')) {
          // 현재 사용자 외 모든 세션 무효화
          localStorage.removeItem('currentUser');
          window.location.reload();
        }
      }

      alert('보안 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Settings save error:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const validateSettings = (settings) => {
    const errors = [];
    
    // 비밀번호 정책 검증
    if (settings.passwordPolicy.minLength < 4) {
      errors.push('비밀번호 최소 길이는 4자 이상이어야 합니다.');
    }
    
    if (settings.passwordPolicy.maxAge < 0) {
      errors.push('비밀번호 유효기간은 0 이상이어야 합니다.');
    }

    // 세션 관리 검증
    if (settings.sessionManagement.maxSessionTime < 1 || settings.sessionManagement.maxSessionTime > 24) {
      errors.push('최대 세션 시간은 1-24시간 범위여야 합니다.');
    }
    
    if (settings.sessionManagement.idleTimeout < 0.5 || settings.sessionManagement.idleTimeout > 8) {
      errors.push('유휴 시간 제한은 0.5-8시간 범위여야 합니다.');
    }

    // 계정 보안 검증
    if (settings.accountSecurity.maxLoginAttempts < 3 || settings.accountSecurity.maxLoginAttempts > 20) {
      errors.push('최대 로그인 시도 횟수는 3-20회 범위여야 합니다.');
    }
    
    if (settings.accountSecurity.lockoutDuration < 5 || settings.accountSecurity.lockoutDuration > 1440) {
      errors.push('계정 잠금 시간은 5분-24시간 범위여야 합니다.');
    }

    return errors;
  };

  const resetToDefaults = () => {
    if (window.confirm('모든 보안 설정을 기본값으로 초기화하시겠습니까?')) {
      const defaultSettings = {
        passwordPolicy: {
          minLength: 6,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          maxAge: 0,
          historyCount: 3,
          preventReuse: true
        },
        sessionManagement: {
          maxSessionTime: 8,
          idleTimeout: 2,
          maxConcurrentSessions: 3,
          forceLogoutOnPolicyChange: false
        },
        accountSecurity: {
          maxLoginAttempts: 5,
          lockoutDuration: 30,
          autoUnlock: true,
          requireEmailVerification: false,
          twoFactorAuth: false
        },
        dataSecurity: {
          enableAuditLogging: true,
          logRetentionDays: 90,
          enableDataEncryption: false,
          backupFrequency: 'daily',
          autoBackup: true
        },
        accessControl: {
          ipWhitelist: [],
          restrictedHours: {
            enabled: false,
            startTime: '09:00',
            endTime: '18:00',
            restrictedDays: []
          },
          deviceRestriction: {
            enabled: false,
            allowedDevices: []
          }
        }
      };
      
      setSettings(defaultSettings);
      logActivity('SECURITY_SETTINGS_RESET', '보안 설정이 기본값으로 초기화됨');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_settings_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    logActivity('SECURITY_SETTINGS_EXPORTED', '보안 설정이 내보내짐');
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        
        // 기본 구조 검증
        const requiredKeys = ['passwordPolicy', 'sessionManagement', 'accountSecurity', 'dataSecurity', 'accessControl'];
        const hasAllKeys = requiredKeys.every(key => importedSettings.hasOwnProperty(key));
        
        if (!hasAllKeys) {
          alert('올바르지 않은 설정 파일입니다.');
          return;
        }
        
        if (window.confirm('현재 설정을 가져온 설정으로 덮어쓰시겠습니까?')) {
          setSettings(importedSettings);
          logActivity('SECURITY_SETTINGS_IMPORTED', '보안 설정을 가져옴');
        }
      } catch (error) {
        alert('설정 파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'password', name: '비밀번호 정책', icon: '🔒' },
    { id: 'session', name: '세션 관리', icon: '⏰' },
    { id: 'account', name: '계정 보안', icon: '🛡️' },
    { id: 'data', name: '데이터 보안', icon: '📊' },
    { id: 'access', name: '접근 제어', icon: '🚪' }
  ];

  return (
    <PermissionGuard permission="admin:security" fallback={
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-lg font-medium text-red-600 mb-2">보안 설정 접근 권한이 없습니다</h3>
        <p className="text-gray-600">이 기능은 최고 관리자만 사용할 수 있습니다.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">🔐</span>
                보안 설정 & 정책 관리
              </h1>
              <p className="text-gray-600 mt-1">시스템 보안 정책 및 설정 관리</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
                id="import-settings"
              />
              <label
                htmlFor="import-settings"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                📥 가져오기
              </label>
              <button
                onClick={exportSettings}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                📤 내보내기
              </button>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
              >
                🔄 초기화
              </button>
            </div>
          </div>

          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-800">변경된 설정이 있습니다. 저장하시겠습니까?</span>
                </div>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '💾 저장'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 비밀번호 정책 */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">비밀번호 정책</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최소 길이
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="20"
                      value={settings.passwordPolicy.minLength}
                      onChange={(e) => handleSettingChange('passwordPolicy', 'minLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      히스토리 개수 (재사용 방지)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={settings.passwordPolicy.historyCount}
                      onChange={(e) => handleSettingChange('passwordPolicy', 'historyCount', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      유효기간 (일, 0=무제한)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.passwordPolicy.maxAge}
                      onChange={(e) => handleSettingChange('passwordPolicy', 'maxAge', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-900">복잡성 요구사항</h4>
                  
                  {[
                    { key: 'requireUppercase', label: '대문자 포함 필수' },
                    { key: 'requireLowercase', label: '소문자 포함 필수' },
                    { key: 'requireNumbers', label: '숫자 포함 필수' },
                    { key: 'requireSpecialChars', label: '특수문자 포함 필수' },
                    { key: 'preventReuse', label: '이전 비밀번호 재사용 방지' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy[item.key]}
                        onChange={(e) => handleSettingChange('passwordPolicy', item.key, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 세션 관리 */}
            {activeTab === 'session' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">세션 관리</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최대 세션 시간 (시간)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={settings.sessionManagement.maxSessionTime}
                      onChange={(e) => handleSettingChange('sessionManagement', 'maxSessionTime', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      유휴 시간 제한 (시간)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="8"
                      step="0.5"
                      value={settings.sessionManagement.idleTimeout}
                      onChange={(e) => handleSettingChange('sessionManagement', 'idleTimeout', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최대 동시 세션 수
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.sessionManagement.maxConcurrentSessions}
                      onChange={(e) => handleSettingChange('sessionManagement', 'maxConcurrentSessions', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.sessionManagement.forceLogoutOnPolicyChange}
                      onChange={(e) => handleSettingChange('sessionManagement', 'forceLogoutOnPolicyChange', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">정책 변경 시 강제 로그아웃</span>
                  </label>
                </div>
              </div>
            )}

            {/* 계정 보안 */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">계정 보안</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최대 로그인 시도 횟수
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={settings.accountSecurity.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('accountSecurity', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계정 잠금 시간 (분)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.accountSecurity.lockoutDuration}
                      onChange={(e) => handleSettingChange('accountSecurity', 'lockoutDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'autoUnlock', label: '자동 계정 잠금 해제' },
                    { key: 'requireEmailVerification', label: '이메일 인증 필수' },
                    { key: 'twoFactorAuth', label: '2단계 인증 활성화' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.accountSecurity[item.key]}
                        onChange={(e) => handleSettingChange('accountSecurity', item.key, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 데이터 보안 */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">데이터 보안</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      로그 보관 기간 (일)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.dataSecurity.logRetentionDays}
                      onChange={(e) => handleSettingChange('dataSecurity', 'logRetentionDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      백업 주기
                    </label>
                    <select
                      value={settings.dataSecurity.backupFrequency}
                      onChange={(e) => handleSettingChange('dataSecurity', 'backupFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'enableAuditLogging', label: '감사 로깅 활성화' },
                    { key: 'enableDataEncryption', label: '데이터 암호화 활성화' },
                    { key: 'autoBackup', label: '자동 백업 활성화' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.dataSecurity[item.key]}
                        onChange={(e) => handleSettingChange('dataSecurity', item.key, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 접근 제어 */}
            {activeTab === 'access' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">접근 제어</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">시간 제한</h4>
                    <label className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={settings.accessControl.restrictedHours.enabled}
                        onChange={(e) => handleNestedSettingChange('accessControl', 'restrictedHours', 'enabled', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">접근 시간 제한 활성화</span>
                    </label>
                    
                    {settings.accessControl.restrictedHours.enabled && (
                      <div className="grid grid-cols-2 gap-4 pl-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                          <input
                            type="time"
                            value={settings.accessControl.restrictedHours.startTime}
                            onChange={(e) => handleNestedSettingChange('accessControl', 'restrictedHours', 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                          <input
                            type="time"
                            value={settings.accessControl.restrictedHours.endTime}
                            onChange={(e) => handleNestedSettingChange('accessControl', 'restrictedHours', 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">기기 제한</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.accessControl.deviceRestriction.enabled}
                        onChange={(e) => handleNestedSettingChange('accessControl', 'deviceRestriction', 'enabled', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">기기 제한 활성화</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 (하단 고정) */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">변경사항이 있습니다</span>
              <button
                onClick={() => {
                  setSettings(originalSettings);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '💾 저장'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default SecuritySettings_v11;