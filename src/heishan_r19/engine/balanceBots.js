import { RECOVERY_CANON_CHARACTER_IDS } from '../data/characters.js';
import { RECOVERY_CANON_ROUTE_IDS } from '../data/routes.js';
import { calculateBossPreparation } from './combatEngine.js';
import { availableActions } from './actionAvailability.js';
import {
  acquireReward,
  advanceNode,
  chooseRescue,
  chooseTavernAction,
  confirmCharacter,
  confirmChoice,
  confirmRoute,
  continueCombat,
  continueRescue,
  createRun,
  directSettleCombat,
  selectCharacter,
  selectChoice,
  selectReward,
  selectRoute
} from './runState.js';

export const BOT_IDS = [
  'random_bot',
  'highest_immediate_value_bot',
  'armor_stack_bot',
  'damage_stack_bot',
  'pressure_down_bot',
  'heal_stack_bot',
  'partner_synergy_bot',
  'xuanjia_threshold_bot',
  'leiqi_threshold_bot',
  'jiuyan_clue_bot',
  'zhenfu_control_bot',
  'xuezhai_burst_bot',
  'boss_counter_bot',
  'greedy_threshold_bot',
  'best_of_known_strategies_bot'
];

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(value) {
  let result = 17;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 31) >>> 0;
  return result;
}

function immediateValue(option) {
  const delta = option.delta || {};
  return (delta.armor || 0) * 1.2 + (delta.damage || 0) * 1.4 + (delta.hp || 0) * 0.45 - (delta.pressure || 0) * 1.1 + (delta.clues || 0) * 1.3 + (delta.bossPrep || 0) * 1.8;
}

function lineValue(option, line) {
  return (option.daomai && option.daomai[line]) || 0;
}

function strategyScore(strategy, option, state, rng) {
  const delta = option.delta || {};
  if (strategy === 'random_bot') return rng();
  if (strategy === 'highest_immediate_value_bot') return immediateValue(option);
  if (strategy === 'armor_stack_bot') return (delta.armor || 0) * 5 + lineValue(option, 'xuanjia') * 2;
  if (strategy === 'damage_stack_bot') return (delta.damage || 0) * 5 + lineValue(option, 'leiqi') * 2;
  if (strategy === 'pressure_down_bot') return -(delta.pressure || 0) * 6 + lineValue(option, 'zhenfu');
  if (strategy === 'heal_stack_bot') return (delta.hp || 0) * 4 + lineValue(option, 'jiuhuo') * 2;
  if (strategy === 'partner_synergy_bot') return lineValue(option, 'partner') * 7 + (option.id.includes('company') ? 3 : 0);
  if (strategy === 'xuanjia_threshold_bot') return lineValue(option, 'xuanjia') * 8 + (delta.armor || 0);
  if (strategy === 'leiqi_threshold_bot') return lineValue(option, 'leiqi') * 8 + (delta.damage || 0);
  if (strategy === 'jiuyan_clue_bot') return lineValue(option, 'jiuyan') * 7 + (delta.clues || 0) * 5 + (option.bossClue ? 3 : 0);
  if (strategy === 'zhenfu_control_bot') return lineValue(option, 'zhenfu') * 8 - (delta.pressure || 0) * 4;
  if (strategy === 'xuezhai_burst_bot') return lineValue(option, 'xuezhai') * 8 + (delta.damage || 0) * 3;
  if (strategy === 'boss_counter_bot') return (option.bossClue ? 7 : 0) + (delta.clues || 0) * 4 + (delta.bossPrep || 0) * 5 + lineValue(option, 'jiuyan') * 2;
  if (strategy === 'greedy_threshold_bot') {
    return Object.entries(option.daomai || {}).reduce((score, [id, amount]) => {
      const before = state.daomai[id] || 0;
      const next = [1, 3, 5, 7].find((threshold) => threshold > before) || 7;
      return score + amount * (10 - Math.max(0, next - before));
    }, 0);
  }
  if (strategy === 'best_of_known_strategies_bot') {
    const breadth = Object.keys(option.daomai || {}).filter((id) => (state.daomai[id] || 0) < 3).length;
    let score = immediateValue(option) + (option.bossClue ? 4 : 0) + (delta.clues || 0) * 2 + (delta.bossPrep || 0) * 3 + breadth * 2 - (option.debtMark ? 3 : 0);
    if (option.special === 'enter-boss-tavern') score += 18;
    if (state.view === 'boss-pre-tavern' && option.id === 'intel') score += 24;
    if (option.partnerId && state.partners.length === 0) score += 7;
    if (option.id === 'heal' && state.stats.hp / state.stats.maxHp < 0.45) score += 16;
    return score;
  }
  return rng();
}

