import { selectionImpactPreview } from './selectionImpactPreview.js';

export function rewardGrowthPreview(run) {
  const preview = selectionImpactPreview(run);
  if (!preview || preview.kind !== 'reward') return null;
  return Object.freeze({
    rewardId: preview.selectionId,
    rewardName: preview.selectionName,
    statChanges: preview.statChanges,
    daomaiChanges: preview.daomaiChanges,
    crossed: preview.crossed
  });
}
