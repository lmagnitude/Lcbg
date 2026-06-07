import React, { useRef, useEffect } from 'react';

const typeBorderColors = {
  damage: '#e74c3c',
  defense: '#3498db',
  evade: '#2ecc71',
  info: 'var(--color-accent)',
  system: '#f39c12',
};

function BattleLog({ entries }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div
      className="rounded-xl p-4 flex flex-col max-h-[260px]"
      style={{ background: 'var(--color-card)' }}
    >
      <h3 className="text-base font-semibold mb-2.5 flex-shrink-0" style={{ color: 'var(--color-text)' }}>
        战斗日志
      </h3>
      <div className="overflow-y-auto flex-1 flex flex-col gap-1.5">
        {entries.length === 0 && (
          <div
            className="text-[13px] text-center py-5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            战斗即将开始...
          </div>
        )}
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="text-[13px] px-2.5 py-1.5 rounded-md"
            style={{
              background: 'var(--color-track)',
              color: 'var(--color-text)',
              borderLeft: `3px solid ${typeBorderColors[entry.type] || 'var(--color-accent)'}`,
            }}
          >
            <span className="mr-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              [{entry.round}]
            </span>
            <span>{entry.text}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default BattleLog;