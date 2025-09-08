// 단순화된 App - 단계별 테스트용
import React from 'react';

/**
 * 단순화된 App 컴포넌트
 * 복잡한 의존성을 제거하고 기본 구조만 테스트
 */
function App_simple() {
  console.log('🚀 [Simple] App starting...');
  
  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1 style={{ color: 'blue' }}>🚀 Simple App 작동 중</h1>
      <p>이 화면이 보인다면 기본 App 구조는 문제없습니다.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>다음 테스트 단계:</h2>
        <ul>
          <li>✅ 기본 React 컴포넌트</li>
          <li>🔄 복잡한 import들 추가 테스트</li>
          <li>🔄 Router 추가 테스트</li>
          <li>🔄 Supabase 라이브러리 테스트</li>
        </ul>
      </div>

      <button 
        onClick={() => console.log('버튼 클릭됨')}
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        테스트 버튼
      </button>
    </div>
  );
}

export default App_simple;