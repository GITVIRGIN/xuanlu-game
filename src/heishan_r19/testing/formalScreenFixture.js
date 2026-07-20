import { FORMAL_PAGE, FORMAL_RUN_VIEW } from '../contracts/formalNavigation.js';
import { createDefaultMeta } from '../data/lore.js';
import { PARTNERS } from '../data/partners.js';
import { WORLD_METRIC_IDS } from '../data/worldMetrics.js';
import { firstWorldMetricEntryId } from '../data/playerFacingWorld.js';
import {
  createDefaultExpansionProgress,
  EXPANSION_ARRIVALS
} from '../data/expansionCanon.js';
import { evaluateActionAvailability } from '../engine/actionAvailability.js';
import { simulateCombat } from '../engine/combatEngine.js';
import { createCombatLog, createCombatSnapshot } from '../engine/combatLogSnapshots.js';
import {
  acquireReward,
  confirmChoice,
  confirmCharacter,
  confirmRoute,
  confirmTavernAction,
  continueCombat,
  createPreparedBossRun,
  createRun,
  directSettleCombat,
  enterCurrentNode,
  selectCharacter,
  selectChoice,
  selectRescueOption,
  selectReward,
  selectRoute,
  selectTavernAction,
  startCombatFixture,
  confirmRescue
} from '../engine/runState.js';
import { FORMAL_SCREEN_SCENARIOS, resolveFormalScreen } from '../ui/formalScreenRegistry.js';

const EXPANSION_STAGE_ORDER = Object.freeze(['F', 'G', 'H']);

function progressedMeta() {
  const meta = createDefaultMeta();
  meta.characterProgress['shen-li'] = {
    ...(meta.characterProgress['shen-li'] || {}),
    familiarity: 7,
    keyStorySeen: 3,
    keyStoryTotal: 5,
    clears: 1,
    bossEncounters: 2,
    endingsSeen: ['带回被守住的一页'],
    oldCausesSeen: ['旧因·旧军残阵', '旧因·封门旧案'],
    bossCluesSeen: ['玄甲成势可抗首领连击'],
    lastRunSummary: '以玄甲成势守住旧军残页。'
  };
  meta.worldProgress = {
    loreStage: 4,
    oldCausesFound: ['旧因·旧军残阵', '旧因·封门旧案', '旧因·雷契旧债'],
    fulfillmentsSeen: ['旧军阵因玄甲应验'],
    bossCluesFound: ['玄甲成势可抗首领连击'],
    routesSeen: ['xuanjia', 'leixue', 'zhenyu'],
    endingsSeen: [],
    truthFragments: [],
    nextHint: '击败首领或抵达结局，触及黑山真相。'
  };
  meta.expansionProgress = createDefaultExpansionProgress();
  return meta;
}

function expansionMeta(stage = 'H') {
  const meta = progressedMeta();
  const expansion = createDefaultExpansionProgress();
  for (const key of EXPANSION_STAGE_ORDER) {
    if (EXPANSION_STAGE_ORDER.indexOf(key) > EXPANSION_STAGE_ORDER.indexOf(stage)) break;
    const arrival = EXPANSION_ARRIVALS[key];
    expansion.acknowledgedArrivals.push(arrival.id);
    expansion.unlockedCharacterIds.push(arrival.unlockCharacterId);
    expansion.unlockedRouteIds.push(arrival.unlockRouteId);
    expansion.fragments[arrival.fragmentId] = {
      status: key === 'H' ? 'contested' : 'confirmed',
      witnesses: key === 'F' ? ['su-yanhui', 'shen-li'] : key === 'G' ? ['bai-heng', 'lu-qinglu'] : ['liu-jisheng']
    };
  }
  expansion.stage = stage;
  expansion.relationProgress = {
    'list-and-blade': 2,
    'early-death-notice': 1,
    'behind-the-mirror': 3
  };
  expansion.lastSettlementUpdates = {
    character: 'su-yanhui',
    relation: 'list-and-blade',
    fragment: 'empty-name-writ'
  };
  meta.expansionProgress = expansion;
  meta.characterProgress['su-yanhui'] = {
    familiarity: 6,
    keyStorySeen: 2,
    keyStoryTotal: 5,
    clears: 1,
    bossEncounters: 1,
    endingsSeen: [],
    oldCausesSeen: ['旧因·空名牒'],
    bossCluesSeen: ['追迹必须由活证人复核'],
    lastRunSummary: '带回第九名收件人的口供。'
  };
  meta.characterProgress['bai-heng'] = {
    familiarity: 3,
    keyStorySeen: 2,
    keyStoryTotal: 5,
    clears: 0,
    bossEncounters: 1,
    endingsSeen: [],
    oldCausesSeen: ['旧因·逆命簿'],
    bossCluesSeen: [],
    lastRunSummary: '将治疗收益和代偿同时归档。'
  };
  meta.characterProgress['liu-jisheng'] = {
    familiarity: 2,
    keyStorySeen: 1,
    keyStoryTotal: 5,
    clears: 0,
    bossEncounters: 0,
    endingsSeen: [],
    oldCausesSeen: ['旧因·易面戏单'],
    bossCluesSeen: [],
    lastRunSummary: '只留下主动选择的名字。'
  };
  meta.worldProgress.routesSeen = ['xuanjia', 'leixue', 'zhenyu', 'zhuoying', 'guizang', 'wuxiang'];
  return meta;
}

