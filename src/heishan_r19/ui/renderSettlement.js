import { primaryDaomai } from '../engine/runState.js';
import { FAMILIARITY_STAGES, familiarityStage } from '../data/lore.js';
import { assetRoleId, backgroundAssetStyle, SCENE_ASSETS } from '../data/assets.js';
import { getCharacter } from '../data/characters.js';
import { getRoute } from '../data/routes.js';
import { BLANK_DOSSIER_CHAPTER, RELATIONSHIPS, ROUTE_FRAGMENT_MAP, expansionStage } from '../data/expansionCanon.js';
import { blackMountainChapter, blankDossierChapter } from '../data/playerFacingWorld.js';
import { escapeHtml } from './view.js';

const HISTORY_TYPE_LABELS = Object.freeze({
  route: '路线',
  choice: '抉择',
  reward: '战利',
  combat: '战斗',
  recruit: '同行',
  tavern: '酒馆',
  rescue: '救援'
});

const RESOLUTION_LABELS = Object.freeze({
  enemy_hp_zero: '敌人生命归零',
  hero_dead: '主角生命归零',
  party_hp_zero: '队伍生命归零',
  pressure_collapse: '压力崩溃',
  prolonged_stalemate: '久战罢兵',
  boss_overwhelmed: '山门封合'
});

function resolutionNarrative(run, victory) {
  const route = getRoute(run.routeId);
  const routeRead = run.routeState || {};
  const evidence = (run.bossClues || []).length + (run.fulfillments || []).length;
  if (victory) {
    if (route.id === 'zhuoying') return `连续追痕锁住了同一目标，断名窗口在第 ${Math.max(1, Number(routeRead.trace || 1))} 层追击后打开；${evidence} 条旁证让这次处决没有只凭名单。`;
    if (route.id === 'guizang') return `归藏保存并重放了 ${Math.max(1, Number(routeRead.replayCount || 1))} 条已见规则；返还的代价被写进结算，没有被治疗收益掩盖。`;
    if (route.id === 'wuxiang') return `移印让敌势认错了 ${Math.max(1, Number(routeRead.transfers || 1))} 次目标；来源仍被保留，因此胜利没有把罪责悄悄转给无名者。`;
    return `${route.name}提供了本局所需的承压方式；${(run.oldCauses || []).length} 个旧因、${(run.fulfillments || []).length} 次应验与 ${(run.bossClues || []).length} 条破局线索共同支撑了终局。`;
  }
  const reason = RESOLUTION_LABELS[run.endedReason] || '准备不足';
  if (run.endedReason === 'second_dying') return '掌柜替你争来的喘息已经走完。你确实经过休整与补给，可旧伤仍不足以撑过后续敌势；第二次倒下时，酒馆的灯再也照不到这里。';
  if (run.endedReason === 'prolonged_stalemate') return '旧军号已经三次示警，双方仍无法改变血线与压力。再打下去只剩重复的伤口，于是山中响起罢兵钟，这一战以未分胜负落款。';
  return `${reason}。本局只带回已经发生的证据：${(run.oldCauses || []).length} 个旧因、${(run.bossClues || []).length} 条破局线索；未达成的应验不会被伪写成胜利。`;
}

function settlementUpdateRows(run, meta) {
  const expansion = meta.expansionProgress || {};
  const updates = expansion.lastSettlementUpdates || {};
  const relation = RELATIONSHIPS.find((item) => item.id === updates.relation);
  const fragment = BLANK_DOSSIER_CHAPTER.documents.find((item) => item.id === updates.fragment);
  const testimony = updates.character ? getCharacter(updates.character) : null;
  return [
    { label: '人物证词', value: testimony ? `${testimony.name} · 本局证词已归档` : '本局无新增' },
    { label: '会证关系', value: relation ? `${relation.title} · 推进一段` : '本局无新增' },
    { label: '卷宗碎片', value: fragment ? `${fragment.name} · 新增一名独立见证` : '本局无新增' }
  ].map((item) => `<div><span>${item.label}</span><b>${escapeHtml(item.value)}</b></div>`).join('');
}

