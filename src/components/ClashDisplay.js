import React from 'react';
import { actionTypeLabel } from '../data/presets';

const typeColors = {
  attack: { bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
  defense: { bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
  evade: { bg: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' },
};

function SingleClash({ pAction, eAction, pRoll, eRoll, result }) {
  if (!pAction || !eAction) return null;

  const oIsAttack = pAction.type === 'attack';
  const eIsAttack = eAction.type === 'attack';

  // mutual attack
  if (oIsAttack && eIsAttack) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
        <span style={{ color: typeColors.attack.color }}>攻{pRoll}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>vs</span>
        <span style={{ color: typeColors.attack.color }}>攻{eRoll}</span>
        {result && (
          <span className="font-semibold" style={{ color: result.tie ? '#f39c12' : '#e74c3c' }}>
            {result.tie ? '→ 平局' : result.oWins ? `→ 胜 ${result.dmg}伤害` : `→ 败 ${result.dmg}伤害`}
          </span>
        )}
      </div>
    );
  }

  // determine attacker / defender
  const attackerRoll = eIsAttack ? eRoll : pRoll;
  const defenderRoll = eIsAttack ? pRoll : eRoll;
  const aType = eIsAttack ? eAction.type : pAction.type;
  const dType = eIsAttack ? pAction.type : eAction.type;

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'var(--color-text)' }}>
      <span
        className="px-1.5 py-0.5 rounded text-xs font-semibold"
        style={{ background: typeColors[aType].bg, color: typeColors[aType].color }}
      >
        {actionTypeLabel[aType]} {attackerRoll}
      </span>
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>vs</span>
      <span
        className="px-1.5 py-0.5 rounded text-xs font-semibold"
        style={{ background: typeColors[dType].bg, color: typeColors[dType].color }}
      >
        {actionTypeLabel[dType]} {defenderRoll}
      </span>
      {result && (
        <span
          className="font-semibold text-xs"
          style={{
            color: result.hit ? '#e74c3c' : dType === 'evade' ? '#2ecc71' : '#3498db',
          }}
        >
          {result.hit
            ? `→ 命中 ${result.dmg}伤害`
            : dType === 'evade'
            ? `→ 闪避 +${result.evadeRecovery}混乱`
            : '→ 防御成功'}
        </span>
      )}
    </div>
  );
}

function ClashDisplay({ actionResults, ownerName, oppName, isActive }) {
  if (!actionResults || actionResults.length === 0) return null;

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
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-md"
          style={{ background: typeColors.attack.bg, color: typeColors.attack.color }}
        >
          {ownerName}
        </span>
        <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>
          VS
        </span>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-md"
          style={{ background: typeColors.defense.bg, color: typeColors.defense.color }}
        >
          {oppName}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pl-1">
        {actionResults.map((ar, idx) => (
          <SingleClash key={idx} {...ar} />
        ))}
      </div>
    </div>
  );
}

export default ClashDisplay;