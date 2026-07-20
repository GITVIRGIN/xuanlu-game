import { createCombatLog, createCombatSnapshot, finalStateFromLogs } from './combatLogSnapshots.js';
import { DAOMAI_IDS, daomaiEffectValue } from '../data/daomai.js';
import { debtImpact } from '../data/debt.js';
import { getPartner } from '../data/partners.js';
import { runStageForNode } from './runDirector.js';
import { PARTY_LIMITS, REVIVAL_RULES, revivedHealth as revivedHealthAmount } from '../contracts/partyScale.js';

export const BOSS_PREPARATION_REQUIREMENTS = Object.freeze({
  score: 58,
  nearScore: 55,
  nearBossPrepCount: 2,
  thresholdCount: 2,
  oldCauseCount: 2,
  clueCount: 3
});

export const BOSS_FORMATION_REQUIREMENTS = Object.freeze({
  thresholdCount: 6,
  bonus: 3,
  partnerDaomaiGoal: 7
});

export const BOSS_OBJECTIVE = Object.freeze({
  id: 'seal-before-third-form',
  phaseLimit: 3,
  title: '山门封合前完成破局',
  rule: '第三势结算前击倒首领；首领仍存活则山门封合，队伍被迫退场。'
});

export const BOSS_PREPARATION_BARRIERS = Object.freeze({
  near: 72,
  unprepared: 96,
  synergyNear: Object.freeze({ 'bai-heng:guizang': 23 })
});

export const COMBAT_STALEMATE_RULES = Object.freeze({
  ordinary: Object.freeze({ evaluationRound: 10, requiredConsecutiveRounds: 3 }),
  elite: Object.freeze({ evaluationRound: 12, requiredConsecutiveRounds: 3 }),
  safetyRoundLimit: 256,
  lethalRangePercent: 35,
  trivialDamagePercent: 5
});

export const PRESSURE_TACTICS = Object.freeze({
  collapseThreshold: 10,
  responseWindowRounds: 1,
  enemy: Object.freeze({
    ordinary: Object.freeze({
      early: Object.freeze({ firstRound: null, interval: null, gain: 0 }),
      mid: Object.freeze({ firstRound: 4, interval: 4, gain: 2 }),
      late: Object.freeze({ firstRound: 3, interval: 3, gain: 2 })
    }),
    elite: Object.freeze({
      early: Object.freeze({ firstRound: 4, interval: 4, gain: 2 }),
      mid: Object.freeze({ firstRound: 3, interval: 3, gain: 2 }),
      late: Object.freeze({ firstRound: 2, interval: 2, gain: 3 })
    }),
    boss: Object.freeze({
      pressurePhase: 2,
      preparedGain: 2,
      nearReadyGain: 3,
      unpreparedGain: 4
    })
  }),
  player: Object.freeze({
    baseThreshold: 9,
    baseAmount: 2,
    baseUses: 1
  })
});

export function pressureStageForRun(run) {
  if (['early', 'mid', 'late'].includes(run?.pressureStage)) return run.pressureStage;
  return runStageForNode(Number.isInteger(run?.nodeIndex) ? run.nodeIndex : 5, run?.sequence?.length);
}

function enemyPressurePlan(run, tier, round) {
  if (tier === 'boss') return null;
  const table = PRESSURE_TACTICS.enemy[tier] || PRESSURE_TACTICS.enemy.ordinary;
  const plan = table[pressureStageForRun(run)];
  if (!plan?.firstRound || round < plan.firstRound || (round - plan.firstRound) % plan.interval !== 0) return null;
  return plan;
}

const EXPANSION_ROUTE_RULES = Object.freeze({
  zhuoying: '【逐影断名】连续攻击同一目标会叠加追痕；敌方进入低血线后打开断名窗口。',
  guizang: '【万象归藏】偶数轮重放一条已见攻势，同时把未处理代价写回压力。',
  wuxiang: '【无相移印】首次来袭被大幅削弱；后续移印仍减伤，但失真会逐次增压。'
});

function effect(run, id, modifier) {
  return daomaiEffectValue(id, modifier, Number(run.daomai?.[id] || 0));
}

function combatPartner(partner, index) {
  const fallback = getPartner(partner.id);
  return {
    ...fallback,
    ...partner,
    hp: Math.max(0, Number(partner.hp ?? partner.maxHp ?? fallback.maxHp)),
    maxHp: Math.max(1, Number(partner.maxHp ?? fallback.maxHp)),
    armor: Math.max(0, Number(partner.armor ?? fallback.armor ?? 0)),
    damage: Math.max(0, Number(partner.damage ?? fallback.damage ?? 0)),
    combatProfile: partner.combatProfile || fallback.combatProfile,
    joinOrder: index + 1
  };
}

function initialSnapshot(run, enemy) {
  return createCombatSnapshot({
    heroHp: run.stats.hp,
    heroMaxHp: run.stats.maxHp,
    heroArmor: run.stats.armor,
    pressure: run.stats.pressure,
    enemyHp: enemy.maxHp,
    enemyMaxHp: enemy.maxHp,
    enemyArmor: enemy.armor,
    phase: enemy.tier === 'boss' ? 1 : 0,
    reviveSeals: run.reviveSeals ?? 0,
    partners: (run.partners || []).map(combatPartner)
  });
}

function snapshotFrom(before, changes = {}) {
  return createCombatSnapshot({
    heroHp: changes.heroHp ?? before.heroHp,
    heroMaxHp: before.heroMaxHp,
    heroArmor: changes.heroArmor ?? before.heroArmor,
    pressure: changes.pressure ?? before.pressure,
    enemyHp: changes.enemyHp ?? before.enemyHp,
    enemyMaxHp: before.enemyMaxHp,
    enemyArmor: changes.enemyArmor ?? before.enemyArmor,
    phase: changes.phase ?? before.phase,
    reviveSeals: changes.reviveSeals ?? before.reviveSeals,
    partners: changes.partners ?? before.partners
  });
}

function pushLog(logs, before, changes, details) {
  const after = snapshotFrom(before, changes);
  logs.push(createCombatLog(before, after, details));
  return after;
}

function replacePartner(current, id, update) {
  return current.partners.map((partner) => partner.id === id ? { ...partner, ...update(partner) } : partner);
}

function earliestDownedPartner(current) {
  return current.partners
    .filter((partner) => partner.hp <= 0)
    .sort((left, right) => left.joinOrder - right.joinOrder)[0] || null;
}

function createRevivalState() {
  return { actorUses: new Map() };
}

function baiHengReviveAvailable(current, revivalState) {
  const baiHeng = current.partners.find((partner) => partner.id === 'partner-bai-heng' && partner.hp > 0);
  if (!baiHeng) return false;
  return (revivalState?.actorUses.get(baiHeng.id) || 0) < REVIVAL_RULES.baiHeng.usesPerCombat;
}

function revivePartner(logs, current, target, {
  actorId,
  actorName,
  actionType,
  actionName,
  healthPercent,
  pressureCost,
  consumeSeal = false,
  round,
  phase = current.phase,
  phaseLabel = '',
  baiHengReviveConsumed = false
}) {
  const restoredHp = revivedHealthAmount(target.maxHp, healthPercent);
  const pressure = Math.min(PRESSURE_TACTICS.collapseThreshold, current.pressure + pressureCost);
  const reviveSeals = consumeSeal ? Math.max(0, current.reviveSeals - 1) : current.reviveSeals;
  return pushLog(logs, current, {
    partners: replacePartner(current, target.id, () => ({ hp: restoredHp })),
    pressure,
    reviveSeals,
    phase
  }, {
    actorId,
    targetId: target.id,
    actionType,
    visualCue: 'ally-revive',
    text: `${actorName} 放弃本轮原本行动，以“${actionName}”让 ${target.name} 重新站起，生命 0→${restoredHp}/${target.maxHp}${consumeSeal ? '，扶魂符 -1' : ''}，压力 ${current.pressure}→${pressure}。`,
    isTerminal: false,
    declaredAmount: restoredHp,
    appliedAmount: restoredHp,
    mitigatedAmount: 0,
    round,
    phaseLabel,
    revivalSource: consumeSeal ? 'revive-seal' : 'bai-heng',
    revivedPartnerId: target.id,
    revivedHealth: restoredHp,
    baiHengReviveConsumed
  });
}