function pendingArrivalMeta() {
  const meta = progressedMeta();
  for (const id of ['shen-li', 'yue-chenbei', 'lu-qinglu']) {
    meta.characterProgress[id] = {
      ...(meta.characterProgress[id] || {}),
      familiarity: 10,
      keyStorySeen: 4,
      keyStoryTotal: 5,
      clears: id === 'shen-li' ? 1 : 0,
      bossEncounters: 1,
      endingsSeen: [],
      oldCausesSeen: [],
      bossCluesSeen: [],
      lastRunSummary: '已完成第一章关键证词。'
    };
  }
  meta.expansionProgress = createDefaultExpansionProgress();
  return meta;
}

function selectedRun(meta = createDefaultMeta(), characterId = 'shen-li', routeId = 'xuanjia') {
  let run = createRun(20, 'run-screen-review-20', meta);
  run = confirmCharacter(selectCharacter(run, characterId));
  run = confirmRoute(selectRoute(run, routeId));
  return run;
}

function atNode(run, predicate) {
  const index = run.sequence.findIndex(predicate);
  if (index < 0) throw new Error('Review fixture node not found.');
  return enterCurrentNode({ ...run, nodeIndex: index });
}

function firstAvailable(options, run) {
  return options.find((option) => evaluateActionAvailability(run, option).available) || options[0];
}

function isSelectedVariant(variant) {
  return variant === 'selected' || variant.endsWith('-selected');
}

function choiceFixture(choiceId, selected = false) {
  let meta = createDefaultMeta();
  let characterId = 'shen-li';
  let routeId = 'xuanjia';
  if (choiceId === 'emptyWrit') {
    meta = expansionMeta('H');
    characterId = 'su-yanhui';
    routeId = 'zhuoying';
  } else if (choiceId === 'reverseLedger') {
    meta = expansionMeta('H');
    characterId = 'bai-heng';
    routeId = 'guizang';
  } else if (choiceId === 'changingPlaybill') {
    meta = expansionMeta('H');
    characterId = 'liu-jisheng';
    routeId = 'wuxiang';
  }
  let run = selectedRun(meta, characterId, routeId);
  run = atNode(run, (node) => node.choiceId === choiceId);
  if (selected) run = selectChoice(run, firstAvailable(run.choiceSet.options, run).id);
  return { run, meta };
}

function rewardFixture(selected = false, recovery = false) {
  const meta = expansionMeta('H');
  let run = selectedRun(meta, 'bai-heng', 'guizang');
  if (recovery) {
    run.sequence = [{ id: 'review-recovery', kind: 'reward', rescueRecovery: true }];
    run.nodeIndex = 0;
    run = enterCurrentNode(run);
  } else {
    run = atNode(run, (node) => node.kind === 'reward');
  }
  if (selected) run = selectReward(run, firstAvailable(run.rewardOptions, run).id);
  return { run, meta };
}

