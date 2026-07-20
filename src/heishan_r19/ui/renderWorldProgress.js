import { LORE_HINTS, loreStage } from '../data/lore.js';
import { expansionStage } from '../data/expansionCanon.js';
import { dossierCatalogs } from '../data/playerFacingDossiers.js';
import { WORLD_METRIC_IDS } from '../data/worldMetrics.js';
import { worldLoreEntryStates } from '../data/worldLore.js';
import {
  blackMountainChapter,
  blankDossierChapter,
  playerLoreVolumeLabel,
  worldMetricEntry,
  worldMetricModel
} from '../data/playerFacingWorld.js';
import { assetRoleId, backgroundAssetStyle, SCENE_ASSETS } from '../data/assets.js';
import { escapeHtml, image, meter } from './view.js';

function renderLoreDetail(selected) {
  if (!selected) {
    return `<article class="world-lore-detail is-empty" data-testid="world-lore-detail">
      <p class="eyebrow">档案阅览</p><h3>选择一页旧案</h3><p>左侧每一页都能展开。已确认的故事会给出正文，未归档的页面只留下不剧透的线头。</p>
    </article>`;
  }
  if (!selected.unlocked) {
    return `<article class="world-lore-detail is-locked" data-testid="world-lore-detail" data-lore-id="${selected.id}">
      <p class="eyebrow">${escapeHtml(playerLoreVolumeLabel(selected.stage))} · 尚未归档</p><h3>${escapeHtml(selected.title)}</h3>
      <div class="world-lore-lock" data-testid="world-lore-detail-locked"><b>墨迹尚未显形</b><p>${escapeHtml(selected.lockedLead)}</p><small>继续从不同路线、人物旧案与结局中取得交叉证据。本页不会提前显示确认正文。</small></div>
    </article>`;
  }
  const statusLabel = selected.status === 'contested' ? '会证中' : '已确认';
  return `<article class="world-lore-detail is-unlocked is-${selected.status || 'confirmed'}" data-testid="world-lore-detail" data-lore-id="${selected.id}" data-evidence-status="${selected.status || 'confirmed'}">
    <p class="eyebrow">${escapeHtml(playerLoreVolumeLabel(selected.stage))} · ${statusLabel}</p><h3>${escapeHtml(selected.title)}</h3>
    <div data-testid="world-lore-detail-unlocked">
      <blockquote>${escapeHtml(selected.core)}</blockquote>
      <section><b>${selected.status === 'contested' ? '当前能确认什么、仍争议什么' : '这段故事说了什么'}</b><p>${escapeHtml(selected.confirmed)}</p></section>
      <section><b>关联人物与旧案</b><p>${escapeHtml(selected.related)}</p></section>
      <section><b>已归档证据</b><ul>${selected.evidence.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul></section>
    </div>
  </article>`;
}

function renderMetricEntryDetail(selected) {
  if (!selected) {
    return `<article class="world-record-detail is-empty" data-testid="world-metric-entry-detail-empty">
      <p class="eyebrow">卷页阅览</p><h3>选择一条记录</h3><p>左侧每一条都能展开。旧因会说明来历与后路影响，线索会说明如何破局，路线与结局也保留各自的代价和余波。</p>
    </article>`;
  }
  const detail = selected.detail;
  const media = detail.media
    ? `<div class="world-record-media is-${escapeHtml(detail.media.kind)} ${detail.media.locked ? 'is-locked' : ''}">${detail.media.asset
      ? image(detail.media.asset, detail.media.alt || detail.title, 'world-record-media-image', { loading: 'lazy' })
      : `<div class="world-record-artifact-seal" aria-hidden="true"><span>${escapeHtml(String(detail.media.label || detail.title).slice(0, 1))}</span></div>`}</div>`
    : '';
  return `<article class="world-record-detail ${detail.locked ? 'is-locked' : ''} ${detail.media ? 'has-media' : ''}" data-testid="world-metric-entry-detail" data-entry-id="${escapeHtml(selected.id)}" data-unlocked="${selected.unlocked !== false}">
    ${media}<div class="world-record-detail-copy"><p class="eyebrow">${escapeHtml(detail.eyebrow)}</p><h3>${escapeHtml(detail.title)}</h3>
    <blockquote>${escapeHtml(detail.quote)}</blockquote>
    ${detail.sections.map((section) => `<section${detail.locked && /解锁线索|入馆线索/.test(section.title) ? ' data-testid="world-dossier-lock-clue"' : ''}><b>${escapeHtml(section.title)}</b><p>${escapeHtml(section.body)}</p></section>`).join('')}</div>
  </article>`;
}

