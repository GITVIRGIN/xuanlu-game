import { createDefaultMeta, familiarityStage, LORE_HINTS, loreStage } from '../data/lore.js';
import {
  applyRunToExpansionProgress,
  createDefaultExpansionProgress,
  evaluateExpansionProgress,
  EXPANSION_ARRIVALS,
  normalizeExpansionProgress
} from '../data/expansionCanon.js';
import { getPartner } from '../data/partners.js';
import { PARTY_LIMITS, clampReviveSeals } from '../contracts/partyScale.js';
import { buildRunSequence } from '../engine/runDirector.js';

const STORAGE_KEY = 'heishan-r19-meta-v1';
const ACTIVE_RUN_STORAGE_KEY = 'heishan-r20-active-run-v1';
const ACTIVE_RUN_SCHEMA_VERSION = 1;
let memoryMeta = null;
let memoryActiveRun = null;

function safeClone(value) {
  return structuredClone(value);
}

function normalizeMeta(value) {
  const meta = value && typeof value === 'object' ? value : createDefaultMeta();
  if (!Array.isArray(meta.appliedRunIds)) meta.appliedRunIds = [];
  if (!meta.characterProgress || typeof meta.characterProgress !== 'object') meta.characterProgress = {};
  if (!meta.worldProgress || typeof meta.worldProgress !== 'object') meta.worldProgress = createDefaultMeta().worldProgress;
  meta.expansionProgress = evaluateExpansionProgress({ ...meta, expansionProgress: normalizeExpansionProgress(meta.expansionProgress) });
  return meta;
}

function normalizedReviveSealValue(value, fallback) {
  if (value === null || value === undefined || value === '') return clampReviveSeals(fallback);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clampReviveSeals(numeric) : clampReviveSeals(fallback);
}

function normalizeCombatSnapshot(snapshot, fallbackReviveSeals) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  snapshot.reviveSeals = normalizedReviveSealValue(snapshot.reviveSeals, fallbackReviveSeals);
  return snapshot;
}

function normalizeActiveCombat(run) {
  const result = run.combat?.result;
  if (!result || typeof result !== 'object') return;
  const logs = Array.isArray(result.logs) ? result.logs : [];
  let rollingReviveSeals = run.reviveSeals;
  result.logs = logs.map((log) => {
    if (!log || typeof log !== 'object') return log;
    log.beforeState = normalizeCombatSnapshot(log.beforeState, rollingReviveSeals);
    const beforeReviveSeals = log.beforeState?.reviveSeals ?? rollingReviveSeals;
    const declaredDelta = Number(log.reviveSealDelta);
    const afterFallback = Number.isFinite(declaredDelta)
      ? beforeReviveSeals + declaredDelta
      : beforeReviveSeals;
    log.afterState = normalizeCombatSnapshot(log.afterState, afterFallback);
    const afterReviveSeals = log.afterState?.reviveSeals ?? beforeReviveSeals;
    log.reviveSealDelta = afterReviveSeals - beforeReviveSeals;
    rollingReviveSeals = afterReviveSeals;
    return log;
  });
  result.finalState = normalizeCombatSnapshot(result.finalState, rollingReviveSeals);
}

function normalizeActiveRun(value) {
  if (!value || typeof value !== 'object') return value;
  const run = safeClone(value);
  const defaults = createDefaultExpansionProgress();
  if (!Array.isArray(run.availableCharacterIds)) run.availableCharacterIds = [...defaults.unlockedCharacterIds];
  if (!Array.isArray(run.availableRouteIds)) run.availableRouteIds = [...defaults.unlockedRouteIds];
  if (!Number.isInteger(run.expansionContentVersion)) run.expansionContentVersion = 1;
  if (!run.expansionStage) run.expansionStage = 'E';
  if (!Array.isArray(run.partners)) run.partners = [];
  run.partners = run.partners.map((partner) => {
    const fallback = getPartner(partner.id);
    return {
      ...fallback,
      ...partner,
      hp: Math.max(0, Number(partner.hp ?? partner.maxHp ?? fallback.maxHp)),
      maxHp: Math.max(1, Number(partner.maxHp ?? fallback.maxHp)),
      armor: Math.max(0, Number(partner.armor ?? fallback.armor ?? 0)),
      damage: Math.max(0, Number(partner.damage ?? fallback.damage ?? 0)),
      combatProfile: partner.combatProfile || fallback.combatProfile
    };
  });
  run.reviveSeals = clampReviveSeals(run.reviveSeals ?? PARTY_LIMITS.startingReviveSeals);
  normalizeActiveCombat(run);
  if (Array.isArray(run.tavernOptions)) {
    run.tavernOptions = run.tavernOptions.map((option) => option?.partnerId
      ? { ...option, requirements: { ...(option.requirements || {}), maxPartners: PARTY_LIMITS.maxPartners } }
      : option);
  }
  const canMigrateFormalSequence = Array.isArray(run.sequence)
    && run.sequence.length < 25
    && !run.sequence.some((node) => node?.rescueRecovery);
  if (canMigrateFormalSequence) {
    const currentId = run.sequence[run.nodeIndex]?.id;
    const migratedSequence = buildRunSequence();
    const migratedIndex = migratedSequence.findIndex((node) => node.id === currentId);
    if (migratedIndex >= 0) {
      run.sequence = migratedSequence;
      run.nodeIndex = migratedIndex;
    }
  }
  run.version = 'r20-p20';
  return run;
}

