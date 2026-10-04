import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Chat from './pages/Chat';
import ThresholdTuning from './pages/ThresholdTuning';
import BenchmarkView from './pages/BenchmarkView';
import Landing from './pages/Landing';
import { fetchHealth } from './services/api';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'app'
  const [activeTab, setActiveTab] = useState('chat');
  const [health, setHealth] = useState(null);

  const checkHealth = () => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Could not contact gateway:', err));
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  if (view === 'landing') {
    return (
      <Landing
        onEnterApp={(targetTab = 'chat') => {
          setView('app');
          if (targetTab && targetTab !== 'dashboard') setActiveTab(targetTab);
          else setActiveTab('chat');
        }}
        health={health}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onReturnToLanding={() => setView('landing')}
      />
      <main style={{ flex: 1 }}>
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'tuning' && <ThresholdTuning />}
        {activeTab === 'benchmark' && <BenchmarkView />}
      </main>
    </div>
  );
}
