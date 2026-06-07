import React, { useState, useEffect, useCallback } from 'react';
import CombatPhase from './components/CombatPhase';
import DebugPanel from './components/DebugPanel';
import { defaultPlayer, defaultEnemy } from './data/presets';

function App() {
  const [theme, setTheme] = useState('light');
  const [showDebug, setShowDebug] = useState(false);
  const [debugConfig, setDebugConfig] = useState({
    enabled: false,
    fixedDice: {},
  });
  const [combatState, setCombatState] = useState(null);
  const [playerOverride, setPlayerOverride] = useState(null);
  const [enemyOverride, setEnemyOverride] = useState(null);
  const [debugScene, setDebugScene] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleCombatStateChange = useCallback((state) => {
    setCombatState(state);
  }, []);

  const handleForceScene = (scene) => {
    setDebugScene(scene);
    // 处理场景
    if (scene === 'sanityZero') {
      setPlayerOverride((prev) => ({ ...(prev || {}), sanity: 0 }));
      setEnemyOverride((prev) => ({ ...(prev || {}), sanity: 0 }));
    } else if (scene === 'lowHp') {
      setPlayerOverride((prev) => ({ ...(prev || {}), hp: 1 }));
      setEnemyOverride((prev) => ({ ...(prev || {}), hp: 1 }));
    } else if (scene === 'fullHp') {
      setPlayerOverride((prev) => ({
        ...(prev || {}),
        hp: defaultPlayer.maxHp,
        sanity: defaultPlayer.maxSanity,
      }));
      setEnemyOverride((prev) => ({
        ...(prev || {}),
        hp: defaultEnemy.maxHp,
        sanity: defaultEnemy.maxSanity,
      }));
    }
  };

  const handleLoadSnapshot = (data) => {
    // 只覆盖 HP/混乱和基本状态
    if (data.player) {
      setPlayerOverride({
        hp: data.player.hp,
        sanity: data.player.sanity,
      });
    }
    if (data.enemy) {
      setEnemyOverride({
        hp: data.enemy.hp,
        sanity: data.enemy.sanity,
      });
    }
  };

  const handleDebugSceneClear = () => {
    setDebugScene(null);
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
            title="切换明暗模式"
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
            debugScene={debugScene}
            onDebugSceneClear={handleDebugSceneClear}
          />
        </main>

        {showDebug && (
          <aside
            className="w-[320px] flex-shrink-0 p-4 border-l overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px]"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-track)',
            }}
          >
            <DebugPanel
              debugConfig={debugConfig}
              onConfigChange={setDebugConfig}
              player={combatState?.player || defaultPlayer}
              enemy={combatState?.enemy || defaultEnemy}
              onPlayerUpdate={setPlayerOverride}
              onEnemyUpdate={setEnemyOverride}
              combatState={combatState || {}}
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