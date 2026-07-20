import { FORMAL_SCREEN_SCENARIOS } from '../heishan_r19/ui/formalScreenRegistry.js';
import { renderApp } from '../heishan_r19/ui/renderApp.js';
import { formalScreenFixture } from '../heishan_r19/testing/formalScreenFixture.js';

const form = document.querySelector('#review-control');
const select = document.querySelector('#review-scenario');
const app = document.querySelector('#app');
const params = new URLSearchParams(location.search);
const requestedScenario = params.get('scenario');

globalThis.__R20_SCREEN_REVIEW__ = {
  ready: false,
  pageErrors: [],
  requestFailures: []
};

function syncAuditDataset() {
  document.documentElement.dataset.auditPageErrors = JSON.stringify(globalThis.__R20_SCREEN_REVIEW__.pageErrors);
  document.documentElement.dataset.auditRequestFailures = JSON.stringify(globalThis.__R20_SCREEN_REVIEW__.requestFailures);
}
syncAuditDataset();

globalThis.addEventListener('error', (event) => {
  const target = event.target;
  if (target instanceof HTMLImageElement || target instanceof HTMLLinkElement || target instanceof HTMLScriptElement) {
    globalThis.__R20_SCREEN_REVIEW__.requestFailures.push(target.currentSrc || target.href || target.src || 'unknown-resource');
    syncAuditDataset();
    return;
  }
  globalThis.__R20_SCREEN_REVIEW__.pageErrors.push(event.message || 'window-error');
  syncAuditDataset();
}, true);
globalThis.addEventListener('unhandledrejection', (event) => {
  globalThis.__R20_SCREEN_REVIEW__.pageErrors.push(String(event.reason?.message || event.reason || 'unhandled-rejection'));
  syncAuditDataset();
});

select.innerHTML = FORMAL_SCREEN_SCENARIOS
  .map((scenario) => `<option value="${scenario.id}">${scenario.id}</option>`)
  .join('');
if (requestedScenario && FORMAL_SCREEN_SCENARIOS.some((scenario) => scenario.id === requestedScenario)) {
  select.value = requestedScenario;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const context = formalScreenFixture(select.value);
    document.body.dataset.reduceMotion = context.preferences.reduceMotion ? 'true' : 'false';
    app.innerHTML = renderApp({ ...context, releaseLabel: 'R20 · 注册表审查' });
    app.dataset.ready = 'true';
    app.dataset.page = context.page;
    app.dataset.runView = context.run?.view || 'none';
    app.dataset.screenId = context.screenIdentity.screenId;
    app.dataset.screenVariant = context.screenIdentity.variant;
    app.dataset.screenScenario = context.screenIdentity.scenarioId;
    form.hidden = true;
    globalThis.__R20_SCREEN_REVIEW__.ready = true;
    globalThis.__R20_SCREEN_REVIEW__.scenarioId = context.screenIdentity.scenarioId;
    document.documentElement.dataset.auditReady = 'true';
  } catch (error) {
    globalThis.__R20_SCREEN_REVIEW__.pageErrors.push(error.message || String(error));
    syncAuditDataset();
    form.querySelector('[data-testid="review-error"]').textContent = error.stack || String(error);
  }
});