function profileFor(strategy, rng) {
  if (strategy === 'random_bot') {
    return {
      characterId: RECOVERY_CANON_CHARACTER_IDS[Math.floor(rng() * RECOVERY_CANON_CHARACTER_IDS.length)],
      routeId: RECOVERY_CANON_ROUTE_IDS[Math.floor(rng() * RECOVERY_CANON_ROUTE_IDS.length)]
    };
  }
  const profiles = {
    highest_immediate_value_bot: ['shen-li', 'xuanjia'],
    armor_stack_bot: ['shen-li', 'xuanjia'],
    damage_stack_bot: ['lu-qinglu', 'leixue'],
    pressure_down_bot: ['xuan-yu', 'zhenyu'],
    heal_stack_bot: ['yue-chenbei', 'zhenyu'],
    partner_synergy_bot: ['shen-li', 'zhenyu'],
    xuanjia_threshold_bot: ['shen-li', 'xuanjia'],
    leiqi_threshold_bot: ['lu-qinglu', 'leixue'],
    jiuyan_clue_bot: ['wen-fuji', 'zhenyu'],
    zhenfu_control_bot: ['xuan-yu', 'zhenyu'],
    xuezhai_burst_bot: ['chi-yao', 'leixue'],
    boss_counter_bot: ['wen-fuji', 'zhenyu'],
    greedy_threshold_bot: ['yue-chenbei', 'zhenyu'],
    best_of_known_strategies_bot: ['yue-chenbei', 'xuanjia']
  };
  const [characterId, routeId] = profiles[strategy] || profiles.best_of_known_strategies_bot;
  return { characterId, routeId };
}

function pickOption(strategy, options, run, rng) {
  const legalOptions = availableActions(run, options);
  if (!legalOptions.length) return null;
  if (strategy === 'best_of_known_strategies_bot') {
    const nodeId = run.sequence[run.nodeIndex]?.id;
    const knownChoiceByNode = {
      gate: 'gate-shield',
      crossroads: 'cross-thunder',
      oldcase: 'case-armor',
      pressure: 'pressure-rest',
      lastcase: 'last-ally',
      'boss-tavern': 'boss-tavern-enter',
      'boss-prep': 'prep-clue'
    };
    if (run.view === 'boss-pre-tavern') {
      const intel = legalOptions.find((option) => option.id === 'intel');
      if (intel) return intel;
    }
    if (run.view === 'tavern') {
      const pressureCostRecruit = legalOptions.find((option) => option.partnerId && (option.delta?.pressure || 0) > 0);
      const anyRecruit = legalOptions.find((option) => option.partnerId);
      if (pressureCostRecruit || anyRecruit) return pressureCostRecruit || anyRecruit;
    }
    if (run.view === 'reward') {
      if (nodeId === 'reward-3') {
        const hasArchive = run.rewards.some((reward) => reward.id === 'archive-thunder');
        const zhenReward = ['cinnabar-nail', 'warded-armor']
          .map((id) => legalOptions.find((option) => option.id === id))
          .find(Boolean);
        const archiveReward = legalOptions.find((option) => option.id === 'archive-thunder');
        if (hasArchive && (run.daomai.zhenfu || 0) < 2 && zhenReward) return zhenReward;
        if (!hasArchive && (run.daomai.zhenfu || 0) >= 2 && archiveReward) return archiveReward;
      }
      const rewardPriority = nodeId === 'reward-3'
        ? ['archive-thunder', 'warded-armor', 'cinnabar-nail', 'old-armor-oil']
        : ['cinnabar-nail', 'warded-armor', 'old-armor-oil', 'archive-thunder'];
      const knownReward = rewardPriority.map((id) => legalOptions.find((option) => option.id === id)).find(Boolean);
      if (knownReward) return knownReward;
    }
    const knownChoice = legalOptions.find((option) => option.id === knownChoiceByNode[nodeId]);
    if (knownChoice) return knownChoice;
  }
  return legalOptions
    .map((option) => {
      let score = strategyScore(strategy, option, run, rng);
      if (option.special === 'enter-boss-tavern' && ['boss_counter_bot', 'jiuyan_clue_bot'].includes(strategy)) score += 18;
      if (run.view === 'boss-pre-tavern' && option.id === 'intel' && ['boss_counter_bot', 'jiuyan_clue_bot'].includes(strategy)) score += 24;
      if (option.partnerId && strategy === 'partner_synergy_bot') score += 20;
      if (option.id === 'heal' && strategy === 'heal_stack_bot') score += 20;
      return { option, score: score + rng() * 0.01 };
    })
    .sort((left, right) => right.score - left.score)[0]?.option || null;
}