function renderMetricItems(section, selectedEntryId) {
  if (!section.items.length) return `<p class="metric-empty">${escapeHtml(section.empty)}</p>`;
  return `<div class="world-record-list">${section.items.map((item) => `<button class="world-record-entry ${item.unlocked === false ? 'is-locked' : 'is-unlocked'} ${item.id === selectedEntryId ? 'is-selected' : ''}" data-action="select-world-metric-entry" data-id="${escapeHtml(item.id)}" data-testid="world-metric-entry" data-unlocked="${item.unlocked !== false}" aria-pressed="${item.id === selectedEntryId}">
    <span>${escapeHtml(item.kicker)}</span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.summary)}</small>
  </button>`).join('')}</div>`;
}

function renderMetricDetail(meta, selectedMetricId, selectedEntryId) {
  if (!WORLD_METRIC_IDS.includes(selectedMetricId)) return '';
  const model = worldMetricModel(meta, selectedMetricId);
  const selected = worldMetricEntry(meta, selectedMetricId, selectedEntryId);
  return `<section class="world-metric-detail" data-testid="world-metric-detail" data-metric-id="${selectedMetricId}">
    <div class="world-metric-detail-heading"><span>展开的卷页</span><button class="text-command" data-action="close-world-metric" data-testid="world-metric-close">合上</button></div>
    <div data-testid="world-metric-detail-${selectedMetricId}"><h3>${escapeHtml(model.title)}</h3><p class="world-metric-lead">${escapeHtml(model.lead)}</p>
      <div class="world-record-grid"><div class="world-record-sections">${model.sections.map((section) => `<section><h4>${escapeHtml(section.title)}</h4>${renderMetricItems(section, selectedEntryId)}</section>`).join('')}</div>${renderMetricEntryDetail(selected)}</div>
    </div>
  </section>`;
}