function tavernFixture(selected = false, boss = false) {
  const meta = expansionMeta('H');
  let run = selectedRun(meta, 'su-yanhui', 'zhuoying');
  if (boss) {
    run = atNode(run, (node) => node.choiceId === 'bossTavern');
    const entry = run.choiceSet.options.find((option) => option.special === 'enter-boss-tavern');
    run = confirmChoice(selectChoice(run, entry.id));
  } else {
    run = atNode(run, (node) => node.kind === 'tavern');
  }
  if (selected) run = selectTavernAction(run, 'heal');
  return { run, meta };
}

function combatFixture(tier = 'ordinary', party = false) {
  const meta = expansionMeta('H');
  let run = selectedRun(meta, 'su-yanhui', 'zhuoying');
  if (party) {
    run.partners = PARTNERS
      .filter((partner) => ['bai-heng', 'liu-jisheng'].includes(partner.characterId))
      .map((partner) => ({ ...partner, hp: partner.maxHp }));
    run.daomai.partner = 5;
  }
  run = atNode(run, (node) => node.kind === (tier === 'ordinary' ? 'combat' : tier));
  return { run, meta };
}

function bossDefeatFixture() {
  const meta = progressedMeta();
  let run = selectedRun(meta, 'yue-chenbei', 'zhenyu');
  run.partners = ['partner-xuan-yu', 'partner-wen-fuji'].map((id) => {
    const partner = PARTNERS.find((entry) => entry.id === id);
    return { ...partner, hp: partner.maxHp };
  });
  run.stats = { ...run.stats, hp: 48, maxHp: 48, armor: 35, damage: 5, pressure: 6, clues: 0, bossPrep: 0 };
  run.daomai = { ...run.daomai, xuanjia: 1, leiqi: 0, jiuyan: 1, jiuhuo: 6, zhenfu: 3, xuezhai: 0, partner: 7 };
  run.nodeIndex = run.sequence.findIndex((node) => node.kind === 'boss');
  run = enterCurrentNode(run);
  if (run.combat?.result?.resolutionReason !== 'boss_overwhelmed') throw new Error('Boss defeat fixture must end through the visible third-form survival rule');
  run = directSettleCombat(run);
  run.combat.reviewVariant = 'boss-defeat-overwhelmed';
  return { run, meta };
}

