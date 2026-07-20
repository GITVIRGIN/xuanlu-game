import { getCharacter, RECOVERY_CANON_CHARACTER_IDS } from '../data/characters.js';
import { PARTNERS } from '../data/partners.js';
import { ALL_CANON_ROUTES, getRoute, RECOVERY_CANON_ROUTES } from '../data/routes.js';
import { getChoiceSet } from '../data/choices.js';
import { rescueRecoveryChoices, rewardChoices } from '../data/rewards.js';
import { crossedThresholds, DAOMAI, emptyDaomai } from '../data/daomai.js';
import { enemyFor } from '../data/enemies.js';
import { getBoss } from '../data/bosses.js';
import { applyPostRescuePacing, bindExpansionStorySequence, buildRunSequence, planPostRescuePacing, traceFor } from './runDirector.js';
import { runCombatFixture, simulateCombat } from './combatEngine.js';
import { applyRescue, openRescueState, selectRescueOption as selectRescueState } from './rescueSystem.js';
import { evaluateActionAvailability } from './actionAvailability.js';
import { applySelectionEffect, applyStatsDelta as applyStats } from './statProjection.js';
import { FORMAL_RUN_VIEW } from '../contracts/formalNavigation.js';
import { availableCharacterIds, availableRouteIds, EXPANSION_CONTENT_VERSION, STRONG_CHARACTER_ROUTE_MATRIX } from '../data/expansionCanon.js';
import { PARTY_LIMITS, clampReviveSeals } from '../contracts/partyScale.js';

export const TAVERN_SHARED_RECOVERY = 4;

function clone(run) {
  return structuredClone(run);
}

let runSerial = 0;

function createRunId(seed) {
  runSerial += 1;
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `run-${uuid}` : `run-${seed}-${Date.now().toString(36)}-${runSerial.toString(36)}`;
}

function applyDaomai(run, delta = {}) {
  const crossed = [];
  Object.entries(delta).forEach(([id, amount]) => {
    if (!(id in run.daomai) || !amount) return;
    const before = run.daomai[id];
    run.daomai[id] += amount;
    crossed.push(...crossedThresholds(before, run.daomai[id], id));
  });
  run.thresholdLog.push(...crossed.map((entry) => ({ ...entry, nodeIndex: run.nodeIndex })));
  return crossed;
}

function uniquePush(array, value) {
  if (value && !array.includes(value)) array.push(value);
}

function currentNode(run) {
  return run.sequence[run.nodeIndex] || null;
}

function recruitCandidates(run, count = 3) {
  const unavailable = new Set(run.partners.map((partner) => partner.id));
  PARTNERS.filter((partner) => partner.characterId === run.characterId).forEach((partner) => unavailable.add(partner.id));
  const unlocked = new Set(run.availableCharacterIds || RECOVERY_CANON_CHARACTER_IDS);
  PARTNERS.filter((partner) => !unlocked.has(partner.characterId)).forEach((partner) => unavailable.add(partner.id));
  const routeOffset = Math.max(0, ALL_CANON_ROUTES.findIndex((route) => route.id === run.routeId));
  const start = Math.abs(run.seed * 11 + run.tavernVisits * 7 + routeOffset * 3) % PARTNERS.length;
  const candidates = [];
  for (let offset = 0; candidates.length < count && offset < PARTNERS.length * 2; offset += 1) {
    const partner = PARTNERS[(start + offset * 5) % PARTNERS.length];
    if (!unavailable.has(partner.id) && !candidates.some((item) => item.id === partner.id)) candidates.push(partner);
  }
  return candidates;
}

