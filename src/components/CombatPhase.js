import React, { useState, useCallback, useEffect } from 'react';
import { defaultPlayer, defaultEnemy, Phase, roll } from '../data/presets';
import StatusBar from './StatusBar';
import SkillSelector from './SkillSelector';
import ClashDisplay from './ClashDisplay';
import BattleLog from './BattleLog';

function CombatPhase({ debugConfig = { enabled: false, fixedDice: {} }, onCombatStateChange, playerOverride, enemyOverride, onPlayerOverrideClear, onEnemyOverrideClear, debugScene, onDebugSceneClear }) {
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

  // 向父组件报告当前状态
  useEffect(() => {
    if (onCombatStateChange) {
      onCombatStateChange({ phase, round, player, enemy, playerSpeed, enemySpeed, enemySkill, playerSkill, clashIndex, clashResults, resolving, combatOver, winner, log });
    }
  }, [phase, round, player, enemy, playerSpeed, enemySpeed, enemySkill, playerSkill, clashIndex, clashResults, resolving, combatOver, winner, log, onCombatStateChange]);

  // 处理来自调试面板的 HP/混乱覆盖
  useEffect(() => {
    if (playerOverride) {
      setPlayer((prev) => ({ ...prev, ...playerOverride }));
      onPlayerOverrideClear?.();
    }
  }, [playerOverride, onPlayerOverrideClear]);

  useEffect(() => {
    if (enemyOverride) {
      setEnemy((prev) => ({ ...prev, ...enemyOverride }));
      onEnemyOverrideClear?.();
    }
  }, [enemyOverride, onEnemyOverrideClear]);

  const addLog = useCallback(
    (text, type = 'info') => {
      setLog((prev) => [...prev, { round, text, type }]);
    },
    [round]
  );

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

  const handleEnemySkillSelect = () => {
    const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    setEnemySkill(skill);
    addLog(`深潜者选择了「${skill.name}」`, 'info');
    setPhase(Phase.PLAYER_SKILL);
  };

  const handlePlayerSkillSelect = (skill) => {
    setPlayerSkill(skill);
  };

  const handleConfirmSkill = () => {
    if (!playerSkill) return;
    addLog(`调查员选择了「${playerSkill.name}」`, 'info');
    setPhase(Phase.RESOLVING);
    resolveNextClash(0, player, enemy, playerSkill, enemySkill);
  };

  const resolveNextClash = (index, currentPlayer, currentEnemy, pSkill, eSkill) => {
    const maxActions = Math.max(pSkill.actions.length, eSkill.actions.length);
    if (index >= maxActions) {
      setPhase(Phase.ROUND_END);
      setResolving(false);
      return;
    }

    const pAction = pSkill.actions[index] || null;
    const eAction = eSkill.actions[index] || null;

    // 调试模式：固定骰值优先
    const fixedDice = debugConfig.enabled ? (debugConfig.fixedDice[index] || {}) : {};
    const pRoll = pAction
      ? (fixedDice.p !== undefined ? fixedDice.p : roll(pAction.min, pAction.max))
      : 0;
    const eRoll = eAction
      ? (fixedDice.e !== undefined ? fixedDice.e : roll(eAction.min, eAction.max))
      : 0;

    let result = null;
    let logText = '';
    let logType = 'info';
    let newPlayer = { ...currentPlayer };
    let newEnemy = { ...currentEnemy };

    if (pAction && eAction) {
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
        // 双方攻击 → 按废墟图书馆规则：高的一方命中，另一方不受伤害；相等则平局无人受伤
        if (pRoll > eRoll) {
          result = { pHit: true, pDmg: pRoll, eHit: false, eDmg: 0 };
          newEnemy = {
            ...newEnemy,
            hp: newEnemy.hp - pRoll,
            sanity: Math.max(0, newEnemy.sanity - pRoll),
          };
          logText = `调查员攻击胜出！深潜者受 ${pRoll} 伤害`;
          logType = 'damage';
        } else if (eRoll > pRoll) {
          result = { pHit: false, pDmg: 0, eHit: true, eDmg: eRoll };
          newPlayer = {
            ...newPlayer,
            hp: newPlayer.hp - eRoll,
            sanity: Math.max(0, newPlayer.sanity - eRoll),
          };
          logText = `深潜者攻击胜出！调查员受 ${eRoll} 伤害`;
          logType = 'damage';
        } else {
          result = { pHit: false, pDmg: 0, eHit: false, eDmg: 0 };
          logText = `双方攻击平局，均不受伤害`;
          logType = 'info';
        }
      } else {
        // 双方都是防御 → 无事发生
        result = { hit: false, dmg: 0 };
        logText = `双方防御，无事发生`;
        logType = 'info';
      }
    } else if (pAction && !eAction) {
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

  const handleNextClash = () => {
    setResolving(false);
    const maxActions = Math.max(playerSkill.actions.length, enemySkill.actions.length);
    if (clashIndex >= maxActions) {
      setPhase(Phase.ROUND_END);
      return;
    }
    resolveNextClash(clashIndex, player, enemy, playerSkill, enemySkill);
  };

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

  const phaseLabels = {
    [Phase.ROLLING]: '等待速度骰',
    [Phase.ENEMY_SKILL]: '敌方选择技能',
    [Phase.PLAYER_SKILL]: '选择你的技能',
    [Phase.RESOLVING]: '拼点结算中',
    [Phase.ROUND_END]: '回合结束',
    [Phase.COMBAT_END]: '战斗结束',
  };

  return (
    <div className="max-w-[780px] mx-auto p-5">
      {/* 阶段标题 */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        <span className="text-[22px] font-bold" style={{ color: 'var(--color-accent)' }}>
          ⚔️ 第 {round} 轮
        </span>
        <span
          className="text-sm px-3 py-1 rounded-[20px]"
          style={{ background: 'var(--color-card)', color: 'var(--color-text-secondary)' }}
        >
          {phaseLabels[phase]}
        </span>
      </div>

      {/* 双血条 */}
      <div className="flex items-center gap-4 mb-4 justify-center flex-wrap">
        <StatusBar character={player} isActive={phase === Phase.PLAYER_SKILL} side="left" />
        <div
          className="text-2xl font-black"
          style={{ color: 'var(--color-accent)', textShadow: '0 0 8px var(--color-accent-glow)' }}
        >
          VS
        </div>
        <StatusBar character={enemy} isActive={phase === Phase.ENEMY_SKILL} side="right" />
      </div>

      {/* 速度骰结果 */}
      {playerSpeed !== null && (
        <div
          className="flex flex-col items-center gap-1 mb-4 p-2.5 rounded-[10px] text-sm"
          style={{ background: 'var(--color-card)', color: 'var(--color-text)' }}
        >
          <span>
            速度骰: 调查员 <strong>{playerSpeed}</strong> vs 深潜者 <strong>{enemySpeed}</strong>
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {playerSpeed > enemySpeed ? '调查员更快（敌人优先选技能）' : '深潜者更快（敌人优先选技能）'}
          </span>
        </div>
      )}

      {/* ROLLING 阶段 */}
      {phase === Phase.ROLLING && (
        <div className="mb-5 text-center">
          <button
            className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleRollSpeed}
          >
            🎲 投速度骰
          </button>
        </div>
      )}

      {/* ENEMY_SKILL 阶段 */}
      {phase === Phase.ENEMY_SKILL && (
        <div className="mb-5 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            深潜者正在选择技能...
          </p>
          <button
            className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleEnemySkillSelect}
          >
            👁️ 查看敌方技能选择
          </button>
        </div>
      )}

      {/* PLAYER_SKILL 阶段 */}
      {phase === Phase.PLAYER_SKILL && (
        <div className="mb-5">
          {enemySkill && (
            <div
              className="flex items-center gap-2 px-4 py-3 mb-4 rounded-[10px] border border-[#e74c3c] flex-wrap"
              style={{ background: 'var(--color-card)' }}
            >
              <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                敌方选择了：
              </span>
              <span className="text-[15px] font-bold" style={{ color: '#e74c3c' }}>
                {enemySkill.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                (
                {enemySkill.actions
                  .map(
                    (a) =>
                      `${a.type === 'attack' ? '攻' : a.type === 'defense' ? '防' : '闪'} ${a.min}~${a.max}`
                  )
                  .join(' → ')}
                )
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
            className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleConfirmSkill}
            disabled={!playerSkill}
          >
            ⚡ 回合结束，开始结算
          </button>
        </div>
      )}

      {/* RESOLVING 阶段 */}
      {phase === Phase.RESOLVING && (
        <div className="mb-5">
          <div className="mb-4">
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
            <div className="flex flex-col items-center gap-2.5">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                → 第 {clashIndex + 1} 段动作拼点
              </p>
              <button
                className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
                onClick={handleNextClash}
              >
                ▶ 结算下一段
              </button>
            </div>
          )}
          {!resolving && phase === Phase.ROUND_END && (
            <div className="text-center">
              <button
                className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
                onClick={handleNextRound}
              >
                ➡ 下一回合
              </button>
            </div>
          )}
          {!resolving && phase === Phase.COMBAT_END && (
            <div className="text-center">
              <button
                className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
                onClick={handleRestart}
              >
                🔄 重新开始
              </button>
            </div>
          )}
        </div>
      )}

      {/* ROUND_END 阶段 */}
      {phase === Phase.ROUND_END && !resolving && (
        <div className="mb-5">
          <div className="mb-4">
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
          <div className="text-center">
            <button
              className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onClick={handleNextRound}
            >
              ➡ 下一回合
            </button>
          </div>
        </div>
      )}

      {/* COMBAT_END 阶段 */}
      {phase === Phase.COMBAT_END && (
        <div className="mb-5 text-center">
          <div
            className="text-[28px] font-black mb-4 animate-victory-pulse"
            style={{ color: 'var(--color-accent)' }}
          >
            {winner === '调查员' ? '🎉 调查员获胜！' : '💀 深潜者获胜！'}
          </div>
          <button
            className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleRestart}
          >
            🔄 重新开始
          </button>
        </div>
      )}

      {/* 战斗日志 */}
      <div className="mt-5">
        <BattleLog entries={log} />
      </div>
    </div>
  );
}

export default CombatPhase;