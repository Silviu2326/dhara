import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (user) {
    return <HomeScreen user={user} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={handleLogin} />;
}