function tavernOptions(run, bossVisit = false) {
  const candidates = run.partners.length < PARTY_LIMITS.maxPartners ? recruitCandidates(run, bossVisit ? 2 : 3) : [];
  const sharedRecovery = bossVisit ? 0 : TAVERN_SHARED_RECOVERY;
  const base = [
    { id: 'heal', title: '炉火包扎', description: '全队恢复 8，压力 -1', scope: 'party', delta: { hp: 8, pressure: -1 }, daomai: { jiuhuo: 1 }, icon: 'heal' },
    { id: 'prep', title: '擦拭旧甲', description: '护甲 +3', delta: { armor: 3 }, daomai: { xuanjia: 1 }, icon: 'prep' },
    { id: 'intel', title: '向掌柜打听旧案', description: '破局线索 +2，破局把握 +1', delta: { clues: 2, bossPrep: 1 }, daomai: { jiuyan: 1 }, icon: 'intel' },
    { id: 'ward', title: '压一道镇符', description: '压力 -2', delta: { pressure: -2 }, daomai: { zhenfu: 1 }, icon: 'ward' },
    { id: 'revive-seal', title: '重描一枚扶魂符', description: '扶魂符 +1；战内可让主角放弃攻击，救起一名倒地同行者', delta: {}, counterDelta: { reviveSeals: 1 }, daomai: { jiuhuo: 1 }, requirements: { openReviveSealSlots: 1 }, icon: 'revive' }
  ];
  return [
    ...base.map((action) => sharedRecovery > 0 ? {
      ...action,
      tavernRecovery: sharedRecovery,
      description: `${action.description}；炉火热食另使全队恢复 ${sharedRecovery}`
    } : action),
    ...candidates.map((partner) => ({
      id: `recruit:${partner.id}`,
      title: `招募 ${partner.name}`,
      description: `${partner.role}；代价：${partner.cost}${sharedRecovery > 0 ? `；炉火热食使全队恢复 ${sharedRecovery}` : ''}`,
      partnerId: partner.id,
      delta: partner.cost === '压力+1' ? { pressure: 1 } : partner.cost === '旧案线索-1' ? { clues: -1 } : { damage: -1 },
      daomai: { partner: 2 },
      requirements: { openPartnerSlots: 1, maxPartners: PARTY_LIMITS.maxPartners },
      tavernRecovery: sharedRecovery,
      icon: 'recruit'
    }))
  ];
}

export function createRun(seed = 19, runId = createRunId(seed), meta = null) {
  return {
    version: 'r20-p20',
    expansionContentVersion: EXPANSION_CONTENT_VERSION,
    expansionStage: meta?.expansionProgress?.stage || 'E',
    availableCharacterIds: [...availableCharacterIds(meta)],
    availableRouteIds: [...availableRouteIds(meta)],
    runId,
    seed,
    view: FORMAL_RUN_VIEW.CHARACTER_SELECT,
    sequence: buildRunSequence(),
    nodeIndex: -1,
    characterId: null,
    characterName: '',
    routeId: null,
    routeName: '',
    selectedCharacterId: null,
    selectedRouteId: null,
    stats: { hp: 40, maxHp: 40, armor: 0, damage: 6, pressure: 2, clues: 0, bossPrep: 0 },
    daomai: emptyDaomai(),
    thresholdLog: [],
    runHistory: [],
    oldCauses: [],
    fulfillments: [],
    debtMarks: [],
    bossClues: [],
    rewards: [],
    partners: [],
    reviveSeals: PARTY_LIMITS.startingReviveSeals,
    rescueCharges: 1,
    rescueUsed: false,
    rescueState: null,
    pendingRescuePacing: null,
    lastRescuePacing: null,
    tavernVisits: 0,
    selectedChoiceId: null,
    selectedRewardId: null,
    selectedTavernActionId: null,
    choiceSet: null,
    rewardOptions: [],
    tavernOptions: [],
    lastConsequence: null,
    nodeResolved: false,
    combat: null,
    outcome: null,
    endedReason: null,
    settlementApplied: false
  };
}

export function selectCharacter(run, id) {
  if (!(run.availableCharacterIds || RECOVERY_CANON_CHARACTER_IDS).includes(id)) return run;
  const next = clone(run);
  next.selectedCharacterId = getCharacter(id).id;
  return next;
}

