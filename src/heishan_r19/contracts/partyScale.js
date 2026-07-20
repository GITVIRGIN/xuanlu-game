export const PARTY_LIMITS = Object.freeze({
  maxPartners: 3,
  startingReviveSeals: 1,
  maxReviveSeals: 2,
  bossHpPerPartner: 44
});

export const REVIVAL_RULES = Object.freeze({
  seal: Object.freeze({
    id: 'revive-seal',
    name: '扶魂符',
    healthPercent: 30,
    pressureCost: 1
  }),
  baiHeng: Object.freeze({
    id: 'bai-heng-stitch-revive',
    name: '缀命回针',
    healthPercent: 25,
    pressureCost: 2,
    usesPerCombat: 1
  })
});

export function clampReviveSeals(value) {
  return Math.max(0, Math.min(PARTY_LIMITS.maxReviveSeals, Number(value) || 0));
}

export function revivedHealth(maxHp, percent) {
  return Math.max(1, Math.ceil(Math.max(1, Number(maxHp) || 1) * Math.max(0, Number(percent) || 0) / 100));
}