function livingParty(current, run) {
  const members = [];
  if (current.heroHp > 0) {
    members.push({ id: run.characterId, name: '主角', kind: 'hero', hp: current.heroHp, maxHp: current.heroMaxHp, armor: current.heroArmor, joinOrder: 0 });
  }
  for (const partner of current.partners) {
    if (partner.hp > 0) members.push({ ...partner, kind: 'partner' });
  }
  return members;
}

function partyDown(current) {
  return current.heroHp <= 0 && current.partners.every((partner) => partner.hp <= 0);
}

function lowestHealthMember(current, run, { injuredOnly = false } = {}) {
  return livingParty(current, run)
    .filter((member) => !injuredOnly || member.hp < member.maxHp)
    .sort((left, right) => (left.hp / left.maxHp) - (right.hp / right.maxHp) || left.joinOrder - right.joinOrder)[0] || null;
}

function appendExpansionRuleLog(logs, current, run, enemy, { phaseLabel = '' } = {}) {
  const text = EXPANSION_ROUTE_RULES[run.routeId];
  if (!text) return current;
  return pushLog(logs, current, {}, {
    actorId: run.characterId,
    targetId: enemy.id,
    actionType: `route_rule_${run.routeId}`,
    visualCue: 'intro',
    text,
    isTerminal: false,
    round: 0,
    phaseLabel
  });
}

function expansionPowerBonus(run, current, { opening = false, round = 1 } = {}) {
  const enemyLow = current.enemyHp * 100 <= current.enemyMaxHp * 35;
  const characterBonus = run.characterId === 'su-yanhui' && opening ? 2 : 0;
  const affinityBonus = run.characterId === 'su-yanhui' && run.routeId === 'zhuoying'
    ? 2
    : run.characterId === 'bai-heng' && run.routeId === 'guizang'
      ? 4
      : run.characterId === 'liu-jisheng' && run.routeId === 'wuxiang'
        ? 7
        : 0;
  if (run.routeId === 'zhuoying') return affinityBonus + characterBonus + (opening ? 2 : 0) + Math.min(3, Math.max(0, round - 1)) + (enemyLow ? 4 : 0);
  if (run.routeId === 'guizang') return affinityBonus + characterBonus + 1 + (round % 2 === 0 ? 3 : 0);
  return affinityBonus + characterBonus;
}

function expansionIncomingRules(run, { round = 1 } = {}) {
  const liuOpeningReduction = run.characterId === 'liu-jisheng' && round === 1 ? 2 : 0;
  if (run.routeId === 'wuxiang') {
    return {
      powerReduction: liuOpeningReduction + (round === 1 ? 3 : 1),
      pressureCost: round > 1 && round % 2 === 0 ? 1 : 0
    };
  }
  if (run.routeId === 'guizang') return { powerReduction: liuOpeningReduction, pressureCost: round % 2 === 0 ? 1 : 0 };
  return { powerReduction: liuOpeningReduction, pressureCost: 0 };
}

function expansionRouteRead(run, logs) {
  if (run.routeId === 'zhuoying') {
    const strikes = logs.filter((log) => log.actionType === 'hero_strike' || log.actionType?.startsWith('boss_phase_') && log.actionType.endsWith('_hero'));
    return { routeId: run.routeId, trace: Math.min(4, strikes.length), targetSwitches: 0, duanmingWindow: logs.some((log) => log.afterState.enemyHp * 100 <= log.afterState.enemyMaxHp * 35) };
  }
  if (run.routeId === 'guizang') {
    const replays = logs.filter((log) => (log.actionType === 'hero_strike' || log.actionType?.endsWith('_hero')) && Number(log.round || 0) % 2 === 0).length;
    return { routeId: run.routeId, savedRules: ['已见攻势'], replayCount: replays, returnedCosts: replays };
  }
  if (run.routeId === 'wuxiang') {
    const transfers = logs.filter((log) => log.actionType === 'enemy_attack' || log.actionType === 'elite_mechanic' || log.actionType?.endsWith('_attack')).length;
    return { routeId: run.routeId, transfers, distortion: Math.max(0, transfers - 1), sourceVisible: true };
  }
  return null;
}

function heroPowerBonus(run, current, { opening = false, bossPhase = 0, round = 1 } = {}) {
  const heroLow = current.heroHp > 0 && current.heroHp * 2 <= current.heroMaxHp;
  const enemyLow = current.enemyHp * 100 <= current.enemyMaxHp * 35;
  return effect(run, 'leiqi', 'attackPowerBonus')
    + (opening ? effect(run, 'leiqi', 'openingPowerBonus') : 0)
    + (heroLow ? effect(run, 'jiuhuo', 'lowHealthPowerBonus') : 0)
    + (heroLow ? effect(run, 'xuezhai', 'lowHealthPowerBonus') : 0)
    + (enemyLow ? effect(run, 'xuezhai', 'enemyLowHealthPowerBonus') : 0)
    + (bossPhase === 1 ? effect(run, 'jiuyan', 'bossPhaseOnePowerBonus') : 0)
    + expansionPowerBonus(run, current, { opening, round });
}

function incomingRules(run, { boss = false, phase = 0, round = 1, squadReduction = 0 } = {}) {
  const expansion = expansionIncomingRules(run, { round });
  return {
    powerReduction: effect(run, 'xuanjia', 'incomingPowerReduction')
      + (boss ? effect(run, 'zhenfu', 'bossIncomingPowerReduction') : 0)
      + (boss && phase === 1 ? effect(run, 'jiuyan', 'bossPhaseOneIncomingReduction') : 0)
      + squadReduction
      + expansion.powerReduction,
    armorBreakReduction: effect(run, 'xuanjia', 'incomingArmorBreakReduction') + effect(run, 'zhenfu', 'incomingArmorBreakReduction'),
    pressureReduction: effect(run, 'zhenfu', 'pressureGainReduction'),
    pressureCap: effect(run, 'zhenfu', 'pressureGainCap') || Number.POSITIVE_INFINITY,
    pressureCost: expansion.pressureCost
  };
}

function damageEnemy(logs, current, { actorId, enemy, power, armorBreak = 1, round, phase = current.phase, actionType, visualCue = 'hit-slash', text, phaseLabel = '' }) {
  const { mitigatedAmount, declaredAmount } = projectedEnemyDamage(current, power);
  const appliedAmount = Math.min(current.enemyHp, declaredAmount);
  const enemyHp = current.enemyHp - appliedAmount;
  return pushLog(logs, current, { enemyHp, enemyArmor: Math.max(0, current.enemyArmor - armorBreak), phase }, {
    actorId,
    targetId: enemy.id,
    actionType,
    visualCue,
    text: text(appliedAmount, mitigatedAmount),
    isTerminal: enemyHp === 0,
    declaredAmount,
    appliedAmount,
    mitigatedAmount,
    round,
    phaseLabel
  });
}

function projectedEnemyDamage(current, power) {
  const mitigatedAmount = Math.min(Math.max(0, power - 1), Math.floor(current.enemyArmor / 2));
  return {
    mitigatedAmount,
    declaredAmount: Math.max(1, power - mitigatedAmount)
  };
}

