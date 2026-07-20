import { FORMAL_PAGE, FORMAL_RUN_VIEW } from '../contracts/formalNavigation.js';
import { worldLoreEntryState } from '../data/worldLore.js';
import { DAOMAI, DAOMAI_IDS } from '../data/daomai.js';
import { WORLD_METRIC_IDS } from '../data/worldMetrics.js';
import { availableCharacterIds, pendingExpansionArrival } from '../data/expansionCanon.js';
import { worldMetricEntry } from '../data/playerFacingWorld.js';

const freezeScenario = (scenario) => Object.freeze({
  ...scenario,
  impactfulSelection: Boolean(scenario.impactfulSelection),
  requiredActions: Object.freeze((scenario.requiredActions || []).map((action) => Object.freeze({ visible: true, inViewport: false, ...action }))),
  requiredOptionStates: Object.freeze((scenario.requiredOptionStates || []).map((state) => Object.freeze({ visible: true, ...state }))),
  requiredTestIds: Object.freeze([...(scenario.requiredTestIds || [])]),
  viewports: Object.freeze(['desktop', 'mobile'])
});

const action = (id, enabled = true, inViewport = false) => ({ id, enabled, inViewport });
const optionState = (actionId, id, enabled, code) => ({ actionId, id, enabled, code });

