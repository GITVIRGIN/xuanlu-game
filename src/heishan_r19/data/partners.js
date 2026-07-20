import { ALL_CANON_CHARACTERS } from './characters.js';
import { REVIVAL_RULES } from '../contracts/partyScale.js';

const COSTS = ['压力+1', '旧案线索-1', '首轮伤害-1'];

const COMBAT_PROFILES = Object.freeze({
  'shen-li': Object.freeze({ timing: 'before-hero', action: 'guard', actionName: '截势', power: 2, guard: 2, visualCue: 'ally-guard' }),
  'yue-chenbei': Object.freeze({ timing: 'before-hero', action: 'guard', actionName: '立碑', power: 1, guard: 3, armorGrant: 1, visualCue: 'ally-guard' }),
  'lu-qinglu': Object.freeze({ timing: 'before-hero', action: 'strike', actionName: '引雷', power: 7, armorBreak: 1, visualCue: 'armor-break' }),
  'chi-yao': Object.freeze({ timing: 'after-hero', action: 'execute', actionName: '追债', power: 7, executeBonus: 3, visualCue: 'hit-slash' }),
  'wen-fuji': Object.freeze({ timing: 'before-hero', action: 'control', actionName: '照心', power: 3, control: 2, visualCue: 'pressure-pulse', pressureRelief: Object.freeze({ threshold: 7, amount: 2, uses: 1, actionName: '照心定念' }) }),
  'xuan-yu': Object.freeze({ timing: 'before-hero', action: 'guard', actionName: '镇门', power: 1, guard: 2, armorGrant: 2, visualCue: 'ally-guard', pressureRelief: Object.freeze({ threshold: 7, amount: 3, uses: 1, actionName: '镇门定息' }) }),
  'su-yanhui': Object.freeze({ timing: 'after-hero', action: 'pursuit', actionName: '追牒', power: 5, roundScaling: 1, visualCue: 'hit-slash' }),
  'bai-heng': Object.freeze({ timing: 'after-hero', action: 'heal', actionName: '缀命', power: 3, heal: 4, visualCue: 'intro', pressureRelief: Object.freeze({ threshold: 8, amount: 2, uses: 1, actionName: '缀命理脉' }), revive: REVIVAL_RULES.baiHeng }),
  'liu-jisheng': Object.freeze({ timing: 'before-hero', action: 'control', actionName: '移印', power: 2, control: 2, armorBreak: 1, visualCue: 'armor-break' })
});

export const PARTNERS = ALL_CANON_CHARACTERS.map((character, index) => ({
  id: `partner-${character.id}`,
  characterId: character.id,
  name: character.name,
  role: character.role,
  tags: [character.mainDaomai],
  maxHp: character.maxHp,
  armor: character.armor,
  damage: character.damage,
  passive: character.unique,
  cost: COSTS[index % COSTS.length],
  asset: character.asset,
  combatProfile: COMBAT_PROFILES[character.id]
}));

export function getPartner(id) {
  return PARTNERS.find((partner) => partner.id === id) || PARTNERS[0];
}
