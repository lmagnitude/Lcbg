import React, { useRef, useEffect } from 'react';
import './BattleLog.css';

function BattleLog({ entries }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="battle-log">
      <h3 className="battle-log__title">战斗日志</h3>
      <div className="battle-log__entries">
        {entries.length === 0 && (
          <div className="battle-log__empty">战斗即将开始...</div>
        )}
        {entries.map((entry, idx) => (
          <div key={idx} className={`battle-log__entry battle-log__entry--${entry.type}`}>
            <span className="battle-log__timestamp">[{entry.round}]</span>
            <span>{entry.text}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default BattleLog;