const scenarios = [
  { id: 'home-default', screenId: 'home', variant: 'default', heading: '黑山酒馆', requiredActions: [action('new-run'), action('open-archive'), action('open-world'), action('open-settings')], requiredTestIds: ['screen-home'] },
  { id: 'home-resumable', screenId: 'home', variant: 'resumable', heading: '黑山酒馆', requiredActions: [action('continue-run'), action('new-run')], requiredTestIds: ['active-run-card'] },
  { id: 'home-progressed', screenId: 'home', variant: 'progressed', heading: '黑山酒馆', requiredActions: [action('new-run'), action('open-archive'), action('open-world')], requiredTestIds: ['screen-home'] },
  { id: 'home-expansion-arrival', screenId: 'home', variant: 'expansion-arrival', heading: '黑山酒馆', requiredActions: [action('acknowledge-expansion'), action('new-run'), action('open-world')], requiredTestIds: ['screen-home', 'expansion-arrival', 'acknowledge-expansion'] },
  { id: 'archive-baseline', screenId: 'archive', variant: 'baseline', heading: '任务档案 · 人物熟悉度', requiredActions: [action('go-home')], requiredTestIds: ['screen-task-archive', 'visual-atlas'] },
  { id: 'archive-progressed', screenId: 'archive', variant: 'progressed', heading: '任务档案 · 人物熟悉度', requiredActions: [action('go-home')], requiredTestIds: ['screen-task-archive', 'visual-atlas'] },
  { id: 'archive-expansion', screenId: 'archive', variant: 'expansion', heading: '任务档案 · 人物熟悉度', requiredActions: [action('go-home')], requiredTestIds: ['screen-task-archive', 'visual-atlas', 'relationship-archive', 'relationship-card'] },
  { id: 'world-baseline-summary', screenId: 'world', variant: 'baseline-summary', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list'] },
  { id: 'world-baseline-unlocked-detail', screenId: 'world', variant: 'baseline-unlocked-detail', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'world-lore-detail-unlocked'] },
  { id: 'world-baseline-locked-detail', screenId: 'world', variant: 'baseline-locked-detail', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'world-lore-detail-locked'] },
  { id: 'world-progressed-summary', screenId: 'world', variant: 'progressed-summary', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list'] },
  { id: 'world-progressed-unlocked-detail', screenId: 'world', variant: 'progressed-unlocked-detail', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'world-lore-detail-unlocked'] },
  { id: 'world-progressed-locked-detail', screenId: 'world', variant: 'progressed-locked-detail', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'world-lore-detail-locked'] },
  { id: 'world-expansion-summary', screenId: 'world', variant: 'expansion-summary', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'expansion-stage'] },
  { id: 'world-expansion-unlocked-detail', screenId: 'world', variant: 'expansion-unlocked-detail', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'world-lore-detail-unlocked', 'expansion-stage'] },
  { id: 'world-expansion-locked-detail', screenId: 'world', variant: 'expansion-locked-detail', heading: '世界卷宗', requiredActions: [action('select-world-lore'), action('go-home')], requiredTestIds: ['screen-world-progress', 'world-lore-list', 'world-lore-detail-locked', 'expansion-stage'] },
  ...WORLD_METRIC_IDS.flatMap((metricId) => ([
    {
      id: `world-metric-${metricId}`,
      screenId: 'world',
      variant: `metric-${metricId}`,
      heading: '世界卷宗',
      requiredActions: [action('select-world-metric'), action('select-world-metric-entry'), action('close-world-metric'), action('go-home')],
      requiredTestIds: ['screen-world-progress', 'world-metrics', 'world-metric-detail', `world-metric-detail-${metricId}`, 'world-metric-entry', 'world-metric-entry-detail-empty']
    },
    {
      id: `world-metric-${metricId}-entry`,
      screenId: 'world',
      variant: `metric-${metricId}-entry`,
      heading: '世界卷宗',
      requiredActions: [action('select-world-metric'), action('select-world-metric-entry'), action('close-world-metric'), action('go-home')],
      requiredTestIds: ['screen-world-progress', 'world-metrics', 'world-metric-detail', `world-metric-detail-${metricId}`, 'world-metric-entry', 'world-metric-entry-detail']
    }
  ])),
  ...['character-dossiers', 'routes', 'artifact-dossiers'].map((metricId) => ({
    id: `world-metric-${metricId}-locked-entry`,
    screenId: 'world',
    variant: `metric-${metricId}-locked-entry`,
    heading: '世界卷宗',
    requiredActions: [action('select-world-metric'), action('select-world-metric-entry'), action('close-world-metric'), action('go-home')],
    requiredTestIds: ['screen-world-progress', 'world-metrics', 'world-metric-detail', `world-metric-detail-${metricId}`, 'world-metric-entry', 'world-metric-entry-detail', 'world-dossier-lock-clue']
  })),
  { id: 'settings-default', screenId: 'settings', variant: 'default', heading: '设置', requiredActions: [action('set-speed'), action('toggle-motion'), action('go-home')], requiredTestIds: ['screen-settings'] },
  { id: 'settings-reduced-motion', screenId: 'settings', variant: 'reduced-motion', heading: '设置', requiredActions: [action('set-speed'), action('toggle-motion'), action('go-home')], requiredTestIds: ['screen-settings'] },
  { id: 'run-detail-debt', screenId: 'run-detail', variant: 'debt', heading: '本局规则详情', requiredActions: [action('open-run-detail'), action('close-run-detail')], requiredTestIds: ['screen-run-detail', 'run-detail-debt', 'debt-score-formula', 'debt-mark-list'] },
  ...DAOMAI_IDS.map((id) => ({ id: `run-detail-${id}`, screenId: 'run-detail', variant: id, heading: '本局规则详情', requiredActions: [action('open-run-detail'), action('close-run-detail')], requiredTestIds: ['screen-run-detail', 'run-detail-daomai', 'daomai-stage-grid', 'daomai-stage'] })),
  { id: 'character-unselected', screenId: 'character-select', variant: 'unselected', heading: '选择主角', requiredActions: [action('select-character'), action('confirm-character', false, true)], requiredTestIds: ['screen-character-select', 'character-grid', 'character-life-scale', 'character-initial-hp'] },
  { id: 'character-selected', screenId: 'character-select', variant: 'selected', heading: '选择主角', impactfulSelection: true, requiredActions: [action('select-character'), action('confirm-character', true, true)], requiredTestIds: ['screen-character-select', 'character-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] },
  { id: 'character-expanded-unselected', screenId: 'character-select', variant: 'expanded-unselected', heading: '选择主角', requiredActions: [action('select-character'), action('confirm-character', false, true)], requiredTestIds: ['screen-character-select', 'character-grid', 'character-life-scale', 'character-initial-hp'] },
  { id: 'character-expanded-selected', screenId: 'character-select', variant: 'expanded-selected', heading: '选择主角', impactfulSelection: true, requiredActions: [action('select-character'), action('confirm-character', true, true)], requiredTestIds: ['screen-character-select', 'character-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] },
  { id: 'route-unselected', screenId: 'route-select', variant: 'unselected', heading: '选择路线', requiredActions: [action('select-route'), action('confirm-route', false, true)], requiredTestIds: ['screen-route-select', 'route-grid'] },
  { id: 'route-selected', screenId: 'route-select', variant: 'selected', heading: '选择路线', impactfulSelection: true, requiredActions: [action('select-route'), action('confirm-route', true, true)], requiredTestIds: ['screen-route-select', 'route-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] },
  { id: 'route-expanded-unselected', screenId: 'route-select', variant: 'expanded-unselected', heading: '选择路线', requiredActions: [action('select-route'), action('confirm-route', false, true)], requiredTestIds: ['screen-route-select', 'route-grid'] },
  { id: 'route-expanded-selected', screenId: 'route-select', variant: 'expanded-selected', heading: '选择路线', impactfulSelection: true, requiredActions: [action('select-route'), action('confirm-route', true, true)], requiredTestIds: ['screen-route-select', 'route-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] },
  ...['gate', 'crossroads', 'oldcase', 'witness-road', 'pressure', 'echo-case', 'lastcase', 'boss-tavern', 'boss-prep', 'empty-writ', 'reverse-ledger', 'changing-playbill'].flatMap((variant) => {
    const blockedCompanionAction = variant === 'crossroads' ? 'cross-company' : null;
    const requiredTestIds = blockedCompanionAction ? ['screen-choice', 'action-unavailable-reason'] : ['screen-choice'];
    const requiredOptionStates = blockedCompanionAction
      ? [optionState('select-choice', blockedCompanionAction, false, 'requires-partner')]
      : [];
    return [
      { id: `choice-${variant}-unselected`, screenId: 'choice', variant: `${variant}-unselected`, heading: null, requiredActions: [action('select-choice'), action('confirm-choice', false, true)], requiredOptionStates, requiredTestIds },
      { id: `choice-${variant}-selected`, screenId: 'choice', variant: `${variant}-selected`, heading: null, impactfulSelection: true, requiredActions: [action('select-choice'), action('confirm-choice', true, true)], requiredOptionStates, requiredTestIds: [...requiredTestIds, 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] }
    ];
  }),
  { id: 'consequence-choice', screenId: 'consequence', variant: 'choice', heading: null, requiredActions: [action('advance-node', true, true)], requiredTestIds: ['screen-consequence-result', 'choice-consequence-card'] },
  { id: 'consequence-reward', screenId: 'consequence', variant: 'reward', heading: null, requiredActions: [action('advance-node', true, true)], requiredTestIds: ['screen-consequence-result', 'choice-consequence-card'] },
  { id: 'consequence-tavern', screenId: 'consequence', variant: 'tavern', heading: null, requiredActions: [action('advance-node', true, true)], requiredTestIds: ['screen-consequence-result', 'choice-consequence-card'] },
  { id: 'reward-unselected', screenId: 'reward', variant: 'unselected', heading: '留下能改变后路的东西', requiredActions: [action('select-reward'), action('acquire-reward', false, true)], requiredOptionStates: [optionState('select-reward', 'company-seal', false, 'requires-partner')], requiredTestIds: ['screen-reward', 'action-unavailable-reason'] },
  { id: 'reward-selected', screenId: 'reward', variant: 'selected', heading: '留下能改变后路的东西', impactfulSelection: true, requiredActions: [action('select-reward'), action('acquire-reward', true, true)], requiredOptionStates: [optionState('select-reward', 'company-seal', false, 'requires-partner')], requiredTestIds: ['screen-reward', 'action-unavailable-reason', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact', 'reward-growth-preview', 'reward-preview-compact', 'daomai-preview-row'] },
  { id: 'reward-recovery-unselected', screenId: 'reward', variant: 'recovery-unselected', heading: '先把阵脚稳住，再谈下一战', requiredActions: [action('select-reward'), action('acquire-reward', false, true)], requiredTestIds: ['screen-reward', 'rescue-recovery-explanation'] },
  { id: 'reward-recovery-selected', screenId: 'reward', variant: 'recovery-selected', heading: '先把阵脚稳住，再谈下一战', impactfulSelection: true, requiredActions: [action('select-reward'), action('acquire-reward', true, true)], requiredTestIds: ['screen-reward', 'rescue-recovery-explanation', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact', 'reward-growth-preview', 'reward-preview-compact', 'daomai-preview-row'] },
  { id: 'tavern-unselected', screenId: 'tavern', variant: 'unselected', heading: '黑山酒馆', requiredActions: [action('select-tavern-action'), action('confirm-tavern-action', false, true)], requiredOptionStates: [optionState('select-tavern-action', 'recruit:partner-wen-fuji', false, 'insufficient-clues')], requiredTestIds: ['screen-tavern', 'tavern-action-bar', 'action-unavailable-reason'] },
  { id: 'tavern-selected', screenId: 'tavern', variant: 'selected', heading: '黑山酒馆', impactfulSelection: true, requiredActions: [action('select-tavern-action'), action('confirm-tavern-action', true, true)], requiredOptionStates: [optionState('select-tavern-action', 'recruit:partner-wen-fuji', false, 'insufficient-clues')], requiredTestIds: ['screen-tavern', 'tavern-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact', 'action-unavailable-reason'] },
  { id: 'boss-pre-tavern-unselected', screenId: 'boss-pre-tavern', variant: 'unselected', heading: '首领门前 · 黑山酒馆', requiredActions: [action('select-tavern-action'), action('confirm-tavern-action', false, true)], requiredTestIds: ['screen-boss-pre-tavern', 'tavern-action-bar'] },
  { id: 'boss-pre-tavern-selected', screenId: 'boss-pre-tavern', variant: 'selected', heading: '首领门前 · 黑山酒馆', impactfulSelection: true, requiredActions: [action('select-tavern-action'), action('confirm-tavern-action', true, true)], requiredTestIds: ['screen-boss-pre-tavern', 'tavern-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] },
  { id: 'combat-ordinary-entry', screenId: 'combat', variant: 'ordinary-entry', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-log-current'] },
  { id: 'combat-ordinary-party-entry', screenId: 'combat', variant: 'ordinary-party-entry', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-log-current', 'combat-party-formation', 'combat-field-partner', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-party-active', screenId: 'combat', variant: 'ordinary-party-active', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-log-current', 'combat-party-formation', 'combat-field-partner', 'combat-field-partner-active', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-party-terminal', screenId: 'combat', variant: 'ordinary-party-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-log-current', 'combat-party-formation', 'combat-field-partner', 'combat-full-report', 'combat-report-entry', 'combat-outcome-explanation', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-party-basic-before', screenId: 'combat', variant: 'ordinary-party-basic-before', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-field-partner-active', 'combat-state-control'] },
  { id: 'combat-ordinary-party-basic-after', screenId: 'combat', variant: 'ordinary-party-basic-after', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-field-partner-active', 'combat-state-heal'] },
  { id: 'combat-ordinary-party-hit', screenId: 'combat', variant: 'ordinary-party-hit', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-field-partner-active', 'combat-state-hit'] },
  { id: 'combat-ordinary-party-intercept', screenId: 'combat', variant: 'ordinary-party-intercept', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-field-partner-active', 'combat-state-intercept'] },
  { id: 'combat-ordinary-party-combo', screenId: 'combat', variant: 'ordinary-party-combo', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-field-partner-active', 'combat-state-combo'] },
  { id: 'combat-ordinary-party-revive-seal', screenId: 'combat', variant: 'ordinary-party-revive-seal', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-revival-status', 'combat-state-revived', 'revive-seal-count', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-party-revive-baiheng', screenId: 'combat', variant: 'ordinary-party-revive-baiheng', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-revival-status', 'combat-state-revived', 'revive-seal-count', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-three-partner-downed-order', screenId: 'combat', variant: 'ordinary-three-partner-downed-order', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-state-downed', 'combat-field-partner', 'revive-seal-count', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-pressure-action', screenId: 'combat', variant: 'ordinary-pressure-action', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-enemy-pressure-status', 'combat-pressure-bar', 'combat-pressure-rule'] },
  { id: 'combat-ordinary-pressure-critical', screenId: 'combat', variant: 'ordinary-pressure-critical', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-enemy-pressure-status', 'combat-pressure-bar', 'combat-pressure-rule'] },
  { id: 'combat-ordinary-pressure-relief', screenId: 'combat', variant: 'ordinary-pressure-relief', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-pressure-relief-status', 'combat-pressure-bar', 'combat-pressure-rule'] },
  { id: 'combat-ordinary-pressure-collapse-terminal', screenId: 'combat', variant: 'ordinary-pressure-collapse-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-pressure-collapse-status', 'combat-full-report', 'combat-report-entry', 'combat-outcome-explanation', 'combat-outcome-trigger'] },
  { id: 'combat-ordinary-party-downed', screenId: 'combat', variant: 'ordinary-party-downed', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-party-formation', 'combat-field-partner', 'combat-state-downed', 'combat-full-report', 'combat-outcome-explanation', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-hero-down-continues', screenId: 'combat', variant: 'ordinary-hero-down-continues', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-hero-downed-state', 'combat-field-partner'] },
  { id: 'combat-ordinary-hero-dead-terminal', screenId: 'combat', variant: 'ordinary-hero-dead-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-hero-downed-state', 'combat-full-report', 'combat-report-entry', 'combat-outcome-explanation', 'combat-outcome-trigger'] },
  { id: 'combat-ordinary-allies-hold-terminal', screenId: 'combat', variant: 'ordinary-allies-hold-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-hero-downed-state', 'combat-allies-hold-status', 'combat-field-partner', 'combat-full-report', 'combat-outcome-explanation', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-party-zero-terminal', screenId: 'combat', variant: 'ordinary-party-zero-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-hero-downed-state', 'combat-state-downed', 'combat-full-report', 'combat-outcome-explanation', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-full-report', screenId: 'combat', variant: 'ordinary-full-report', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-full-report', 'combat-report-entry', 'combat-outcome-explanation', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'combat-ordinary-stalemate-warning-1', screenId: 'combat', variant: 'ordinary-stalemate-warning-1', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-stalemate-status'] },
  { id: 'combat-ordinary-stalemate-warning-2', screenId: 'combat', variant: 'ordinary-stalemate-warning-2', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-stalemate-status'] },
  { id: 'combat-ordinary-stalemate-terminal', screenId: 'combat', variant: 'ordinary-stalemate-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-stalemate-status', 'combat-full-report', 'combat-outcome-explanation'] },
  { id: 'combat-ordinary-terminal', screenId: 'combat', variant: 'ordinary-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-log-current', 'combat-full-report', 'combat-outcome-explanation'] },
  { id: 'combat-elite-entry', screenId: 'combat', variant: 'elite-entry', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'combat-log-current'] },
  { id: 'combat-elite-terminal', screenId: 'combat', variant: 'elite-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'combat-log-current', 'combat-full-report', 'combat-outcome-explanation'] },
  { id: 'combat-boss-phase-1', screenId: 'combat', variant: 'boss-phase-1', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'boss-pressure-read', 'boss-objective', 'boss-objective-progress', 'boss-objective-rule', 'boss-preparation-partner-status', 'boss-preparation-formation-status'] },
  { id: 'combat-boss-phase-2', screenId: 'combat', variant: 'boss-phase-2', headingPrefix: '迎战 · ', requiredActions: [action('next-combat-log'), action('auto-combat'), action('direct-settle')], requiredTestIds: ['screen-combat', 'boss-pressure-read', 'boss-objective', 'boss-objective-progress', 'boss-objective-rule'] },
  { id: 'combat-boss-phase-3-terminal', screenId: 'combat', variant: 'boss-phase-3-terminal', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'boss-pressure-read', 'boss-objective', 'boss-objective-progress', 'combat-full-report', 'combat-outcome-explanation'] },
  { id: 'combat-boss-defeat-overwhelmed', screenId: 'combat', variant: 'boss-defeat-overwhelmed', headingPrefix: '迎战 · ', requiredActions: [action('continue-combat')], requiredTestIds: ['screen-combat', 'boss-pressure-read', 'boss-objective', 'boss-objective-progress', 'boss-objective-rule', 'boss-preparation-partner-status', 'boss-preparation-formation-status', 'combat-boss-objective-failed', 'combat-full-report', 'combat-report-entry', 'combat-outcome-explanation', 'combat-outcome-trigger', 'sidebar-partner-card', 'sidebar-partner-hp-bar'] },
  { id: 'rescue-choice-unselected', screenId: 'rescue', variant: 'choice-unselected', heading: '一救，从来不是免费的', requiredActions: [action('select-rescue'), action('confirm-rescue', false, true)], requiredTestIds: ['screen-rescue-tavern', 'rescue-charges', 'rescue-action-bar'] },
  { id: 'rescue-choice-selected', screenId: 'rescue', variant: 'choice-selected', heading: '一救，从来不是免费的', impactfulSelection: true, requiredActions: [action('select-rescue'), action('confirm-rescue', true, true)], requiredTestIds: ['screen-rescue-tavern', 'rescue-charges', 'rescue-action-bar', 'choice-impact-preview', 'choice-impact-preview-deltas', 'choice-impact-preview-compact'] },
  { id: 'rescue-result', screenId: 'rescue', variant: 'result', heading: '命悬一线，账已记下', requiredActions: [action('continue-rescue')], requiredTestIds: ['screen-rescue-tavern', 'rescue-result', 'rescue-pacing-promise'] },
  { id: 'settlement-victory', screenId: 'settlement', variant: 'victory', heading: '带回被守住的一页', requiredActions: [action('new-run'), action('open-archive'), action('open-world'), action('go-home')], requiredTestIds: ['screen-settlement', 'settlement-history', 'settlement-dossier', 'settlement-update-cap'] },
  { id: 'settlement-failure', screenId: 'settlement', variant: 'failure', heading: null, requiredActions: [action('new-run'), action('open-archive'), action('open-world'), action('go-home')], requiredTestIds: ['screen-settlement', 'settlement-history', 'settlement-dossier', 'settlement-update-cap'] }
].map(freezeScenario);

export const FORMAL_SCREEN_SCENARIOS = Object.freeze(scenarios);

const variantsFor = (screenId) => Object.freeze(scenarios.filter((scenario) => scenario.screenId === screenId).map((scenario) => scenario.variant));

export const FORMAL_SCREEN_REGISTRY = Object.freeze([
  { id: 'home', rendererId: 'home', pages: [FORMAL_PAGE.HOME], runViews: [], variants: variantsFor('home') },
  { id: 'archive', rendererId: 'archive', pages: [FORMAL_PAGE.ARCHIVE], runViews: [], variants: variantsFor('archive') },
  { id: 'world', rendererId: 'world', pages: [FORMAL_PAGE.WORLD], runViews: [], variants: variantsFor('world') },
  { id: 'settings', rendererId: 'settings', pages: [FORMAL_PAGE.SETTINGS], runViews: [], variants: variantsFor('settings') },
  { id: 'run-detail', rendererId: 'run-detail', pages: [FORMAL_PAGE.RUN_DETAIL], runViews: [], variants: variantsFor('run-detail') },
  { id: 'character-select', rendererId: 'character-select', pages: [], runViews: [FORMAL_RUN_VIEW.CHARACTER_SELECT], variants: variantsFor('character-select') },
  { id: 'route-select', rendererId: 'route-select', pages: [], runViews: [FORMAL_RUN_VIEW.ROUTE_SELECT], variants: variantsFor('route-select') },
  { id: 'choice', rendererId: 'choice', pages: [], runViews: [FORMAL_RUN_VIEW.CHOICE], variants: variantsFor('choice') },
  { id: 'consequence', rendererId: 'consequence', pages: [], runViews: [FORMAL_RUN_VIEW.CHOICE_RESULT, FORMAL_RUN_VIEW.REWARD_RESULT, FORMAL_RUN_VIEW.TAVERN_RESULT], variants: variantsFor('consequence') },
  { id: 'reward', rendererId: 'reward', pages: [], runViews: [FORMAL_RUN_VIEW.REWARD], variants: variantsFor('reward') },
  { id: 'tavern', rendererId: 'tavern', pages: [], runViews: [FORMAL_RUN_VIEW.TAVERN], variants: variantsFor('tavern') },
  { id: 'boss-pre-tavern', rendererId: 'boss-pre-tavern', pages: [], runViews: [FORMAL_RUN_VIEW.BOSS_PRE_TAVERN], variants: variantsFor('boss-pre-tavern') },
  { id: 'combat', rendererId: 'combat', pages: [], runViews: [FORMAL_RUN_VIEW.COMBAT], variants: variantsFor('combat') },
  { id: 'rescue', rendererId: 'rescue', pages: [], runViews: [FORMAL_RUN_VIEW.RESCUE_TAVERN], variants: variantsFor('rescue') },
  { id: 'settlement', rendererId: 'settlement', pages: [], runViews: [FORMAL_RUN_VIEW.SETTLEMENT], variants: variantsFor('settlement') }
].map((screen) => Object.freeze({ ...screen, pages: Object.freeze(screen.pages), runViews: Object.freeze(screen.runViews) })));

export const FORMAL_PAGE_IDS = Object.freeze(Object.values(FORMAL_PAGE));
export const FORMAL_RUN_VIEWS = Object.freeze(FORMAL_SCREEN_REGISTRY.flatMap((screen) => screen.runViews));
export const FORMAL_RENDERER_IDS = Object.freeze(FORMAL_SCREEN_REGISTRY.map((screen) => screen.rendererId));

const screenByPage = new Map(FORMAL_SCREEN_REGISTRY.flatMap((screen) => screen.pages.map((page) => [page, screen])));
const screenByRunView = new Map(FORMAL_SCREEN_REGISTRY.flatMap((screen) => screen.runViews.map((view) => [view, screen])));

function hasEarnedProgress(meta) {
  const world = meta?.worldProgress || {};
  const characterProgress = Object.values(meta?.characterProgress || {});
  return Number(world.loreStage || 0) > 1
    || (world.endingsSeen || []).length > 0
    || (world.truthFragments || []).length > 0
    || characterProgress.length > 1
    || characterProgress.some((entry) => Number(entry?.familiarity || 0) > 1 || Number(entry?.bossEncounters || 0) > 0);
}

function choiceVariant(run) {
  const raw = run?.sequence?.[run.nodeIndex]?.choiceId || 'unregistered-choice';
  const name = raw.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `${name}-${run?.selectedChoiceId ? 'selected' : 'unselected'}`;
}

function combatVariant(run) {
  if (run?.combat?.reviewVariant) return run.combat.reviewVariant;
  const tier = run?.combat?.result?.tier;
  if (tier === 'ordinary' || tier === 'elite') {
    const currentLog = run.combat.result.logs?.[run.combat.logIndex];
    if (tier === 'ordinary' && (run?.partners || []).length) {
      if (run.combat.allLogsRevealed && run.combat.legalTerminal) return 'ordinary-party-terminal';
      const partnerActive = run.partners.some((partner) => partner.id === currentLog?.actorId);
      return partnerActive ? 'ordinary-party-active' : 'ordinary-party-entry';
    }
    return `${tier}-${run.combat.allLogsRevealed && run.combat.legalTerminal ? 'terminal' : 'entry'}`;
  }
  if (tier === 'boss') {
    if (run.combat.allLogsRevealed && run.combat.legalTerminal) return 'boss-phase-3-terminal';
    if (Number(run.combat.logIndex || 0) >= 3) return 'boss-phase-2';
    return 'boss-phase-1';
  }
  return 'unregistered-combat';
}

function variantFor(screenId, { run, meta, preferences, worldLoreSelectionId, worldMetricSelectionId, worldMetricEntrySelectionId, runDetailId }) {
  if (screenId === 'home') {
    if (pendingExpansionArrival(meta)) return 'expansion-arrival';
    if (run && run.view !== 'settlement') return 'resumable';
    return hasEarnedProgress(meta) ? 'progressed' : 'default';
  }
  if (screenId === 'archive') {
    if (availableCharacterIds(meta).length > 6) return 'expansion';
    return hasEarnedProgress(meta) ? 'progressed' : 'baseline';
  }
  if (screenId === 'world') {
    if (WORLD_METRIC_IDS.includes(worldMetricSelectionId)) {
      if (!worldMetricEntrySelectionId) return `metric-${worldMetricSelectionId}`;
      const selectedMetricEntry = worldMetricEntry(meta, worldMetricSelectionId, worldMetricEntrySelectionId);
      return `metric-${worldMetricSelectionId}${selectedMetricEntry?.unlocked === false ? '-locked-entry' : '-entry'}`;
    }
    const progress = availableCharacterIds(meta).length > 6 ? 'expansion' : hasEarnedProgress(meta) ? 'progressed' : 'baseline';
    if (!worldLoreSelectionId) return `${progress}-summary`;
    return `${progress}-${worldLoreEntryState(meta, worldLoreSelectionId)?.unlocked ? 'unlocked' : 'locked'}-detail`;
  }
  if (screenId === 'settings') return preferences?.reduceMotion ? 'reduced-motion' : 'default';
  if (screenId === 'run-detail') return runDetailId === 'debt' || DAOMAI_IDS.includes(runDetailId) ? runDetailId : 'debt';
  if (screenId === 'character-select') return `${(run?.availableCharacterIds || []).length > 6 ? 'expanded-' : ''}${run?.selectedCharacterId ? 'selected' : 'unselected'}`;
  if (screenId === 'route-select') return `${(run?.availableRouteIds || []).length > 3 ? 'expanded-' : ''}${run?.selectedRouteId ? 'selected' : 'unselected'}`;
  if (screenId === 'choice') return choiceVariant(run);
  if (screenId === 'consequence') return run?.view === 'choice-result' ? 'choice' : run?.view === 'reward-result' ? 'reward' : 'tavern';
  if (screenId === 'reward') {
    const recovery = Boolean(run?.sequence?.[run?.nodeIndex]?.rescueRecovery);
    return `${recovery ? 'recovery-' : ''}${run?.selectedRewardId ? 'selected' : 'unselected'}`;
  }
  if (screenId === 'tavern' || screenId === 'boss-pre-tavern') return run?.selectedTavernActionId ? 'selected' : 'unselected';
  if (screenId === 'combat') return combatVariant(run);
  if (screenId === 'rescue') return run?.rescueState?.phase === 'result' ? 'result' : `choice-${run?.rescueState?.selectedId ? 'selected' : 'unselected'}`;
  if (screenId === 'settlement') return run?.outcome === 'victory' ? 'victory' : 'failure';
  return 'unregistered';
}

export function resolveFormalScreen({ page, run, meta, preferences, worldLoreSelectionId = null, worldMetricSelectionId = null, worldMetricEntrySelectionId = null, runDetailId = 'debt' }) {
  const screen = page === 'run' ? screenByRunView.get(run?.view) : screenByPage.get(page);
  if (!screen) throw new Error(`Unregistered formal screen: page=${page}; run.view=${run?.view || 'none'}`);
  const variant = variantFor(screen.id, { run, meta, preferences, worldLoreSelectionId, worldMetricSelectionId, worldMetricEntrySelectionId, runDetailId });
  if (!screen.variants.includes(variant)) {
    throw new Error(`Unregistered formal screen variant: ${screen.id}:${variant}`);
  }
  const scenario = FORMAL_SCREEN_SCENARIOS.find((entry) => entry.screenId === screen.id && entry.variant === variant);
  if (!scenario) throw new Error(`Missing formal screen scenario: ${screen.id}:${variant}`);
  return Object.freeze({ screenId: screen.id, rendererId: screen.rendererId, variant, scenarioId: scenario.id, key: `${screen.id}:${variant}` });
}

export function formalScreenScenario(screenId, variant) {
  return FORMAL_SCREEN_SCENARIOS.find((scenario) => scenario.screenId === screenId && scenario.variant === variant) || null;
}
