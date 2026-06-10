import React, { useState, useCallback, useEffect } from 'react';
import {
  defaultAllies,
  defaultEnemies,
  Phase,
  roll,
  findCombatant,
} from '../data/presets';
import StatusBar from './StatusBar';
import SkillSelector from './SkillSelector';
import ClashDisplay from './ClashDisplay';
import BattleLog from './BattleLog';

// ---- helpers ----
const clone = (c) => ({ ...c, skills: [...c.skills] });

function calcEvadeResult(evadeRoll, attackRoll) {
  const evaded = evadeRoll > attackRoll;
  const dmg = Math.max(0, attackRoll - evadeRoll);
  return {
    hit: !evaded,
    dmg: evaded ? 0 : dmg,
    evadeRecovery: evaded ? evadeRoll : 0,
    evadeLeftover: evaded ? evadeRoll - attackRoll : 0,
  };
}

function makeCombatState(phase, round, combatants, speedDice, plans, log, resolving) {
  return { phase, round, combatants, speedDice, plans, log, resolving };
}

function CombatPhase({ debugConfig = { enabled: false, fixedDice: {} }, onCombatStateChange, playerOverride, enemyOverride, onPlayerOverrideClear, onEnemyOverrideClear }) {
  // ---- state ----
  const [phase, setPhase] = useState(Phase.ROLLING);
  const [round, setRound] = useState(1);
  const [combatants, setCombatants] = useState(() => [
    ...defaultAllies.map(clone),
    ...defaultEnemies.map(clone),
  ]);
  const [speedDice, setSpeedDice] = useState([]);
  const [plans, setPlans] = useState([]); // { ownerId, dieIndex, speedValue, skill, targetId }
  const [currentPlanSlot, setCurrentPlanSlot] = useState(0); // which ally plan slot we're editing (0-based index within ally plans)
  const [clashIndex, setClashIndex] = useState(0);
  const [clashResults, setClashResults] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [winnerSide, setWinnerSide] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = useCallback((text, type = 'info') => { setLog((p) => [...p, { round, text, type }]); }, [round]);

  // keep parent updated
  useEffect(() => {
    onCombatStateChange?.(
      makeCombatState(phase, round, combatants, speedDice, plans, log, resolving)
    );
  }, [phase, round, combatants, speedDice, plans, log, resolving, onCombatStateChange]);

  // debug overrides
  useEffect(() => {
    if (playerOverride || enemyOverride) {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.side === 'ally' && playerOverride) return { ...c, ...playerOverride };
          if (c.side === 'enemy' && enemyOverride) return { ...c, ...enemyOverride };
          return c;
        })
      );
      onPlayerOverrideClear?.();
      onEnemyOverrideClear?.();
    }
  }, [playerOverride, enemyOverride, onPlayerOverrideClear, onEnemyOverrideClear]);

  // helpers
  const getC = (id) => findCombatant(combatants, id);
  const aliveAllies = () => combatants.filter((c) => c.side === 'ally' && c.hp > 0);
  const aliveEnemies = () => combatants.filter((c) => c.side === 'enemy' && c.hp > 0);

  // ============ PHASE: ROLLING ============
  const handleRollSpeed = () => {
    const alive = combatants.filter((c) => c.hp > 0 && !c.stunned);
    const dice = [];
    alive.forEach((c) => {
      for (let i = 0; i < c.speedDieCount; i++) {
        dice.push({
          combatantId: c.id,
          value: roll(c.speed.min, c.speed.max),
          dieIndex: i,
        });
      }
    });
    dice.sort((a, b) => b.value - a.value);
    setSpeedDice(dice);
    // init empty plans for all dice
    const initPlans = dice.map((sd) => ({
      ownerId: sd.combatantId,
      dieIndex: sd.dieIndex,
      speedValue: sd.value,
      skill: null,
      targetId: null,
    }));
    setPlans(initPlans);
    setClashResults([]);
    setClashIndex(0);

    const names = dice.map((sd) => `${getC(sd.combatantId)?.name || '?'}(${sd.value})`).join(', ');
    addLog(`先攻顺序: ${names}`, 'system');
    setPhase(Phase.ENEMY_PLAN);
  };

  // ============ PHASE: ENEMY_PLAN (AI) ============
  const handleEnemyAutoPlan = () => {
    const newPlans = [...plans];
    const allyIds = aliveAllies().map((c) => c.id);

    speedDice.forEach((sd, idx) => {
      const c = getC(sd.combatantId);
      if (c && c.side === 'enemy') {
        const skill = c.skills[Math.floor(Math.random() * c.skills.length)];
        const targetId = allyIds[Math.floor(Math.random() * allyIds.length)] || allyIds[0];
        newPlans[idx] = { ...newPlans[idx], skill, targetId };
        const tgt = getC(targetId);
        addLog(`${c.name}选择「${skill.name}」→ ${tgt?.name || '?'}`, 'info');
      }
    });
    setPlans(newPlans);
    setCurrentPlanSlot(0);
    setPhase(Phase.ALLY_PLAN);
  };

  // ============ PHASE: ALLY_PLAN (step by step) ============
  const allyPlanSlots = plans
    .map((p, idx) => ({ ...p, planIndex: idx }))
    .filter((p) => getC(p.ownerId)?.side === 'ally');

  const currentAllyPlan = allyPlanSlots[currentPlanSlot] || null;

  // check if current ally's selection causes an interception
  const checkInterception = (targetId) => {
    if (!currentAllyPlan) return null;
    // find enemy plans that target slower allies of the same side
    const intercepted = [];
    plans.forEach((ep, idx) => {
      if (ep.ownerId === targetId && ep.skill && ep.targetId) {
        const victim = getC(ep.targetId);
        if (victim && victim.side === 'ally' && victim.id !== currentAllyPlan.ownerId) {
          const victimSpeed = speedDice.find(
            (sd) => sd.combatantId === victim.id
          );
          if (victimSpeed && currentAllyPlan.speedValue > victimSpeed.value) {
            intercepted.push({ planIndex: idx, victim: victim.name });
          }
        }
      }
    });
    return intercepted.length > 0 ? intercepted : null;
  };

  const handleAllySelectTarget = (targetId) => {
    const newPlans = [...plans];
    const slot = allyPlanSlots[currentPlanSlot];
    newPlans[slot.planIndex] = { ...newPlans[slot.planIndex], targetId };
    setPlans(newPlans);
  };

  const handleAllySelectSkill = (skill) => {
    const newPlans = [...plans];
    const slot = allyPlanSlots[currentPlanSlot];
    newPlans[slot.planIndex] = { ...newPlans[slot.planIndex], skill };
    setPlans(newPlans);
  };

  const handleAllyConfirm = () => {
    const plan = currentAllyPlan;
    if (!plan || !plan.targetId || !plan.skill) return;
    const owner = getC(plan.ownerId);
    const target = getC(plan.targetId);
    const interception = checkInterception(plan.targetId);
    if (interception) {
      addLog(
        `${owner.name}拦截了${interception.map((i) => `${getC(plans[i.planIndex].ownerId)?.name}对${i.victim}的攻击`).join('、')}`,
        'info'
      );
      // mark intercepted plans
      const newPlans = [...plans];
      interception.forEach((i) => {
        newPlans[i.planIndex] = {
          ...newPlans[i.planIndex],
          intercepted: true,
          interceptorId: plan.ownerId,
        };
      });
      setPlans(newPlans);
    }
    addLog(`${owner.name}选择「${plan.skill.name}」→ ${target.name}`, 'info');
    if (currentPlanSlot + 1 >= allyPlanSlots.length) {
      setPhase(Phase.RESOLVING);
      resolveNextClash(0);
    } else {
      setCurrentPlanSlot((s) => s + 1);
    }
  };

  // ============ RESOLVING ============
  const getUsedDiceForPlan = (planIndex) =>
    debugConfig.enabled ? (debugConfig.fixedDice[planIndex] || {}) : {};

  const resolveNextClash = (index) => {
    if (index >= plans.length) {
      setPhase(Phase.ROUND_END);
      setResolving(false);
      return;
    }

    const plan = plans[index];
    const owner = getC(plan.ownerId);
    if (!owner || owner.hp <= 0) {
      setClashResults((p) => [...p, { plan, result: null, skipped: true }]);
      setTimeout(() => resolveNextClash(index + 1), 0);
      return;
    }

    // find opposing plan
    let oppPlan = null;
    if (plan.skill && plan.targetId) {
      // find if target has a plan against us (or someone)
      oppPlan = plans.find((p) => p.ownerId === plan.targetId);
      // if plan is intercepted, the interceptor's plan becomes the clash
      if (plan.intercepted && plan.interceptorId) {
        oppPlan = plans.find((p) => p.ownerId === plan.interceptorId);
      }
    }

    if (!plan.skill) {
      setClashResults((p) => [...p, { plan, result: null, skipped: true }]);
      setTimeout(() => resolveNextClash(index + 1), 0);
      return;
    }

    const oSkill = plan.skill;
    const eSkill = oppPlan?.skill || null;
    const maxActions = Math.max(oSkill.actions.length, eSkill?.actions.length || 0);

    // if no opposing plan, just execute attacks unopposed
    if (!eSkill && oSkill.actions.some((a) => a.type === 'attack')) {
      let newCombatants = combatants;
      const fd = getUsedDiceForPlan(index);
      let logText = '';
      oSkill.actions.forEach((action, aIdx) => {
        const pRoll = fd[`p${aIdx}`] !== undefined ? fd[`p${aIdx}`] : roll(action.min, action.max);
        if (action.type === 'attack') {
          const tgt = getC(plan.targetId);
          if (tgt && tgt.hp > 0) {
            const dmg = pRoll;
            newCombatants = newCombatants.map((c) =>
              c.id === tgt.id
                ? {
                    ...c,
                    hp: c.hp - dmg,
                    sanity: Math.max(0, c.sanity - dmg),
                  }
                : c
            );
            logText += `${owner.name}命中${tgt.name}，${dmg}伤害 `;
          }
        }
      });
      if (logText) addLog(logText.trim(), 'damage');
      setCombatants(newCombatants);
      setClashResults((p) => [...p, { plan, oppPlan, result: { unopposed: true } }]);
      setTimeout(() => resolveNextClash(index + 1), 0);
      return;
    }

    if (!eSkill) {
      setClashResults((p) => [...p, { plan, result: null, skipped: true }]);
      setTimeout(() => resolveNextClash(index + 1), 0);
      return;
    }

    // clash: generate per-action rolls
    const actionResults = [];
    let newCombatants = combatants;
    const fd = getUsedDiceForPlan(index);

    const getWorkingCombatant = (id) => newCombatants.find((c) => c.id === id);
    const consumeEvadeLeftover = (id) => {
      const leftover = getWorkingCombatant(id)?.evadeLeftover || 0;
      if (leftover > 0) {
        newCombatants = newCombatants.map((c) =>
          c.id === id ? { ...c, evadeLeftover: 0 } : c
        );
      }
      return leftover;
    };
    const setEvadeLeftover = (id, value) => {
      newCombatants = newCombatants.map((c) =>
        c.id === id ? { ...c, evadeLeftover: Math.max(0, value) } : c
      );
    };

    for (let aIdx = 0; aIdx < maxActions; aIdx++) {
      const pAction = oSkill.actions[aIdx] || null;
      const eAction = eSkill.actions[aIdx] || null;

      const pRoll = pAction
        ? (fd[`p${aIdx}`] !== undefined ? fd[`p${aIdx}`] : roll(pAction.min, pAction.max))
        : 0;
      const eRoll = eAction
        ? (fd[`e${aIdx}`] !== undefined ? fd[`e${aIdx}`] : roll(eAction.min, eAction.max))
        : 0;

      let result = null;
      let logText = '';
      let logType = 'info';
      let displayPRoll = pRoll;
      let displayERoll = eRoll;

      if (pAction && eAction) {
        const oIsAttack = pAction.type === 'attack';
        const eIsAttack = eAction.type === 'attack';

        if (!oIsAttack && eIsAttack) {
          // owner defending/evading vs opp attacking
          const inheritedEvade = consumeEvadeLeftover(owner.id);
          const effectivePRoll = pRoll + inheritedEvade;
          const dmg = Math.max(0, eRoll - effectivePRoll);
          const inheritedText = inheritedEvade > 0 ? `（继承闪避+${inheritedEvade}）` : '';
          displayPRoll = effectivePRoll;

          if (pAction.type === 'evade') {
            result = calcEvadeResult(effectivePRoll, eRoll);
            if (result.hit) {
              newCombatants = newCombatants.map((c) =>
                c.id === owner.id ? { ...c, hp: c.hp - dmg, sanity: Math.max(0, c.sanity - dmg) } : c
              );
              logText = `${oppPlan ? (getC(oppPlan.ownerId)?.name) : '?'}命中！${owner.name}受${dmg}伤害${inheritedText}`;
              logType = 'damage';
            } else {
              setEvadeLeftover(owner.id, result.evadeLeftover);
              newCombatants = newCombatants.map((c) =>
                c.id === owner.id
                  ? { ...c, sanity: Math.min(c.maxSanity, c.sanity + effectivePRoll) }
                  : c
              );
              logText = `${owner.name}闪避成功${inheritedText}，回复${effectivePRoll}混乱，保留${result.evadeLeftover}闪避`;
              logType = 'evade';
            }
          } else {
            const blocked = effectivePRoll >= eRoll;
            result = { hit: !blocked, dmg };
            if (!blocked) {
              newCombatants = newCombatants.map((c) =>
                c.id === owner.id ? { ...c, hp: c.hp - dmg, sanity: Math.max(0, c.sanity - dmg) } : c
              );
              logText = `${oppPlan ? getC(oppPlan.ownerId)?.name : '?'}命中！${owner.name}受${dmg}伤害${inheritedText}`;
              logType = 'damage';
            } else {
              logText = `防御成功，无伤害${inheritedText}`;
              logType = 'defense';
            }
          }
        } else if (oIsAttack && !eIsAttack) {
          // owner attacking vs opp defending/evading
          const inheritedEvade = consumeEvadeLeftover(oppPlan.ownerId);
          const effectiveERoll = eRoll + inheritedEvade;
          const dmg = Math.max(0, pRoll - effectiveERoll);
          const blocked = effectiveERoll >= pRoll;
          const oppName = getC(oppPlan.ownerId)?.name || '?';
          const inheritedText = inheritedEvade > 0 ? `（继承闪避+${inheritedEvade}）` : '';
          displayERoll = effectiveERoll;

          if (eAction.type === 'evade') {
            result = calcEvadeResult(effectiveERoll, pRoll);
            if (result.hit) {
              newCombatants = newCombatants.map((c) =>
                c.id === oppPlan.ownerId ? { ...c, hp: c.hp - dmg, sanity: Math.max(0, c.sanity - dmg) } : c
              );
              logText = `${owner.name}命中${oppName}，${dmg}伤害${inheritedText}`;
              logType = 'damage';
            } else {
              setEvadeLeftover(oppPlan.ownerId, result.evadeLeftover);
              newCombatants = newCombatants.map((c) =>
                c.id === oppPlan.ownerId
                  ? { ...c, sanity: Math.min(c.maxSanity, c.sanity + effectiveERoll) }
                  : c
              );
              logText = `${oppName}闪避成功${inheritedText}，回复${effectiveERoll}混乱，保留${result.evadeLeftover}闪避`;
              logType = 'evade';
            }
          } else {
            result = { hit: !blocked, dmg };
            if (!blocked) {
              newCombatants = newCombatants.map((c) =>
                c.id === oppPlan.ownerId ? { ...c, hp: c.hp - dmg, sanity: Math.max(0, c.sanity - dmg) } : c
              );
              logText = `${owner.name}命中${oppName}，${dmg}伤害${inheritedText}`;
              logType = 'damage';
            } else {
              logText = `${oppName}防御成功${inheritedText}`;
              logType = 'defense';
            }
          }
        } else if (oIsAttack && eIsAttack) {
          // both attack: higher wins, ties = nothing
          const oppName = getC(oppPlan.ownerId)?.name || '?';
          if (pRoll > eRoll) {
            result = { oWins: true, dmg: pRoll };
            newCombatants = newCombatants.map((c) =>
              c.id === oppPlan.ownerId ? { ...c, hp: c.hp - pRoll, sanity: Math.max(0, c.sanity - pRoll) } : c
            );
            logText = `${owner.name}攻击胜出！${oppName}受${pRoll}伤害`;
            logType = 'damage';
          } else if (eRoll > pRoll) {
            result = { oWins: false, dmg: eRoll };
            newCombatants = newCombatants.map((c) =>
              c.id === owner.id ? { ...c, hp: c.hp - eRoll, sanity: Math.max(0, c.sanity - eRoll) } : c
            );
            logText = `${oppName}攻击胜出！${owner.name}受${eRoll}伤害`;
            logType = 'damage';
          } else {
            result = { tie: true };
            logText = '双方攻击平局';
            logType = 'info';
          }
        } else {
          result = { hit: false, dmg: 0 };
          logText = '双方防御，无事发生';
          logType = 'info';
        }
      }

      if (logText) addLog(logText, logType);
      actionResults.push({ pAction, eAction, pRoll: displayPRoll, eRoll: displayERoll, result });
    }

    setCombatants(newCombatants);
    setClashResults((p) => [
      ...p,
      { plan, oppPlan, actionResults, skipped: false },
    ]);
    setClashIndex(index + 1);

    // check win
    const newAlliesAlive = newCombatants.filter((c) => c.side === 'ally' && c.hp > 0).length;
    const newEnemiesAlive = newCombatants.filter((c) => c.side === 'enemy' && c.hp > 0).length;
    if (newAlliesAlive === 0) {
      setPhase(Phase.COMBAT_END);
      setWinnerSide('enemy');
      addLog('盟友全灭！敌人获胜！', 'damage');
      setResolving(false);
      return;
    }
    if (newEnemiesAlive === 0) {
      setPhase(Phase.COMBAT_END);
      setWinnerSide('ally');
      addLog('敌人全灭！盟友获胜！', 'damage');
      setResolving(false);
      return;
    }

    setResolving(true);
  };

  const handleNextClash = () => {
    setResolving(false);
    resolveNextClash(clashIndex);
  };

  // ============ ROUND END ============
  const handleNextRound = () => {
    // stunned recovery
    const newCombatants = combatants.map((c) => {
      if (c.stunned && c.hp > 0) {
        addLog(`${c.name}从混乱中恢复`, 'system');
        return { ...c, stunned: false, sanity: Math.min(c.maxSanity, c.sanity + Math.ceil(c.maxSanity * 0.3)) };
      }
      // if sanity = 0, stun next round
      if (c.hp > 0 && c.sanity <= 0) {
        addLog(`${c.name}混乱归零，陷入昏迷！`, 'system');
        return { ...c, stunned: true, sanity: Math.ceil(c.maxSanity * 0.2) };
      }
      return c;
    }).map((c) => ({ ...c, evadeLeftover: 0 }));
    setCombatants(newCombatants);
    setSpeedDice([]);
    setPlans([]);
    setClashIndex(0);
    setClashResults([]);
    setResolving(false);
    setPhase(Phase.ROLLING);
    setRound((r) => r + 1);
  };

  const handleRestart = () => {
    setPhase(Phase.ROLLING);
    setRound(1);
    setCombatants([...defaultAllies.map(clone), ...defaultEnemies.map(clone)]);
    setSpeedDice([]);
    setPlans([]);
    setCurrentPlanSlot(0);
    setClashIndex(0);
    setClashResults([]);
    setResolving(false);
    setWinnerSide(null);
    setLog([]);
  };

  const phaseLabels = {
    [Phase.ROLLING]: '等待速度骰',
    [Phase.SPEED_DISPLAY]: '先攻顺序',
    [Phase.ENEMY_PLAN]: '敌方计划中',
    [Phase.ALLY_PLAN]: '选择你的行动',
    [Phase.RESOLVING]: '拼点结算中',
    [Phase.ROUND_END]: '回合结束',
    [Phase.COMBAT_END]: '战斗结束',
  };

  // ============ RENDER ============
  const renderSpeedBar = () => (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {speedDice.map((sd, idx) => {
        const c = getC(sd.combatantId);
        const isAlly = c?.side === 'ally';
        const isDead = !c || c.hp <= 0;
        return (
          <div
            key={idx}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-all duration-300 ${
              isDead ? 'opacity-30' : ''
            }`}
            style={{
              background: isDead ? 'var(--color-track)' : 'var(--color-card)',
              color: isDead ? 'var(--color-text-secondary)' : isAlly ? '#3498db' : '#e74c3c',
              borderColor: isDead ? 'transparent' : isAlly ? '#3498db' : '#e74c3c',
              borderWidth: '2px',
            }}
          >
            {c?.name || '?'} ⚡{sd.value}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-[940px] mx-auto p-5">
      {/* header */}
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

      {/* alive combatant bars */}
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        {aliveAllies().map((c) => (
          <StatusBar key={c.id} character={c} isActive={false} />
        ))}
        <div className="w-full flex justify-center py-1">
          <span
            className="text-xl font-black"
            style={{ color: 'var(--color-accent)', textShadow: '0 0 8px var(--color-accent-glow)' }}
          >
            ⚡ VS ⚡
          </span>
        </div>
        {aliveEnemies().map((c) => (
          <StatusBar key={c.id} character={c} isActive={false} />
        ))}
      </div>

      {/* speed bar */}
      {speedDice.length > 0 && renderSpeedBar()}

      {/* ---- ROLLING ---- */}
      {phase === Phase.ROLLING && (
        <div className="mb-5 text-center">
          <button
            className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleRollSpeed}
          >
            🎲 投速度骰 ({aliveAllies().length}v{aliveEnemies().length})
          </button>
        </div>
      )}

      {/* ---- ENEMY_PLAN ---- */}
      {phase === Phase.ENEMY_PLAN && (
        <div className="mb-5 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            敌方正在制定计划...
          </p>
          <button
            className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleEnemyAutoPlan}
          >
            👁️ 查看敌方计划
          </button>
        </div>
      )}

      {/* ---- ALLY_PLAN ---- */}
      {phase === Phase.ALLY_PLAN && currentAllyPlan && (
        <div className="mb-5">
          <div className="mb-3 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            选择 {getC(currentAllyPlan.ownerId)?.name} 的行动 ({currentPlanSlot + 1}/{allyPlanSlots.length})
            速度: <strong style={{ color: 'var(--color-accent)' }}>{currentAllyPlan.speedValue}</strong>
          </div>

          {/* target selection */}
          <div className="mb-4">
            <h4
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              🎯 选择攻击目标
            </h4>
            <div className="flex flex-wrap gap-2">
              {aliveEnemies().map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAllySelectTarget(c.id)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer transition-all duration-200 ${
                    currentAllyPlan.targetId === c.id ? '' : ''
                  }`}
                  style={{
                    background:
                      currentAllyPlan.targetId === c.id
                        ? 'var(--color-accent-bg)'
                        : 'var(--color-card)',
                    color: 'var(--color-text)',
                    borderColor:
                      currentAllyPlan.targetId === c.id
                        ? 'var(--color-accent)'
                        : 'var(--color-track)',
                  }}
                >
                  {c.name} (HP: {c.hp})
                </button>
              ))}
            </div>
          </div>

          {/* skill selection */}
          {currentAllyPlan.targetId && (
            <SkillSelector
              skills={getC(currentAllyPlan.ownerId)?.skills || []}
              selectedSkill={
                currentAllyPlan.skill
                  ? getC(currentAllyPlan.ownerId)?.skills.find(
                      (s) => s.name === currentAllyPlan.skill.name
                    )
                  : null
              }
              onSelect={handleAllySelectSkill}
              disabled={false}
              label="📋 选择技能"
            />
          )}

          {/* interception info */}
          {currentAllyPlan.targetId && (
            (() => {
              const inter = checkInterception(currentAllyPlan.targetId);
              return inter ? (
                <div
                  className="text-sm p-2.5 rounded-lg mt-3"
                  style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71' }}
                >
                  🛡️ 自动拦截！{getC(currentAllyPlan.ownerId)?.name}将拦截{inter.map((i) => `${getC(plans[i.planIndex].ownerId)?.name}对${i.victim}的攻击`).join('、')}
                </div>
              ) : null;
            })()
          )}

          <button
            className="mx-auto mt-4 px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onClick={handleAllyConfirm}
            disabled={!currentAllyPlan.targetId || !currentAllyPlan.skill}
          >
            {currentPlanSlot + 1 >= allyPlanSlots.length ? '⚡ 开始结算' : '✓ 确认 → 下一人'}
          </button>
        </div>
      )}

      {/* ---- RESOLVING ---- */}
      {phase === Phase.RESOLVING && (
        <div className="mb-5">
          <div className="mb-4">
            {clashResults.map((cr, idx) =>
              cr.skipped ? null : cr.actionResults ? (
                <ClashDisplay
                  key={idx}
                  actionResults={cr.actionResults}
                  ownerName={getC(cr.plan.ownerId)?.name || '?'}
                  oppName={getC(cr.oppPlan?.ownerId)?.name || '?'}
                  isActive={idx === clashResults.length - 1}
                />
              ) : cr.result?.unopposed ? (
                <div
                  key={idx}
                  className="rounded-xl p-[14px_18px] mb-2.5"
                  style={{
                    background: 'var(--color-card)',
                    opacity: 0.7,
                  }}
                >
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {getC(cr.plan.ownerId)?.name} 发动攻击，未遇对手
                  </span>
                </div>
              ) : null
            )}
          </div>
          {resolving && (
            <div className="flex flex-col items-center gap-2.5">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                → 第 {Math.min(clashResults.length + 1, plans.length)}/{plans.length} 拼点
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
          {!resolving && (
            <div className="text-center">
              {phase === Phase.ROUND_END ? (
                <button
                  className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                  onClick={handleNextRound}
                >
                  ➡ 下一回合
                </button>
              ) : phase === Phase.COMBAT_END ? (
                <button
                  className="mx-auto px-8 py-3 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                  onClick={handleRestart}
                >
                  🔄 重新开始
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ---- ROUND_END ---- */}
      {phase === Phase.ROUND_END && (
        <div className="mb-5">
          <div className="mb-4">
            {clashResults.map((cr, idx) =>
              cr.actionResults ? (
                <ClashDisplay
                  key={idx}
                  actionResults={cr.actionResults}
                  ownerName={getC(cr.plan.ownerId)?.name || '?'}
                  oppName={getC(cr.oppPlan?.ownerId)?.name || '?'}
                  isActive={false}
                />
              ) : null
            )}
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

      {/* ---- COMBAT_END ---- */}
      {phase === Phase.COMBAT_END && (
        <div className="mb-5 text-center">
          <div
            className="text-[28px] font-black mb-4 animate-victory-pulse"
            style={{ color: 'var(--color-accent)' }}
          >
            {winnerSide === 'ally' ? '🎉 盟友获胜！' : '💀 敌人获胜！'}
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

      {/* log */}
      <div className="mt-5">
        <BattleLog entries={log} />
      </div>
    </div>
  );
}

export default CombatPhase;