function healPartyMember(logs, current, run, target, amount, { actorId, actionType, visualCue = 'intro', round, phase = current.phase, phaseLabel = '', text }) {
  const appliedAmount = Math.max(0, Math.min(amount, target.maxHp - target.hp));
  const changes = target.kind === 'hero'
    ? { heroHp: current.heroHp + appliedAmount, phase }
    : { partners: replacePartner(current, target.id, (partner) => ({ hp: partner.hp + appliedAmount })), phase };
  return pushLog(logs, current, changes, {
    actorId,
    targetId: target.id,
    actionType,
    visualCue,
    text: text(appliedAmount, target),
    isTerminal: false,
    declaredAmount: amount,
    appliedAmount,
    mitigatedAmount: amount - appliedAmount,
    round,
    phaseLabel
  });
}

function grantPartyArmor(logs, current, target, amount, { actorId, actionType, visualCue = 'ally-guard', round, phase = current.phase, phaseLabel = '', text, declaredAmount = amount }) {
  const changes = target.kind === 'hero'
    ? { heroArmor: current.heroArmor + amount, phase }
    : { partners: replacePartner(current, target.id, (partner) => ({ armor: partner.armor + amount })), phase };
  return pushLog(logs, current, changes, {
    actorId,
    targetId: target.id,
    actionType,
    visualCue,
    text,
    isTerminal: false,
    declaredAmount,
    appliedAmount: amount,
    mitigatedAmount: 0,
    round,
    phaseLabel
  });
}

function changePressure(logs, current, { actorId, targetId = 'party', amount, round, phase = current.phase, actionType, visualCue = 'pressure-pulse', text, phaseLabel = '', declaredAmount = Math.abs(amount) }) {
  const pressure = Math.max(0, Math.min(PRESSURE_TACTICS.collapseThreshold, current.pressure + amount));
  const appliedAmount = Math.abs(pressure - current.pressure);
  return pushLog(logs, current, { pressure, phase }, {
    actorId,
    targetId,
    actionType,
    visualCue,
    text: text(current.pressure, pressure, appliedAmount),
    isTerminal: false,
    declaredAmount,
    appliedAmount,
    mitigatedAmount: Math.max(0, declaredAmount - appliedAmount),
    round,
    phaseLabel
  });
}

function damagePartyMember(logs, current, run, { actorId, target, originalTargetId = target.id, power, armorBreak = 1, pressure = 0, round, phase = current.phase, actionType, visualCue = 'hit-slash', text, phaseLabel = '' }) {
  const mitigatedAmount = Math.min(Math.max(0, power - 1), Math.floor(target.armor / 3));
  const declaredAmount = Math.max(1, power - mitigatedAmount);
  const appliedAmount = Math.min(target.hp, declaredAmount);
  const pressureAfter = Math.min(10, current.pressure + pressure);
  const changes = target.kind === 'hero'
    ? { heroHp: current.heroHp - appliedAmount, heroArmor: Math.max(0, current.heroArmor - armorBreak), pressure: pressureAfter, phase }
    : {
        partners: replacePartner(current, target.id, (partner) => ({ hp: partner.hp - appliedAmount, armor: Math.max(0, partner.armor - armorBreak) })),
        pressure: pressureAfter,
        phase
      };
  const after = snapshotFrom(current, changes);
  logs.push(createCombatLog(current, after, {
    actorId,
    targetId: target.id,
    originalTargetId,
    actualTargetId: target.id,
    actionType,
    visualCue,
    text: text(appliedAmount, mitigatedAmount, target),
    isTerminal: partyDown(after),
    declaredAmount,
    appliedAmount,
    mitigatedAmount,
    round,
    phaseLabel
  }));
  return after;
}

function healFromWineFire(logs, current, run, { round, phase = current.phase, phaseLabel = '' } = {}) {
  const characterRecovery = run.characterId === 'bai-heng' ? 3 : 0;
  const requested = effect(run, 'jiuhuo', 'lowHealthHeal') + characterRecovery;
  if (!requested || current.heroHp <= 0 || current.heroHp * 2 > current.heroMaxHp) return { current, healed: false };
  const target = { id: run.characterId, name: '主角', kind: 'hero', hp: current.heroHp, maxHp: current.heroMaxHp };
  if (target.hp >= target.maxHp) return { current, healed: false };
  const after = healPartyMember(logs, current, run, target, requested, {
    actorId: run.characterId,
    actionType: characterRecovery ? 'baiheng_stitch_life' : 'jiuhuo_recovery',
    round,
    phase,
    phaseLabel,
    text: (amount) => characterRecovery ? `白蘅在半血线缀回命线，恢复 ${amount} 点生命；治疗代价保留到结算。` : `酒火在低血线回燃，恢复 ${amount} 点生命。`
  });
  return { current: after, healed: true };
}

function partnerRuntime(run, currentPartner) {
  const source = (run.partners || []).find((partner) => partner.id === currentPartner.id) || getPartner(currentPartner.id);
  return { ...source, ...currentPartner, combatProfile: source.combatProfile || getPartner(currentPartner.id).combatProfile };
}

const HERO_PRESSURE_PROFILES = Object.freeze({
  'wen-fuji': Object.freeze({ threshold: 7, amount: 2, uses: 2, actionName: '照心定念' }),
  'xuan-yu': Object.freeze({ threshold: 7, amount: 3, uses: 2, actionName: '镇门定息' }),
  'bai-heng': Object.freeze({ threshold: 8, amount: 2, uses: 1, actionName: '缀命理脉' })
});

function createPressureReliefState() {
  return { actorUses: new Map(), usedRounds: new Set() };
}

function heroPressureReliefPlan(run) {
  const identity = HERO_PRESSURE_PROFILES[run.characterId] || {};
  const zhenfuThreshold = effect(run, 'zhenfu', 'pressureReliefThreshold');
  const zhenfuAmount = effect(run, 'zhenfu', 'pressureReliefAmount');
  const zhenfuUses = effect(run, 'zhenfu', 'pressureReliefUses');
  const routeBonus = run.routeId === 'zhenyu';
  return {
    threshold: Math.min(
      Number(identity.threshold || PRESSURE_TACTICS.player.baseThreshold),
      Number(zhenfuThreshold || PRESSURE_TACTICS.player.baseThreshold),
      routeBonus ? 8 : PRESSURE_TACTICS.player.baseThreshold
    ),
    amount: Math.max(
      Number(identity.amount || PRESSURE_TACTICS.player.baseAmount),
      Number(zhenfuAmount || PRESSURE_TACTICS.player.baseAmount)
    ) + (routeBonus ? 1 : 0),
    uses: Math.max(
      Number(identity.uses || PRESSURE_TACTICS.player.baseUses),
      Number(zhenfuUses || PRESSURE_TACTICS.player.baseUses)
    ) + (routeBonus ? 1 : 0),
    actionName: identity.actionName || (zhenfuThreshold ? '镇符稳息' : '稳息')
  };
}

function tryPressureRelief(logs, current, { actorId, actorName, plan, reliefState, round, phase = current.phase, phaseLabel = '', actionType }) {
  if (!reliefState || reliefState.usedRounds.has(round) || current.pressure < plan.threshold) return null;
  const used = reliefState.actorUses.get(actorId) || 0;
  if (used >= plan.uses) return null;
  reliefState.actorUses.set(actorId, used + 1);
  reliefState.usedRounds.add(round);
  return changePressure(logs, current, {
    actorId,
    targetId: 'party',
    amount: -plan.amount,
    round,
    phase,
    phaseLabel,
    actionType,
    text: (before, after) => `${actorName} 以“${plan.actionName}”稳住全队，压力 ${before}→${after}；本轮放弃原本出手。`
  });
}

function partnerBasicAttackPower(current, partner, profile, round, basicBonus) {
  let power = Math.max(1, Math.round((Number(partner.damage || 0) + Number(profile.power || 1)) / 2) + basicBonus);
  if (profile.action === 'execute' && current.enemyHp * 100 <= current.enemyMaxHp * 35) power += Number(profile.executeBonus || 0);
  if (profile.action === 'pursuit') power += Math.min(3, Math.max(0, round - 1) * Number(profile.roundScaling || 0));
  return power;
}

