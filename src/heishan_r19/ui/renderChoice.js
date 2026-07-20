import { DAOMAI } from '../data/daomai.js';
import { CONSEQUENCE_ICONS } from '../data/assets.js';
import { image } from './view.js';
import { actionAvailabilityView } from './actionAvailabilityView.js';
import { renderCompactImpact } from './selectionImpactView.js';

function lineText(delta = {}) {
  return Object.entries(delta).map(([id, value]) => `${DAOMAI[id].name} +${value}`).join('、') || '不改变';
}

function consequenceLine(icon, label, value, className = '') {
  return `<span class="consequence-line ${className}">${image(icon, '', 'consequence-icon')}<span><b>${label}</b>${value}</span></span>`;
}

function consequenceSummaryLine(icon, label, value) {
  return `<div>${image(icon, '', 'consequence-icon')}<span><b>${label}</b><span>${value}</span></span></div>`;
}

function consequenceCard(run, entry, selected) {
  const availability = actionAvailabilityView(run, entry);
  const nextThresholdText = Object.entries(entry.daomai || {}).map(([id]) => `${DAOMAI[id].name} 将向下一层成势推进`).join('；');
  return `<button class="choice-card ${selected ? 'selected' : ''} ${availability.className}" data-action="select-choice" data-id="${entry.id}" data-testid="choice-card" aria-pressed="${selected}" ${availability.attributes}>
    <span class="choice-title">${entry.title}</span>
    ${consequenceLine(CONSEQUENCE_ICONS.immediate, '立即', entry.immediate)}
    ${consequenceLine(CONSEQUENCE_ICONS.daomai, '道脉', lineText(entry.daomai))}
    ${consequenceLine(CONSEQUENCE_ICONS.threshold, '成势将至', nextThresholdText || '保持当前节奏')}
    ${consequenceLine(CONSEQUENCE_ICONS.oldCause, '旧因', entry.oldCause)}
    ${consequenceLine(CONSEQUENCE_ICONS.fulfillment, '应验', entry.fulfillment)}
    ${consequenceLine(CONSEQUENCE_ICONS.debt, '债印', entry.debtMark || '无', entry.debtMark ? 'cost' : '')}
    ${consequenceLine(CONSEQUENCE_ICONS.clue, '破局线索', entry.bossClue || '尚未显明', 'clue')}
    ${availability.reasonHtml}
  </button>`;
}

export function renderChoice(run) {
  const set = run.choiceSet;
  const selected = set.options.find((entry) => entry.id === run.selectedChoiceId) || null;
  const selectionIsAvailable = selected ? actionAvailabilityView(run, selected).available : false;
  const cards = set.options.map((entry) => consequenceCard(run, entry, selectionIsAvailable && selected?.id === entry.id)).join('');
  return `<section class="node-screen" data-testid="screen-choice">
    <div class="screen-heading"><p class="eyebrow">山路抉择 · 第 ${run.nodeIndex + 1} 程</p><h2>${set.title}</h2><p>${set.prompt}</p></div>
    <div class="choice-grid selection-scroll">${cards}</div>
    <div class="sticky-action">
      <div class="selection-summary" aria-live="polite" aria-atomic="true"><span>${selectionIsAvailable ? `已选 · ${selected.title}` : '选择一项，旧因会进入本局记录'}</span><small>${selectionIsAvailable ? renderCompactImpact(run) : '选中后先预览准确变化；确认后才会生效并写入本局记录。'}</small></div>
      <button class="command primary" data-action="confirm-choice" data-testid="confirm-choice" ${selectionIsAvailable ? '' : 'disabled'}>确认选择</button>
    </div>
  </section>`;
}

export function renderConsequenceResult(run) {
  const result = run.lastConsequence;
  const daomai = Object.entries(result.daomai || {}).map(([id, value]) => `${DAOMAI[id].name} +${value}`).join('、') || '无变化';
  const thresholds = (result.thresholds || []).length ? result.thresholds.map((entry) => `${entry.line} ${entry.threshold} · ${entry.benefit}`).join('；') : '尚未跨过新阈值';
  return `<section class="result-screen" data-testid="screen-consequence-result">
    <div class="result-mark">应</div>
    <p class="eyebrow">选择已落定</p>
    <h2>${result.title}</h2>
    <div class="consequence-summary" data-testid="choice-consequence-card">
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.immediate, '立即', result.immediate)}
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.daomai, '道脉', daomai)}
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.threshold, '成势将至', thresholds)}
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.oldCause, '旧因', result.oldCause || '无')}
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.fulfillment, '应验', result.fulfillment || '后续节点中等待应验')}
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.debt, '债印', result.debtMark || '无')}
      ${consequenceSummaryLine(CONSEQUENCE_ICONS.clue, '破局线索', result.bossClue || '尚未显明')}
    </div>
    <button class="command primary result-continue" data-action="advance-node" data-testid="consequence-continue">继续前行</button>
  </section>`;
}
