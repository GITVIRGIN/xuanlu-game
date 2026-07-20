import { DAOMAI } from '../data/daomai.js';
import { actionAvailabilityView } from './actionAvailabilityView.js';
import { renderCompactImpact } from './selectionImpactView.js';

function renderCompactPreview(run) {
  return `${renderCompactImpact(run)}<span>；领取后，这页会留在本局见证簿。</span>`;
}

export function renderReward(run) {
  const node = run.sequence?.[run.nodeIndex] || null;
  const isRescueRecovery = Boolean(node?.rescueRecovery);
  const cards = run.rewardOptions.map((reward) => {
    const availability = actionAvailabilityView(run, reward);
    const selected = availability.available && run.selectedRewardId === reward.id;
    const lines = Object.entries(reward.daomai).map(([id, value]) => `${DAOMAI[id].name} +${value}`).join('、');
    return `<button class="reward-card ${selected ? 'selected' : ''} ${availability.className}" data-action="select-reward" data-id="${reward.id}" data-testid="reward-card" aria-pressed="${selected}" ${availability.attributes}>
      <span class="rarity">${reward.rarity}</span><b>${reward.name}</b><span>${reward.immediate}</span><small>道脉 · ${lines}</small><em>${reward.oldCause}</em>
      ${availability.reasonHtml}
    </button>`;
  }).join('');
  const selected = run.rewardOptions.find((reward) => reward.id === run.selectedRewardId) || null;
  const selectionIsAvailable = selected ? actionAvailabilityView(run, selected).available : false;
  const compactPreview = renderCompactPreview(run);
  return `<section class="node-screen reward-screen ${isRescueRecovery ? 'rescue-recovery-reward' : ''}" data-testid="screen-reward"${isRescueRecovery ? ' data-rescue-recovery="true"' : ''}>
    <div class="screen-heading">${isRescueRecovery ? '<p class="eyebrow">掌柜改路 · 撤路补给</p><h2>先把阵脚稳住，再谈下一战</h2><p data-testid="rescue-recovery-explanation">你顺着石缝里的灯记找到三件无主补给。它们只帮你止血、整甲、重认方向，不会再添一笔代价。</p>' : '<p class="eyebrow">战后奖励</p><h2>留下能改变后路的东西</h2><p>战利不是纯数字，它会推进一条道脉并留下旧因。</p>'}</div>
    <div class="reward-grid selection-scroll">${cards}</div>
    <div class="sticky-action"><div class="selection-summary" aria-live="polite" aria-atomic="true"><span>${selectionIsAvailable ? `已选 · ${selected.name}` : isRescueRecovery ? '选择一份撤离补给' : '选择一件战利'}</span><small>${compactPreview}</small></div><button class="command primary" data-action="acquire-reward" data-testid="acquire-reward" ${selectionIsAvailable ? '' : 'disabled'}>${isRescueRecovery ? '完成整备' : '获得战利'}</button></div>
  </section>`;
}