function executePartnerBasic(logs, current, run, enemy, partnerId, { round, phase = current.phase, phaseLabel = '', reliefState = null, revivalState = null } = {}) {
  const state = current.partners.find((partner) => partner.id === partnerId);
  if (!state || state.hp <= 0 || current.enemyHp <= 0) return { current, guardReduction: 0, controlReduction: 0 };
  const partner = partnerRuntime(run, state);
  const profile = partner.combatProfile;
  if (!profile) throw new Error(`Missing combat profile for ${partner.id}`);
  const basicBonus = effect(run, 'partner', 'basicActionBonus');
  const common = { actorId: partner.id, round, phase, phaseLabel };
  const injuredTarget = profile.action === 'heal' ? lowestHealthMember(current, run, { injuredOnly: true }) : null;
  const attackPower = profile.action !== 'guard' && (profile.action !== 'heal' || !injuredTarget)
    ? partnerBasicAttackPower(current, partner, profile, round, basicBonus)
    : null;
  const canFinishNow = attackPower !== null && projectedEnemyDamage(current, attackPower).declaredAmount >= current.enemyHp;
  if (profile.pressureRelief && !canFinishNow) {
    const relieved = tryPressureRelief(logs, current, {
      ...common,
      actorName: partner.name,
      plan: profile.pressureRelief,
      reliefState,
      actionType: 'partner_basic_pressure_relief'
    });
    if (relieved) return { current: relieved, guardReduction: 0, controlReduction: 0 };
  }
  const downedTarget = earliestDownedPartner(current);
  const reviveUses = revivalState?.actorUses.get(partner.id) || 0;
  if (profile.revive && revivalState && downedTarget && !canFinishNow && reviveUses < Number(profile.revive.usesPerCombat || 0)) {
    revivalState.actorUses.set(partner.id, reviveUses + 1);
    const after = revivePartner(logs, current, downedTarget, {
      ...common,
      actorName: partner.name,
      actionType: 'partner_basic_revive',
      actionName: profile.revive.name,
      healthPercent: profile.revive.healthPercent,
      pressureCost: profile.revive.pressureCost,
      baiHengReviveConsumed: partner.id === 'partner-bai-heng'
    });
    return { current: after, guardReduction: 0, controlReduction: 0 };
  }
  if (profile.action === 'guard') {
    const target = lowestHealthMember(current, run) || { id: run.characterId, kind: 'hero', hp: current.heroHp, maxHp: current.heroMaxHp };
    const armorGrant = Math.max(0, Number(profile.armorGrant || 0) + (basicBonus > 0 ? 1 : 0));
    const guardReduction = Math.max(1, Number(profile.guard || 1) + basicBonus);
    const after = grantPartyArmor(logs, current, target, armorGrant, {
      ...common,
      actionType: 'partner_basic_guard',
      visualCue: profile.visualCue,
      declaredAmount: guardReduction + armorGrant,
      text: `${partner.name} 以“${profile.actionName}”稳住 ${target.name || '队友'}，本轮来袭削弱 ${guardReduction}${armorGrant ? `，并补上 ${armorGrant} 点护甲` : ''}。`
    });
    return { current: after, guardReduction, controlReduction: 0 };
  }
  if (profile.action === 'heal') {
    const target = injuredTarget;
    if (target) {
      const requested = Number(profile.heal || 3) + basicBonus;
      const after = healPartyMember(logs, current, run, target, requested, {
        ...common,
        actionType: 'partner_basic_heal',
        visualCue: profile.visualCue,
        text: (amount) => `${partner.name} 以“${profile.actionName}”为 ${target.name || '队友'} 缀回 ${amount} 点生命。`
      });
      return { current: after, guardReduction: 0, controlReduction: 0 };
    }
  }
  const power = attackPower;
  const actionType = profile.action === 'control' ? 'partner_basic_control' : profile.action === 'heal' ? 'partner_basic_heal' : 'partner_basic_strike';
  const after = damageEnemy(logs, current, {
    ...common,
    enemy,
    power,
    armorBreak: Number(profile.armorBreak || 0),
    actionType,
    visualCue: profile.action === 'heal' ? 'hit-slash' : profile.visualCue,
    text: (amount) => profile.action === 'heal'
      ? `${partner.name} 见全队无伤，改以“${profile.actionName}”牵住敌势，造成 ${amount} 点伤害。`
      : `${partner.name} 施展“${profile.actionName}”，对 ${enemy.name} 造成 ${amount} 点伤害。`
  });
  return { current: after, guardReduction: 0, controlReduction: Number(profile.control || 0) + (profile.control ? basicBonus : 0) };
}

function executePartnerPhase(logs, current, run, enemy, timing, context) {
  let next = current;
  let guardReduction = 0;
  let controlReduction = 0;
  for (const state of next.partners) {
    const partner = partnerRuntime(run, state);
    if (partner.combatProfile?.timing !== timing || state.hp <= 0 || next.enemyHp <= 0) continue;
    const result = executePartnerBasic(logs, next, run, enemy, state.id, context);
    next = result.current;
    guardReduction += result.guardReduction;
    controlReduction += result.controlReduction;
  }
  return { current: next, guardReduction, controlReduction };
}

function executeHeroAction(logs, current, run, enemy, { power, armorBreak, round, phase = current.phase, phaseLabel = '', actionType = 'hero_strike', visualCue = 'hit-slash', text, reliefState = null, revivalState = null }) {
  if (current.heroHp <= 0) {
    return pushLog(logs, current, { phase }, {
      actorId: run.characterId,
      targetId: run.characterId,
      actionType: 'hero_downed_skip',
      visualCue: 'pressure-pulse',
      text: '主角已经倒地，本轮由仍站立的同行者接住战局。',
      isTerminal: false,
      round,
      phaseLabel
    });
  }
  const canFinishNow = projectedEnemyDamage(current, power).declaredAmount >= current.enemyHp;
  const relieved = canFinishNow ? null : tryPressureRelief(logs, current, {
    actorId: run.characterId,
    actorName: '主角',
    plan: heroPressureReliefPlan(run),
    reliefState,
    round,
    phase,
    phaseLabel,
    actionType: 'hero_pressure_relief'
  });
  if (relieved) return relieved;
  const downedTarget = earliestDownedPartner(current);
  if (!canFinishNow && downedTarget && current.reviveSeals > 0 && !baiHengReviveAvailable(current, revivalState)) {
    return revivePartner(logs, current, downedTarget, {
      actorId: run.characterId,
      actorName: '主角',
      actionType: 'hero_revive_partner',
      actionName: REVIVAL_RULES.seal.name,
      healthPercent: REVIVAL_RULES.seal.healthPercent,
      pressureCost: REVIVAL_RULES.seal.pressureCost,
      consumeSeal: true,
      round,
      phase,
      phaseLabel
    });
  }
  return damageEnemy(logs, current, { actorId: run.characterId, enemy, power, armorBreak, round, phase, phaseLabel, actionType, visualCue, text });
}

function executePartnerCombos(logs, current, run, enemy, { round, phase = current.phase, phaseLabel = '' } = {}) {
  const comboPower = effect(run, 'partner', 'comboPower');
  if (!comboPower || current.enemyHp <= 0) return current;
  const living = current.partners.filter((partner) => partner.hp > 0);
  if (!living.length) return current;
  const selected = effect(run, 'partner', 'allPartnersCombo') ? living : [living[(round - 1) % living.length]];
  let next = current;
  for (const state of selected) {
    if (next.enemyHp <= 0) break;
    const partner = partnerRuntime(run, state);
    next = damageEnemy(logs, next, {
      actorId: partner.id,
      enemy,
      power: Math.max(1, comboPower + Math.floor(Number(partner.damage || 0) / 3)),
      armorBreak: 0,
      round,
      phase,
      phaseLabel,
      actionType: 'partner_combo',
      visualCue: 'hit-slash',
      text: (amount) => `${partner.name} 在基础行动之外接上合击，追加 ${amount} 点伤害。`
    });
  }
  return next;
}

