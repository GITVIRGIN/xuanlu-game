import { DAOMAI, DAOMAI_IDS, nextThreshold } from '../data/daomai.js';
import { DEBT_SCORE_PENALTY_EACH, debtImpact } from '../data/debt.js';
import { getCharacter } from '../data/characters.js';
import { STATUS_ICONS } from '../data/assets.js';
import { selectionImpactPreview } from '../engine/selectionImpactPreview.js';
import { escapeHtml, image, meter } from './view.js';
import { renderTrace } from './renderTrace.js';
import { PARTY_LIMITS } from '../contracts/partyScale.js';

function phaseName(value) {
  return value >= 7 ? '大成' : value >= 3 ? '成势' : value ? '初凝' : '未起';
}

function projectedValue(change, current, format = String, testId = '') {
  const testAttribute = testId ? ` data-testid="${testId}"` : '';
  if (!change) return `<b${testAttribute}>${format(current)}</b>`;
  const beforeText = change.beforeText ?? format(change.before);
  const afterText = change.afterText ?? format(change.after);
  return `<b class="projected-number"${testAttribute} data-preview-before="${change.before}" data-preview-after="${change.after}"><del>${escapeHtml(beforeText)}</del><span aria-hidden="true">→</span><strong>${escapeHtml(afterText)}</strong></b>`;
}

function renderCollectionRows(changes) {
  return changes.map((change) => {
    const additions = change.added.map((value) => `<strong>获得 ${escapeHtml(value)}</strong>`).join('');
    const removals = change.removed.map((value) => `<del>失去 ${escapeHtml(value)}</del>`).join('');
    return `<li class="impact-collection-row" data-preview-collection="${change.id}"><span>${change.label}</span><b>${removals}${additions}</b></li>`;
  }).join('');
}

function renderImpactPreview(preview) {
  if (!preview) return '';
  const statRows = preview.statChanges.map((change) => `<li data-preview-stat="${change.id}"><span>${change.label}</span><b><del>${escapeHtml(change.beforeText)}</del><i aria-hidden="true">→</i><strong>${escapeHtml(change.afterText)}</strong></b>${change.capped ? '<small>已触及上限，本次实际增量受限</small>' : ''}</li>`).join('');
  const partnerRows = preview.partnerChanges.flatMap((partner) => partner.stats.map((change) => `<li data-preview-partner="${escapeHtml(partner.id)}" data-preview-partner-stat="${change.id}"><span>${escapeHtml(partner.name)} · ${change.label}</span><b><del>${escapeHtml(change.beforeText)}</del><i aria-hidden="true">→</i><strong>${escapeHtml(change.afterText)}</strong></b></li>`)).join('');
  const daomaiRows = preview.daomaiChanges.map((change) => `<li data-preview-daomai="${change.id}"><span>${change.label}道脉</span><b><del>${change.before}</del><i aria-hidden="true">→</i><strong>${change.after}</strong></b></li>`).join('');
  const identityRows = preview.identityChanges.map((change) => `<li data-preview-identity="${change.id}"><span>${change.label}</span><b><del>${escapeHtml(change.before)}</del><i aria-hidden="true">→</i><strong>${escapeHtml(change.after)}</strong></b></li>`).join('');
  const counterRows = preview.counterChanges.map((change) => `<li data-preview-counter="${change.id}"><span>${change.label}</span><b><del>${change.before}${change.suffix}</del><i aria-hidden="true">→</i><strong>${change.after}${change.suffix}</strong></b></li>`).join('');
  const collectionRows = renderCollectionRows(preview.collectionChanges);
  const thresholds = !preview.daomaiChanges.length
    ? ''
    : preview.crossed.length
      ? `<div class="preview-thresholds" data-testid="choice-impact-preview-thresholds">${preview.crossed.map((threshold) => `<span>成势 ${threshold.line} ${threshold.threshold} · ${threshold.benefit}</span>`).join('')}</div>`
      : '<small class="preview-no-threshold">本次不跨越新的成势门槛</small>';
  const rewardCompatibility = preview.kind === 'reward' ? '<span class="compatibility-marker" data-testid="reward-growth-preview" aria-hidden="true"></span>' : '';
  const destination = preview.destination ? `<p class="impact-destination">确认后进入 · ${escapeHtml(preview.destination)}</p>` : '';
  return `<section class="sidebar-section choice-impact-preview" data-testid="choice-impact-preview" data-impact-kind="${preview.kind}" aria-live="polite" aria-atomic="true">
    ${rewardCompatibility}
    <div class="section-title"><h3>确认后的变化</h3><span>尚未生效</span></div>
    <ul data-testid="choice-impact-preview-deltas">${identityRows}${statRows}${partnerRows}${daomaiRows}${counterRows}${collectionRows}</ul>
    ${thresholds}
    ${destination}
  </section>`;
}

