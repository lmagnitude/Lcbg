import React from 'react';
import { actionTypeLabel } from '../data/presets';

function SkillSelector({ skills, selectedSkill, onSelect, disabled, label }) {
  return (
    <div className="my-4">
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
        {label}
      </h3>
      <div className="flex gap-3">
        {skills.map((skill, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(skill)}
            disabled={disabled}
            className="text-left min-w-[160px] px-[18px] py-[14px] rounded-xl border-2 border-transparent transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              borderColor: selectedSkill === skill ? 'var(--color-accent)' : 'transparent',
              background: selectedSkill === skill ? 'var(--color-accent-bg)' : 'var(--color-card)',
            }}
          >
            <div className="text-[15px] font-bold mb-2">{skill.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {skill.actions.map((action, aIdx) => (
                <span
                  key={aIdx}
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{
                    background:
                      action.type === 'attack'
                        ? 'rgba(231, 76, 60, 0.2)'
                        : action.type === 'defense'
                        ? 'rgba(52, 152, 219, 0.2)'
                        : 'rgba(46, 204, 113, 0.2)',
                    color:
                      action.type === 'attack'
                        ? '#e74c3c'
                        : action.type === 'defense'
                        ? '#3498db'
                        : '#2ecc71',
                  }}
                >
                  {actionTypeLabel[action.type]} {action.min}~{action.max}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SkillSelector;