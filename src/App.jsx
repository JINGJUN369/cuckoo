import React from 'react';
import AuthenticatedApp_v11 from './AuthenticatedApp_v1.1';
import { ToastProvider } from './components/ui/Toast';

/**
 * v1.1 App - 새로운 아키텍처 적용
 */
function App() {
  console.log('🏁 [v1.1] App component starting...');
  
  return (
    <ToastProvider>
      <div className="App" data-version="v1.1">
        <AuthenticatedApp_v11 />
      </div>
    </ToastProvider>
  );
}

export default App;