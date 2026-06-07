// 预设技能数据
// 每个技能含 name 和 actions 数组
// action: { type: 'attack' | 'defense' | 'evade', min: number, max: number }

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

// 预设角色
export const defaultPlayer = {
  name: '调查员',
  hp: 13,
  maxHp: 13,
  sanity: 14,
  maxSanity: 14,
  speed: { min: 2, max: 5 },
  skills: playerSkills,
};

export const defaultEnemy = {
  name: '深潜者',
  hp: 13,
  maxHp: 13,
  sanity: 14,
  maxSanity: 14,
  speed: { min: 2, max: 5 },
  skills: enemySkills,
};

// 战斗阶段枚举
export const Phase = {
  ROLLING: 'ROLLING',
  ENEMY_SKILL: 'ENEMY_SKILL',
  PLAYER_SKILL: 'PLAYER_SKILL',
  RESOLVING: 'RESOLVING',
  ROUND_END: 'ROUND_END',
  COMBAT_END: 'COMBAT_END',
};

// 骰子工具
export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 动作类型中文名
export const actionTypeLabel = {
  attack: '攻击',
  defense: '防御',
  evade: '闪避',
};

export const damageTypes = ['斩击', '突刺', '打击'];