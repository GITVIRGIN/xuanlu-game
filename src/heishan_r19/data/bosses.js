import { R20_BOSS_ASSETS } from '../../heishan_r20/data/assetRoles.js';

const MAIN = [
  ['boss-yaojiang','妖将','sunder','带回被封存的军册残页。'],
  ['boss-shanjun','山君','suppress','压力猎杀不是终点，是门槛。'],
  ['boss-heishan','黑山老妖','dispel','它是守卷人，不是源头。']
];

const HIDDEN = [];

function createBoss([id, name, counter, meaning], index, hidden = false) {
  const maxHp = 150 + index * 7 + (hidden ? 45 : 0);
  return {
    id, name, hidden, counter, maxHp,
    armor: 12 + (index % 4) + (hidden ? 2 : 0),
    attack: 10 + (index % 3) + (hidden ? 2 : 0),
    victoryMeaning: meaning,
    asset: R20_BOSS_ASSETS[id],
    phases: [
      { id: 1, name: '初势·试探', threshold: 1, mechanic: '以旧案压住第一轮攻势' },
      { id: 2, name: '显形·撕甲', threshold: 0.66, mechanic: '撕甲并读取主修道脉' },
      { id: 3, name: '逼命·绝杀', threshold: 0.33, mechanic: '高压处决，破局线索可削弱' }
    ]
  };
}

export const BOSSES = MAIN.map((boss, index) => createBoss(boss, index));
export const HIDDEN_BOSSES = HIDDEN.map((boss, index) => createBoss(boss, index, true));
export const ALL_BOSSES = [...BOSSES, ...HIDDEN_BOSSES];
export const RECOVERY_CANON_BOSS_IDS = ['boss-yaojiang', 'boss-shanjun', 'boss-heishan'];
export const RECOVERY_CANON_BOSSES = RECOVERY_CANON_BOSS_IDS
  .map((id) => BOSSES.find((boss) => boss.id === id));

export function getBoss(id) {
  return RECOVERY_CANON_BOSSES.find((boss) => boss.id === id) || RECOVERY_CANON_BOSSES[0];
}