export function isValidActiveRun(run) {
  return Boolean(
    run
    && typeof run === 'object'
    && typeof run.runId === 'string'
    && run.runId.startsWith('run-')
    && Number.isFinite(run.seed)
    && Array.isArray(run.sequence)
    && run.sequence.length >= 1
    && Number.isInteger(run.nodeIndex)
    && typeof run.view === 'string'
    && run.view !== 'settlement'
    && run.stats
    && Number.isFinite(run.stats.hp)
    && Number.isFinite(run.stats.maxHp)
    && run.stats.maxHp > 0
    && run.daomai
    && typeof run.daomai === 'object'
  );
}

export function loadMeta() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalizeMeta(JSON.parse(raw));
    }
  } catch {
    // Fall through to deterministic memory state.
  }
  if (!memoryMeta) memoryMeta = createDefaultMeta();
  return safeClone(normalizeMeta(memoryMeta));
}

export function saveMeta(meta) {
  memoryMeta = safeClone(normalizeMeta(meta));
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryMeta));
  } catch {
    // Memory persistence remains available for harness and restricted browsers.
  }
  return safeClone(memoryMeta);
}

export function loadActiveRun() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ACTIVE_RUN_STORAGE_KEY);
      if (raw) {
        const envelope = JSON.parse(raw);
        const candidate = envelope?.schemaVersion === ACTIVE_RUN_SCHEMA_VERSION ? normalizeActiveRun(envelope.run) : null;
        if (isValidActiveRun(candidate)) {
          memoryActiveRun = safeClone(candidate);
          return safeClone(candidate);
        }
        localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
      }
    }
  } catch {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions.
    }
    // Fall through to the in-memory copy; malformed storage is never persisted.
  }
  return isValidActiveRun(memoryActiveRun) ? normalizeActiveRun(memoryActiveRun) : null;
}

export function saveActiveRun(run) {
  if (!isValidActiveRun(run)) {
    clearActiveRun();
    return null;
  }
  memoryActiveRun = safeClone(run);
  const envelope = {
    schemaVersion: ACTIVE_RUN_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    run: memoryActiveRun
  };
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // In-memory resume remains available for restricted browsers and harnesses.
  }
  return safeClone(memoryActiveRun);
}

export function clearActiveRun() {
  memoryActiveRun = null;
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
  return null;
}

export function resetMeta() {
  memoryMeta = createDefaultMeta();
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
  return loadMeta();
}

export function seedReviewMeta() {
  const meta = createDefaultMeta();
  meta.characterProgress['shen-li'] = {
    familiarity: 7,
    keyStorySeen: 3,
    keyStoryTotal: 5,
    clears: 1,
    bossEncounters: 2,
    endingsSeen: ['带回被守住的一页'],
    oldCausesSeen: ['旧因·旧军残阵', '旧因·封门旧案'],
    bossCluesSeen: ['玄甲成势可抗妖将的撕甲连击'],
    lastRunSummary: '以玄甲成势守过三阶，带回一页旧军册。'
  };
  meta.characterProgress['lu-qinglu'] = {
    familiarity: 3,
    keyStorySeen: 1,
    keyStoryTotal: 5,
    clears: 0,
    bossEncounters: 1,
    endingsSeen: [],
    oldCausesSeen: ['旧因·雷契旧债'],
    bossCluesSeen: ['雷契成势可先破首领护甲'],
    lastRunSummary: '在雷血路上留下了一笔未清的债。'
  };
  meta.worldProgress = {
    loreStage: 4,
    oldCausesFound: ['旧因·旧军残阵', '旧因·封门旧案', '旧因·雷契旧债'],
    fulfillmentsSeen: ['妖将重击与旧军阵会因此松动'],
    bossCluesFound: ['玄甲成势可抗妖将的撕甲连击', '雷契成势可先破首领护甲'],
    routesSeen: ['xuanjia', 'leixue', 'zhenyu'],
    endingsSeen: ['带回被守住的一页'],
    truthFragments: ['黑山旧案残页'],
    nextHint: LORE_HINTS[4]
  };
  return saveMeta(meta);
}

