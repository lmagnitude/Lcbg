// ============================================================
// 预设技能数据
// ============================================================
export const playerSkills = [
  {
    name: '掩护转移',
    actions: [
      { type: 'defense', min: 2, max: 3 },
      { type: 'evade', min: 1, max: 6 },
    ],
  },
  {
    name: '精准打击',
    actions: [
      { type: 'attack', min: 3, max: 5 },
      { type: 'attack', min: 2, max: 4 },
    ],
  },
];

export const enemySkills = [
  {
    name: '爪击',
    actions: [
      { type: 'attack', min: 3, max: 4 },
      { type: 'attack', min: 2, max: 3 },
    ],
  },
  {
    name: '防御姿态',
    actions: [
      { type: 'defense', min: 2, max: 4 },
      { type: 'defense', min: 1, max: 3 },
    ],
  },
];

// ============================================================
// 3v3 预设战斗者 (Combatant)
// ============================================================
export const defaultAllies = [
  {
    id: 'a1',
    name: '调查员A',
    side: 'ally',
    hp: 13,
    maxHp: 13,
    sanity: 14,
    maxSanity: 14,
    speedDieCount: 1,
    speed: { min: 2, max: 5 },
    skills: playerSkills,
    stunned: false,
  },
  {
    id: 'a2',
    name: '调查员B',
    side: 'ally',
    hp: 13,
    maxHp: 13,
    sanity: 14,
    maxSanity: 14,
    speedDieCount: 1,
    speed: { min: 2, max: 5 },
    skills: playerSkills,
    stunned: false,
  },
  {
    id: 'a3',
    name: '调查员C',
    side: 'ally',
    hp: 13,
    maxHp: 13,
    sanity: 14,
    maxSanity: 14,
    speedDieCount: 1,
    speed: { min: 2, max: 5 },
    skills: playerSkills,
    stunned: false,
  },
];

export const defaultEnemies = [
  {
    id: 'e1',
    name: '深潜者A',
    side: 'enemy',
    hp: 13,
    maxHp: 13,
    sanity: 14,
    maxSanity: 14,
    speedDieCount: 1,
    speed: { min: 2, max: 5 },
    skills: enemySkills,
    stunned: false,
  },
  {
    id: 'e2',
    name: '深潜者B',
    side: 'enemy',
    hp: 13,
    maxHp: 13,
    sanity: 14,
    maxSanity: 14,
    speedDieCount: 1,
    speed: { min: 2, max: 5 },
    skills: enemySkills,
    stunned: false,
  },
  {
    id: 'e3',
    name: '深潜者C',
    side: 'enemy',
    hp: 13,
    maxHp: 13,
    sanity: 14,
    maxSanity: 14,
    speedDieCount: 1,
    speed: { min: 2, max: 5 },
    skills: enemySkills,
    stunned: false,
  },
];

// 保持向后兼容（调试面板 / 简单场景可能用到）
export const defaultPlayer = defaultAllies[0];
export const defaultEnemy = defaultEnemies[0];

// ============================================================
// 战斗阶段枚举
// ============================================================
export const Phase = {
  ROLLING: 'ROLLING',
  SPEED_DISPLAY: 'SPEED_DISPLAY',
  ENEMY_PLAN: 'ENEMY_PLAN',
  ALLY_PLAN: 'ALLY_PLAN',
  RESOLVING: 'RESOLVING',
  ROUND_END: 'ROUND_END',
  COMBAT_END: 'COMBAT_END',
};

// ============================================================
// 工具函数
// ============================================================
export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function cloneCombatants(combatants) {
  return combatants.map((c) => ({ ...c, skills: c.skills }));
}

export function findCombatant(combatants, id) {
  return combatants.find((c) => c.id === id);
}

export function getAliveAllies(combatants) {
  return combatants.filter((c) => c.side === 'ally' && c.hp > 0);
}

export function getAliveEnemies(combatants) {
  return combatants.filter((c) => c.side === 'enemy' && c.hp > 0);
}

export const actionTypeLabel = {
  attack: '攻击',
  defense: '防御',
  evade: '闪避',
};

export const damageTypes = ['斩击', '突刺', '打击'];