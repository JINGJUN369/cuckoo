// 간단한 테스트 앱 - 흰 화면 문제 디버깅용
import React from 'react';

function TestApp() {
  console.log('🧪 TestApp rendering...');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ React 앱이 정상 작동합니다!</h1>
      <p>이 화면이 보인다면 기본 React 설정은 문제없습니다.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>디버깅 정보:</h2>
        <ul>
          <li>현재 시간: {new Date().toLocaleString('ko-KR')}</li>
          <li>브라우저: {navigator.userAgent}</li>
          <li>React 버전: {React.version}</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h3>다음 단계:</h3>
        <p>이 화면이 보인다면 원래 App.jsx로 돌아가서 세부 에러를 확인해야 합니다.</p>
      </div>
    </div>
  );
}

export default TestApp;