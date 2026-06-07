import React, { useState, useEffect } from 'react';
import CombatPhase from './components/CombatPhase';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App">
      <nav className="navbar">
        <span className="navbar__title">⚔️ LCB 战斗模拟器</span>
        <button className="navbar__theme-toggle" onClick={toggleTheme} title="切换明暗模式">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>
      <CombatPhase />
    </div>
  );
}

export default App;