export function confirmCharacter(run) {
  if (!run.selectedCharacterId) return run;
  const next = clone(run);
  const character = getCharacter(next.selectedCharacterId);
  next.characterId = character.id;
  next.characterName = character.name;
  next.stats = {
    hp: character.maxHp,
    maxHp: character.maxHp,
    armor: character.armor,
    damage: character.damage,
    pressure: character.pressure,
    clues: character.id === 'gu-wujiu' ? 1 : 0,
    bossPrep: character.id === 'yue-chenbei' ? 1 : 0
  };
  next.view = FORMAL_RUN_VIEW.ROUTE_SELECT;
  return next;
}

export function selectRoute(run, id) {
  if (!(run.availableRouteIds || RECOVERY_CANON_ROUTES.map((route) => route.id)).includes(id)) return run;
  const next = clone(run);
  next.selectedRouteId = getRoute(id).id;
  return next;
}

export function confirmRoute(run) {
  if (!run.selectedRouteId) return run;
  const next = clone(run);
  const route = getRoute(next.selectedRouteId);
  next.routeId = route.id;
  next.routeName = route.name;
  next.routeAffinity = STRONG_CHARACTER_ROUTE_MATRIX[next.characterId]?.[route.id] || 'G';
  next.routeState = route.id === 'zhuoying'
    ? { trace: 0, targetSwitches: 0, duanmingWindow: false }
    : route.id === 'guizang'
      ? { savedRules: [], replayCount: 0, returnedCosts: 0 }
      : route.id === 'wuxiang'
        ? { transfers: 0, distortion: 0, sourceVisible: true }
        : null;
  applyStats(next, route.delta);
  next.sequence = bindExpansionStorySequence(next.sequence, next.characterId, route.id);
  next.runHistory.push({ type: 'route', routeId: route.id, title: route.name, immediateEffect: route.risk, affinity: next.routeAffinity, question: route.question });
  next.nodeIndex = 0;
  return enterCurrentNode(next);
}

export function enterCurrentNode(run) {
  const next = clone(run);
  const node = currentNode(next);
  next.selectedChoiceId = null;
  next.selectedRewardId = null;
  next.selectedTavernActionId = null;
  next.lastConsequence = null;
  next.nodeResolved = false;
  next.choiceSet = null;
  next.rewardOptions = [];
  next.tavernOptions = [];
  next.combat = null;
  if (!node) return next;
  if (node.kind === 'choice') {
    next.view = FORMAL_RUN_VIEW.CHOICE;
    next.choiceSet = getChoiceSet(node.choiceId, next.seed);
  } else if (node.kind === 'reward') {
    next.view = FORMAL_RUN_VIEW.REWARD;
    const acquiredRewardIds = next.runHistory
      .filter((entry) => entry.type === 'reward' && entry.rewardId)
      .map((entry) => entry.rewardId);
    next.rewardOptions = node.rescueRecovery
      ? rescueRecoveryChoices(next.seed + next.nodeIndex, 3)
      : rewardChoices(next.seed + next.nodeIndex, 3, [
        ...next.rewards.map((reward) => reward.id),
        ...acquiredRewardIds
      ]);
  } else if (node.kind === 'tavern') {
    next.view = FORMAL_RUN_VIEW.TAVERN;
    next.tavernVisits += 1;
    next.tavernOptions = tavernOptions(next, false);
  } else if (node.kind === 'combat' || node.kind === 'elite') {
    next.view = FORMAL_RUN_VIEW.COMBAT;
    const enemy = enemyFor(next.seed + next.nodeIndex * 7, node.kind === 'elite' ? 'elite' : 'ordinary');
    const result = simulateCombat(next, enemy, node.kind === 'elite' ? 'elite' : 'ordinary');
    next.combat = { enemy, result, logIndex: 0, allLogsRevealed: result.logs.length === 1, legalTerminal: false, reportMode: 'single', fixture: null };
  } else if (node.kind === 'boss') {
    next.view = FORMAL_RUN_VIEW.COMBAT;
    const boss = { ...getBoss(getRoute(next.routeId).bossId), tier: 'boss' };
    const result = simulateCombat(next, boss, 'boss');
    next.combat = { enemy: boss, result, logIndex: 0, allLogsRevealed: result.logs.length === 1, legalTerminal: false, reportMode: 'single', fixture: null };
  } else if (node.kind === 'settlement') {
    next.view = FORMAL_RUN_VIEW.SETTLEMENT;
    next.nodeResolved = true;
    if (!next.outcome) next.outcome = next.stats.hp > 0 ? 'retreat' : 'failure';
  }
  return next;
}

