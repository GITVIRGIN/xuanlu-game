function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(freezeDeep);
  return value;
}

export function createCombatSnapshot({
  heroHp,
  heroMaxHp,
  heroArmor,
  pressure,
  enemyHp,
  enemyMaxHp,
  enemyArmor,
  phase = 0,
  reviveSeals = 0,
  partners = []
}) {
  return freezeDeep({
    heroHp: Math.max(0, heroHp),
    heroMaxHp,
    heroArmor: Math.max(0, heroArmor),
    pressure: Math.max(0, Math.min(10, pressure)),
    enemyHp: Math.max(0, enemyHp),
    enemyMaxHp,
    enemyArmor: Math.max(0, enemyArmor),
    phase,
    reviveSeals: Math.max(0, Number(reviveSeals) || 0),
    partners: partners.map((partner, index) => ({
      id: partner.id,
      characterId: partner.characterId || '',
      name: partner.name || partner.id,
      hp: Math.max(0, Number(partner.hp || 0)),
      maxHp: Math.max(1, Number(partner.maxHp || 1)),
      armor: Math.max(0, Number(partner.armor || 0)),
      damage: Math.max(0, Number(partner.damage || 0)),
      alive: Number(partner.hp || 0) > 0,
      joinOrder: Number(partner.joinOrder || index + 1)
    }))
  });
}

export function createCombatLog(beforeState, afterState, details) {
  const beforePartners = new Map(beforeState.partners.map((partner) => [partner.id, partner]));
  const partnerDeltas = afterState.partners.map((partner) => {
    const before = beforePartners.get(partner.id) || { hp: 0, armor: 0, damage: partner.damage };
    return {
      id: partner.id,
      hpDelta: partner.hp - before.hp,
      armorDelta: partner.armor - before.armor,
      damageDelta: partner.damage - before.damage,
      downed: before.hp > 0 && partner.hp === 0,
      revived: before.hp === 0 && partner.hp > 0
    };
  });
  return freezeDeep({
    beforeState,
    afterState,
    actorId: details.actorId,
    targetId: details.targetId,
    actionType: details.actionType,
    hpDelta: afterState.heroHp - beforeState.heroHp,
    armorDelta: afterState.heroArmor - beforeState.heroArmor,
    pressureDelta: afterState.pressure - beforeState.pressure,
    reviveSealDelta: afterState.reviveSeals - beforeState.reviveSeals,
    enemyHpDelta: afterState.enemyHp - beforeState.enemyHp,
    enemyArmorDelta: afterState.enemyArmor - beforeState.enemyArmor,
    partnerDeltas,
    declaredAmount: Math.max(0, details.declaredAmount || 0),
    appliedAmount: Math.max(0, details.appliedAmount || 0),
    mitigatedAmount: Math.max(0, details.mitigatedAmount || 0),
    round: Math.max(0, details.round || 0),
    visualCue: details.visualCue,
    isTerminal: Boolean(details.isTerminal),
    text: details.text,
    phaseLabel: details.phaseLabel || '',
    originalTargetId: details.originalTargetId || '',
    actualTargetId: details.actualTargetId || details.targetId || '',
    reportLabel: details.reportLabel || '',
    revivalSource: details.revivalSource || '',
    revivedPartnerId: details.revivedPartnerId || '',
    revivedHealth: Math.max(0, Number(details.revivedHealth) || 0),
    baiHengReviveConsumed: Boolean(details.baiHengReviveConsumed)
  });
}

export function finalStateFromLogs(logs) {
  return logs.length ? logs[logs.length - 1].afterState : null;
}
