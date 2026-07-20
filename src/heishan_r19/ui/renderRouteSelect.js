import { routesForRun } from '../data/routes.js';
import { assetRoleId, backgroundAssetStyle } from '../data/assets.js';
import { getBoss } from '../data/bosses.js';
import { renderCompactImpact } from './selectionImpactView.js';

export function renderRouteSelect(run) {
  const routePool = routesForRun(run);
  const cards = routePool.map((route) => {
    const selected = run.selectedRouteId === route.id;
    const boss = getBoss(route.bossId);
    return `<button class="route-card ${selected ? 'selected' : ''}" data-action="select-route" data-id="${route.id}" data-testid="route-card" data-asset-role="${assetRoleId(route.asset)}" aria-pressed="${selected}" style="${backgroundAssetStyle(route.asset, 'route')}">
      <span class="route-shade"></span>
      <span class="route-copy"><b>${route.name}</b><small><i>所得</i>${route.gain}</small><small><i>所舍</i>${route.sacrifice}</small><em>${route.question}</em><span>首领 · ${boss.name}</span></span>
    </button>`;
  }).join('');
  const selected = routePool.find((route) => route.id === run.selectedRouteId);
  return `<section class="selection-screen" data-testid="screen-route-select">
    <div class="screen-heading"><p class="eyebrow">第二步 · 入山路</p><h2>选择路线</h2><p>路线改变压力、敌势与首领。选人和选路不计入行踪。</p></div>
    <div class="route-grid selection-scroll ${routePool.length > 3 ? 'is-expanded-routes' : ''}" data-testid="route-grid" data-route-count="${routePool.length}">${cards}</div>
    <div class="sticky-action" data-testid="route-action-bar">
      <div class="selection-summary" aria-live="polite" aria-atomic="true"><span>${selected ? `已选择 · ${selected.name}` : '请选择一条入山之路'}</span><small>${selected ? renderCompactImpact(run) : '踏入黑山后才会遇见第一场山路抉择；选中后可预览路线影响'}</small></div>
      <button class="command primary" data-action="confirm-route" data-testid="confirm-route" ${selected ? '' : 'disabled'}>踏入黑山</button>
    </div>
  </section>`;
}