export function renderSidebar(run) {
  if (!run) return '';
  const character = getCharacter(run.characterId || run.selectedCharacterId || 'shen-li');
  const revealedCombatState = run.view === 'combat'
    ? run.combat?.result?.logs?.[run.combat.logIndex]?.afterState
    : null;
  const displayedStats = revealedCombatState
    ? {
        ...run.stats,
        hp: revealedCombatState.heroHp,
        maxHp: revealedCombatState.heroMaxHp,
        armor: revealedCombatState.heroArmor,
        pressure: revealedCombatState.pressure
      }
    : run.stats;
  const preview = selectionImpactPreview(run);
  const previewStats = new Map((preview?.statChanges || []).map((change) => [change.id, change]));
  const previewDaomai = new Map((preview?.daomaiChanges || []).map((change) => [change.id, change]));
  const previewCounters = new Map((preview?.counterChanges || []).map((change) => [change.id, change]));
  const displayedReviveSeals = revealedCombatState?.reviveSeals ?? run.reviveSeals ?? 0;
  const debt = debtImpact(run.debtMarks || []);
  const debtChange = preview?.collectionChanges.find((change) => change.id === 'debtMarks') || null;
  const projectedDebtCount = debt.count + (debtChange?.added.length || 0) - (debtChange?.removed.length || 0);
  const projectedDebtPenalty = projectedDebtCount * DEBT_SCORE_PENALTY_EACH;
  const daomaiRows = DAOMAI_IDS.map((id) => {
    const value = run.daomai[id] || 0;
    const projected = previewDaomai.get(id);
    const shownValue = projected?.after ?? value;
    const next = nextThreshold(shownValue);
    return `<button type="button" class="daomai-row ${projected ? 'is-previewed' : ''}" data-action="open-run-detail" data-id="${id}" data-daomai-id="${id}" data-testid="daomai-row" aria-label="查看${DAOMAI[id].name}道脉逐阶效果"${projected ? ` data-preview-before="${value}" data-preview-after="${shownValue}"` : ''}>
      <div><b>${DAOMAI[id].name}</b><span${projected ? ' data-testid="daomai-preview-row"' : ''}>${projected ? `${phaseName(value)} ${value} → ${phaseName(shownValue)} ${shownValue}` : `${phaseName(value)} · ${value}`}</span></div>
      ${meter(shownValue, 7, `daomai line-${id} ${projected ? 'preview-meter' : ''}`, '', `${DAOMAI[id].name} 道脉${projected ? '选择预览' : ''}`)}
      <small>${projected?.crossed.length ? `将成势 · ${projected.crossed.map((threshold) => threshold.benefit).join('、')}` : next ? `距 ${next} 还差 ${Math.max(0, next - shownValue)} · ${DAOMAI[id].benefits[next]}` : '入局·大成'}</small>
    </button>`;
  }).join('');
  const previewPartners = new Map((preview?.partnerChanges || []).map((partner) => [partner.id, partner]));
  const revealedPartners = new Map((revealedCombatState?.partners || []).map((partner) => [partner.id, partner]));
  const partners = run.partners.length
    ? run.partners.map((partner, index) => {
        const shown = revealedPartners.get(partner.id) || partner;
        const projected = previewPartners.get(partner.id);
        const changes = new Map((projected?.stats || []).map((change) => [change.id, change]));
        const hpChange = changes.get('hp');
        const maxHp = hpChange?.afterMax ?? shown.maxHp ?? partner.maxHp;
        const baseHp = shown.hp ?? shown.maxHp ?? partner.maxHp;
        const displayedHp = hpChange?.after ?? baseHp;
        const joinOrder = shown.joinOrder || index + 1;
        const state = displayedHp <= 0 ? '倒地' : run.view === 'combat' ? '在阵' : '待命';
        return `<article class="partner-status-card ${projected ? 'is-previewed' : ''} ${displayedHp <= 0 ? 'is-downed' : ''}" data-partner-id="${escapeHtml(partner.id)}" data-testid="sidebar-partner-card" aria-label="同行第 ${joinOrder} 位 ${escapeHtml(partner.name)}，生命 ${displayedHp}/${maxHp}，${state}">
          <div class="partner-status-head">
            ${image(partner.asset, partner.name, 'partner-thumb')}
            <span class="partner-status-identity"><b>${escapeHtml(partner.name)}</b><small>${escapeHtml(partner.role)}</small></span>
            <em class="partner-status-badge">${state}</em>
          </div>
          <div class="partner-status-life"><span>生命</span>${projectedValue(hpChange, baseHp, (value) => `${value}/${maxHp}`, 'sidebar-partner-hp')}</div>
          ${meter(displayedHp, maxHp, `partner-sidebar-hp ${displayedHp <= 0 ? 'is-empty' : ''} ${projected ? 'preview-meter' : ''}`, 'sidebar-partner-hp-bar', `${partner.name}生命`)}
          <div class="partner-status-stats"><span>护甲 ${projectedValue(changes.get('armor'), shown.armor ?? 0)}</span><span>伤害 ${projectedValue(changes.get('damage'), shown.damage ?? partner.damage ?? 0)}</span></div>
          <small class="partner-status-position">同行第 ${joinOrder} 位 · ${displayedHp <= 0 ? '无法行动' : '每轮执行自身基础行动'}</small>
        </article>`;
      }).join('')
    : '<p class="muted">尚无同行者，可在酒馆招募。</p>';
  return `<aside class="run-sidebar" data-testid="run-sidebar" aria-label="本局状态">
    <div class="sidebar-scroll" data-testid="sidebar-scroll">
      <section class="sidebar-section party-status">
        <div class="section-title"><h3>队伍 · ${character.name}</h3><span>${run.routeName || '尚未选路'}</span></div>
        <div class="status-line ${previewStats.has('hp') ? 'is-previewed' : ''}"><span>${image(STATUS_ICONS.life, '', 'status-icon')}血量</span>${projectedValue(previewStats.get('hp'), displayedStats.hp, (value) => `${value}/${displayedStats.maxHp}`, 'sidebar-hero-hp')}</div>
        ${meter(previewStats.get('hp')?.after ?? displayedStats.hp, previewStats.get('hp')?.afterMax ?? displayedStats.maxHp, `hp ${previewStats.has('hp') ? 'preview-meter' : ''}`, '', '队伍生命')}
        <div class="status-grid"><span class="${previewStats.has('armor') ? 'is-previewed' : ''}">${image(STATUS_ICONS.armor, '', 'status-icon')}护甲 ${projectedValue(previewStats.get('armor'), displayedStats.armor)}</span><span class="${previewStats.has('damage') ? 'is-previewed' : ''}">${image(STATUS_ICONS.damage, '', 'status-icon')}伤害 ${projectedValue(previewStats.get('damage'), displayedStats.damage)}</span><span class="${previewStats.has('pressure') ? 'is-previewed' : ''}">${image(STATUS_ICONS.pressure, '', 'status-icon')}压力 ${projectedValue(previewStats.get('pressure'), displayedStats.pressure, (value) => `${value}/10`)}</span><span class="${previewStats.has('clues') ? 'is-previewed' : ''}">${image(STATUS_ICONS.clue, '', 'status-icon')}线索 ${projectedValue(previewStats.get('clues'), displayedStats.clues)}</span></div>
        ${meter(previewStats.get('pressure')?.after ?? displayedStats.pressure, 10, `pressure ${previewStats.has('pressure') ? 'preview-meter' : ''}`, '', '队伍压力')}
        <div class="rescue-charge ${previewCounters.has('rescueCharges') ? 'is-previewed' : ''}">${image(STATUS_ICONS.rescue, '', 'status-icon')}濒死救援 ${projectedValue(previewCounters.get('rescueCharges'), run.rescueCharges, (value) => `${value} 次`, 'rescue-charge-count')}</div>
        <div class="revive-seal-count ${previewCounters.has('reviveSeals') ? 'is-previewed' : ''}" data-testid="revive-seal-count">${image(STATUS_ICONS.revive, '', 'status-icon')}扶魂符 ${projectedValue(previewCounters.get('reviveSeals'), displayedReviveSeals, (value) => `${value} 枚`, 'sidebar-revive-seals')}<small>主角可放弃攻击，救起倒地同行者</small></div>
        <button type="button" class="debt-summary ${debtChange ? 'is-previewed' : ''}" data-action="open-run-detail" data-id="debt" data-testid="debt-summary" aria-label="查看债印来由与后果"${debtChange ? ` data-preview-before="${debt.count}" data-preview-after="${projectedDebtCount}"` : ''}><span>债印 ${debtChange ? `<del>${debt.count}</del><i aria-hidden="true">→</i><strong>${projectedDebtCount}</strong>` : debt.count} 枚</span><b>破局把握 ${debtChange ? `${debt.scorePenalty ? `-${debt.scorePenalty}` : '0'} → -${projectedDebtPenalty}` : debt.scorePenalty ? `-${debt.scorePenalty}` : '未受损'}</b><small>${debtChange ? '确认后记入旧账；尚未生效' : '查看来由与后果'}</small></button>
      </section>
      ${renderImpactPreview(preview)}
      <section class="sidebar-section"><div class="section-title"><h3>同行伙伴</h3><span>${run.partners.length}/${PARTY_LIMITS.maxPartners}</span></div>${partners}</section>
      <section class="sidebar-section daomai-section" data-testid="daomai-panel">
        <div class="section-title"><h3>道脉</h3><span>1 / 3 / 5 / 7</span></div>${daomaiRows}
      </section>
      ${renderTrace(run)}
    </div>
  </aside>`;
}
