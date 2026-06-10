import React, { useState } from 'react';

const DebugPanel = ({
  debugConfig,
  onConfigChange,
  combatants,
  speedDice,
  plans,
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
    plans.forEach((plan, idx) => {
      const skill = plan.skill;
      if (!skill) return;
      skill.actions.forEach((action, aIdx) => {
        const key = `p${aIdx}`;
        if (preset === 'max') newDice[idx] = { ...newDice[idx], [key]: action.max };
        else if (preset === 'min') newDice[idx] = { ...newDice[idx], [key]: action.min };
        else if (preset === 'tie') newDice[idx] = { ...newDice[idx], [key]: Math.floor((action.min + action.max) / 2) };
      });
      // add enemy dice mirror
      const oppPlan = plans.find((p) => p.ownerId !== plan.ownerId);
      if (oppPlan?.skill) {
        oppPlan.skill.actions.forEach((action, aIdx) => {
          const key = `e${aIdx}`;
          if (preset === 'max') newDice[idx] = { ...newDice[idx], [key]: action.max };
          else if (preset === 'min') newDice[idx] = { ...newDice[idx], [key]: action.min };
          else if (preset === 'tie') newDice[idx] = { ...newDice[idx], [key]: Math.floor((action.min + action.max) / 2) };
        });
      }
    });
    onConfigChange({ ...debugConfig, fixedDice: newDice, enabled: true });
  };

  const updateDice = (planIndex, side, aIdx, value) => {
    const newDice = { ...debugConfig.fixedDice };
    if (!newDice[planIndex]) newDice[planIndex] = {};
    newDice[planIndex] = { ...newDice[planIndex], [`${side}${aIdx}`]: parseInt(value) || 0 };
    onConfigChange({ ...debugConfig, fixedDice: newDice });
  };

  const handleForceAll = () => {
    onPlayerUpdate({
      hp: debugConfig.forceAllyHp ?? 13,
      sanity: debugConfig.forceAllySanity ?? 14,
    });
    onEnemyUpdate({
      hp: debugConfig.forceEnemyHp ?? 13,
      sanity: debugConfig.forceEnemySanity ?? 14,
    });
  };

  const updateForceValue = (field, value) => {
    onConfigChange({ ...debugConfig, [field]: value === '' ? null : parseInt(value) || 0 });
  };

  const handleCopySnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(combatState, null, 2)).then(() => {
      alert('状态快照已复制到剪贴板');
    });
  };

  const handleLoadSnapshot = () => {
    try {
      const data = JSON.parse(snapshotInput);
      onLoadSnapshot?.(data);
      setSnapshotInput('');
    } catch {
      alert('JSON 解析失败');
    }
  };

  const allies = combatants.filter((c) => c.side === 'ally');
  const enemies = combatants.filter((c) => c.side === 'enemy');

  // Build dice rows from plans
  const diceInputRows = plans.map((plan, idx) => {
    const owner = combatants.find((c) => c.id === plan.ownerId);
    const skillName = plan.skill?.name || '(未选)';
    return { idx, ownerName: owner?.name || '?', skillName, plan };
  });

  return (
    <div
      className="p-4 rounded-xl text-sm max-h-[70vh] overflow-y-auto"
      style={{ background: 'var(--color-card)', color: 'var(--color-text)', border: '1px solid var(--color-track)' }}
    >
      <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-accent)' }}>🔧 调试面板</h3>

      {/* Dice control */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>🎲 骰子控制 ({plans.length}个骰子)</h4>
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={debugConfig.enabled} onChange={toggleEnabled} />
          <span>启用固定骰值</span>
        </label>

        {diceInputRows.map(({ idx, ownerName, skillName, plan }) => (
          <div key={idx} className="mb-2">
            <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              [{idx}] {ownerName} — {skillName}
            </div>
            {plan.skill?.actions.map((action, aIdx) => (
              <div key={aIdx} className="flex items-center gap-1.5 ml-2 mb-1">
                <span className="text-xs w-6" style={{ color: 'var(--color-text-secondary)' }}>#{aIdx}</span>
                <span className="text-xs w-8">P</span>
                <input
                  type="number"
                  className="w-12 px-1 py-0.5 rounded text-xs border"
                  style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
                  value={debugConfig.fixedDice[idx]?.[`p${aIdx}`] ?? ''}
                  onChange={(e) => updateDice(idx, 'p', aIdx, e.target.value)}
                  disabled={!debugConfig.enabled}
                />
                <span className="text-xs w-8">E</span>
                <input
                  type="number"
                  className="w-12 px-1 py-0.5 rounded text-xs border"
                  style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
                  value={debugConfig.fixedDice[idx]?.[`e${aIdx}`] ?? ''}
                  onChange={(e) => updateDice(idx, 'e', aIdx, e.target.value)}
                  disabled={!debugConfig.enabled}
                />
              </div>
            ))}
          </div>
        ))}

        <div className="flex gap-1.5 mt-2 flex-wrap">
          <button className="text-xs px-2 py-1 rounded border-none cursor-pointer" style={{ background: 'var(--color-track)', color: 'var(--color-text)' }} onClick={() => setDicePreset('max')}>全最大</button>
          <button className="text-xs px-2 py-1 rounded border-none cursor-pointer" style={{ background: 'var(--color-track)', color: 'var(--color-text)' }} onClick={() => setDicePreset('min')}>全最小</button>
          <button className="text-xs px-2 py-1 rounded border-none cursor-pointer" style={{ background: 'var(--color-track)', color: 'var(--color-text)' }} onClick={() => setDicePreset('tie')}>强制平局</button>
        </div>
      </section>

      {/* Hot edit */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>✏️ 数值热编辑</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>盟友 ({allies.length}人)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs w-4">HP</span>
              <input type="number" className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
                value={debugConfig.forceAllyHp ?? ''} onChange={(e) => updateForceValue('forceAllyHp', e.target.value)} placeholder="13" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs w-4">混</span>
              <input type="number" className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
                value={debugConfig.forceAllySanity ?? ''} onChange={(e) => updateForceValue('forceAllySanity', e.target.value)} placeholder="14" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>敌人 ({enemies.length}人)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs w-4">HP</span>
              <input type="number" className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
                value={debugConfig.forceEnemyHp ?? ''} onChange={(e) => updateForceValue('forceEnemyHp', e.target.value)} placeholder="13" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs w-4">混</span>
              <input type="number" className="flex-1 w-12 px-1 py-0.5 rounded text-xs border"
                style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
                value={debugConfig.forceEnemySanity ?? ''} onChange={(e) => updateForceValue('forceEnemySanity', e.target.value)} placeholder="14" />
            </div>
          </div>
        </div>
        <button className="w-full text-xs py-1.5 rounded border-none cursor-pointer" style={{ background: 'var(--color-accent)', color: '#fff' }} onClick={handleForceAll}>应用修改</button>
      </section>

      {/* Scenes */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>🧪 一键场景</h4>
        <div className="flex flex-wrap gap-1.5">
          <button className="text-xs px-2.5 py-1.5 rounded border-none cursor-pointer" style={{ background: '#9b59b6', color: '#fff' }} onClick={() => onForceScene('sanityZero')}>混乱归零</button>
          <button className="text-xs px-2.5 py-1.5 rounded border-none cursor-pointer" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => onForceScene('lowHp')}>丝血状态</button>
          <button className="text-xs px-2.5 py-1.5 rounded border-none cursor-pointer" style={{ background: '#2ecc71', color: '#fff' }} onClick={() => onForceScene('fullHp')}>双方满血</button>
        </div>
      </section>

      {/* Snapshot */}
      <section className="mb-4">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>📋 状态快照</h4>
        <button className="w-full text-xs py-1.5 rounded border-none cursor-pointer mb-2" style={{ background: 'var(--color-track)', color: 'var(--color-text)' }} onClick={handleCopySnapshot}>📋 复制状态 JSON</button>
        <textarea className="w-full h-16 text-xs p-1.5 rounded border resize-none mb-1"
          style={{ background: 'var(--color-track)', color: 'var(--color-text)', borderColor: 'var(--color-track)' }}
          value={snapshotInput} onChange={(e) => setSnapshotInput(e.target.value)} placeholder="粘贴状态 JSON..." />
        <button className="w-full text-xs py-1.5 rounded border-none cursor-pointer" style={{ background: 'var(--color-track)', color: 'var(--color-text)' }} onClick={handleLoadSnapshot}>📥 加载快照</button>
      </section>

      {/* State JSON */}
      <section>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>📊 实时状态</h4>
        <pre className="text-[11px] p-2 rounded overflow-x-auto max-h-48" style={{ background: 'var(--color-track)', color: 'var(--color-text)' }}>
          {JSON.stringify({ phase: combatState.phase, round: combatState.round, combatantCount: combatState.combatants?.length, plans: combatState.plans?.length, speedDiceCount: combatState.speedDice?.length }, null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default DebugPanel;