function selectEnemyTarget(current, run, round, phase = 0) {
  const candidates = livingParty(current, run);
  if (!candidates.length) return null;
  const seed = Number.isFinite(Number(run.seed)) ? Math.abs(Number(run.seed)) : 0;
  return candidates[(seed + Math.max(0, round - 1) + Math.max(0, phase - 1)) % candidates.length];
}

function applyIntercept(logs, current, run, originalTarget, { used, round, phase = current.phase, phaseLabel = '' } = {}) {
  const reduction = effect(run, 'partner', 'firstGuardReduction');
  if (used || !reduction || !originalTarget) return { current, target: originalTarget, reduction: 0, used };
  const interceptor = current.partners.find((partner) => partner.hp > 0 && partner.id !== originalTarget.id);
  if (!interceptor) return { current, target: originalTarget, reduction: 0, used };
  const partner = partnerRuntime(run, interceptor);
  const next = pushLog(logs, current, {}, {
    actorId: partner.id,
    targetId: interceptor.id,
    originalTargetId: originalTarget.id,
    actualTargetId: interceptor.id,
    actionType: 'partner_intercept',
    visualCue: 'ally-guard',
    text: `${partner.name} 抢到 ${originalTarget.name || '主角'} 身前完成援护；来袭改由其承受，并削弱 ${reduction} 点威力。`,
    isTerminal: false,
    declaredAmount: reduction,
    appliedAmount: reduction,
    mitigatedAmount: 0,
    round,
    phase,
    phaseLabel
  });
  return { current: next, target: { ...interceptor, kind: 'partner' }, reduction, used: true };
}

function roundProgressSince(logs, startIndex) {
  return logs.slice(startIndex).reduce((progress, log) => ({
    toEnemy: progress.toEnemy + Math.abs(log.enemyHpDelta) + Math.abs(log.enemyArmorDelta),
    toParty: progress.toParty
      + Math.abs(log.hpDelta)
      + Math.abs(log.armorDelta)
      + log.partnerDeltas.reduce((sum, entry) => sum + Math.abs(entry.hpDelta) + Math.abs(entry.armorDelta), 0),
    pressureChanged: progress.pressureChanged || log.pressureDelta !== 0
  }), { toEnemy: 0, toParty: 0, pressureChanged: false });
}

function partyHealth(current) {
  return {
    hp: current.heroHp + current.partners.reduce((sum, partner) => sum + partner.hp, 0),
    maxHp: current.heroMaxHp + current.partners.reduce((sum, partner) => sum + partner.maxHp, 0)
  };
}

function isStalemateRound(current, roundDamage) {
  const party = partyHealth(current);
  const partyFarFromLethal = party.hp * 100 > party.maxHp * COMBAT_STALEMATE_RULES.lethalRangePercent;
  const enemyFarFromLethal = current.enemyHp * 100 > current.enemyMaxHp * COMBAT_STALEMATE_RULES.lethalRangePercent;
  const partyDamageLimit = Math.max(1, Math.floor(party.maxHp * COMBAT_STALEMATE_RULES.trivialDamagePercent / 100));
  const enemyDamageLimit = Math.max(1, Math.floor(current.enemyMaxHp * COMBAT_STALEMATE_RULES.trivialDamagePercent / 100));
  return partyFarFromLethal
    && enemyFarFromLethal
    && !roundDamage.pressureChanged
    && roundDamage.toParty <= partyDamageLimit
    && roundDamage.toEnemy <= enemyDamageLimit;
}

function resultFromTerminal({ logs, enemy, tier, phasesSeen = 1, bossRead = null }) {
  const finalState = finalStateFromLogs(logs);
  const terminalAction = logs.at(-1)?.actionType;
  const livingPartners = finalState.partners.filter((partner) => partner.hp > 0);
  let outcome;
  let resolutionReason;
  if (finalState.enemyHp === 0) {
    outcome = 'victory';
    resolutionReason = finalState.heroHp === 0 && livingPartners.length ? 'enemy_hp_zero_allies_hold' : 'enemy_hp_zero';
  } else if (partyDown(finalState)) {
    outcome = 'failure';
    resolutionReason = terminalAction === 'hero_dead' || finalState.partners.length === 0 ? 'hero_dead' : 'party_hp_zero';
  } else if (terminalAction === 'pressure_collapse') {
    outcome = 'failure';
    resolutionReason = 'pressure_collapse';
  } else if (terminalAction === 'stalemate_disengagement') {
    outcome = 'stalemate';
    resolutionReason = 'prolonged_stalemate';
  } else if (terminalAction === 'boss_overwhelmed') {
    outcome = 'failure';
    resolutionReason = 'boss_overwhelmed';
  } else {
    throw new Error(`Combat terminal invariant failed: ${terminalAction || 'missing_action'} did not resolve the whole squad or an explicit legal terminal.`);
  }
  return { outcome, resolutionReason, tier, enemyId: enemy.id, enemyName: enemy.name, logs, finalState, phasesSeen, ...(bossRead ? { bossRead } : {}) };
}

export function calculateBossPreparation(run) {
  const entries = Object.entries(run.daomai || {});
  const strongest = entries.sort((left, right) => right[1] - left[1])[0] || ['xuanjia', 0];
  const thresholds = entries.filter(([, value]) => value >= 3).length;
  const oldCauseCount = (run.oldCauses || []).length;
  const clueBonus = effect(run, 'jiuyan', 'bossClueBonus');
  const clueCount = (run.bossClues || []).length + Math.min(3, run.stats.clues || 0) + clueBonus;
  const bossPrepCount = run.stats.bossPrep || 0;
  const debt = debtImpact(run.debtMarks || []);
  const daomaiScore = DAOMAI_IDS.reduce((score, id) => score + effect(run, id, 'bossPreparationScore'), 0);
  const formationReady = thresholds >= BOSS_FORMATION_REQUIREMENTS.thresholdCount;
  const formationBonus = formationReady ? BOSS_FORMATION_REQUIREMENTS.bonus : 0;
  const partnerDaomaiValue = run.daomai?.partner || 0;
  const partnerDaomaiReady = partnerDaomaiValue >= BOSS_FORMATION_REQUIREMENTS.partnerDaomaiGoal;
  const score = daomaiScore + Math.min(oldCauseCount, 5) * 2 + Math.min(clueCount, 5) * 2 + bossPrepCount * 3 + Math.min(run.partners.length, PARTY_LIMITS.maxPartners) * 2 + formationBonus - debt.scorePenalty + Math.ceil((run.stats.armor || 0) / 4) + Math.floor((run.stats.damage || 0) / 4);
  const discreteReady = thresholds >= BOSS_PREPARATION_REQUIREMENTS.thresholdCount && oldCauseCount >= BOSS_PREPARATION_REQUIREMENTS.oldCauseCount && clueCount >= BOSS_PREPARATION_REQUIREMENTS.clueCount;
  const prepared = discreteReady && bossPrepCount >= BOSS_PREPARATION_REQUIREMENTS.nearBossPrepCount && score >= BOSS_PREPARATION_REQUIREMENTS.score;
  const nearReady = discreteReady && score >= BOSS_PREPARATION_REQUIREMENTS.nearScore && bossPrepCount >= BOSS_PREPARATION_REQUIREMENTS.nearBossPrepCount && !prepared;
  return {
    strongestDaomai: strongest[0], strongestValue: strongest[1], daomaiThresholdMet: strongest[1] >= 3,
    thresholdCount: thresholds,
    formationLineCount: thresholds,
    formationLineGoal: BOSS_FORMATION_REQUIREMENTS.thresholdCount,
    formationRemaining: Math.max(0, BOSS_FORMATION_REQUIREMENTS.thresholdCount - thresholds),
    formationReady,
    formationBonus,
    partnerDaomaiValue,
    partnerDaomaiGoal: BOSS_FORMATION_REQUIREMENTS.partnerDaomaiGoal,
    partnerDaomaiRemaining: Math.max(0, BOSS_FORMATION_REQUIREMENTS.partnerDaomaiGoal - partnerDaomaiValue),
    partnerDaomaiReady,
    oldCause: (run.oldCauses || [])[0] || '尚无旧因', oldCauseCount,
    bossClue: (run.bossClues || [])[0] || '尚无破局线索', clueCount, clueBonus, bossPrepCount, daomaiScore,
    debtCount: debt.count, debtPenalty: debt.scorePenalty, score, prepared, nearReady,
    readinessTier: prepared ? 'prepared' : nearReady ? 'near' : 'unprepared', requirements: BOSS_PREPARATION_REQUIREMENTS
  };
}

