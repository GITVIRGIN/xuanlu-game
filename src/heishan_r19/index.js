import { ALL_CANON_CHARACTERS, RECOVERY_CANON_CHARACTERS } from './data/characters.js';
import { PARTNERS } from './data/partners.js';
import { ENEMIES, ELITES } from './data/enemies.js';
import { RECOVERY_CANON_BOSSES } from './data/bosses.js';
import { ALL_CANON_ROUTES, RECOVERY_CANON_ROUTES } from './data/routes.js';
import { acknowledgeExpansionArrival, pendingExpansionArrival } from './data/expansionCanon.js';
import { DAOMAI, THRESHOLDS } from './data/daomai.js';
import { avoidImmediateOfferRepeat } from './data/choices.js';
import { renderApp } from './ui/renderApp.js';
import {
  FORMAL_SCREEN_REGISTRY,
  FORMAL_SCREEN_SCENARIOS,
  resolveFormalScreen
} from './ui/formalScreenRegistry.js';
import { assertFormalPage, FORMAL_PAGE } from './contracts/formalNavigation.js';
import {
  acquireReward,
  advanceNode,
  chooseRescue,
  chooseTavernAction,
  confirmRescue,
  confirmTavernAction,
  confirmCharacter,
  confirmChoice,
  confirmRoute,
  continueCombat,
  continueRescue,
  createPreparedBossRun,
  createRescuePacingFixture,
  createRun,
  directSettleCombat,
  revealNextCombatLog,
  selectCharacter,
  selectChoice,
  selectReward,
  selectRoute,
  selectRescueOption,
  selectTavernAction,
  startCombatFixture,
  testRecruitDiversity,
  trace
} from './engine/runState.js';
import { runCombatFixture } from './engine/combatEngine.js';
import { combatPacingAudit, tavernPacingAudit } from './engine/runDirector.js';
import {
  applyRunToMeta,
  clearActiveRun,
  loadActiveRun,
  loadMeta,
  resetMeta,
  saveActiveRun,
  saveMeta,
  seedExpansionReviewMeta,
  seedReviewMeta
} from './persistence/saveStore.js';

const SPEED_MS = { slow: 720, normal: 420, fast: 170 };

