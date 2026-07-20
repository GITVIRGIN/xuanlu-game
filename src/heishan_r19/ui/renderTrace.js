import { trace } from '../engine/runState.js';

const GLYPHS = { choice: '案', reward: '赏', combat: '战', elite: '精', tavern: '酒', boss: '王', settlement: '结' };

export function renderTrace(run) {
  const model = trace(run);
  if (!model.started) {
    return `<section class="sidebar-section trace-section" data-testid="trace-panel" data-started="false">
      <div class="section-title"><h3>行踪</h3><span>尚未入山</span></div>
      <p class="muted">选人与选路不计入行踪。</p>
    </section>`;
  }
  const nodes = [
    ...model.visited.map((node) => `<span class="trace-node visited" data-kind="${node.kind}" title="${node.title}">${GLYPHS[node.kind] || '事'}</span>`),
    ...model.current.map((node) => `<span class="trace-node current risk-${node.risk}" data-kind="${node.kind}" title="当前 · ${node.title}">${GLYPHS[node.kind] || '事'}</span>`),
    ...model.future.map((node) => `<span class="trace-node unknown risk-${node.risk}" data-risk="${node.risk}" title="前路未知">?</span>`)
  ].join('<i class="trace-link"></i>');
  return `<section class="sidebar-section trace-section" data-testid="trace-panel" data-started="true">
    <div class="section-title"><h3>行踪</h3><span>前路未明</span></div>
    <div class="trace-scroll" data-testid="trace-scroll">${nodes}</div>
    <div class="trace-counts" aria-label="行踪计数">
      <span>已过 <b data-testid="trace-visited-count">${model.visited.length}</b></span>
      <span>当前 <b data-testid="trace-current-count">${model.current.length}</b></span>
      <span>未知 <b data-testid="trace-future-count">${model.future.length}</b></span>
    </div>
  </section>`;
}
