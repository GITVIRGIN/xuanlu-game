import { assetRoleId, backgroundAssetStyle, SCENE_ASSETS, TAVERN_ICONS } from '../data/assets.js';
import { image } from './view.js';
import { actionAvailabilityView } from './actionAvailabilityView.js';
import { renderCompactImpact } from './selectionImpactView.js';

export function renderTavern(run, bossVisit = false) {
  const cards = run.tavernOptions.map((action) => {
    const availability = actionAvailabilityView(run, action);
    const selected = availability.available && run.selectedTavernActionId === action.id;
    return `<button class="tavern-action ${selected ? 'selected' : ''} ${availability.className}" data-action="select-tavern-action" data-id="${action.id}" data-testid="tavern-action" aria-pressed="${selected}" ${availability.attributes}>
      ${image(TAVERN_ICONS[action.icon] || TAVERN_ICONS.intel, '', 'tavern-action-icon')}
      <span><b>${action.title}</b><small>${action.description}</small>${availability.reasonHtml}</span>
    </button>`;
  }).join('');
  const selected = run.tavernOptions.find((action) => action.id === run.selectedTavernActionId) || null;
  const selectionIsAvailable = selected ? actionAvailabilityView(run, selected).available : false;
  return `<section class="tavern-screen" data-testid="${bossVisit ? 'screen-boss-pre-tavern' : 'screen-tavern'}" data-asset-role="${assetRoleId(SCENE_ASSETS.tavern)}" style="${backgroundAssetStyle(SCENE_ASSETS.tavern)}">
    <div class="scene-scrim"></div>
    <div class="tavern-content">
      <p class="eyebrow">${bossVisit ? '可选修整 · 首领门前' : '山路歇脚 · 炉火未灭'}</p>
      <h2>${bossVisit ? '首领门前 · 黑山酒馆' : '黑山酒馆'}</h2>
      <p>${bossVisit ? '你选择回头，但修整并非免费。只可落定一项。' : '只可选择一项。愿意同行的人会随你走过的路线和这次来访而改变。'}</p>
      <div class="tavern-grid selection-scroll">${cards}</div>
    </div>
    <div class="sticky-action tavern-confirm-bar" data-testid="tavern-action-bar">
      <div class="selection-summary" aria-live="polite" aria-atomic="true"><span>${selectionIsAvailable ? `已选 · ${selected.title}` : '请选择一项酒馆行动'}</span><small>${selectionIsAvailable ? renderCompactImpact(run) : '选中后先查看代价与收益，确认后才会结算。'}</small></div>
      <button class="command primary" data-action="confirm-tavern-action" data-testid="confirm-tavern-action" ${selectionIsAvailable ? '' : 'disabled'}>确认行动</button>
    </div>
  </section>`;
}