function simulateOrdinary(run, enemy, tier) {
  const logs = [];
  let current = initialSnapshot(run, enemy);
  logs.push(createCombatLog(current, current, { actorId: 'system', targetId: enemy.id, actionType: 'combat_start', visualCue: 'intro', text: `【战斗开始】${enemy.name} 压住山道。`, isTerminal: false, round: 0 }));
  current = appendExpansionRuleLog(logs, current, run, enemy);
  const stalemateRule = COMBAT_STALEMATE_RULES[tier] || COMBAT_STALEMATE_RULES.ordinary;
  let wineHealUsed = false;
  let interceptUsed = false;
  let stalemateStreak = 0;
  const reliefState = createPressureReliefState();
  const revivalState = createRevivalState();
  let pendingPressureCollapse = current.pressure >= PRESSURE_TACTICS.collapseThreshold;
  for (let round = 1; round <= COMBAT_STALEMATE_RULES.safetyRoundLimit; round += 1) {
    const roundLogStart = logs.length;
    const beforePartners = executePartnerPhase(logs, current, run, enemy, 'before-hero', { round, reliefState, revivalState });
    current = beforePartners.current;
    if (current.enemyHp === 0) break;

    current = executeHeroAction(logs, current, run, enemy, {
      power: Math.max(1, run.stats.damage + (round === 1 ? 3 : 0) + heroPowerBonus(run, current, { opening: round === 1, round })),
      armorBreak: 1 + effect(run, 'xuanjia', 'armorBreakBonus') + effect(run, 'leiqi', 'armorBreakBonus'),
      round,
      reliefState,
      revivalState,
      text: (amount, mitigated) => `你撕开 ${enemy.name} 的守势，造成 ${amount} 点伤害${mitigated ? `（减免 ${mitigated}）` : ''}。`
    });
    if (current.enemyHp === 0) break;

    const afterPartners = executePartnerPhase(logs, current, run, enemy, 'after-hero', { round, reliefState, revivalState });
    current = afterPartners.current;
    if (current.enemyHp === 0) break;
    current = executePartnerCombos(logs, current, run, enemy, { round });
    if (current.enemyHp === 0) break;

    if (pendingPressureCollapse) {
      if (current.pressure >= PRESSURE_TACTICS.collapseThreshold) {
        current = pushLog(logs, current, {}, {
          actorId: 'system',
          targetId: 'party',
          actionType: 'pressure_collapse',
          visualCue: 'pressure-pulse',
          text: '【结果·压力崩溃】临界之后仍无人稳住心神，队伍失去继续作战的能力。',
          isTerminal: true,
          round
        });
        break;
      }
      pendingPressureCollapse = false;
    }
    if (current.pressure >= PRESSURE_TACTICS.collapseThreshold) {
      // A revival can itself push the party to the limit. It opens the same
      // one-round response window as enemy pressure instead of bypassing the
      // collapse contract or ending the battle immediately.
      pendingPressureCollapse = true;
    }

    const pressurePlan = enemyPressurePlan(run, tier, round);
    const squadReduction = beforePartners.guardReduction + beforePartners.controlReduction + afterPartners.guardReduction + afterPartners.controlReduction;
    if (pressurePlan) {
      const incoming = incomingRules(run, { round, squadReduction });
      const declaredPressure = pressurePlan.gain + incoming.pressureCost;
      const pressureGain = Math.min(incoming.pressureCap, Math.max(0, declaredPressure - incoming.pressureReduction));
      current = changePressure(logs, current, {
        actorId: enemy.id,
        targetId: 'party',
        amount: pressureGain,
        declaredAmount: declaredPressure,
        round,
        actionType: 'enemy_pressure_action',
        text: (before, after) => `${enemy.name} 放弃本轮进攻，以妖声逼阵，压力 ${before}→${after}${after >= PRESSURE_TACTICS.collapseThreshold ? '；下轮若无人稳住，队伍将崩溃' : ''}。`
      });
      pendingPressureCollapse = current.pressure >= PRESSURE_TACTICS.collapseThreshold;
    } else {
      const originalTarget = selectEnemyTarget(current, run, round);
      if (!originalTarget) break;
      const intercept = applyIntercept(logs, current, run, originalTarget, { used: interceptUsed, round });
      current = intercept.current;
      interceptUsed = intercept.used;
      const incoming = incomingRules(run, { round, squadReduction: squadReduction + intercept.reduction });
      const enemyPower = Math.max(1, enemy.attack + (tier === 'elite' && round % 2 === 0 ? 3 : 0) - incoming.powerReduction);
      const target = livingParty(current, run).find((member) => member.id === intercept.target.id) || selectEnemyTarget(current, run, round);
      current = damagePartyMember(logs, current, run, {
        actorId: enemy.id,
        target,
        originalTargetId: originalTarget.id,
        power: enemyPower,
        armorBreak: Math.max(0, (tier === 'elite' ? 2 : 1) - incoming.armorBreakReduction),
        pressure: 0,
        round,
        actionType: tier === 'elite' && round % 2 === 0 ? 'elite_mechanic' : 'enemy_attack',
        visualCue: tier === 'elite' ? 'armor-break' : 'hit-slash',
        text: (amount, mitigated, hit) => `${enemy.name} 攻向 ${hit.name || '主角'}，造成 ${amount} 点生命伤害${mitigated ? `（护甲减免 ${mitigated}）` : ''}；这次攻击不会增加压力。`
      });
    }
    if (partyDown(current)) break;
    if (!wineHealUsed) {
      const recovery = healFromWineFire(logs, current, run, { round });
      current = recovery.current;
      wineHealUsed = recovery.healed;
    }
    if (round >= stalemateRule.evaluationRound && isStalemateRound(current, roundProgressSince(logs, roundLogStart))) {
      stalemateStreak += 1;
      if (stalemateStreak >= stalemateRule.requiredConsecutiveRounds) {
        current = pushLog(logs, current, {}, { actorId: 'system', targetId: run.characterId, actionType: 'stalemate_disengagement', visualCue: 'intro', text: '【结果·久战罢兵】连续三轮双方均未形成有效突破，且都远离斩杀线；队伍有序脱离。', isTerminal: true, round });
        break;
      }
      current = pushLog(logs, current, {}, {
        actorId: 'system', targetId: run.characterId, actionType: 'stalemate_warning', visualCue: 'intro',
        text: stalemateStreak === 1 ? '【久战预警·1/3】双方都未形成有效突破；若僵局持续，队伍将准备罢兵。' : '【久战预警·2/3】僵局仍未打破；下一轮依然无突破，将以久战罢兵收束。',
        isTerminal: false, round
      });
    } else {
      stalemateStreak = 0;
    }
  }
  if (!logs.at(-1).isTerminal) throw new Error(`Combat failed to reach a legal terminal within ${COMBAT_STALEMATE_RULES.safetyRoundLimit} rounds.`);
  const result = resultFromTerminal({ logs, enemy, tier, phasesSeen: tier === 'elite' ? 2 : 1 });
  const routeRead = expansionRouteRead(run, logs);
  if (routeRead) result.routeRead = routeRead;
  return result;
}

