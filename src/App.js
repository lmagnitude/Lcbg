import React, { useState, useEffect, useCallback } from 'react';
import CombatPhase from './components/CombatPhase';
import DebugPanel from './components/DebugPanel';

function App() {
  const [theme, setTheme] = useState('light');
  const [showDebug, setShowDebug] = useState(false);
  const [debugConfig, setDebugConfig] = useState({ enabled: false, fixedDice: {} });
  const [combatState, setCombatState] = useState({ combatants: [], speedDice: [], plans: [] });
  const [playerOverride, setPlayerOverride] = useState(null);
  const [enemyOverride, setEnemyOverride] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  const handleCombatStateChange = useCallback((state) => {
    setCombatState(state);
  }, []);

  const handleForceScene = (scene) => {
    if (scene === 'sanityZero') {
      setPlayerOverride({ sanity: 0 });
      setEnemyOverride({ sanity: 0 });
    } else if (scene === 'lowHp') {
      setPlayerOverride({ hp: 1 });
      setEnemyOverride({ hp: 1 });
    } else if (scene === 'fullHp') {
      setPlayerOverride({ hp: 13, sanity: 14 });
      setEnemyOverride({ hp: 13, sanity: 14 });
    }
  };

  const handleLoadSnapshot = (data) => {
    if (data.combatants) {
      const allies = data.combatants.filter((c) => c.side === 'ally');
      const enemies = data.combatants.filter((c) => c.side === 'enemy');
      if (allies.length) setPlayerOverride({ hp: allies[0].hp, sanity: allies[0].sanity });
      if (enemies.length) setEnemyOverride({ hp: enemies[0].hp, sanity: enemies[0].sanity });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav
        className="flex justify-between items-center px-7 py-3.5 border-b sticky top-0 z-[100] backdrop-blur-[10px]"
        style={{ background: 'var(--color-card)', borderColor: 'var(--color-track)' }}
      >
        <span className="text-lg font-bold tracking-wider" style={{ color: 'var(--color-accent)' }}>
          ⚔️ LCB 战斗模拟器
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDebug(!showDebug)}
            title="调试面板"
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg leading-none cursor-pointer transition-all duration-200"
            style={{
              borderColor: showDebug ? 'var(--color-accent)' : 'var(--color-track)',
              color: showDebug ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
          >
            🔧
          </button>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl leading-none cursor-pointer transition-all duration-200 hover:rotate-[15deg]"
            style={{ borderColor: 'var(--color-track)' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        <main className="flex-1">
          <CombatPhase
            debugConfig={debugConfig}
            onCombatStateChange={handleCombatStateChange}
            playerOverride={playerOverride}
            enemyOverride={enemyOverride}
            onPlayerOverrideClear={() => setPlayerOverride(null)}
            onEnemyOverrideClear={() => setEnemyOverride(null)}
          />
        </main>

        {showDebug && (
          <aside
            className="w-[360px] flex-shrink-0 p-4 border-l overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px]"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-track)' }}
          >
            <DebugPanel
              debugConfig={debugConfig}
              onConfigChange={setDebugConfig}
              combatants={combatState.combatants || []}
              speedDice={combatState.speedDice || []}
              plans={combatState.plans || []}
              onPlayerUpdate={setPlayerOverride}
              onEnemyUpdate={setEnemyOverride}
              combatState={combatState}
              onForceScene={handleForceScene}
              onLoadSnapshot={handleLoadSnapshot}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;