function rescueIdFor(strategy, run, rng) {
  const ids = availableActions(run, run.rescueState?.options || []).map((option) => option.id);
  if (!ids.length) return null;
  if (strategy === 'random_bot') return ids[Math.floor(rng() * ids.length)];
  const preferred = strategy === 'heal_stack_bot'
    ? 'wake-wine'
    : ['armor_stack_bot', 'xuanjia_threshold_bot', 'pressure_down_bot', 'zhenfu_control_bot', 'best_of_known_strategies_bot'].includes(strategy)
      ? 'pawn-relic'
      : 'keeper-credit';
  return ids.includes(preferred) ? preferred : ids[0];
}

export function simulateStrategyRun({ seed = 1, strategy = 'random_bot', profileOverride = null, meta = null } = {}) {
  if (!BOT_IDS.includes(strategy)) throw new Error(`Unknown balance bot: ${strategy}`);
  const rng = makeRng(seed ^ hash(strategy));
  const profile = profileOverride || profileFor(strategy, rng);
  let run = createRun(seed, undefined, meta);
  run = confirmCharacter(selectCharacter(run, profile.characterId));
  run = confirmRoute(selectRoute(run, profile.routeId));
  let bossPreparation = null;
  let bossCombat = null;
  let lastCombat = null;
  const decisions = [];
  let actionCount = 0;

  while (run.view !== 'settlement' && actionCount < 160) {
    actionCount += 1;
    if (run.view === 'choice') {
      const selected = pickOption(strategy, run.choiceSet?.options || [], run, rng);
      if (!selected) break;
      decisions.push({ node: run.sequence[run.nodeIndex]?.id, kind: 'choice', id: selected.id });
      run = confirmChoice(selectChoice(run, selected.id));
    } else if (run.view === 'choice-result' || run.view === 'reward-result' || run.view === 'tavern-result') {
      run = advanceNode(run);
    } else if (run.view === 'reward') {
      const selected = pickOption(strategy, run.rewardOptions || [], run, rng);
      if (!selected) break;
      decisions.push({ node: run.sequence[run.nodeIndex]?.id, kind: 'reward', id: selected.id });
      run = acquireReward(selectReward(run, selected.id));
    } else if (run.view === 'tavern' || run.view === 'boss-pre-tavern') {
      const selected = pickOption(strategy, run.tavernOptions || [], run, rng);
      if (!selected) break;
      decisions.push({ node: run.sequence[run.nodeIndex]?.id, kind: run.view, id: selected.id });
      run = chooseTavernAction(run, selected.id);
    } else if (run.view === 'combat') {
      lastCombat = run.combat?.result || null;
      if (lastCombat?.tier === 'boss') {
        bossPreparation = calculateBossPreparation(run);
        bossCombat = lastCombat;
      }
      run = continueCombat(directSettleCombat(run));
    } else if (run.view === 'rescue-tavern') {
      if (run.rescueState?.phase === 'choice') {
        const rescueId = rescueIdFor(strategy, run, rng);
        if (!rescueId) break;
        decisions.push({ node: run.sequence[run.nodeIndex]?.id, kind: 'rescue', id: rescueId });
        run = chooseRescue(run, rescueId);
      } else {
        run = continueRescue(run);
      }
    } else {
      break;
    }
  }

  const read = bossPreparation || calculateBossPreparation(run);
  const combat = bossCombat || lastCombat;
  const won = run.view === 'settlement' && run.outcome === 'victory';
  return {
    won,
    winChance: won ? 1 : 0,
    roll: null,
    combat: {
      outcome: combat?.outcome || run.outcome || 'not_reached',
      resolutionReason: combat?.resolutionReason || run.endedReason || 'not_reached',
      finalState: combat?.finalState || null,
      logCount: combat?.logs?.length || 0
    },
    preparation: read,
    final: {
      hp: run.stats.hp,
      maxHp: run.stats.maxHp,
      armor: run.stats.armor,
      damage: run.stats.damage,
      pressure: run.stats.pressure,
      clues: run.stats.clues,
      bossPrep: run.stats.bossPrep,
      daomai: run.daomai,
      debtMarks: run.debtMarks.length
    },
    productionFlow: {
      characterId: run.characterId,
      routeId: run.routeId,
      reachedBoss: Boolean(bossCombat),
      reachedSettlement: run.view === 'settlement',
      outcome: run.outcome,
      actionCount,
      decisions
    }
  };
}