function simulateBoss(run, boss) {
  const read = calculateBossPreparation(run);
  const phaseLimit = BOSS_OBJECTIVE.phaseLimit;
  const prepared = read.prepared;
  const nearReady = read.nearReady;
  const nearBarrier = BOSS_PREPARATION_BARRIERS.synergyNear[`${run.characterId}:${run.routeId}`]
    ?? BOSS_PREPARATION_BARRIERS.near;
  const preparationBarrier = prepared
    ? 0
    : nearReady
      ? nearBarrier
      : BOSS_PREPARATION_BARRIERS.unprepared;
  const partyScaleBarrier = Math.min(run.partners.length, PARTY_LIMITS.maxPartners) * PARTY_LIMITS.bossHpPerPartner;
  const logs = [];
  let current = initialSnapshot(run, { ...boss, tier: 'boss', maxHp: boss.maxHp + preparationBarrier + partyScaleBarrier });
  logs.push(createCombatLog(current, current, {
    actorId: 'system',
    targetId: boss.id,
    actionType: 'boss_start',
    visualCue: 'boss-phase-red',
    phaseLabel: boss.phases[0].name,
    text: `【破局约定】山门只容三势交锋：第三势结算前必须击倒${boss.name}；若首领仍存活，山门便会封合，队伍即使尚有余力也必须退场。${boss.name}随后读取 ${read.oldCause}。${preparationBarrier ? `准备尚有缺口，首领仍披着 ${preparationBarrier} 点未解山势。` : '门前准备已剥去首领的未解山势。'}${partyScaleBarrier ? ` ${run.partners.length} 名同行者的合阵惊动旧军，首领聚起 ${partyScaleBarrier} 点合阵回响；同行者也会逐势行动。` : ''}`,
    isTerminal: false,
    round: 0
  }));
  current = appendExpansionRuleLog(logs, current, run, boss, { phaseLabel: boss.phases[0].name });
  const finisherBonus = prepared
    ? 24 + Math.min(12, Math.max(0, read.score - BOSS_PREPARATION_REQUIREMENTS.score))
    : nearReady
      ? Math.min(18, Math.max(0, read.score - BOSS_PREPARATION_REQUIREMENTS.nearScore + 1) * 3)
      : 0;
  const phasePowers = [
    18 + Math.min(10, run.stats.damage) + Math.min(9, read.oldCauseCount * 3),
    16 + Math.min(10, run.stats.damage) + Math.min(20, read.thresholdCount * 4),
    14 + Math.min(10, run.stats.damage) + Math.min(20, read.clueCount * 4) + finisherBonus
  ];
  let wineHealUsed = false;
  let interceptUsed = false;
  const reliefState = createPressureReliefState();
  const revivalState = createRevivalState();
  let pendingPressureCollapse = current.pressure >= PRESSURE_TACTICS.collapseThreshold;
  for (let phaseIndex = 0; phaseIndex < phaseLimit; phaseIndex += 1) {
    const phase = phaseIndex + 1;
    const phaseLabel = boss.phases[phaseIndex].name;
    if (phase > 1) {
      const remainingAfterPhase = phaseLimit - phase;
      current = pushLog(logs, current, { phase }, {
        actorId: 'system',
        targetId: 'party',
        actionType: 'boss_objective_countdown',
        visualCue: 'boss-phase-red',
        phaseLabel,
        text: phase === phaseLimit
          ? `【最后一势·山门将合】这是最后一次破局机会；本势结算后若${boss.name}仍存活，山门立即封合，队伍将被迫退场。`
          : `【第二势·封痕逼近】山门再合一重；本势之后尚余 ${remainingAfterPhase} 势破局机会。`,
        isTerminal: false,
        round: phase
      });
    }
    const beforePartners = executePartnerPhase(logs, current, run, boss, 'before-hero', { round: phase, phase, phaseLabel, reliefState, revivalState });
    current = beforePartners.current;
    if (current.enemyHp === 0) break;
    current = executeHeroAction(logs, current, run, boss, {
      power: phasePowers[phaseIndex] + heroPowerBonus(run, current, { opening: phase === 1, bossPhase: phase, round: phase }),
      armorBreak: 2 + read.thresholdCount + effect(run, 'xuanjia', 'armorBreakBonus') + effect(run, 'leiqi', 'armorBreakBonus'),
      round: phase,
      phase,
      phaseLabel,
      actionType: `boss_phase_${phase}_hero`,
      visualCue: phase === 3 ? 'boss-phase-red' : 'hit-slash',
      reliefState,
      revivalState,
      text: (amount) => `${phase === 1 ? '旧因应验' : phase === 2 ? '道脉成势' : '破局线索落定'}，压下 ${amount} 点首领血线。`
    });
    if (current.enemyHp === 0) break;
    const afterPartners = executePartnerPhase(logs, current, run, boss, 'after-hero', { round: phase, phase, phaseLabel, reliefState, revivalState });
    current = afterPartners.current;
    if (current.enemyHp === 0) break;
    current = executePartnerCombos(logs, current, run, boss, { round: phase, phase, phaseLabel });
    if (current.enemyHp === 0) break;

    if (pendingPressureCollapse) {
      if (current.pressure >= PRESSURE_TACTICS.collapseThreshold) {
        current = pushLog(logs, current, {}, {
          actorId: 'system',
          targetId: 'party',
          actionType: 'pressure_collapse',
          visualCue: 'pressure-pulse',
          phaseLabel,
          text: '【结果·压力崩溃】临界之后仍无人稳住心神，队伍失去继续作战的能力。',
          isTerminal: true,
          round: phase
        });
        break;
      }
      pendingPressureCollapse = false;
    }
    if (current.pressure >= PRESSURE_TACTICS.collapseThreshold) {
      pendingPressureCollapse = true;
    }

    const missingPreparation = prepared ? 0 : Math.max(4, 20 - read.score);
    const preparationReduction = prepared ? read.thresholdCount * 2 : nearReady ? Math.ceil(read.thresholdCount * 1.5) : 0;
    const squadReduction = beforePartners.guardReduction + beforePartners.controlReduction + afterPartners.guardReduction + afterPartners.controlReduction;
    if (phase === PRESSURE_TACTICS.enemy.boss.pressurePhase) {
      const incoming = incomingRules(run, { boss: true, phase, round: phase, squadReduction });
      const basePressure = prepared
        ? PRESSURE_TACTICS.enemy.boss.preparedGain
        : nearReady
          ? PRESSURE_TACTICS.enemy.boss.nearReadyGain
          : PRESSURE_TACTICS.enemy.boss.unpreparedGain;
      const declaredPressure = basePressure + incoming.pressureCost;
      const pressureGain = Math.min(incoming.pressureCap, Math.max(0, declaredPressure - incoming.pressureReduction));
      current = changePressure(logs, current, {
        actorId: boss.id,
        targetId: 'party',
        amount: pressureGain,
        declaredAmount: declaredPressure,
        round: phase,
        phase,
        phaseLabel,
        actionType: 'enemy_pressure_action',
        text: (before, after) => `${boss.name} 放弃这一势的追命攻击，引山势迫近，压力 ${before}→${after}${after >= PRESSURE_TACTICS.collapseThreshold ? '；下一势若无人稳住，队伍将崩溃' : ''}。`
      });
      pendingPressureCollapse = current.pressure >= PRESSURE_TACTICS.collapseThreshold;
    } else {
      const originalTarget = selectEnemyTarget(current, run, phase);
      if (!originalTarget) break;
      const intercept = applyIntercept(logs, current, run, originalTarget, { used: interceptUsed, round: phase, phase, phaseLabel });
      current = intercept.current;
      interceptUsed = intercept.used;
      const incoming = incomingRules(run, { boss: true, phase, round: phase, squadReduction: squadReduction + intercept.reduction });
      const target = livingParty(current, run).find((member) => member.id === intercept.target.id) || selectEnemyTarget(current, run, phase);
      current = damagePartyMember(logs, current, run, {
        actorId: boss.id,
        target,
        originalTargetId: originalTarget.id,
        power: Math.max(4, boss.attack + phase * 3 + missingPreparation - preparationReduction - incoming.powerReduction),
        armorBreak: Math.max(0, 2 + phase - incoming.armorBreakReduction),
        pressure: 0,
        round: phase,
        phase,
        actionType: `boss_phase_${phase}_attack`,
        visualCue: 'armor-break',
        phaseLabel,
        text: (amount, mitigated, hit) => `${boss.name} 读取准备缺口，令 ${hit.name || '主角'} 失去 ${amount} 点生命${mitigated ? `（护甲减免 ${mitigated}）` : ''}；这一击不会增加压力。`
      });
    }
    if (partyDown(current)) break;
    if (!wineHealUsed) {
      const recovery = healFromWineFire(logs, current, run, { round: phase, phase, phaseLabel });
      current = recovery.current;
      wineHealUsed = recovery.healed;
    }
  }
  if (!logs.at(-1).isTerminal) {
    current = pushLog(logs, current, {}, {
      actorId: 'system',
      targetId: run.characterId,
      actionType: 'boss_overwhelmed',
      visualCue: 'boss-phase-red',
      phaseLabel: boss.phases[phaseLimit - 1].name,
      text: `【破局失败·山门封合】第三势全部行动已经结算，${boss.name}仍有 ${current.enemyHp}/${current.enemyMaxHp} 生命。开场约定的破局目标未能完成，队伍被迫退场；此败局与当前生命、压力是否健康无关。`,
      isTerminal: true,
      round: phaseLimit
    });
  }
  const base = resultFromTerminal({ logs, enemy: boss, tier: 'boss', phasesSeen: phaseLimit });
  base.bossRead = {
    ...read,
    preparationBarrier,
    partyScaleBarrier,
    finisherBonus,
    objectiveId: BOSS_OBJECTIVE.id,
    objectiveTitle: BOSS_OBJECTIVE.title,
    objectiveRule: BOSS_OBJECTIVE.rule,
    phaseLimit,
    phaseCount: phaseLimit,
    victoryExplanation: base.outcome === 'victory' ? '旧因、道脉成势、同行者行动与破局线索共同完成了实际伤害结算。' : '',
    failureAdvice: base.outcome === 'victory' ? '' : `下一次入山前，可把破局把握提到 ${read.requirements.score}，完成 ${read.requirements.nearBossPrepCount} 次门前筹备，并带齐至少 ${read.requirements.thresholdCount} 条成势道脉、${read.requirements.oldCauseCount} 项旧因和 ${read.requirements.clueCount} 条破局线索；战中仍须在山门第三次封合前击倒首领。`
  };
  const routeRead = expansionRouteRead(run, logs);
  if (routeRead) base.routeRead = routeRead;
  return base;
}

