import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import { fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Could not contact gateway:', err));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} health={health} />
      <main style={{ flex: 1 }}>
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'models' && <Models />}
      </main>
    </div>
  );
}