function reviewCombatFixture(variant) {
  const meta = expansionMeta('H');
  if (variant === 'ordinary-party-revive-seal' || variant === 'ordinary-party-revive-baiheng') {
    let run = selectedRun(meta, 'shen-li', 'xuanjia');
    const downed = PARTNERS.find((partner) => partner.characterId === 'xuan-yu');
    const supportId = variant === 'ordinary-party-revive-baiheng' ? 'bai-heng' : 'chi-yao';
    const support = PARTNERS.find((partner) => partner.characterId === supportId);
    run = {
      ...run,
      reviveSeals: 1,
      stats: { ...run.stats, hp: 120, maxHp: 120, armor: 8, damage: 2, pressure: 0 },
      partners: [{ ...downed, hp: 0 }, { ...support, hp: support.maxHp }]
    };
    const enemy = { id: 'review-revival-old-soldier', name: '缚魂旧卒', tier: 'ordinary', maxHp: 120, armor: 8, attack: 3 };
    const result = simulateCombat(run, enemy, 'ordinary');
    const actionType = variant === 'ordinary-party-revive-baiheng' ? 'partner_basic_revive' : 'hero_revive_partner';
    const logIndex = result.logs.findIndex((log) => log.actionType === actionType);
    if (logIndex < 0) throw new Error(`Missing revival combat state for review variant: ${variant}`);
    run.view = FORMAL_RUN_VIEW.COMBAT;
    run.combat = { enemy, result, logIndex, allLogsRevealed: false, legalTerminal: false, reportMode: 'single', reviewVariant: variant };
    return { run, meta };
  }
  if (variant === 'ordinary-three-partner-downed-order') {
    let run = selectedRun(meta, 'shen-li', 'xuanjia');
    const ids = ['xuan-yu', 'bai-heng', 'chi-yao'];
    run.partners = ids.map((id, index) => {
      const source = PARTNERS.find((partner) => partner.characterId === id);
      return { ...source, hp: index === 1 ? source.maxHp : 0 };
    });
    run.reviveSeals = 1;
    const enemy = { id: 'review-formation-old-soldier', name: '排阵旧卒', tier: 'ordinary', maxHp: 120, armor: 4, attack: 4 };
    const state = createCombatSnapshot({
      heroHp: 40,
      heroMaxHp: 46,
      heroArmor: 8,
      pressure: 4,
      enemyHp: 80,
      enemyMaxHp: 120,
      enemyArmor: 4,
      reviveSeals: 1,
      partners: run.partners.map((partner, index) => ({ ...partner, joinOrder: index + 1 }))
    });
    const log = createCombatLog(state, state, {
      actorId: enemy.id,
      targetId: 'partner-xuan-yu',
      actionType: 'enemy_attack',
      visualCue: 'hit-slash',
      text: '两名同行者已经倒地，仍站立者继续守阵。',
      round: 4
    });
    const result = { enemyId: enemy.id, enemyName: enemy.name, tier: 'ordinary', logs: [log], finalState: state };
    run.view = FORMAL_RUN_VIEW.COMBAT;
    run.combat = { enemy, result, logIndex: 0, allLogsRevealed: false, legalTerminal: false, reportMode: 'single', reviewVariant: variant };
    return { run, meta };
  }
  if (variant === 'ordinary-pressure-collapse-terminal') {
    let run = startCombatFixture(selectedRun(meta, 'shen-li', 'zhuoying'), 'pressure_collapse');
    run = directSettleCombat(run);
    run.combat.reviewVariant = variant;
    return { run, meta };
  }
  if (variant === 'ordinary-hero-dead-terminal') {
    let run = startCombatFixture(selectedRun(meta, 'shen-li', 'zhuoying'), 'hero_dead');
    run = directSettleCombat(run);
    run.combat.reviewVariant = variant;
    return { run, meta };
  }
  if (variant.startsWith('ordinary-pressure-')) {
    let run = selectedRun(meta, 'shen-li', 'zhuoying');
    run = {
      ...run,
      pressureStage: 'late',
      stats: { ...run.stats, hp: 240, maxHp: 240, armor: 20, damage: 1, pressure: variant === 'ordinary-pressure-action' ? 0 : 8 },
      partners: [],
      daomai: { ...run.daomai, xuanjia: 0, zhenfu: 0, partner: 0 }
    };
    const enemy = { id: 'pressure-review-old-soldier', name: '压阵旧卒', tier: 'ordinary', maxHp: 240, armor: 20, attack: 2 };
    const result = simulateCombat(run, enemy, 'ordinary');
    const actionType = variant === 'ordinary-pressure-relief' ? 'hero_pressure_relief' : 'enemy_pressure_action';
    const logIndex = result.logs.findIndex((log) => log.actionType === actionType
      && (variant !== 'ordinary-pressure-critical' || log.afterState.pressure === 10));
    if (logIndex < 0) throw new Error(`Missing pressure combat state for review variant: ${variant}`);
    run.view = FORMAL_RUN_VIEW.COMBAT;
    run.combat = { enemy, result, logIndex, allLogsRevealed: false, legalTerminal: false, reportMode: 'single', reviewVariant: variant };
    return { run, meta };
  }
  if (variant === 'ordinary-party-downed' || variant === 'ordinary-party-zero-terminal') {
    let run = startCombatFixture(selectedRun(meta, 'su-yanhui', 'zhuoying'), 'party_hp_zero');
    run = directSettleCombat(run);
    run.combat.reviewVariant = variant;
    return { run, meta };
  }
  if (variant === 'ordinary-hero-down-continues' || variant === 'ordinary-allies-hold-terminal') {
    let run = startCombatFixture(selectedRun(meta, 'su-yanhui', 'zhuoying'), 'hero_down_allies_hold');
    if (variant === 'ordinary-hero-down-continues') {
      run.combat.logIndex = run.combat.result.logs.findIndex((log) => log.actionType === 'hero_downed_skip');
    } else {
      run = directSettleCombat(run);
    }
    run.combat.reviewVariant = variant;
    return { run, meta };
  }
  if (variant.startsWith('ordinary-stalemate-')) {
    let run = startCombatFixture(selectedRun(meta, 'su-yanhui', 'zhuoying'), 'prolonged_stalemate');
    if (variant === 'ordinary-stalemate-warning-1') {
      run.combat.logIndex = run.combat.result.logs.findIndex((log) => log.actionType === 'stalemate_warning');
    } else if (variant === 'ordinary-stalemate-warning-2') {
      run.combat.logIndex = run.combat.result.logs.findLastIndex((log) => log.actionType === 'stalemate_warning');
    } else {
      run = directSettleCombat(run);
    }
    run.combat.reviewVariant = variant;
    return { run, meta };
  }
  let fixture = combatFixture('ordinary', true);
  let { run } = fixture;
  const actionByVariant = {
    'ordinary-party-basic-before': 'partner_basic_control',
    'ordinary-party-basic-after': 'partner_basic_heal',
    'ordinary-party-hit': 'enemy_attack',
    'ordinary-party-intercept': 'partner_intercept',
    'ordinary-party-combo': 'partner_combo'
  };
  if (variant === 'ordinary-full-report') {
    run = directSettleCombat(run);
  } else {
    const actionType = actionByVariant[variant];
    run.combat.logIndex = run.combat.result.logs.findIndex((log) => {
      if (variant === 'ordinary-party-hit') return log.actionType === actionType && log.partnerDeltas.some((entry) => entry.hpDelta < 0);
      return log.actionType === actionType;
    });
  }
  if (run.combat.logIndex < 0) throw new Error(`Missing combat state for review variant: ${variant}`);
  run.combat.reviewVariant = variant;
  return { ...fixture, run };
}