export function mountHeishanR19(root, { release = 'R19', globalName = `Heishan${release}` } = {}) {
  const params = new URLSearchParams(globalThis.location?.search || '');
  let page = FORMAL_PAGE.HOME;
  let run = loadActiveRun();
  let meta = loadMeta();
  let autoTimer = null;
  let renderedScreenKey = null;
  let worldLoreSelectionId = null;
  let worldMetricSelectionId = null;
  let worldMetricEntrySelectionId = null;
  let runDetailId = 'debt';
  let lastActionFingerprint = '';
  let lastActionAt = 0;
  let preferences = {
    speed: params.get('speed') || 'normal',
    reduceMotion: params.get('motion') === 'reduced'
      || Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  };

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function applySettlementOnce() {
    if (!run || run.view !== 'settlement' || run.settlementApplied) return;
    meta = applyRunToMeta(run);
    run = { ...run, settlementApplied: true, metaApplied: true };
    clearActiveRun();
  }

  function render() {
    applySettlementOnce();
    if (run && run.view !== 'settlement') saveActiveRun(run);
    const activeAction = root.contains(document.activeElement)
      ? document.activeElement.closest?.('[data-action]')
      : null;
    const focusIdentity = activeAction
      ? { action: activeAction.dataset.action, id: activeAction.dataset.id || '' }
      : null;
    const screenIdentity = resolveFormalScreen({ page, run, meta, preferences, worldLoreSelectionId, worldMetricSelectionId, worldMetricEntrySelectionId, runDetailId });
    const nextScreenKey = `${page}:${run?.view || 'none'}:${worldLoreSelectionId || worldMetricSelectionId || runDetailId || 'none'}:${worldMetricEntrySelectionId || 'none'}`;
    const hadRenderedScreen = renderedScreenKey !== null;
    const screenChanged = nextScreenKey !== renderedScreenKey;
    document.body.dataset.reduceMotion = preferences.reduceMotion ? 'true' : 'false';
    root.innerHTML = renderApp({ page, run, meta, preferences, releaseLabel: release, screenIdentity, worldLoreSelectionId, worldMetricSelectionId, worldMetricEntrySelectionId, runDetailId });
    root.dataset.ready = 'true';
    root.dataset.page = page;
    root.dataset.runView = run?.view || 'none';
    root.dataset.screenId = screenIdentity.screenId;
    root.dataset.screenVariant = screenIdentity.variant;
    root.dataset.screenScenario = screenIdentity.scenarioId;
    if (screenChanged) {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
    renderedScreenKey = nextScreenKey;
    const heading = root.querySelector('h1, h2');
    if (screenChanged && heading && hadRenderedScreen) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      const announcer = document.getElementById('screen-announcer');
      if (announcer) {
        announcer.textContent = '';
        requestAnimationFrame(() => { announcer.textContent = heading.textContent.trim(); });
      }
    } else if (focusIdentity) {
      const idSelector = focusIdentity.id ? `[data-id="${focusIdentity.id}"]` : ':not([data-id])';
      const replacement = root.querySelector(`[data-action="${focusIdentity.action}"]${idSelector}`)
        || root.querySelector('[data-testid="combat-log-current"]')
        || heading;
      if (replacement) {
        if (!replacement.matches('button, select, input, a[href]')) replacement.tabIndex = -1;
        replacement.focus({ preventScroll: true });
      }
    }
  }

  function replaceRun(next) {
    run = next;
    page = FORMAL_PAGE.RUN;
    render();
  }

  function playerEntropySeed() {
    let entropy = 0;
    try {
      const sample = new Uint32Array(1);
      globalThis.crypto?.getRandomValues?.(sample);
      entropy = sample[0];
    } catch {
      entropy = 0;
    }
    if (!entropy) entropy = Date.now() + Math.floor((globalThis.performance?.now?.() || 0) * 1000);
    return (Math.abs(Math.trunc(entropy)) % 2_000_000_000) + 1;
  }

  function resolvedRunSeed(requestedSeed) {
    if (Number.isFinite(Number(requestedSeed)) && Number(requestedSeed) !== 0) return Math.trunc(Number(requestedSeed));
    const querySeed = Number(params.get('seed'));
    if (params.has('seed') && Number.isFinite(querySeed) && querySeed !== 0) return Math.trunc(querySeed);
    return avoidImmediateOfferRepeat(playerEntropySeed(), run?.seed);
  }

  function beginRun(seed) {
    stopAuto();
    run = createRun(resolvedRunSeed(seed), undefined, meta);
    page = FORMAL_PAGE.RUN;
    render();
  }

  function openPage(nextPage) {
    stopAuto();
    page = assertFormalPage(nextPage);
    worldLoreSelectionId = null;
    worldMetricSelectionId = null;
    worldMetricEntrySelectionId = null;
    meta = loadMeta();
    render();
  }

  function autoPlayCombat() {
    if (!run?.combat || run.combat.allLogsRevealed || autoTimer) return;
    autoTimer = setInterval(() => {
      if (!run?.combat || run.combat.allLogsRevealed) {
        stopAuto();
        render();
        return;
      }
      run = revealNextCombatLog(run);
      render();
      if (run.combat.allLogsRevealed) stopAuto();
    }, preferences.reduceMotion ? 40 : SPEED_MS[preferences.speed]);
  }

  root.addEventListener('error', (event) => {
    const target = event.target;
    if (target?.tagName !== 'IMG' || !target.dataset.assetFallbackSrc || target.dataset.assetFallbackUsed === 'true') return;
    target.dataset.assetPrimarySrc = target.currentSrc || target.src;
    target.dataset.assetFallbackUsed = 'true';
    target.src = target.dataset.assetFallbackSrc;
    console.warn(`[asset-fallback] ${target.dataset.assetRole || 'unregistered'} -> ${target.dataset.assetFallbackSrc}`);
  }, true);

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    const fingerprint = [action, target.dataset.id || '', run?.runId || '', run?.view || page, run?.nodeIndex ?? '', run?.combat?.logIndex ?? '', run?.rescueState?.phase || ''].join(':');
    const now = Date.now();
    if (fingerprint === lastActionFingerprint && now - lastActionAt < 350) return;
    lastActionFingerprint = fingerprint;
    lastActionAt = now;
    if (action === 'new-run') beginRun();
    else if (action === 'continue-run' && run) { page = FORMAL_PAGE.RUN; render(); }
    else if (action === 'go-home') openPage(FORMAL_PAGE.HOME);
    else if (action === 'open-archive') openPage(FORMAL_PAGE.ARCHIVE);
    else if (action === 'open-world') openPage(FORMAL_PAGE.WORLD);
    else if (action === 'open-settings') openPage(FORMAL_PAGE.SETTINGS);
    else if (action === 'acknowledge-expansion') {
      const arrival = pendingExpansionArrival(meta);
      if (arrival && arrival.id === target.dataset.id) meta = saveMeta(acknowledgeExpansionArrival(meta, arrival.id));
      render();
    }
    else if (action === 'open-run-detail' && run) {
      runDetailId = target.dataset.id || 'debt';
      page = FORMAL_PAGE.RUN_DETAIL;
      render();
    } else if (action === 'close-run-detail' && run) {
      page = FORMAL_PAGE.RUN;
      render();
    }
    else if (action === 'restart-run') beginRun((run?.seed || 19) + 1);
    else if (action === 'select-character') replaceRun(selectCharacter(run, target.dataset.id));
    else if (action === 'confirm-character') replaceRun(confirmCharacter(run));
    else if (action === 'select-route') replaceRun(selectRoute(run, target.dataset.id));
    else if (action === 'confirm-route') replaceRun(confirmRoute(run));
    else if (action === 'select-choice') replaceRun(selectChoice(run, target.dataset.id));
    else if (action === 'confirm-choice') replaceRun(confirmChoice(run));
    else if (action === 'select-reward') replaceRun(selectReward(run, target.dataset.id));
    else if (action === 'acquire-reward') replaceRun(acquireReward(run));
    else if (action === 'select-tavern-action') replaceRun(selectTavernAction(run, target.dataset.id));
    else if (action === 'confirm-tavern-action') replaceRun(confirmTavernAction(run));
    else if (action === 'tavern-action') replaceRun(chooseTavernAction(run, target.dataset.id));
    else if (action === 'advance-node') replaceRun(advanceNode(run));
    else if (action === 'next-combat-log') replaceRun(revealNextCombatLog(run));
    else if (action === 'direct-settle') replaceRun(directSettleCombat(run));
    else if (action === 'continue-combat') replaceRun(continueCombat(run));
    else if (action === 'auto-combat') autoPlayCombat();
    else if (action === 'select-rescue') replaceRun(selectRescueOption(run, target.dataset.id));
    else if (action === 'confirm-rescue') replaceRun(confirmRescue(run));
    else if (action === 'choose-rescue') replaceRun(chooseRescue(run, target.dataset.id));
    else if (action === 'continue-rescue') replaceRun(continueRescue(run));
    else if (action === 'toggle-motion') {
      preferences = { ...preferences, reduceMotion: !preferences.reduceMotion };
      render();
    } else if (action === 'select-world-lore') {
      worldLoreSelectionId = target.dataset.id || null;
      worldMetricSelectionId = null;
      worldMetricEntrySelectionId = null;
      render();
    } else if (action === 'select-world-metric') {
      worldMetricSelectionId = target.dataset.id || null;
      worldMetricEntrySelectionId = null;
      worldLoreSelectionId = null;
      render();
    } else if (action === 'select-world-metric-entry') {
      worldMetricEntrySelectionId = target.dataset.id || null;
      worldLoreSelectionId = null;
      render();
    } else if (action === 'close-world-metric') {
      worldMetricSelectionId = null;
      worldMetricEntrySelectionId = null;
      render();
    }
  });

  root.addEventListener('change', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'set-speed') {
      preferences = { ...preferences, speed: target.value };
      render();
    }
  });

  const api = {
    version: release,
    getState: () => structuredClone(run),
    getMeta: () => structuredClone(meta),
    getPage: () => page,
    data: {
      CHARACTERS: ALL_CANON_CHARACTERS,
      INITIAL_CHARACTERS: RECOVERY_CANON_CHARACTERS,
      PARTNERS,
      ENEMIES,
      ELITES,
      BOSSES: RECOVERY_CANON_BOSSES,
      ROUTES: ALL_CANON_ROUTES,
      INITIAL_ROUTES: RECOVERY_CANON_ROUTES,
      DAOMAI,
      THRESHOLDS,
      FORMAL_SCREENS: FORMAL_SCREEN_REGISTRY,
      FORMAL_SCREEN_SCENARIOS
    },
    test: {
      reset: () => { meta = resetMeta(); clearActiveRun(); page = FORMAL_PAGE.HOME; run = null; stopAuto(); render(); return true; },
      seedMeta: () => { meta = seedReviewMeta(); render(); return structuredClone(meta); },
      seedExpansionMeta: (stage = 'H') => { meta = seedExpansionReviewMeta(stage); render(); return structuredClone(meta); },
      acknowledgeExpansion: () => {
        const arrival = pendingExpansionArrival(meta);
        if (!arrival) return null;
        meta = saveMeta(acknowledgeExpansionArrival(meta, arrival.id));
        render();
        return structuredClone(meta.expansionProgress);
      },
      openArchive: () => { page = FORMAL_PAGE.ARCHIVE; meta = loadMeta(); render(); return true; },
      openWorld: () => { page = FORMAL_PAGE.WORLD; worldLoreSelectionId = null; worldMetricSelectionId = null; worldMetricEntrySelectionId = null; meta = loadMeta(); render(); return true; },
      startFixture: (name) => { run = startCombatFixture(run, name); page = FORMAL_PAGE.RUN; stopAuto(); render(); return structuredClone(run.combat.result); },
      startPreparedBoss: () => { run = createPreparedBossRun(); page = FORMAL_PAGE.RUN; stopAuto(); render(); return structuredClone(run.combat.result.bossRead); },
      startRescuePacing: () => { run = createRescuePacingFixture(); page = FORMAL_PAGE.RUN; stopAuto(); render(); return structuredClone({ pacing: run.pendingRescuePacing, pressure: run.stats.pressure, hp: run.stats.hp }); },
      drainRescue: () => { if (run) run.rescueCharges = 0; render(); return run?.rescueCharges ?? null; },
      trace: () => run ? trace(run) : { started: false, visited: [], current: [], future: [] },
      recruitDiversity: (count = 20) => testRecruitDiversity(count),
      combatFixture: (name) => runCombatFixture(name),
      tavernPacing: () => tavernPacingAudit(run?.sequence),
      combatPacing: () => combatPacingAudit(run?.sequence),
      contentInventory: () => ({
        protagonists: ALL_CANON_CHARACTERS.map((entry) => entry.name),
        partners: PARTNERS.map((entry) => entry.name),
        enemies: ENEMIES.map((entry) => entry.name),
        elites: ELITES.map((entry) => entry.name),
        bosses: RECOVERY_CANON_BOSSES.map((entry) => entry.name),
        routes: ALL_CANON_ROUTES.map((entry) => entry.name)
      }),
      activeRun: () => loadActiveRun(),
      clearActiveRun: () => clearActiveRun()
    }
  };

  globalThis[globalName] = api;
  render();
  return api;
}

export {
  RECOVERY_CANON_CHARACTERS,
  ALL_CANON_CHARACTERS,
  PARTNERS,
  ENEMIES,
  ELITES,
  RECOVERY_CANON_BOSSES,
  RECOVERY_CANON_ROUTES,
  ALL_CANON_ROUTES,
  DAOMAI,
  THRESHOLDS,
  createRun,
  runCombatFixture,
  tavernPacingAudit,
  testRecruitDiversity
};
