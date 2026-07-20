import { PARTY_LIMITS } from '../contracts/partyScale.js';

const RESOURCE_LABELS = Object.freeze({
  armor: '护甲',
  damage: '伤害',
  clues: '破局线索',
  bossPrep: '破局把握'
});

function asCount(value) {
  return Math.max(0, Number(value) || 0);
}

function addFailure(failures, code, reason) {
  if (!failures.some((entry) => entry.code === code)) failures.push({ code, reason });
}

/**
 * Every selectable run action uses this pure availability contract. Renderers,
 * state transitions, bots and tests therefore agree on whether it can fire.
 */
export function evaluateActionAvailability(run, action) {
  const failures = [];
  if (!run || !action || typeof action.id !== 'string') {
    addFailure(failures, 'invalid-action', '这项行动已经失效');
  } else {
    const requirements = action.requirements || {};
    const partnerCount = Array.isArray(run.partners) ? run.partners.length : 0;
    const rewardCount = Array.isArray(run.rewards) ? run.rewards.length : 0;

    if (partnerCount < asCount(requirements.minPartners)) {
      addFailure(failures, 'requires-partner', '尚无同行者，不能执行这项行动');
    }

    const openPartnerSlots = asCount(requirements.openPartnerSlots);
    const maxPartners = Math.max(0, Number(requirements.maxPartners) || PARTY_LIMITS.maxPartners);
    if (openPartnerSlots > 0 && maxPartners - partnerCount < openPartnerSlots) {
      addFailure(failures, 'partner-slots-full', '同行席位已满');
    }

    const openReviveSealSlots = asCount(requirements.openReviveSealSlots);
    if (openReviveSealSlots > 0 && PARTY_LIMITS.maxReviveSeals - asCount(run.reviveSeals) < openReviveSealSlots) {
      addFailure(failures, 'revive-seals-full', '扶魂符已经备足');
    }

    if (rewardCount < asCount(requirements.minRewards)) {
      addFailure(failures, 'requires-reward', '没有可用于典当的战利');
    }

    for (const [stat, required] of Object.entries(requirements.minStats || {})) {
      const needed = asCount(required);
      const current = asCount(run.stats?.[stat]);
      if (current < needed) {
        const label = RESOURCE_LABELS[stat] || stat;
        addFailure(failures, `insufficient-${stat}`, `${label}不足，需要 ${needed}`);
      }
    }

    const hpDelta = Number(action.delta?.hp || 0);
    const currentHp = asCount(run.stats?.hp);
    if (hpDelta < 0 && currentHp + hpDelta < 1) {
      addFailure(failures, 'insufficient-hp', `生命不足，至少需要 ${Math.abs(hpDelta) + 1} 点生命`);
    }

    for (const [stat, label] of Object.entries(RESOURCE_LABELS)) {
      const delta = Number(action.delta?.[stat] || 0);
      const current = asCount(run.stats?.[stat]);
      if (delta < 0 && current + delta < 0) {
        addFailure(failures, `insufficient-${stat}`, `${label}不足，需要 ${Math.abs(delta)}`);
      }
    }
  }

  const available = failures.length === 0;
  return Object.freeze({
    available,
    code: available ? 'available' : failures[0].code,
    reason: available ? '' : failures.map((entry) => entry.reason).join('；'),
    reasons: Object.freeze(failures.map((entry) => Object.freeze({ ...entry })))
  });
}

export function availableActions(run, actions = []) {
  return actions.filter((action) => evaluateActionAvailability(run, action).available);
}