export function seedExpansionReviewMeta(stage = 'H') {
  const meta = seedReviewMeta();
  for (const id of ['shen-li', 'yue-chenbei', 'lu-qinglu']) {
    meta.characterProgress[id] = {
      ...(meta.characterProgress[id] || {}),
      familiarity: Math.max(10, Number(meta.characterProgress[id]?.familiarity || 0)),
      keyStorySeen: 4,
      keyStoryTotal: 5,
      clears: Math.max(1, Number(meta.characterProgress[id]?.clears || 0)),
      bossEncounters: Math.max(1, Number(meta.characterProgress[id]?.bossEncounters || 0)),
      endingsSeen: meta.characterProgress[id]?.endingsSeen || [],
      oldCausesSeen: meta.characterProgress[id]?.oldCausesSeen || [],
      bossCluesSeen: meta.characterProgress[id]?.bossCluesSeen || [],
      lastRunSummary: meta.characterProgress[id]?.lastRunSummary || '已经带回一份可核对的黑山证词。'
    };
  }
  const expansion = createDefaultExpansionProgress();
  const stages = ['F', 'G', 'H'];
  for (const key of stages) {
    if (stages.indexOf(key) > stages.indexOf(stage)) continue;
    const arrival = EXPANSION_ARRIVALS[key];
    expansion.acknowledgedArrivals.push(arrival.id);
    expansion.unlockedCharacterIds.push(arrival.unlockCharacterId);
    expansion.unlockedRouteIds.push(arrival.unlockRouteId);
    expansion.fragments[arrival.fragmentId].status = key === 'H' ? 'contested' : 'confirmed';
    expansion.fragments[arrival.fragmentId].witnesses = key === 'F' ? ['su-yanhui', 'shen-li'] : key === 'G' ? ['bai-heng', 'lu-qinglu'] : ['liu-jisheng'];
  }
  expansion.stage = stage;
  expansion.legalBlackMountainVictories = 3;
  expansion.keyRouteEvents = ['zhuoying-protected-living-witness'];
  expansion.archiveConflictRecords = ['空名牒日期', '逆命簿病案'];
  expansion.controlWitnessRuns = 1;
  meta.expansionProgress = expansion;
  meta.worldProgress.routesSeen = [...new Set([...meta.worldProgress.routesSeen, ...expansion.unlockedRouteIds])];
  return saveMeta(meta);
}

export function applyRunToMeta(run) {
  if (run.metaApplied) return loadMeta();
  const meta = loadMeta();
  if (run.runId && meta.appliedRunIds.includes(run.runId)) return meta;
  const character = meta.characterProgress[run.characterId] || {
    familiarity: 0,
    keyStorySeen: 0,
    keyStoryTotal: 5,
    clears: 0,
    bossEncounters: 0,
    endingsSeen: [],
    oldCausesSeen: [],
    bossCluesSeen: [],
    lastRunSummary: ''
  };
  character.familiarity += run.outcome === 'victory' ? 3 : 1;
  character.keyStorySeen = Math.min(5, character.keyStorySeen + 1);
  character.bossEncounters += 1;
  if (run.outcome === 'victory') character.clears += 1;
  character.oldCausesSeen = [...new Set([...character.oldCausesSeen, ...run.oldCauses])];
  character.bossCluesSeen = [...new Set([...character.bossCluesSeen, ...run.bossClues])];
  const ending = run.outcome === 'victory' ? '带回被守住的一页' : run.endedReason === 'second_dying' ? '再无救援' : '败退回酒馆';
  character.endingsSeen = [...new Set([...character.endingsSeen, ending])];
  character.lastRunSummary = `${run.routeName}：${run.outcome === 'victory' ? '守过首领三阶' : '未能破局'}；主修 ${run.primaryDaomaiName || '未定'}。`;
  character.stage = familiarityStage(character.familiarity);
  meta.characterProgress[run.characterId] = character;

  const world = meta.worldProgress;
  world.oldCausesFound = [...new Set([...world.oldCausesFound, ...run.oldCauses])];
  world.fulfillmentsSeen = [...new Set([...world.fulfillmentsSeen, ...run.fulfillments])];
  world.bossCluesFound = [...new Set([...world.bossCluesFound, ...run.bossClues])];
  world.routesSeen = [...new Set([...world.routesSeen, run.routeId])];
  world.endingsSeen = [...new Set([...world.endingsSeen, ending])];
  if (run.outcome === 'victory') world.truthFragments = [...new Set([...world.truthFragments, '黑山旧案残页'])];
  world.loreStage = loreStage(world);
  world.nextHint = LORE_HINTS[world.loreStage];
  if (run.runId) meta.appliedRunIds = [...meta.appliedRunIds, run.runId].slice(-200);
  return saveMeta(applyRunToExpansionProgress(meta, run));
}
