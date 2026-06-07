import React from 'react';
import { actionTypeLabel } from '../data/presets';
import './SkillSelector.css';

function SkillSelector({ skills, selectedSkill, onSelect, disabled, label }) {
  return (
    <div className="skill-selector">
      <h3 className="skill-selector__title">{label}</h3>
      <div className="skill-selector__cards">
        {skills.map((skill, idx) => (
          <button
            key={idx}
            className={`skill-card ${selectedSkill === skill ? 'selected' : ''}`}
            onClick={() => onSelect(skill)}
            disabled={disabled}
          >
            <div className="skill-card__name">{skill.name}</div>
            <div className="skill-card__actions">
              {skill.actions.map((action, aIdx) => (
                <span key={aIdx} className={`skill-card__action skill-card__action--${action.type}`}>
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