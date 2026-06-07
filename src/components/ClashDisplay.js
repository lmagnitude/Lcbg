import React from 'react';
import { actionTypeLabel } from '../data/presets';
import './ClashDisplay.css';

function ClashDisplay({ playerAction, enemyAction, playerRoll, enemyRoll, result, isActive }) {
  if (!playerAction || !enemyAction) return null;

  const playerIsAttack = playerAction.type === 'attack';
  const enemyIsAttack = enemyAction.type === 'attack';

  // 确定进攻方和防守方
  let attackerLabel, defenderLabel, attackRoll, defenseRoll, attackType, defenseType;

  if (enemyIsAttack && !playerIsAttack) {
    // 敌人进攻，玩家防御/闪避
    attackerLabel = '深潜者';
    defenderLabel = '调查员';
    attackRoll = enemyRoll;
    defenseRoll = playerRoll;
    attackType = enemyAction.type;
    defenseType = playerAction.type;
  } else if (playerIsAttack && !enemyIsAttack) {
    // 玩家进攻，敌人防御
    attackerLabel = '调查员';
    defenderLabel = '深潜者';
    attackRoll = playerRoll;
    defenseRoll = enemyRoll;
    attackType = playerAction.type;
    defenseType = enemyAction.type;
  } else {
    // 双方都是攻击或都是防御
    return (
      <div className={`clash-item ${isActive ? 'active' : 'resolved'}`}>
        <div className="clash-item__mutual">
          <span>双方均为攻击动作，互相造成伤害</span>
          <div className="clash-item__rolls">
            <span>调查员: {playerRoll}</span>
            <span>深潜者: {enemyRoll}</span>
          </div>
          {result && (
            <div className="clash-item__result">
              <span className="clash-item__damage">调查员受 {result.playerDmg} 伤害</span>
              <span className="clash-item__damage">深潜者受 {result.enemyDmg} 伤害</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hit = result ? result.hit : null;
  const damage = result ? result.dmg : null;
  const evadeRecovery = result ? result.evadeRecovery : null;

  return (
    <div className={`clash-item ${isActive ? 'active' : 'resolved'}`}>
      <div className="clash-item__header">
        <span className={`clash-item__type clash-item__type--${attackType}`}>
          {attackerLabel} {actionTypeLabel[attackType]}
        </span>
        <span className="clash-item__vs">VS</span>
        <span className={`clash-item__type clash-item__type--${defenseType}`}>
          {defenderLabel} {actionTypeLabel[defenseType]}
        </span>
      </div>

      <div className="clash-item__rolls">
        <span className="clash-item__roll clash-item__roll--attack">
          {actionTypeLabel[attackType]}骰: <strong>{attackRoll}</strong>
        </span>
        <span className="clash-item__roll clash-item__roll--defense">
          {actionTypeLabel[defenseType]}骰: <strong>{defenseRoll}</strong>
        </span>
      </div>

      {result && (
        <div className="clash-item__result">
          {hit && (
            <span className="clash-item__damage">
              {attackerLabel}命中！造成 {damage} 点伤害
            </span>
          )}
          {!hit && defenseType !== 'evade' && (
            <span className="clash-item__block">防御成功，无伤害</span>
          )}
          {!hit && defenseType === 'evade' && (
            <span className="clash-item__evade">
              闪避成功！{defenderLabel}回复 {evadeRecovery} 混乱值
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ClashDisplay;