export function simulateCombat(run, enemy, tier = enemy.tier || 'ordinary') {
  return tier === 'boss' ? simulateBoss(run, enemy) : simulateOrdinary(run, enemy, tier);
}

export function runCombatFixture(name) {
  const baseRun = {
    seed: 0,
    nodeIndex: 2,
    characterId: 'shen-li',
    stats: { hp: 40, maxHp: 40, armor: 5, pressure: 2, damage: 8, clues: 1, bossPrep: 0 },
    partners: [],
    daomai: { xuanjia: 1, leiqi: 0, jiuyan: 0, jiuhuo: 0, zhenfu: 0, xuezhai: 0, partner: 0 },
    oldCauses: ['旧因·旧军残阵'], bossClues: ['玄甲成势可抗妖将的撕甲连击'], debtMarks: []
  };
  if (name === 'enemy_hp_zero') return simulateOrdinary(baseRun, { id: 'fixture-enemy', name: '门钉妖影', tier: 'ordinary', maxHp: 22, armor: 1, attack: 5 }, 'ordinary');
  if (name === 'long_combat_resolves') {
    const longRun = { ...baseRun, stats: { ...baseRun.stats, hp: 40, maxHp: 40, armor: 5, pressure: 2, damage: 1 }, daomai: { ...baseRun.daomai, xuanjia: 0 } };
    return simulateOrdinary(longRun, { id: 'fixture-long-enemy', name: '旧军残魂', tier: 'ordinary', maxHp: 10, armor: 0, attack: 1 }, 'ordinary');
  }
  if (name === 'pressure_collapse') {
    const pressureRun = { ...baseRun, pressureStage: 'late', stats: { ...baseRun.stats, hp: 40, maxHp: 40, armor: 5, pressure: 8, damage: 1 }, daomai: { ...baseRun.daomai, xuanjia: 0 } };
    return simulateOrdinary(pressureRun, { id: 'fixture-pressure-enemy', name: '压山妖影', tier: 'ordinary', maxHp: 40, armor: 2, attack: 1 }, 'ordinary');
  }
  if (name === 'prolonged_stalemate') {
    const stalemateRun = { ...baseRun, stats: { ...baseRun.stats, hp: 200, maxHp: 200, armor: 5, pressure: 2, damage: 1 }, daomai: { ...baseRun.daomai, xuanjia: 0, zhenfu: 1 } };
    return simulateOrdinary(stalemateRun, { id: 'fixture-stalemate-enemy', name: '铁壁门傀', tier: 'ordinary', maxHp: 200, armor: 2, attack: 1 }, 'ordinary');
  }
  if (name === 'hero_down_allies_hold') {
    const partner = getPartner('partner-chi-yao');
    const alliesRun = {
      ...baseRun,
      stats: { ...baseRun.stats, hp: 3, maxHp: 40, armor: 0, pressure: 0, damage: 1 },
      partners: [{ ...partner, hp: partner.maxHp }],
      daomai: { ...baseRun.daomai, xuanjia: 0 }
    };
    return simulateOrdinary(alliesRun, { id: 'fixture-allies-hold', name: '索命旧卒', tier: 'ordinary', maxHp: 20, armor: 1, attack: 10 }, 'ordinary');
  }
  const enemy = { id: 'fixture-enemy', name: '门钉妖影', tier: 'ordinary', maxHp: 40, armor: 2, attack: 7 };
  const fixtureRun = name === 'party_hp_zero'
    ? { ...baseRun, partners: [{ ...getPartner('partner-shen-li'), hp: 8 }] }
    : baseRun;
  const logs = [];
  let current = initialSnapshot(fixtureRun, enemy);
  logs.push(createCombatLog(current, current, { actorId: 'system', targetId: enemy.id, actionType: 'combat_start', visualCue: 'intro', text: '【战斗开始】边缘用例。', isTerminal: false, round: 0 }));
  if (name === 'hero_dead' || name === 'party_hp_zero') {
    const hero = livingParty(current, fixtureRun).find((member) => member.kind === 'hero');
    current = damagePartyMember(logs, current, fixtureRun, {
      actorId: enemy.id, target: hero, power: 99, armorBreak: 5, pressure: 0, round: 1,
      actionType: name === 'hero_dead' ? 'hero_dead' : 'enemy_attack',
      text: () => name === 'hero_dead' ? '【结果·失败】主角倒下，队伍已无人站立。' : '主角倒下，但同行者仍在抵抗。'
    });
    if (name === 'party_hp_zero') {
      const partner = livingParty(current, fixtureRun).find((member) => member.kind === 'partner');
      current = damagePartyMember(logs, current, fixtureRun, {
        actorId: enemy.id, target: partner, power: 99, armorBreak: 5, pressure: 0, round: 1,
        actionType: 'party_hp_zero', text: () => '【结果·失败】最后一名同行者倒下，队伍全员失去战斗能力。'
      });
    }
    return resultFromTerminal({ logs, enemy, tier: 'ordinary' });
  }
  throw new Error(`Unknown combat fixture: ${name}`);
}
