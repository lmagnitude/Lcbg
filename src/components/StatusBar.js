import React from 'react';

function StatusBar({ character, isActive, side }) {
  const hpPercent = Math.max(0, (character.hp / character.maxHp) * 100);
  const sanityPercent = Math.max(0, (character.sanity / character.maxSanity) * 100);

  return (
    <div
      className="rounded-xl p-4 min-w-[220px] border-2 border-transparent transition-all duration-300"
      style={{
        background: 'var(--color-card)',
        borderColor: isActive ? 'var(--color-accent)' : 'transparent',
        boxShadow: isActive ? '0 0 16px var(--color-accent-glow)' : 'none',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {character.name}
        </span>
        {isActive && (
          <span
            className="text-xs text-white px-2 py-0.5 rounded-full animate-pulse-badge"
            style={{ background: 'var(--color-accent)' }}
          >
            行动中
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          <span>生命</span>
          <span>{character.hp} / {character.maxHp}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-track)' }}>
          <div
            className="h-full rounded-full bar-transition bg-gradient-to-r from-red-600 to-red-700"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          <span>混乱</span>
          <span>{character.sanity} / {character.maxSanity}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-track)' }}>
          <div
            className="h-full rounded-full bar-transition bg-gradient-to-r from-purple-500 to-purple-700"
            style={{ width: `${sanityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StatusBar;