export function selectChoice(run, id) {
  if (run.view !== FORMAL_RUN_VIEW.CHOICE || run.nodeResolved || !run.choiceSet) return run;
  const selected = run.choiceSet.options.find((entry) => entry.id === id);
  if (!selected || !evaluateActionAvailability(run, selected).available) return run;
  const next = clone(run);
  next.selectedChoiceId = id;
  return next;
}

export function confirmChoice(run) {
  if (run.view !== FORMAL_RUN_VIEW.CHOICE || !run.choiceSet || !run.selectedChoiceId || run.nodeResolved) return run;
  const selected = run.choiceSet.options.find((entry) => entry.id === run.selectedChoiceId);
  if (!selected || !evaluateActionAvailability(run, selected).available) return run;
  const next = clone(run);
  applySelectionEffect(next, selected);
  const crossed = applyDaomai(next, selected.daomai);
  uniquePush(next.oldCauses, selected.oldCause);
  uniquePush(next.fulfillments, selected.fulfillment);
  uniquePush(next.bossClues, selected.bossClue);
  if (selected.debtMark) next.debtMarks.push(selected.debtMark);
  next.lastConsequence = {
    title: selected.title,
    immediate: selected.immediate,
    daomai: selected.daomai,
    thresholds: crossed,
    oldCause: selected.oldCause,
    fulfillment: selected.fulfillment,
    debtMark: selected.debtMark,
    bossClue: selected.bossClue
  };
  next.runHistory.push({
    type: 'choice',
    nodeId: currentNode(next).id,
    title: selected.title,
    immediateEffect: selected.immediate,
    daomaiDelta: selected.daomai,
    thresholds: crossed,
    oldCause: selected.oldCause,
    futureFulfillment: selected.fulfillment,
    debtMark: selected.debtMark,
    bossClue: selected.bossClue
  });
  if (selected.special === 'enter-boss-tavern') {
    next.stats.pressure = Math.min(10, next.stats.pressure + 1);
    next.view = FORMAL_RUN_VIEW.BOSS_PRE_TAVERN;
    next.tavernVisits += 1;
    next.tavernOptions = tavernOptions(next, true);
  } else {
    next.nodeResolved = true;
    next.view = FORMAL_RUN_VIEW.CHOICE_RESULT;
  }
  return next;
}

export function selectReward(run, id) {
  if (run.view !== FORMAL_RUN_VIEW.REWARD || run.nodeResolved) return run;
  const selected = run.rewardOptions.find((entry) => entry.id === id);
  if (!selected || !evaluateActionAvailability(run, selected).available) return run;
  const next = clone(run);
  next.selectedRewardId = id;
  return next;
}

export function acquireReward(run) {
  if (run.view !== FORMAL_RUN_VIEW.REWARD || !run.selectedRewardId || run.nodeResolved) return run;
  const reward = run.rewardOptions.find((entry) => entry.id === run.selectedRewardId);
  if (!reward || !evaluateActionAvailability(run, reward).available) return run;
  const next = clone(run);
  applySelectionEffect(next, reward);
  const crossed = applyDaomai(next, reward.daomai);
  next.rewards.push(reward);
  uniquePush(next.oldCauses, reward.oldCause);
  next.runHistory.push({ type: 'reward', rewardId: reward.id, name: reward.name, immediateEffect: reward.immediate, daomaiDelta: reward.daomai, thresholds: crossed, oldCause: reward.oldCause });
  next.lastConsequence = { title: reward.name, immediate: reward.immediate, daomai: reward.daomai, thresholds: crossed, oldCause: reward.oldCause, fulfillment: '', debtMark: '', bossClue: '' };
  next.nodeResolved = true;
  next.view = FORMAL_RUN_VIEW.REWARD_RESULT;
  return next;
}

