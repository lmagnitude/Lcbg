import React, { useState, useCallback } from 'react';
import { defaultPlayer, defaultEnemy, Phase, roll } from '../data/presets';
import StatusBar from './StatusBar';
import SkillSelector from './SkillSelector';
import ClashDisplay from './ClashDisplay';
import BattleLog from './BattleLog';
import './CombatPhase.css';

function CombatPhase() {
  const [phase, setPhase] = useState(Phase.ROLLING);
  const [round, setRound] = useState(1);
  const [player, setPlayer] = useState({ ...defaultPlayer });
  const [enemy, setEnemy] = useState({ ...defaultEnemy });
  const [playerSpeed, setPlayerSpeed] = useState(null);
  const [enemySpeed, setEnemySpeed] = useState(null);
  const [enemySkill, setEnemySkill] = useState(null);
  const [playerSkill, setPlayerSkill] = useState(null);
  const [clashIndex, setClashIndex] = useState(0);
  const [clashResults, setClashResults] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [combatOver, setCombatOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = useCallback((text, type = 'info') => {
    setLog((prev) => [...prev, { round, text, type }]);
  }, [round]);

  // 开始投速度骰
  const handleRollSpeed = () => {
    const pSpeed = roll(player.speed.min, player.speed.max);
    const eSpeed = roll(enemy.speed.min, enemy.speed.max);
    setPlayerSpeed(pSpeed);
    setEnemySpeed(eSpeed);
    setClashResults([]);
    setClashIndex(0);
    addLog(`速度骰: 调查员 ${pSpeed} vs 深潜者 ${eSpeed}`, 'system');
    setPhase(Phase.ENEMY_SKILL);
  };

  // 敌人选择技能（AI 随机）
  const handleEnemySkillSelect = () => {
    const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    setEnemySkill(skill);
    addLog(`深潜者选择了「${skill.name}」`, 'info');
    setPhase(Phase.PLAYER_SKILL);
  };

  // 玩家选择技能
  const handlePlayerSkillSelect = (skill) => {
    setPlayerSkill(skill);
  };

  // 确认玩家技能，开始结算
  const handleConfirmSkill = () => {
    if (!playerSkill) return;
    addLog(`调查员选择了「${playerSkill.name}」`, 'info');
    setPhase(Phase.RESOLVING);
    resolveNextClash(0, player, enemy, playerSkill, enemySkill);
  };

  // 逐段结算拼点
  const resolveNextClash = (index, currentPlayer, currentEnemy, pSkill, eSkill) => {
    const maxActions = Math.max(pSkill.actions.length, eSkill.actions.length);
    if (index >= maxActions) {
      // 所有动作结算完毕
      setPhase(Phase.ROUND_END);
      setResolving(false);
      return;
    }

    const pAction = pSkill.actions[index] || null;
    const eAction = eSkill.actions[index] || null;

    // 投骰子
    const pRoll = pAction ? roll(pAction.min, pAction.max) : 0;
    const eRoll = eAction ? roll(eAction.min, eAction.max) : 0;

    let result = null;
    let logText = '';
    let logType = 'info';
    let newPlayer = { ...currentPlayer };
    let newEnemy = { ...currentEnemy };

    if (pAction && eAction) {
      // 判断双方动作类型
      const pIsAttack = pAction.type === 'attack';
      const eIsAttack = eAction.type === 'attack';

      if (eIsAttack && !pIsAttack) {
        // 敌人进攻 vs 玩家防御/闪避
        const dmg = Math.max(0, eRoll - pRoll);
        if (pAction.type === 'evade') {
          const evaded = pRoll > eRoll;
          result = { hit: !evaded, dmg: evaded ? 0 : dmg, evadeRecovery: evaded ? pRoll : 0 };
          if (evaded) {
            newPlayer = { ...newPlayer, sanity: Math.min(newPlayer.maxSanity, newPlayer.sanity + pRoll) };
            logText = `闪避成功！调查员回复 ${pRoll} 混乱值`;
            logType = 'evade';
          } else {
            newPlayer = {
              ...newPlayer,
              hp: newPlayer.hp - dmg,
              sanity: Math.max(0, newPlayer.sanity - dmg),
            };
            logText = `深潜者命中！调查员受 ${dmg} 伤害`;
            logType = 'damage';
          }
        } else {
          const blocked = pRoll >= eRoll;
          result = { hit: !blocked, dmg };
          if (blocked) {
            logText = `防御成功，无伤害`;
            logType = 'defense';
          } else {
            newPlayer = {
              ...newPlayer,
              hp: newPlayer.hp - dmg,
              sanity: Math.max(0, newPlayer.sanity - dmg),
            };
            logText = `深潜者命中！调查员受 ${dmg} 伤害`;
            logType = 'damage';
          }
        }
      } else if (pIsAttack && !eIsAttack) {
        // 玩家进攻 vs 敌人防御
        const dmg = Math.max(0, pRoll - eRoll);
        const blocked = eRoll >= pRoll;
        result = { hit: !blocked, dmg };
        if (blocked) {
          logText = `防御成功，无伤害`;
          logType = 'defense';
        } else {
          newEnemy = {
            ...newEnemy,
            hp: newEnemy.hp - dmg,
            sanity: Math.max(0, newEnemy.sanity - dmg),
          };
          logText = `调查员命中！深潜者受 ${dmg} 伤害`;
          logType = 'damage';
        }
      } else if (pIsAttack && eIsAttack) {
        // 双方都是攻击 → 互殴
        const pDmg = pRoll;
        const eDmg = eRoll;
        result = { playerDmg: eDmg, enemyDmg: pDmg };
        newPlayer = {
          ...newPlayer,
          hp: newPlayer.hp - eDmg,
          sanity: Math.max(0, newPlayer.sanity - eDmg),
        };
        newEnemy = {
          ...newEnemy,
          hp: newEnemy.hp - pDmg,
          sanity: Math.max(0, newEnemy.sanity - pDmg),
        };
        logText = `双方对攻！调查员受 ${eDmg}，深潜者受 ${pDmg}`;
        logType = 'damage';
      } else {
        // 双方都是防御 → 无事发生
        result = { hit: false, dmg: 0 };
        logText = `双方防御，无事发生`;
        logType = 'info';
      }
    } else if (pAction && !eAction) {
      // 只有玩家有动作（玩家攻击空位）
      if (pAction.type === 'attack') {
        const dmg = pRoll;
        newEnemy = {
          ...newEnemy,
          hp: newEnemy.hp - dmg,
          sanity: Math.max(0, newEnemy.sanity - dmg),
        };
        result = { hit: true, dmg };
        logText = `调查员命中！深潜者受 ${dmg} 伤害`;
        logType = 'damage';
      }
    } else if (!pAction && eAction) {
      // 只有敌人有动作（敌人攻击空位）
      if (eAction.type === 'attack') {
        const dmg = eRoll;
        newPlayer = {
          ...newPlayer,
          hp: newPlayer.hp - dmg,
          sanity: Math.max(0, newPlayer.sanity - dmg),
        };
        result = { hit: true, dmg };
        logText = `深潜者命中！调查员受 ${dmg} 伤害`;
        logType = 'damage';
      }
    }

    if (logText) addLog(logText, logType);

    const newClashResult = {
      playerAction: pAction,
      enemyAction: eAction,
      playerRoll: pRoll,
      enemyRoll: eRoll,
      result,
    };

    setClashResults((prev) => [...prev, newClashResult]);
    setClashIndex(index + 1);
    setPlayer(newPlayer);
    setEnemy(newEnemy);

    // 检查是否有人倒下
    if (newPlayer.hp <= 0) {
      setPhase(Phase.COMBAT_END);
      setCombatOver(true);
      setWinner('深潜者');
      addLog(`调查员倒下！深潜者获胜！`, 'damage');
      setResolving(false);
      return;
    }
    if (newEnemy.hp <= 0) {
      setPhase(Phase.COMBAT_END);
      setCombatOver(true);
      setWinner('调查员');
      addLog(`深潜者倒下！调查员获胜！`, 'damage');
      setResolving(false);
      return;
    }

    setResolving(true);
  };

  // 手动推进下一段结算
  const handleNextClash = () => {
    setResolving(false);
    const maxActions = Math.max(playerSkill.actions.length, enemySkill.actions.length);
    if (clashIndex >= maxActions) {
      setPhase(Phase.ROUND_END);
      return;
    }
    resolveNextClash(clashIndex, player, enemy, playerSkill, enemySkill);
  };

  // 下一回合
  const handleNextRound = () => {
    setRound((r) => r + 1);
    setEnemySkill(null);
    setPlayerSkill(null);
    setClashIndex(0);
    setClashResults([]);
    setPlayerSpeed(null);
    setEnemySpeed(null);
    setResolving(false);
    setPhase(Phase.ROLLING);
    addLog('--- 回合结束 ---', 'system');
  };

  // 重新开始
  const handleRestart = () => {
    setPhase(Phase.ROLLING);
    setRound(1);
    setPlayer({ ...defaultPlayer });
    setEnemy({ ...defaultEnemy });
    setPlayerSpeed(null);
    setEnemySpeed(null);
    setEnemySkill(null);
    setPlayerSkill(null);
    setClashIndex(0);
    setClashResults([]);
    setResolving(false);
    setCombatOver(false);
    setWinner(null);
    setLog([]);
  };

  // 判断是否混乱（混乱值为0则跳过回合）
  const playerStunned = player.sanity <= 0;

  return (
    <div className="combat-phase">
      {/* 阶段标题 */}
      <div className="combat-phase__header">
        <span className="combat-phase__round">⚔️ 第 {round} 轮</span>
        <span className="combat-phase__phase-label">
          {phase === Phase.ROLLING && '等待速度骰'}
          {phase === Phase.ENEMY_SKILL && '敌方选择技能'}
          {phase === Phase.PLAYER_SKILL && '选择你的技能'}
          {phase === Phase.RESOLVING && '拼点结算中'}
          {phase === Phase.ROUND_END && '回合结束'}
          {phase === Phase.COMBAT_END && '战斗结束'}
        </span>
      </div>

      {/* 双血条 */}
      <div className="combat-phase__status-row">
        <StatusBar character={player} isActive={phase === Phase.PLAYER_SKILL} side="left" />
        <div className="combat-phase__vs-indicator">VS</div>
        <StatusBar character={enemy} isActive={phase === Phase.ENEMY_SKILL} side="right" />
      </div>

      {/* 速度骰结果 */}
      {(playerSpeed !== null) && (
        <div className="combat-phase__speed">
          <span>速度骰: 调查员 <strong>{playerSpeed}</strong> vs 深潜者 <strong>{enemySpeed}</strong></span>
          <span className="combat-phase__speed-hint">
            {playerSpeed > enemySpeed ? '调查员更快（敌人优先选技能）' : '深潜者更快（敌人优先选技能）'}
          </span>
        </div>
      )}

      {/* ROLLING 阶段 */}
      {phase === Phase.ROLLING && (
        <div className="combat-phase__action-area">
          <button className="btn btn--primary" onClick={handleRollSpeed}>
            🎲 投速度骰
          </button>
        </div>
      )}

      {/* ENEMY_SKILL 阶段 */}
      {phase === Phase.ENEMY_SKILL && (
        <div className="combat-phase__action-area">
          <p className="combat-phase__prompt">深潜者正在选择技能...</p>
          <button className="btn btn--primary" onClick={handleEnemySkillSelect}>
            👁️ 查看敌方技能选择
          </button>
        </div>
      )}

      {/* PLAYER_SKILL 阶段 */}
      {phase === Phase.PLAYER_SKILL && (
        <div className="combat-phase__action-area">
          {enemySkill && (
            <div className="combat-phase__enemy-reveal">
              <span className="combat-phase__reveal-label">敌方选择了：</span>
              <span className="combat-phase__reveal-skill">{enemySkill.name}</span>
              <span className="combat-phase__reveal-detail">
                ({enemySkill.actions.map((a, i) => `${a.type === 'attack' ? '攻' : a.type === 'defense' ? '防' : '闪'} ${a.min}~${a.max}`).join(' → ')})
              </span>
            </div>
          )}
          <SkillSelector
            skills={player.skills}
            selectedSkill={playerSkill}
            onSelect={handlePlayerSkillSelect}
            disabled={false}
            label="选择你的技能"
          />
          <button
            className="btn btn--primary"
            onClick={handleConfirmSkill}
            disabled={!playerSkill}
          >
            ⚡ 回合结束，开始结算
          </button>
        </div>
      )}

      {/* RESOLVING 阶段 */}
      {phase === Phase.RESOLVING && (
        <div className="combat-phase__action-area">
          <div className="combat-phase__clash-list">
            {clashResults.map((cr, idx) => (
              <ClashDisplay
                key={idx}
                playerAction={cr.playerAction}
                enemyAction={cr.enemyAction}
                playerRoll={cr.playerRoll}
                enemyRoll={cr.enemyRoll}
                result={cr.result}
                isActive={false}
              />
            ))}
          </div>
          {resolving && (
            <div className="combat-phase__clash-controls">
              <p className="combat-phase__clash-hint">
                → 第 {clashIndex + 1} 段动作拼点
              </p>
              <button className="btn btn--primary" onClick={handleNextClash}>
                ▶ 结算下一段
              </button>
            </div>
          )}
          {!resolving && phase === Phase.ROUND_END && (
            <div className="combat-phase__action-area">
              <button className="btn btn--primary" onClick={handleNextRound}>
                ➡ 下一回合
              </button>
            </div>
          )}
          {!resolving && phase === Phase.COMBAT_END && (
            <div className="combat-phase__action-area">
              <button className="btn btn--primary" onClick={handleRestart}>
                🔄 重新开始
              </button>
            </div>
          )}
        </div>
      )}

      {/* ROUND_END 阶段 */}
      {phase === Phase.ROUND_END && !resolving && (
        <div className="combat-phase__action-area">
          <div className="combat-phase__clash-list">
            {clashResults.map((cr, idx) => (
              <ClashDisplay
                key={idx}
                playerAction={cr.playerAction}
                enemyAction={cr.enemyAction}
                playerRoll={cr.playerRoll}
                enemyRoll={cr.enemyRoll}
                result={cr.result}
                isActive={false}
              />
            ))}
          </div>
          <button className="btn btn--primary" onClick={handleNextRound}>
            ➡ 下一回合
          </button>
        </div>
      )}

      {/* COMBAT_END 阶段 */}
      {phase === Phase.COMBAT_END && (
        <div className="combat-phase__action-area">
          <div className="combat-phase__victory">
            {winner === '调查员' ? '🎉 调查员获胜！' : '💀 深潜者获胜！'}
          </div>
          <button className="btn btn--primary" onClick={handleRestart}>
            🔄 重新开始
          </button>
        </div>
      )}

      {/* 战斗日志 */}
      <div className="combat-phase__log-area">
        <BattleLog entries={log} />
      </div>
    </div>
  );
}

export default CombatPhase;