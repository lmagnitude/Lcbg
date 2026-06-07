import React, { useState, useEffect } from 'react';
import CombatPhase from './components/CombatPhase';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav
        className="flex justify-between items-center px-7 py-3.5 border-b sticky top-0 z-[100] backdrop-blur-[10px]"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-track)',
        }}
      >
        <span
          className="text-lg font-bold tracking-wider"
          style={{ color: 'var(--color-accent)' }}
        >
          ⚔️ LCB 战斗模拟器
        </span>
        <button
          onClick={toggleTheme}
          title="切换明暗模式"
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl leading-none cursor-pointer transition-all duration-200 hover:rotate-[15deg]"
          style={{ borderColor: 'var(--color-track)' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>
      <CombatPhase />
    </div>
  );
}

export default App;