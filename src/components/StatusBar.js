import React from 'react';
import './StatusBar.css';

function StatusBar({ character, isActive, side }) {
  const hpPercent = Math.max(0, (character.hp / character.maxHp) * 100);
  const sanityPercent = Math.max(0, (character.sanity / character.maxSanity) * 100);

  return (
    <div className={`status-bar ${side} ${isActive ? 'active' : ''}`}>
      <div className="status-bar__header">
        <span className="status-bar__name">{character.name}</span>
        {isActive && <span className="status-bar__badge">行动中</span>}
      </div>

      <div className="status-bar__bar-group">
        <div className="status-bar__label">
          <span>生命</span>
          <span>{character.hp} / {character.maxHp}</span>
        </div>
        <div className="status-bar__track">
          <div
            className="status-bar__fill status-bar__fill--hp"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="status-bar__bar-group">
        <div className="status-bar__label">
          <span>混乱</span>
          <span>{character.sanity} / {character.maxSanity}</span>
        </div>
        <div className="status-bar__track">
          <div
            className="status-bar__fill status-bar__fill--sanity"
            style={{ width: `${sanityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StatusBar;