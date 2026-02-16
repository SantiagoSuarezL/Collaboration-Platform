import React, { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import Board from './components/Board';
import Login from './components/Login';
import Signup from './components/Signup';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return isLoginView ? (
      <Login onSwitch={() => setIsLoginView(false)} />
    ) : (
      <Signup onSwitch={() => setIsLoginView(true)} />
    );
  }

  return <Board />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

