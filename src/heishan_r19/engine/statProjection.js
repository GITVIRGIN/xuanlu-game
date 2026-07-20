import { clampReviveSeals } from '../contracts/partyScale.js';

const COMBAT_KEYS = Object.freeze(['hp', 'armor', 'damage']);
const SHARED_KEYS = Object.freeze(['pressure', 'clues', 'bossPrep']);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function projectStats(stats, delta = {}) {
  return {
    ...stats,
    hp: clamp(stats.hp + (delta.hp || 0), 0, stats.maxHp),
    armor: Math.max(0, stats.armor + (delta.armor || 0)),
    damage: Math.max(0, stats.damage + (delta.damage || 0)),
    pressure: clamp(stats.pressure + (delta.pressure || 0), 0, 10),
    clues: Math.max(0, stats.clues + (delta.clues || 0)),
    bossPrep: Math.max(0, stats.bossPrep + (delta.bossPrep || 0))
  };
}

export function projectPartner(partner, delta = {}) {
  const maxHp = Math.max(1, Number(partner.maxHp || 1));
  const currentHp = Math.max(0, Number(partner.hp ?? maxHp));
  return {
    ...partner,
    hp: currentHp <= 0 ? 0 : clamp(currentHp + Number(delta.hp || 0), 0, maxHp),
    armor: Math.max(0, Number(partner.armor || 0) + Number(delta.armor || 0)),
    damage: Math.max(0, Number(partner.damage || 0) + Number(delta.damage || 0))
  };
}

function pick(delta, keys) {
  return Object.fromEntries(keys.filter((key) => Number(delta?.[key] || 0) !== 0).map((key) => [key, Number(delta[key]) || 0]));
}

export function selectionEffectScope(entry = {}) {
  const scope = entry.scope || 'leader';
  if (!['leader', 'party', 'partners'].includes(scope)) throw new Error(`Unknown selection effect scope: ${scope}`);
  return scope;
}

export function applySelectionEffect(run, entry = {}) {
  const delta = entry.delta || {};
  const scope = selectionEffectScope(entry);
  const sharedDelta = pick(delta, SHARED_KEYS);
  const combatDelta = pick(delta, COMBAT_KEYS);
  const leaderDelta = scope === 'partners' ? sharedDelta : { ...sharedDelta, ...combatDelta };
  run.stats = projectStats(run.stats, leaderDelta);
  if (scope === 'party' || scope === 'partners') {
    run.partners = (run.partners || []).map((partner) => projectPartner(partner, combatDelta));
  }
  const counterDelta = entry.counterDelta || {};
  if (Number(counterDelta.reviveSeals || 0) !== 0) {
    run.reviveSeals = clampReviveSeals(Number(run.reviveSeals || 0) + Number(counterDelta.reviveSeals || 0));
  }
  return { scope, leaderDelta, partnerDelta: scope === 'party' || scope === 'partners' ? combatDelta : {}, counterDelta };
}

export function applyStatsDelta(run, delta = {}) {
  run.stats = projectStats(run.stats, delta);
  return run.stats;
}
