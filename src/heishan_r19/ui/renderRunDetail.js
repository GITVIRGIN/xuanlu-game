import { currentThreshold, DAOMAI, DAOMAI_IDS, THRESHOLDS } from '../data/daomai.js';
import { DEBT_RULE, debtImpact } from '../data/debt.js';
import { calculateBossPreparation } from '../engine/combatEngine.js';
import { escapeHtml, meter } from './view.js';

function phaseName(threshold) {
  return threshold >= 7 ? '大成' : threshold >= 3 ? '成势' : threshold >= 1 ? '初凝' : '未起';
}

function detailNavigation(selectedId) {
  const debt = `<button class="run-detail-nav-item ${selectedId === 'debt' ? 'is-selected' : ''}" data-action="open-run-detail" data-id="debt" aria-pressed="${selectedId === 'debt'}"><b>债印</b><span>代价与临门破局折损</span></button>`;
  const lines = DAOMAI_IDS.map((id) => `<button class="run-detail-nav-item ${selectedId === id ? 'is-selected' : ''}" data-action="open-run-detail" data-id="${id}" aria-pressed="${selectedId === id}"><b>${DAOMAI[id].name}</b><span>${DAOMAI[id].direction}</span></button>`).join('');
  return `<nav class="run-detail-nav" aria-label="本局规则详情">${debt}${lines}</nav>`;
}

function renderDebt(run) {
  const debt = debtImpact(run.debtMarks || []);
  const preparation = calculateBossPreparation(run);
  const marks = debt.marks.length
    ? debt.marks.map((mark) => `<li><span>${escapeHtml(mark.name)}</span><b>${mark.count} 枚 · 破局把握 -${mark.count * DEBT_RULE.scorePenaltyEach}</b></li>`).join('')
    : '<li class="is-empty"><span>本局尚无债印</span><b>不折损破局把握</b></li>';
  return `<article class="run-rule-detail debt-rule-detail" data-testid="run-detail-debt">
    <p class="eyebrow">本局负面账目</p><h2 tabindex="-1">债印账册</h2>
    <p class="run-detail-lead">债印记录你为力量付出的延后代价。它不会暗扣血量，却会让首领门前少一分破局把握。</p>
    <div class="debt-formula" data-testid="debt-score-formula">
      <span>当前 ${debt.count} 枚</span><strong>${debt.count} × ${DEBT_RULE.scorePenaltyEach} = 破局把握 -${debt.scorePenalty}</strong>
      <small>${DEBT_RULE.appliesAt}</small>
    </div>
    <div class="debt-score-flow" aria-label="债印折损前后的破局把握">
      <span>未计债印 <b>${preparation.score + debt.scorePenalty}</b></span><i aria-hidden="true">→</i><span>当前把握 <b>${preparation.score}</b></span>
    </div>
    <section><h3>本局债印明细</h3><ul class="rule-ledger" data-testid="debt-mark-list">${marks}</ul></section>
    <section class="rule-note"><h3>不会发生什么</h3><p>${DEBT_RULE.immediateRule}</p></section>
    <section class="rule-note"><h3>如何清除</h3><p>${DEBT_RULE.clearingRule}</p></section>
  </article>`;
}

function renderDaomai(run, id) {
  const line = DAOMAI[id];
  const value = Number(run.daomai?.[id] || 0);
  const active = currentThreshold(value);
  const stages = THRESHOLDS.map((threshold) => {
    const stage = line.stages[threshold];
    const unlocked = value >= threshold;
    const current = active === threshold;
    return `<article class="daomai-stage-card ${unlocked ? 'is-unlocked' : 'is-locked'} ${current ? 'is-current' : ''}" data-testid="daomai-stage" data-threshold="${threshold}" data-stage-state="${current ? 'current' : unlocked ? 'unlocked' : 'locked'}">
      <div><span>${threshold} · ${phaseName(threshold)}</span>${current ? '<b>当前成势</b>' : unlocked ? '<b>已生效</b>' : `<b>还差 ${threshold - value}</b>`}</div>
      <h3>${escapeHtml(stage.title)}</h3><p>${escapeHtml(stage.mechanic)}</p>
    </article>`;
  }).join('');
  return `<article class="run-rule-detail daomai-rule-detail" data-testid="run-detail-daomai" data-daomai-id="${id}">
    <p class="eyebrow">道脉成势次第</p><h2 tabindex="-1">道脉详解 · ${line.name}</h2>
    <div class="daomai-detail-summary">
      <div><span>本局进度</span><strong>${value}/7 · ${phaseName(active)}</strong>${meter(value, 7, `daomai line-${id}`, '', `${line.name}道脉进度`)}</div>
      <div><span>构筑方向</span><strong>${escapeHtml(line.direction)}</strong><small>短板：${escapeHtml(line.weakness)}</small></div>
    </div>
    <p class="run-detail-lead">道脉在 1 / 3 / 5 / 7 处依次初凝、成势、精进、大成；停在 2、4、6 时沿用上一重已经显形的效果。</p>
    <div class="daomai-stage-grid" data-testid="daomai-stage-grid">${stages}</div>
  </article>`;
}

export function renderRunDetail(run, selectedId = 'debt') {
  const normalized = selectedId === 'debt' || DAOMAI_IDS.includes(selectedId) ? selectedId : 'debt';
  return `<section class="run-detail-screen" data-testid="screen-run-detail" data-detail-id="${normalized}">
    <header class="run-detail-heading"><div><p class="eyebrow">规则可查询 · 数值即结算</p><h1>本局规则详情</h1></div><button class="command primary" data-action="close-run-detail" data-testid="run-detail-back">返回本局</button></header>
    <div class="run-detail-layout">${detailNavigation(normalized)}${normalized === 'debt' ? renderDebt(run) : renderDaomai(run, normalized)}</div>
  </section>`;
}
