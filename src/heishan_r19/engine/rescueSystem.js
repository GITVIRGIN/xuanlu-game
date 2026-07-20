import { FORMAL_RUN_VIEW } from '../contracts/formalNavigation.js';
import { evaluateActionAvailability } from './actionAvailability.js';

export const RESCUE_OPTIONS = [
  {
    id: 'wake-wine',
    title: '灌一碗醒魂酒',
    description: '恢复到 45%；醒魂躁意 +1，但离店时压力不会高于 7；失去一件战利，若无战利则债印 +1。'
  },
  {
    id: 'keeper-credit',
    title: '掌柜赊你一命',
    description: '恢复到 35%，压力稳定至不高于 6；记下债印“酒债”，首领会循债闻到你的行踪。'
  },
  {
    id: 'pawn-relic',
    title: '典当一件旧物',
    description: '恢复到 40%，移除一件战利，护甲 +4、压力 -2且不高于 7；若有破局线索则 -1。',
    requirements: { minRewards: 1 }
  }
];

export function openRescueState(run) {
  return {
    ...run,
    view: FORMAL_RUN_VIEW.RESCUE_TAVERN,
    rescueState: {
      phase: 'choice',
      options: RESCUE_OPTIONS,
      selectedId: null,
      resultText: ''
    }
  };
}

export function selectRescueOption(run, optionId) {
  if (run.view !== FORMAL_RUN_VIEW.RESCUE_TAVERN || !run.rescueState || run.rescueState.phase !== 'choice' || run.rescueCharges <= 0) return run;
  const option = run.rescueState.options.find((item) => item.id === optionId);
  if (!option || !evaluateActionAvailability(run, option).available) return run;
  const next = structuredClone(run);
  next.rescueState.selectedId = option.id;
  return next;
}

export function applyRescue(run, optionId) {
  if (run.view !== FORMAL_RUN_VIEW.RESCUE_TAVERN || !run.rescueState || run.rescueState.phase !== 'choice' || run.rescueCharges <= 0) return run;
  if (!run.rescueState.options.some((item) => item.id === optionId)) return run;
  const option = RESCUE_OPTIONS.find((item) => item.id === optionId);
  if (!option || !evaluateActionAvailability(run, option).available) return run;
  const next = structuredClone(run);
  const maxHp = next.stats.maxHp;
  let partnerRecoveryRatio = 0.3;
  if (option.id === 'wake-wine') {
    next.stats.hp = Math.max(next.stats.hp, Math.round(maxHp * 0.45));
    partnerRecoveryRatio = 0.35;
    next.stats.pressure = Math.min(7, next.stats.pressure + 1);
    if (next.rewards.length) next.rewards.pop();
    else next.debtMarks.push('醒魂酒债');
  } else if (option.id === 'keeper-credit') {
    next.stats.hp = Math.max(next.stats.hp, Math.round(maxHp * 0.35));
    partnerRecoveryRatio = 0.3;
    next.stats.pressure = Math.min(6, next.stats.pressure);
    next.debtMarks.push('酒债');
  } else {
    if (next.rewards.length) next.rewards.shift();
    next.stats.hp = Math.max(next.stats.hp, Math.round(maxHp * 0.4));
    next.stats.armor += 4;
    next.stats.pressure = Math.min(7, Math.max(0, next.stats.pressure - 2));
    next.stats.clues = Math.max(0, next.stats.clues - 1);
    partnerRecoveryRatio = 0.4;
  }
  next.partners = (next.partners || []).map((partner) => ({
    ...partner,
    hp: partner.hp > 0 ? partner.hp : Math.max(1, Math.round(partner.maxHp * partnerRecoveryRatio))
  }));
  next.rescueCharges -= 1;
  next.rescueUsed = true;
  next.rescueState = {
    ...next.rescueState,
    phase: 'result',
    selectedId: option.id,
    resultText: `${option.title}：${option.description}${next.partners.length ? ' 同行者也被扶回了能继续赶路的气息。' : ''}`
  };
  next.runHistory.push({
    type: 'rescue',
    optionId: option.id,
    label: option.title,
    cost: option.description,
    chargesAfter: next.rescueCharges
  });
  return next;
}