export function chooseTavernAction(run, id) {
  if (![FORMAL_RUN_VIEW.TAVERN, FORMAL_RUN_VIEW.BOSS_PRE_TAVERN].includes(run.view) || run.nodeResolved) return run;
  const action = run.tavernOptions.find((entry) => entry.id === id);
  const recruitedPartner = action?.partnerId ? PARTNERS.find((partner) => partner.id === action.partnerId) : null;
  if (!action || (action.partnerId && !recruitedPartner) || !evaluateActionAvailability(run, action).available) return run;
  const next = clone(run);
  applySelectionEffect(next, action);
  if (Number(action.tavernRecovery || 0) > 0) {
    applySelectionEffect(next, { scope: 'party', delta: { hp: Number(action.tavernRecovery) } });
  }
  const crossed = applyDaomai(next, action.daomai);
  if (recruitedPartner) {
    next.partners.push({ ...recruitedPartner, hp: recruitedPartner.maxHp, armor: recruitedPartner.armor, damage: recruitedPartner.damage });
  }
  const oldCause = recruitedPartner ? `旧因·同行之誓（${recruitedPartner.name}）` : `旧因·${action.title}`;
  const fulfillment = '后续战斗中应验';
  const debtMark = action.debtMark || '';
  const bossClue = action.id === 'intel' ? '掌柜指出首领最后一道逼命杀招' : '';
  uniquePush(next.oldCauses, oldCause);
  uniquePush(next.fulfillments, fulfillment);
  if (debtMark) next.debtMarks.push(debtMark);
  uniquePush(next.bossClues, bossClue);
  next.runHistory.push({ type: action.partnerId ? 'recruit' : 'tavern', actionId: action.id, title: action.title, cost: action.description, daomaiDelta: action.daomai, thresholds: crossed, oldCause, futureFulfillment: fulfillment, debtMark, bossClue });
  next.lastConsequence = { title: action.title, immediate: action.description, daomai: action.daomai, thresholds: crossed, oldCause, fulfillment, debtMark, bossClue };
  next.nodeResolved = true;
  next.view = FORMAL_RUN_VIEW.TAVERN_RESULT;
  return next;
}

export function selectTavernAction(run, id) {
  if (![FORMAL_RUN_VIEW.TAVERN, FORMAL_RUN_VIEW.BOSS_PRE_TAVERN].includes(run.view) || run.nodeResolved) return run;
  const action = run.tavernOptions.find((entry) => entry.id === id);
  if (!action || !evaluateActionAvailability(run, action).available) return run;
  const next = clone(run);
  next.selectedTavernActionId = action.id;
  return next;
}

export function confirmTavernAction(run) {
  if (!run.selectedTavernActionId) return run;
  return chooseTavernAction(run, run.selectedTavernActionId);
}

export function revealNextCombatLog(run) {
  if (!run.combat || run.combat.allLogsRevealed) return run;
  const next = clone(run);
  next.combat.logIndex = Math.min(next.combat.result.logs.length - 1, next.combat.logIndex + 1);
  next.combat.allLogsRevealed = next.combat.logIndex === next.combat.result.logs.length - 1;
  next.combat.legalTerminal = next.combat.allLogsRevealed && Boolean(next.combat.result.logs[next.combat.logIndex].isTerminal);
  return next;
}

export function directSettleCombat(run) {
  if (!run.combat) return run;
  const next = clone(run);
  next.combat.logIndex = next.combat.result.logs.length - 1;
  next.combat.allLogsRevealed = true;
  next.combat.legalTerminal = Boolean(next.combat.result.logs[next.combat.logIndex].isTerminal);
  next.combat.reportMode = 'full';
  return next;
}

