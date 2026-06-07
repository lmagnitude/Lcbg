import React, { useState, useCallback } from 'react';

const DebugPanel = ({
  debugConfig,
  onConfigChange,
  player,
  enemy,
  onPlayerUpdate,
  onEnemyUpdate,
  combatState,
  onForceScene,
  onLoadSnapshot,
}) => {
  const [snapshotInput, setSnapshotInput] = useState('');

  const toggleEnabled = () => {
    onConfigChange({ ...debugConfig, enabled: !debugConfig.enabled });
  };

  const setDicePreset = (preset) => {
    const newDice = { ...debugConfig.fixedDice };
    if (preset === 'max') {
      newDice[0] = { p: 6, e: 4 };
      newDice[1] = { p: 6, e: 3 };
    } else if (preset === 'min') {
      newDice[0] = { p: 1, e: 1 };
      newDice[1] = { p: 1, e: 1 };
    } else if (preset === 'tie') {
      newDice[0] = { p: 3, e: 3 };
      newDice[1] = { p: 3, e: 3 };
    }
    onConfigChange({ ...debugConfig, fixedDice: newDice, enabled: true });
  };

  const updateDice = (index, side, value) => {
    const newDice = { ...debugConfig.fixedDice };
    if (!newDice[index]) newDice[index] = {};
    newDice[index] = { ...newDice[index], [side]: parseInt(value) || 0 };
    onConfigChange({ ...debugConfig, fixedDice: newDice });
  };

  const handleForceHP = () => {
    const newPlayer = {
      ...player,
      hp: debugConfig.forcePlayerHp ?? player.hp,
      sanity: debugConfig.forcePlayerSanity ?? player.sanity,
    };
    const newEnemy = {
      ...enemy,
      hp: debugConfig.forceEnemyHp ?? enemy.hp,
      sanity: debugConfig.forceEnemySanity ?? enemy.sanity,
    };
    onPlayerUpdate(newPlayer);
    onEnemyUpdate(newEnemy);
  };

  const updateForceValue = (field, value) => {
    onConfigChange({ ...debugConfig, [field]: value === '' ? null : parseInt(value) || 0 });
  };

  const handleCopySnapshot = () => {
    const snapshot = JSON.stringify(combatState, null, 2);
    navigator.clipboard.writeText(snapshot).then(() => {
      alert('状态快照已复制到剪贴板');
    });
  };

  const handleLoadSnapshot = () => {
    try {
      const data = JSON.parse(snapshotInput);
      if (onLoadSnapshot) onLoadSnapshot(data);
      setSnapshotInput('');
    } catch (e) {
      alert('JSON 解析失败，请检查格式');
    }
  };

  return (
    <div
      className="p-4 rounded-xl text-sm max-h-[70vh] overflow-y-auto"
      style={{
        background: 'var(--color-card)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-track)',
      }}
    >
      <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-accent)' }}>
        🔧 调试面板
      </h3>

      {/* 骰子控制 */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          🎲 骰子控制
        </h4>
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={debugConfig.enabled} onChange={toggleEnabled} />
          <span>启用固定骰值</span>
        </label>

        {['第1段', '第2段'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1.5">
            <span className="w-10 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {label}
            </span>
            <span className="text-xs">玩家</span>
            <input
              type="number"
              className="w-14 px-1.5 py-0.5 rounded text-sm border"
              style={{
                background: 'var(--color-track)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-track)',
              }}
              value={debugConfig.fixedDice[idx]?.p ?? ''}
              onChange={(e) => updateDice(idx, 'p', e.target.value)}
              disabled={!debugConfig.enabled}
              min={0}
            />
            <span className="text-xs">敌人</span>
            <input
              type="number"
              className="w-14 px-1.5 py-0.5 rounded text-sm border"
              style={{
                background: 'var(--color-track)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-track)',
              }}
              value={debugConfig.fixedDice[idx]?.e ?? ''}
              onChange={(e) => updateDice(idx, 'e', e.target.value)}
              disabled={!debugConfig.enabled}
              min={0}
            />
          </div>
        ))}

        <div className="flex gap-1.5 mt-2">
          <button
            className="text-xs px-2 py-1 rounded border-none cursor-pointer"
            style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}
            onClick={() => setDicePreset('max')}
          >
            全最大
          </button>
          <button
            className="text-xs px-2 py-1 rounded border-none cursor-pointer"
            style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}
            onClick={() => setDicePreset('min')}
          >
            全最小
          </button>
          <button
            className="text-xs px-2 py-1 rounded border-none cursor-pointer"
            style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}
            onClick={() => setDicePreset('tie')}
          >
            强制平局
          </button>
        </div>
      </section>

      {/* 数值热编辑 */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          ✏️ 数值热编辑
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>调查员</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">HP</span>
              <input
                type="number"
                className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{
                  background: 'var(--color-track)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-track)',
                }}
                value={debugConfig.forcePlayerHp ?? ''}
                onChange={(e) => updateForceValue('forcePlayerHp', e.target.value)}
                placeholder={player.hp}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">混乱</span>
              <input
                type="number"
                className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{
                  background: 'var(--color-track)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-track)',
                }}
                value={debugConfig.forcePlayerSanity ?? ''}
                onChange={(e) => updateForceValue('forcePlayerSanity', e.target.value)}
                placeholder={player.sanity}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>深潜者</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">HP</span>
              <input
                type="number"
                className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{
                  background: 'var(--color-track)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-track)',
                }}
                value={debugConfig.forceEnemyHp ?? ''}
                onChange={(e) => updateForceValue('forceEnemyHp', e.target.value)}
                placeholder={enemy.hp}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">混乱</span>
              <input
                type="number"
                className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{
                  background: 'var(--color-track)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-track)',
                }}
                value={debugConfig.forceEnemySanity ?? ''}
                onChange={(e) => updateForceValue('forceEnemySanity', e.target.value)}
                placeholder={enemy.sanity}
              />
            </div>
          </div>
        </div>
        <button
          className="w-full text-xs py-1.5 rounded border-none cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
          onClick={handleForceHP}
        >
          应用修改
        </button>
      </section>

      {/* 一键场景 */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          🧪 一键场景
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            className="text-xs px-2.5 py-1.5 rounded border-none cursor-pointer"
            style={{ background: '#9b59b6', color: '#fff' }}
            onClick={() => onForceScene('sanityZero')}
          >
            混乱归零
          </button>
          <button
            className="text-xs px-2.5 py-1.5 rounded border-none cursor-pointer"
            style={{ background: '#e74c3c', color: '#fff' }}
            onClick={() => onForceScene('lowHp')}
          >
            丝血状态
          </button>
          <button
            className="text-xs px-2.5 py-1.5 rounded border-none cursor-pointer"
            style={{ background: '#2ecc71', color: '#fff' }}
            onClick={() => onForceScene('fullHp')}
          >
            双方满血
          </button>
        </div>
      </section>

      {/* 状态快照 */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          📋 状态快照
        </h4>
        <button
          className="w-full text-xs py-1.5 rounded border-none cursor-pointer mb-2"
          style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}
          onClick={handleCopySnapshot}
        >
          📋 复制状态 JSON
        </button>
        <textarea
          className="w-full h-16 text-xs p-1.5 rounded border resize-none mb-1"
          style={{
            background: 'var(--color-track)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-track)',
          }}
          value={snapshotInput}
          onChange={(e) => setSnapshotInput(e.target.value)}
          placeholder="粘贴状态 JSON 后点击加载..."
        />
        <button
          className="w-full text-xs py-1.5 rounded border-none cursor-pointer"
          style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}
          onClick={handleLoadSnapshot}
        >
          📥 加载快照
        </button>
      </section>

      {/* 实时状态 */}
      <section>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          📊 实时状态
        </h4>
        <pre
          className="text-[11px] p-2 rounded overflow-x-auto max-h-48"
          style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}
        >
          {JSON.stringify(combatState, null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default DebugPanel;