function rescueFixture(variant) {
  const meta = expansionMeta('H');
  let run = selectedRun(meta, 'bai-heng', 'guizang');
  run = startCombatFixture(run, 'hero_dead');
  run = continueCombat(directSettleCombat(run));
  if (variant !== 'choice-unselected') run = selectRescueOption(run, 'keeper-credit');
  if (variant === 'result') run = confirmRescue(run);
  return { run, meta };
}

function settlementFixture(victory) {
  const meta = expansionMeta('H');
  let run;
  if (victory) {
    run = createPreparedBossRun();
    run = continueCombat(directSettleCombat(run));
  } else {
    run = selectedRun(meta, 'bai-heng', 'guizang');
    run.rescueCharges = 0;
    run = startCombatFixture(run, 'hero_dead');
    run = continueCombat(directSettleCombat(run));
  }
  run.view = FORMAL_RUN_VIEW.SETTLEMENT;
  run.outcome = victory ? 'victory' : 'failure';
  run.endedReason = victory ? 'enemy_hp_zero' : 'second_dying';
  run.oldCauses = run.oldCauses.length ? run.oldCauses : ['旧因·空白卷宗'];
  run.fulfillments = run.fulfillments.length ? run.fulfillments : ['应验·见证仍在'];
  run.bossClues = run.bossClues.length ? run.bossClues : ['破局线索·卷宗会改写名字'];
  return { run, meta };
}

function runDetailFixture(variant) {
  const meta = expansionMeta('H');
  const run = selectedRun(meta, 'liu-jisheng', 'wuxiang');
  run.debtMarks = ['借面留痕', '改名之债'];
  run.daomai = { xuanjia: 3, leiqi: 1, jiuyan: 5, jiuhuo: 2, zhenfu: 3, xuezhai: 1, partner: 4 };
  return { page: FORMAL_PAGE.RUN_DETAIL, run, meta, runDetailId: variant };
}