function applyCombatFinal(run) {
  const finalState = run.combat.result.finalState;
  run.stats.hp = finalState.heroHp;
  run.stats.armor = finalState.heroArmor;
  run.stats.pressure = finalState.pressure;
  run.reviveSeals = clampReviveSeals(finalState.reviveSeals ?? run.reviveSeals);
  run.partners = run.partners.map((partner) => {
    const finalPartner = finalState.partners.find((entry) => entry.id === partner.id);
    return finalPartner ? { ...partner, hp: finalPartner.hp, armor: finalPartner.armor, damage: finalPartner.damage } : partner;
  });
  if (run.combat.result.resolutionReason === 'enemy_hp_zero_allies_hold' && run.stats.hp === 0) run.stats.hp = 1;
  if (run.combat.result.routeRead) run.routeState = { ...run.combat.result.routeRead };
  run.runHistory.push({
    type: 'combat',
    enemy: run.combat.result.enemyName,
    tier: run.combat.result.tier,
    outcome: run.combat.result.outcome,
    resolutionReason: run.combat.result.resolutionReason,
    finalState,
    routeRead: run.combat.result.routeRead || null
  });
}

export function continueCombat(run) {
  if (!run.combat || !run.combat.legalTerminal || !run.combat.allLogsRevealed) return run;
  let next = clone(run);
  applyCombatFinal(next);
  const result = next.combat.result;
  const recoverableDefeat = result.tier !== 'boss' && ['hero_dead', 'party_hp_zero'].includes(result.resolutionReason);
  if (recoverableDefeat) {
    if (next.rescueCharges > 0) {
      next.pendingAfterRescueIndex = next.combat.fixture ? next.nodeIndex : next.nodeIndex + 1;
      next.pendingRescuePacing = next.combat.fixture ? null : planPostRescuePacing(next.sequence, next.nodeIndex);
      return openRescueState(next);
    }
    next.outcome = 'failure';
    next.endedReason = 'second_dying';
    const settlementIndex = next.sequence.findIndex((node) => node.kind === 'settlement');
    next.nodeIndex = settlementIndex;
    return enterCurrentNode(next);
  }
  if (result.tier === 'boss') {
    next.outcome = result.outcome === 'victory' ? 'victory' : 'failure';
    next.endedReason = result.resolutionReason;
  } else if (result.outcome === 'failure') {
    next.outcome = 'failure';
    next.endedReason = result.resolutionReason;
    const settlementIndex = next.sequence.findIndex((node) => node.kind === 'settlement');
    next.nodeIndex = settlementIndex;
    return enterCurrentNode(next);
  }
  next.nodeResolved = true;
  return advanceNode(next);
}

export function chooseRescue(run, id) {
  return applyRescue(run, id);
}

export function selectRescueOption(run, id) {
  return selectRescueState(run, id);
}

export function confirmRescue(run) {
  if (!run.rescueState?.selectedId) return run;
  return applyRescue(run, run.rescueState.selectedId);
}

export function continueRescue(run) {
  if (!run.rescueState || run.rescueState.phase !== 'result') return run;
  const next = clone(run);
  const target = next.pendingAfterRescueIndex;
  const pacing = next.pendingRescuePacing || (next.combat && !next.combat.fixture
    ? planPostRescuePacing(next.sequence, next.nodeIndex)
    : null);
  if (pacing) {
    next.sequence = applyPostRescuePacing(next.sequence, pacing);
    next.lastRescuePacing = { ...pacing, applied: true };
  }
  next.pendingAfterRescueIndex = null;
  next.pendingRescuePacing = null;
  next.rescueState = null;
  if (next.combat && next.combat.fixture) {
    next.view = FORMAL_RUN_VIEW.TAVERN_RESULT;
    next.nodeResolved = true;
    next.lastConsequence = { title: '濒死救援完成', immediate: '带伤继续，救援次数已经扣除', daomai: {}, thresholds: [], oldCause: '旧因·酒馆救援', fulfillment: '再次濒死将直接结束本局', debtMark: next.debtMarks.at(-1) || '救援代价', bossClue: '' };
    return next;
  }
  next.nodeIndex = target;
  return enterCurrentNode(next);
}

export function advanceNode(run) {
  if (!run.nodeResolved) return run;
  const next = clone(run);
  next.nodeIndex += 1;
  return enterCurrentNode(next);
}

