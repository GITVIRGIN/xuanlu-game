import { selectionImpactPreview } from '../engine/selectionImpactPreview.js';
import { escapeHtml } from './view.js';

function changeText(change) {
  return `${change.label} ${change.beforeText ?? change.before}→${change.afterText ?? change.after}`;
}

export function compactImpactModel(run) {
  const preview = selectionImpactPreview(run);
  if (!preview) return null;
  const fragments = [
    ...preview.identityChanges.map(changeText),
    ...preview.statChanges.map(changeText),
    ...preview.partnerChanges.flatMap((partner) => partner.stats.map((change) => `${partner.name}${change.label} ${change.beforeText}→${change.afterText}`)),
    ...preview.daomaiChanges.map(changeText),
    ...preview.counterChanges.map((change) => `${change.label} ${change.before}${change.suffix}→${change.after}${change.suffix}`),
    ...preview.collectionChanges.flatMap((change) => [
      ...change.removed.map((value) => `${change.label} 失去${value}`),
      ...change.added.map((value) => `${change.label} 获得${value}`)
    ])
  ];
  if (preview.destination) fragments.push(`去向 ${preview.destination}`);
  return { preview, fragments };
}

export function renderCompactImpact(run) {
  const model = compactImpactModel(run);
  if (!model) return '<span>请选择一项以查看确认后的准确变化。</span>';
  const visible = model.fragments.length ? model.fragments.slice(0, 6) : ['不会改变当前数值，但会写入本局选择'];
  const remaining = Math.max(0, model.fragments.length - visible.length);
  const text = `${visible.join(' · ')}${remaining ? ` · 另有 ${remaining} 项` : ''}`;
  return `<span class="choice-impact-preview-compact" data-testid="choice-impact-preview-compact" data-impact-kind="${model.preview.kind}">${escapeHtml(text)}</span>${model.preview.kind === 'reward' ? '<span class="compatibility-marker" data-testid="reward-preview-compact" aria-hidden="true"></span>' : ''}`;
}