function worldContext(variant) {
  const expanded = variant.startsWith('expansion-');
  const metric = WORLD_METRIC_IDS.find((id) => variant === `metric-${id}` || variant === `metric-${id}-entry` || variant === `metric-${id}-locked-entry`) || null;
  const lockedMetricEntry = variant.endsWith('-locked-entry');
  const progressed = variant.startsWith('progressed-') || Boolean(metric);
  const meta = lockedMetricEntry ? progressedMeta() : expanded || metric ? expansionMeta('H') : progressed ? progressedMeta() : createDefaultMeta();
  if (metric) {
    meta.worldProgress.oldCausesFound = [
      '旧因·旧军残阵', '旧因·空名牒活证', '旧因·知情代偿', '旧因·自报名姓'
    ];
    meta.worldProgress.fulfillmentsSeen = [
      '妖将重击会因旧军阵松动', '第十封在多人见证下开启时应验'
    ];
    meta.worldProgress.bossCluesFound = [
      '玄甲成势可抗妖将的撕甲连击', '旁证可阻止目标被卷宗再次抹除', '归藏会把被保存的伤害一起带回'
    ];
    meta.worldProgress.endingsSeen = ['带回被守住的一页', '败退回酒馆'];
    meta.worldProgress.truthFragments = ['黑山旧案残页'];
  }
  const detail = variant.endsWith('-unlocked-detail')
    ? expanded ? 'empty-name-writ' : 'fengshan-ling'
    : variant.endsWith('-locked-detail') ? 'xuanlu-canye' : null;
  const lockedEntryByMetric = {
    'character-dossiers': 'character:su-yanhui',
    routes: 'route:zhuoying',
    'artifact-dossiers': 'artifact:empty-name-writ'
  };
  const metricEntry = lockedMetricEntry
    ? lockedEntryByMetric[metric]
    : variant.endsWith('-entry') ? firstWorldMetricEntryId(meta, metric) : null;
  return {
    page: FORMAL_PAGE.WORLD,
    run: null,
    meta,
    worldLoreSelectionId: detail,
    worldMetricSelectionId: metric,
    worldMetricEntrySelectionId: metricEntry
  };
}

