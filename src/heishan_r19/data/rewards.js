export const REWARDS = [
  { id: 'old-armor-oil', name: '旧甲灯油', rarity: '寻常', immediate: '护甲 +2', delta: { armor: 2 }, daomai: { xuanjia: 1 }, oldCause: '旧因·灯油浸甲' },
  { id: 'thunder-token', name: '雷契铜筹', rarity: '精良', immediate: '伤害 +2，压力 +1', delta: { damage: 2, pressure: 1 }, daomai: { leiqi: 1 }, oldCause: '旧因·雷契旧债' },
  { id: 'case-fragment', name: '封门残页', rarity: '精良', immediate: '破局线索 +1', delta: { clues: 1 }, daomai: { jiuyan: 1 }, oldCause: '旧因·封门旧案' },
  { id: 'warm-wine', name: '余温酒盏', rarity: '寻常', immediate: '全队恢复 5', scope: 'party', delta: { hp: 5 }, daomai: { jiuhuo: 1 }, oldCause: '旧因·炉火余温' },
  { id: 'cinnabar-nail', name: '朱砂门钉', rarity: '稀有', immediate: '压力 -2', delta: { pressure: -2 }, daomai: { zhenfu: 1 }, oldCause: '旧因·朱砂镇符' },
  { id: 'blood-ledger', name: '血印账页', rarity: '稀有', immediate: '伤害 +3，生命 -3', delta: { damage: 3, hp: -3 }, daomai: { xuezhai: 1 }, oldCause: '旧因·血债契约' },
  { id: 'company-seal', name: '同行印', rarity: '精良', immediate: '同行者护甲 +1，伙伴联动', scope: 'partners', delta: { armor: 1 }, daomai: { partner: 1 }, requirements: { minPartners: 1 }, oldCause: '旧因·同行之誓' },
  { id: 'soul-returning-paper', name: '扶魂符纸', rarity: '稀有', immediate: '扶魂符 +1', delta: {}, counterDelta: { reviveSeals: 1 }, daomai: { jiuhuo: 1, zhenfu: 1 }, requirements: { openReviveSealSlots: 1 }, oldCause: '旧因·扶魂符纸' },
  { id: 'warded-armor', name: '镇符旧甲', rarity: '遗物', immediate: '护甲 +3，压力 -1', delta: { armor: 3, pressure: -1 }, daomai: { xuanjia: 1, zhenfu: 1 }, oldCause: '旧因·镇符旧甲' },
  { id: 'archive-thunder', name: '雷烧案卷', rarity: '遗物', immediate: '伤害 +2，破局线索 +1', delta: { damage: 2, clues: 1 }, daomai: { leiqi: 1, jiuyan: 1 }, oldCause: '旧因·雷烧案卷' }
];

export const RESCUE_RECOVERY_REWARDS = Object.freeze([
  Object.freeze({ id: 'recovery-bandage', name: '撤路药散', rarity: '救援补给', immediate: '全队恢复 8', scope: 'party', delta: { hp: 8 }, daomai: { jiuhuo: 1 }, oldCause: '旧因·撤路药散' }),
  Object.freeze({ id: 'recovery-guard', name: '弃置护臂', rarity: '救援补给', immediate: '护甲 +3，压力 -1', delta: { armor: 3, pressure: -1 }, daomai: { xuanjia: 1 }, oldCause: '旧因·弃置护臂' }),
  Object.freeze({ id: 'recovery-talisman', name: '静息残符', rarity: '救援补给', immediate: '压力 -3，破局线索 +1', delta: { pressure: -3, clues: 1 }, daomai: { zhenfu: 1 }, oldCause: '旧因·静息残符' })
]);

export function rewardChoices(seed, count = 3, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const pool = REWARDS.filter((reward) => !excluded.has(reward.id));
  if (!pool.length) return [];
  const start = Math.abs(seed * 5 + 3) % pool.length;
  const ordered = pool.slice(start).concat(pool.slice(0, start));
  const odd = ordered.filter((_, index) => index % 2 === 0);
  const even = ordered.filter((_, index) => index % 2 === 1);
  return odd.concat(even).slice(0, Math.min(count, pool.length));
}

export function rescueRecoveryChoices(seed, count = 3) {
  const start = Math.abs(seed) % RESCUE_RECOVERY_REWARDS.length;
  return Array.from({ length: Math.min(count, RESCUE_RECOVERY_REWARDS.length) }, (_, index) => RESCUE_RECOVERY_REWARDS[(start + index) % RESCUE_RECOVERY_REWARDS.length]);
}
