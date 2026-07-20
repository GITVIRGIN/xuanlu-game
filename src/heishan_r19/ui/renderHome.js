import { assetRoleId, backgroundAssetStyle, SCENE_ASSETS } from '../data/assets.js';
import { expansionStage, pendingExpansionArrival } from '../data/expansionCanon.js';
import { blackMountainChapter, blankDossierChapter } from '../data/playerFacingWorld.js';
import { escapeHtml } from './view.js';

export function renderHome(meta, releaseLabel = 'R19', activeRun = null) {
  const world = meta.worldProgress || {};
  const stage = world.loreStage || 0;
  const futureStage = expansionStage(meta);
  const currentChapter = blackMountainChapter(stage);
  const futureChapter = blankDossierChapter(futureStage.id);
  const arrival = pendingExpansionArrival(meta);
  const canResume = activeRun && activeRun.view !== 'settlement';
  const resumeProgress = activeRun?.nodeIndex >= 0
    ? `山路第 ${activeRun.nodeIndex + 1} 程 · 共 ${activeRun.sequence.length} 程`
    : activeRun?.view === 'route-select' ? '待选路线' : '待选主角';
  const resumeIdentity = [activeRun?.characterName, activeRun?.routeName].filter(Boolean).join(' · ') || '尚未落款';
  return `<main id="main-content" class="home-scene" tabindex="-1" data-testid="screen-home" data-asset-role="${assetRoleId(SCENE_ASSETS.home)}" style="${backgroundAssetStyle(SCENE_ASSETS.home)}">
    <div class="home-scrim"></div>
    <header class="home-brand">
      <span class="brand-seal" aria-hidden="true">黑</span>
      <div><h1>黑山酒馆</h1><p>旧案未结，酒火还亮</p></div>
    </header>
    <div class="home-offer">
      <p class="eyebrow">执灯人入山 · 旧案重开</p>
      <h2>带回被守住的一页</h2>
      <p>从山门下的第一盏灯出发。你的道脉会成势，旧因会在首领面前应验。</p>
      <div class="home-progress" aria-label="世界卷宗摘要">
        <span>黑山旧案 <b>${escapeHtml(currentChapter.seal)}</b></span>
        <span>空白卷宗 <b>${escapeHtml(futureChapter.title)}</b></span>
        <span>旧因 <b>${(world.oldCausesFound || []).length}</b></span>
        <span>破局线索 <b>${(world.bossCluesFound || []).length}</b></span>
      </div>
      ${arrival ? `<article class="home-arrival" data-testid="expansion-arrival" data-arrival-id="${arrival.id}">
        <p class="eyebrow">${escapeHtml(arrival.eyebrow)}</p><h3>${escapeHtml(arrival.title)}</h3>
        <p>${escapeHtml(arrival.body)}</p><blockquote>${escapeHtml(arrival.quote)}</blockquote>
        <div><span>先见证入馆事件，人物与路线才会进入下一局名册。</span><button class="command primary" data-action="acknowledge-expansion" data-id="${arrival.id}" data-testid="acknowledge-expansion">确认见证</button></div>
      </article>` : ''}
      ${canResume ? `<div class="home-resume" data-testid="active-run-card"><div><span>未完的一局</span><strong>${escapeHtml(resumeIdentity)}</strong><small>${escapeHtml(resumeProgress)} · 自动存档已就绪</small></div><button class="command primary" data-action="continue-run" data-testid="btn-continue-run">继续前行</button></div>` : ''}
      <nav class="home-actions" aria-label="首页操作">
        <button class="command primary" data-action="new-run" data-testid="btn-new-run">开始新局</button>
        <button class="command" data-action="open-archive" data-testid="btn-task-archive">任务档案</button>
        <button class="command" data-action="open-world" data-testid="btn-world-progress">世界卷宗</button>
        <button class="icon-command" data-action="open-settings" data-testid="btn-settings" aria-label="设置" title="设置">⚙</button>
      </nav>
    </div>
    <div class="home-case-note">
      <span>当前档案</span>
      <strong>${world.nextHint || '踏入黑山，揭开第一桩旧案。'}</strong>
    </div>
  </main>`;
}