export function trace(run) {
  return traceFor(run);
}

export function primaryDaomai(run) {
  const [id, value] = Object.entries(run.daomai).sort((left, right) => right[1] - left[1])[0];
  return { id, name: DAOMAI[id].name, value };
}

export function startCombatFixture(run, name) {
  const next = clone(run?.characterId ? run : createRun(99));
  if (!next.characterId) {
    const character = getCharacter('shen-li');
    next.characterId = character.id;
    next.characterName = character.name;
    next.stats = { hp: 40, maxHp: 40, armor: 5, damage: 8, pressure: 2, clues: 1, bossPrep: 0 };
    next.routeId = 'xuanjia';
    next.routeName = '玄甲破军';
    next.nodeIndex = 0;
  }
  const result = runCombatFixture(name);
  const fixtureEnemy = enemyFor(0, 'ordinary');
  const fixturePartners = result.logs[0]?.afterState?.partners || [];
  next.partners = fixturePartners.map((state) => {
    const source = PARTNERS.find((partner) => partner.id === state.id) || state;
    return { ...source, hp: state.hp, maxHp: state.maxHp, armor: state.armor, damage: state.damage };
  });
  next.view = FORMAL_RUN_VIEW.COMBAT;
  next.combat = {
    enemy: { id: result.enemyId, name: result.enemyName, tier: 'ordinary', maxHp: result.logs[0].afterState.enemyMaxHp, armor: result.logs[0].afterState.enemyArmor, asset: fixtureEnemy.asset },
    result,
    logIndex: 0,
    allLogsRevealed: false,
    legalTerminal: false,
    reportMode: 'single',
    fixture: name
  };
  next.nodeResolved = false;
  return next;
}

export function createPreparedBossRun() {
  let run = createRun(77);
  run = confirmCharacter(selectCharacter(run, 'shen-li'));
  run = confirmRoute(selectRoute(run, 'xuanjia'));
  run.daomai.xuanjia = 7;
  run.daomai.jiuyan = 5;
  run.daomai.zhenfu = 3;
  run.daomai.jiuhuo = 3;
  run.daomai.partner = 3;
  run.oldCauses = ['旧因·旧军残阵', '旧因·档案真相', '旧因·炉火余温'];
  run.bossClues = ['玄甲成势可抗妖将的撕甲连击', '旧案三层可保住一条结论', '镇符成势可压低三阶妖气'];
  run.stats.clues = 3;
  run.stats.bossPrep = 5;
  run.stats.armor = 20;
  run.stats.damage = 12;
  run.nodeIndex = run.sequence.findIndex((node) => node.kind === 'boss');
  return enterCurrentNode(run);
}

export function createRescuePacingFixture() {
  let run = createRun(41);
  run = confirmCharacter(selectCharacter(run, 'shen-li'));
  run = confirmRoute(selectRoute(run, 'xuanjia'));
  run.nodeIndex = run.sequence.findIndex((node) => node.id === 'combat-2');
  const result = runCombatFixture('hero_dead');
  const fallbackEnemy = enemyFor(41, 'ordinary');
  run.view = FORMAL_RUN_VIEW.COMBAT;
  run.combat = {
    enemy: { ...fallbackEnemy, id: result.enemyId, name: result.enemyName },
    result,
    logIndex: 0,
    allLogsRevealed: false,
    legalTerminal: false,
    reportMode: 'single',
    fixture: null
  };
  run = continueCombat(directSettleCombat(run));
  return chooseRescue(run, 'keeper-credit');
}

export function testRecruitDiversity(seedCount = 20) {
  const ids = new Set();
  for (let seed = 1; seed <= seedCount; seed += 1) {
    const run = createRun(seed);
    run.routeId = RECOVERY_CANON_ROUTES[seed % RECOVERY_CANON_ROUTES.length].id;
    run.tavernVisits = seed % 3;
    recruitCandidates(run, 3).forEach((partner) => ids.add(partner.id));
  }
  return { seedCount, uniqueCandidateIds: [...ids], uniqueCount: ids.size };
}