export function renderSettlement(run, meta) {
  const primary = primaryDaomai(run);
  const record = meta.characterProgress?.[run.characterId] || { familiarity: 0 };
  const stage = familiarityStage(record.familiarity || 0);
  const victory = run.outcome === 'victory';
  const history = run.runHistory.slice(-7).map((entry) => {
    const type = HISTORY_TYPE_LABELS[entry.type] || '旧案';
    const title = entry.title || entry.name || entry.enemy || entry.label || '旧案记录';
    const detail = entry.immediateEffect || RESOLUTION_LABELS[entry.resolutionReason] || entry.cost || '';
    return `<li><span>${type}</span><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></li>`;
  }).join('');
  const settlementAsset = victory ? SCENE_ASSETS.partner : SCENE_ASSETS.archive;
  const futureStage = expansionStage(meta);
  const futureChapter = blankDossierChapter(futureStage.id);
  const currentChapter = blackMountainChapter(meta.worldProgress?.loreStage || 0);
  const fragmentId = ROUTE_FRAGMENT_MAP[run.routeId];
  const fragment = fragmentId ? meta.expansionProgress?.fragments?.[fragmentId] : null;
  const fragmentName = BLANK_DOSSIER_CHAPTER.documents.find((item) => item.id === fragmentId)?.name;
  return `<section class="settlement-screen" data-testid="screen-settlement" data-asset-role="${assetRoleId(settlementAsset)}" style="${backgroundAssetStyle(settlementAsset)}">
    <div class="settlement-verdict ${victory ? 'victory' : 'failure'}"><p class="eyebrow">此行落款</p><h2>${victory ? '带回被守住的一页' : run.endedReason === 'second_dying' ? '再无救援' : '败退回酒馆'}</h2><p>${victory ? '旧因、成势与破局线索在首领三重敌势中共同奏效。' : '见证簿已经记下缺失的准备，带回酒馆的旧案不会归零。'}</p></div>
    <div class="settlement-grid">
      <article><span>主修道脉</span><b>${primary.name} ${primary.value}</b><small>${primary.value >= 7 ? '入局·大成' : primary.value >= 3 ? '已经成势' : '尚未成势'}</small></article>
      <article><span>人物熟悉度</span><b data-testid="settlement-familiarity">${FAMILIARITY_STAGES[stage]} · ${record.familiarity || 0}</b><small>${run.characterName} 的档案已更新</small></article>
      <article><span>世界卷宗</span><b data-testid="settlement-lore-stage">${currentChapter.seal}</b><small>${meta.worldProgress?.nextHint || '仍有旧案残页'}</small></article>
      <article><span>破局记录</span><b>${run.bossClues.length} 条线索</b><small>${run.oldCauses.length} 个旧因 · ${run.debtMarks.length} 枚债印</small></article>
    </div>
    <section class="settlement-dossier" data-testid="settlement-dossier">
      <div><p class="eyebrow">这局为什么会这样</p><h3>${escapeHtml(getRoute(run.routeId).name)} · ${victory ? '成立' : '未能闭合'}</h3><p>${escapeHtml(resolutionNarrative(run, victory))}</p></div>
      <div><p class="eyebrow">这局确认了什么</p><h3>${fragmentName ? `${fragmentName} · ${fragment?.status === 'confirmed' ? '已确认' : '会证中'}` : futureChapter.seal}</h3><p>${fragmentName ? `当前已有 ${fragment?.witnesses?.length || 0} 名不同见证人；两名独立见证后才从“会证中”改为“已确认”。` : BLANK_DOSSIER_CHAPTER.uncertainty}</p></div>
    </section>
    <section class="settlement-update-cap" data-testid="settlement-update-cap"><header><b>带回酒馆的墨迹</b><span>酒馆一夜只收妥：人物一页 · 关系一笔 · 碎片一份</span></header>${settlementUpdateRows(run, meta)}</section>
    <ol class="settlement-history" data-testid="settlement-history">${history}</ol>
    <div class="settlement-actions"><button class="command primary" data-action="new-run">再入黑山</button><button class="command" data-action="open-archive">查看任务档案</button><button class="command" data-action="open-world">查看世界卷宗</button><button class="command" data-action="go-home">返回首页</button></div>
  </section>`;
}
