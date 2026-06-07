import React from 'react';
import { actionTypeLabel } from '../data/presets';

function ClashDisplay({ playerAction, enemyAction, playerRoll, enemyRoll, result, isActive }) {
  if (!playerAction || !enemyAction) return null;

  const playerIsAttack = playerAction.type === 'attack';
  const enemyIsAttack = enemyAction.type === 'attack';

  // 确定进攻方和防守方
  let attackerLabel, defenderLabel, attackRoll, defenseRoll, attackType, defenseType;

  if (enemyIsAttack && !playerIsAttack) {
    attackerLabel = '深潜者';
    defenderLabel = '调查员';
    attackRoll = enemyRoll;
    defenseRoll = playerRoll;
    attackType = enemyAction.type;
    defenseType = playerAction.type;
  } else if (playerIsAttack && !enemyIsAttack) {
    attackerLabel = '调查员';
    defenderLabel = '深潜者';
    attackRoll = playerRoll;
    defenseRoll = enemyRoll;
    attackType = playerAction.type;
    defenseType = enemyAction.type;
  } else {
    // 双方都是攻击或都是防御
    return (
      <div
        className="rounded-xl p-[14px_18px] mb-2.5 border-l-4 border-transparent transition-all duration-300"
        style={{
          background: 'var(--color-card)',
          borderLeftColor: isActive ? 'var(--color-accent)' : 'transparent',
          opacity: isActive ? 1 : 0.7,
          animation: isActive ? 'revealIn 0.4s ease' : 'none',
        }}
      >
        <div style={{ color: 'var(--color-text)' }}>
          <span>双方均为攻击动作</span>
          <div className="flex gap-4 text-sm my-1" style={{ color: 'var(--color-text-secondary)' }}>
            <span>调查员: {playerRoll}</span>
            <span>深潜者: {enemyRoll}</span>
          </div>
          {result && (
            <div className="mt-1.5">
              {result.pHit && (
                <span className="block text-sm font-semibold mt-1" style={{ color: '#e74c3c' }}>
                  调查员命中！深潜者受 {result.pDmg} 伤害
                </span>
              )}
              {result.eHit && (
                <span className="block text-sm font-semibold mt-1" style={{ color: '#e74c3c' }}>
                  深潜者命中！调查员受 {result.eDmg} 伤害
                </span>
              )}
              {!result.pHit && !result.eHit && (
                <span className="block text-sm font-semibold mt-1" style={{ color: '#f39c12' }}>
                  双方平局，均不受伤害
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const hit = result ? result.hit : null;
  const damage = result ? result.dmg : null;
  const evadeRecovery = result ? result.evadeRecovery : null;

  const typeColors = {
    attack: { bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
    defense: { bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
    evade: { bg: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' },
  };

  return (
    <div
      className="rounded-xl p-[14px_18px] mb-2.5 border-l-4 border-transparent transition-all duration-300"
      style={{
        background: 'var(--color-card)',
        borderLeftColor: isActive ? 'var(--color-accent)' : 'transparent',
        opacity: isActive ? 1 : 0.7,
        animation: isActive ? 'revealIn 0.4s ease' : 'none',
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-md"
          style={{ background: typeColors[attackType].bg, color: typeColors[attackType].color }}
        >
          {attackerLabel} {actionTypeLabel[attackType]}
        </span>
        <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>
          VS
        </span>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-md"
          style={{ background: typeColors[defenseType].bg, color: typeColors[defenseType].color }}
        >
          {defenderLabel} {actionTypeLabel[defenseType]}
        </span>
      </div>

      <div className="flex gap-4 text-sm mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
        <span>
          {actionTypeLabel[attackType]}骰: <strong style={{ color: 'var(--color-text)' }}>{attackRoll}</strong>
        </span>
        <span>
          {actionTypeLabel[defenseType]}骰: <strong style={{ color: 'var(--color-text)' }}>{defenseRoll}</strong>
        </span>
      </div>

      {result && (
        <div className="mt-1.5 text-sm font-semibold">
          {hit && (
            <span style={{ color: '#e74c3c' }}>
              {attackerLabel}命中！造成 {damage} 点伤害
            </span>
          )}
          {!hit && defenseType !== 'evade' && (
            <span style={{ color: '#3498db' }}>防御成功，无伤害</span>
          )}
          {!hit && defenseType === 'evade' && (
            <span style={{ color: '#2ecc71' }}>
              闪避成功！{defenderLabel}回复 {evadeRecovery} 混乱值
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ClashDisplay;