function runScreenContext(scenario) {
  const { screenId, variant } = scenario;
  if (screenId === 'character-select') {
    const meta = variant.startsWith('expanded-') ? expansionMeta('H') : createDefaultMeta();
    let run = createRun(20, `run-review-${scenario.id}`, meta);
    if (isSelectedVariant(variant)) run = selectCharacter(run, variant.startsWith('expanded-') ? 'su-yanhui' : 'shen-li');
    return { run, meta };
  }
  if (screenId === 'route-select') {
    const meta = variant.startsWith('expanded-') ? expansionMeta('H') : createDefaultMeta();
    let run = createRun(20, `run-review-${scenario.id}`, meta);
    run = confirmCharacter(selectCharacter(run, variant.startsWith('expanded-') ? 'su-yanhui' : 'shen-li'));
    if (isSelectedVariant(variant)) run = selectRoute(run, variant.startsWith('expanded-') ? 'zhuoying' : 'xuanjia');
    return { run, meta };
  }
  if (screenId === 'choice') {
    const choiceId = variant.replace(/-(selected|unselected)$/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return choiceFixture(choiceId, variant.endsWith('-selected'));
  }
  if (screenId === 'consequence') {
    if (variant === 'choice') {
      let fixture = choiceFixture('gate', true);
      fixture.run = confirmChoice(fixture.run);
      return fixture;
    }
    if (variant === 'reward') {
      let fixture = rewardFixture(true, false);
      fixture.run = acquireReward(fixture.run);
      return fixture;
    }
    let fixture = tavernFixture(true, false);
    fixture.run = confirmTavernAction(fixture.run);
    return fixture;
  }
  if (screenId === 'reward') return rewardFixture(isSelectedVariant(variant), variant.startsWith('recovery-'));
  if (screenId === 'tavern') return tavernFixture(variant === 'selected', false);
  if (screenId === 'boss-pre-tavern') return tavernFixture(variant === 'selected', true);
  if (screenId === 'combat') {
    if (variant.startsWith('ordinary-party-basic-')
      || variant.startsWith('ordinary-pressure-')
      || ['ordinary-party-hit', 'ordinary-party-intercept', 'ordinary-party-combo', 'ordinary-party-revive-seal', 'ordinary-party-revive-baiheng', 'ordinary-three-partner-downed-order', 'ordinary-party-downed', 'ordinary-hero-down-continues', 'ordinary-hero-dead-terminal', 'ordinary-allies-hold-terminal', 'ordinary-party-zero-terminal', 'ordinary-full-report', 'ordinary-stalemate-warning-1', 'ordinary-stalemate-warning-2', 'ordinary-stalemate-terminal'].includes(variant)) {
      return reviewCombatFixture(variant);
    }
    if (variant.startsWith('boss-')) {
      if (variant === 'boss-defeat-overwhelmed') return bossDefeatFixture();
      const meta = progressedMeta();
      let run = createPreparedBossRun();
      if (variant === 'boss-phase-2') {
        const phaseTwoIndex = run.combat.result.logs.findIndex((log) => log.actionType === 'boss_objective_countdown' && log.round === 2);
        run.combat.logIndex = phaseTwoIndex >= 0 ? phaseTwoIndex : Math.min(3, run.combat.result.logs.length - 2);
      } else if (variant === 'boss-phase-3-terminal') {
        run = directSettleCombat(run);
      }
      return { run, meta };
    }
    const tier = variant.startsWith('elite-') ? 'elite' : 'ordinary';
    const party = variant.includes('-party-');
    const fixture = combatFixture(tier, party);
    if (variant.includes('-active')) {
      const partnerIds = new Set(fixture.run.partners.map((partner) => partner.id));
      const activeIndex = fixture.run.combat.result.logs.findIndex((log) => partnerIds.has(log.actorId));
      fixture.run.combat.logIndex = Math.max(0, activeIndex);
    }
    if (variant.endsWith('-terminal')) fixture.run = directSettleCombat(fixture.run);
    return fixture;
  }
  if (screenId === 'rescue') return rescueFixture(variant);
  if (screenId === 'settlement') return settlementFixture(variant === 'victory');
  throw new Error(`No review fixture for run screen: ${screenId}:${variant}`);
}

export function formalScreenFixture(scenarioId) {
  const scenario = FORMAL_SCREEN_SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) throw new Error(`Unknown formal screen scenario: ${scenarioId}`);
  const preferences = { speed: 'normal', reduceMotion: scenario.variant === 'reduced-motion' };
  let context;
  if (scenario.screenId === 'home') {
    const meta = scenario.variant === 'expansion-arrival'
      ? pendingArrivalMeta()
      : scenario.variant === 'progressed' ? progressedMeta() : createDefaultMeta();
    const run = scenario.variant === 'resumable' ? createRun(20, 'run-review-resumable', meta) : null;
    context = { page: FORMAL_PAGE.HOME, run, meta };
  } else if (scenario.screenId === 'archive') {
    const meta = scenario.variant === 'expansion' ? expansionMeta('H') : scenario.variant === 'progressed' ? progressedMeta() : createDefaultMeta();
    context = { page: FORMAL_PAGE.ARCHIVE, run: null, meta };
  } else if (scenario.screenId === 'world') {
    context = worldContext(scenario.variant);
  } else if (scenario.screenId === 'settings') {
    context = { page: FORMAL_PAGE.SETTINGS, run: null, meta: createDefaultMeta() };
  } else if (scenario.screenId === 'run-detail') {
    context = runDetailFixture(scenario.variant);
  } else {
    context = { page: FORMAL_PAGE.RUN, ...runScreenContext(scenario) };
  }
  const normalized = {
    worldLoreSelectionId: null,
    worldMetricSelectionId: null,
    worldMetricEntrySelectionId: null,
    runDetailId: 'debt',
    ...context,
    preferences
  };
  const screenIdentity = resolveFormalScreen(normalized);
  if (screenIdentity.scenarioId !== scenarioId) {
    throw new Error(`Fixture mismatch: requested ${scenarioId}, resolved ${screenIdentity.scenarioId}`);
  }
  return { ...normalized, screenIdentity };
}

export function formalScreenFixtureCoverage() {
  return FORMAL_SCREEN_SCENARIOS.map((scenario) => formalScreenFixture(scenario.id).screenIdentity.scenarioId);
}