export function renderWorldProgress(meta, selectedLoreId = null, selectedMetricId = null, selectedMetricEntryId = null) {
  const world = meta.worldProgress || {};
  const stage = loreStage(world);
  const currentChapter = blackMountainChapter(stage);
  const oldCauses = (world.oldCausesFound || []).length;
  const fulfillments = (world.fulfillmentsSeen || []).length;
  const clues = (world.bossCluesFound || []).length;
  const routes = (world.routesSeen || []).length;
  const endings = (world.endingsSeen || []).length;
  const dossiers = dossierCatalogs(meta);
  const futureStage = expansionStage(meta);
  const futureChapter = blankDossierChapter(futureStage.id);
  const loreEntries = worldLoreEntryStates(meta);
  const selected = loreEntries.find((item) => item.id === selectedLoreId) || null;
  const loreList = loreEntries.map((item, index) => `<button class="world-lore-entry ${item.unlocked ? 'is-unlocked' : 'is-locked'} is-${item.status || 'unknown'} ${selected?.id === item.id ? 'is-selected' : ''}" data-action="select-world-lore" data-id="${item.id}" data-testid="world-lore-entry" aria-pressed="${selected?.id === item.id}">
    <span>卷页 ${String(index + 1).padStart(2, '0')} · ${item.status === 'contested' ? '会证中' : item.unlocked ? '已确认' : '待归档'}</span><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.unlocked ? item.lead : item.lockedLead)}</small>
  </button>`).join('');
  return `<section class="world-screen" data-testid="screen-world-progress" data-asset-role="${assetRoleId(SCENE_ASSETS.archive)}" style="${backgroundAssetStyle(SCENE_ASSETS.archive)}">
    <div class="world-heading"><p class="eyebrow">黑山旧案</p><h2>世界卷宗</h2><p>已确认的发现可以逐条展开；尚未入馆的人物、路线与关键物件也留下可追索的名字和线索，不会提前泄露结论。</p></div>
    <div class="world-stage"><span>当前卷名</span><strong data-testid="lore-stage">黑山旧案 · ${escapeHtml(currentChapter.seal)}</strong><small data-testid="expansion-stage">${escapeHtml(futureChapter.seal)}</small>${meter(stage, 6, 'lore', '', '黑山旧案归档进境')}</div>
    <div class="world-metrics" data-testid="world-metrics">
      <button class="world-metric ${selectedMetricId === 'archive-progress' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="archive-progress" aria-pressed="${selectedMetricId === 'archive-progress'}"><b>世界卷册总览</b><strong>${Math.round((stage / 6) * 100)}%</strong><small>${stage ? '旧案仍有残页未归档' : '山门尚在雾中'} · 展开卷页</small></button>
      <button class="world-metric ${selectedMetricId === 'old-causes' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="old-causes" aria-pressed="${selectedMetricId === 'old-causes'}"><b>已发现旧因</b><strong data-testid="old-causes-found">${oldCauses}</strong><small>其中 ${fulfillments} 条已经应验 · 查看全部</small></button>
      <button class="world-metric ${selectedMetricId === 'boss-clues' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="boss-clues" aria-pressed="${selectedMetricId === 'boss-clues'}"><b>首领破局线索</b><strong data-testid="boss-clues-found">${clues}</strong><small>未发现部分仍被抹去 · 查看全部</small></button>
      <button class="world-metric ${selectedMetricId === 'character-dossiers' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="character-dossiers" aria-pressed="${selectedMetricId === 'character-dossiers'}"><b>人物档案</b><strong data-testid="character-dossiers-count">${dossiers.characters.unlocked} / ${dossiers.characters.total}</strong><small>已入馆 / 名册总数 · 查看九人</small></button>
      <button class="world-metric ${selectedMetricId === 'routes' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="routes" aria-pressed="${selectedMetricId === 'routes'}"><b>路线档案</b><strong data-testid="route-dossiers-count">${dossiers.routes.unlocked} / ${dossiers.routes.total}</strong><small><span data-testid="routes-seen">${routes} 条已有足迹</span> · 查看六路</small></button>
      <button class="world-metric ${selectedMetricId === 'artifact-dossiers' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="artifact-dossiers" aria-pressed="${selectedMetricId === 'artifact-dossiers'}"><b>物件档案</b><strong data-testid="artifact-dossiers-count">${dossiers.artifacts.unlocked} / ${dossiers.artifacts.total}</strong><small>已入馆 / 关键异文总数 · 查看线索</small></button>
      <button class="world-metric ${selectedMetricId === 'endings' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="endings" aria-pressed="${selectedMetricId === 'endings'}"><b>已见结局</b><strong data-testid="endings-seen">${endings}</strong><small>结局之外还有余波 · 查看全部</small></button>
      <button class="world-metric next-hint ${selectedMetricId === 'next-stage' ? 'is-selected' : ''}" data-action="select-world-metric" data-id="next-stage" aria-pressed="${selectedMetricId === 'next-stage'}"><b>下一页何时显墨</b><strong>${world.nextHint || LORE_HINTS[stage]}</strong><small>墨迹未显 · 不剧透 · 查看缘由</small></button>
    </div>
    ${renderMetricDetail(meta, selectedMetricId, selectedMetricEntryId)}
    <div class="world-lore-archive">
      <div class="world-lore-section-heading"><div><p class="eyebrow">世界碎片</p><h3>${loreEntries.length > 7 ? '黑山旧案与空白卷宗' : '黑山旧案七页'}</h3></div><span>${loreEntries.filter((item) => item.status === 'confirmed').length} 已确认 · ${loreEntries.filter((item) => item.status === 'contested').length} 会证中</span></div>
      <div class="world-lore-grid">
        <nav class="world-lore-list" data-testid="world-lore-list" aria-label="世界卷宗故事条目">${loreList}</nav>
        ${renderLoreDetail(selected)}
      </div>
    </div>
    <div class="standalone-action"><button class="command primary" data-action="go-home" data-testid="world-back-home">返回首页</button></div>
  </section>`;
}
