import { renderHome } from './renderHome.js';
import { renderCharacterSelect } from './renderCharacterSelect.js';
import { renderRouteSelect } from './renderRouteSelect.js';
import { renderSidebar } from './renderSidebar.js';
import { renderChoice, renderConsequenceResult } from './renderChoice.js';
import { renderReward } from './renderReward.js';
import { renderTavern } from './renderTavern.js';
import { renderCombat } from './renderCombat.js';
import { renderArchive } from './renderArchive.js';
import { renderWorldProgress } from './renderWorldProgress.js';
import { renderSettlement } from './renderSettlement.js';
import { renderRescue } from './renderRescue.js';
import { renderSettings } from './renderSettings.js';
import { renderRunDetail } from './renderRunDetail.js';
import { resolveFormalScreen } from './formalScreenRegistry.js';

function header(run) {
  return `<header class="app-header"><button class="brand-button" data-action="go-home" aria-label="返回首页"><span class="brand-seal" aria-hidden="true">黑</span><span><b>黑山酒馆</b><small>旧案未结</small></span></button>${run ? `<div class="header-run" aria-label="当前角色与路线"><span>${run.characterName || '未选主角'}</span><i aria-hidden="true"></i><span>${run.routeName || '未选路线'}</span></div><button class="icon-command" data-action="restart-run" title="重开一局" aria-label="重开一局">↻</button>` : ''}</header>`;
}

function runLayout(content, run) {
  return `${header(run)}<div class="run-layout"><main id="main-content" class="main-stage" tabindex="-1">${content}</main>${renderSidebar(run)}</div>`;
}

const FORMAL_SCREEN_RENDERERS = Object.freeze({
  home: ({ meta, releaseLabel, run }) => renderHome(meta, releaseLabel, run),
  archive: ({ meta }) => `${header(null)}<main id="main-content" tabindex="-1">${renderArchive(meta)}</main>`,
  world: ({ meta, worldLoreSelectionId, worldMetricSelectionId, worldMetricEntrySelectionId }) => `${header(null)}<main id="main-content" tabindex="-1">${renderWorldProgress(meta, worldLoreSelectionId, worldMetricSelectionId, worldMetricEntrySelectionId)}</main>`,
  settings: ({ preferences }) => `${header(null)}<main id="main-content" tabindex="-1">${renderSettings(preferences)}</main>`,
  'run-detail': ({ run, runDetailId }) => `${header(run)}<main id="main-content" tabindex="-1">${renderRunDetail(run, runDetailId)}</main>`,
  'character-select': ({ run }) => runLayout(renderCharacterSelect(run), run),
  'route-select': ({ run }) => runLayout(renderRouteSelect(run), run),
  choice: ({ run }) => runLayout(renderChoice(run), run),
  consequence: ({ run }) => runLayout(renderConsequenceResult(run), run),
  reward: ({ run }) => runLayout(renderReward(run), run),
  tavern: ({ run }) => runLayout(renderTavern(run, false), run),
  'boss-pre-tavern': ({ run }) => runLayout(renderTavern(run, true), run),
  combat: ({ run }) => runLayout(renderCombat(run), run),
  rescue: ({ run }) => runLayout(renderRescue(run), run),
  settlement: ({ run, meta }) => `${header(run)}<main id="main-content" tabindex="-1">${renderSettlement(run, meta)}</main>`
});

export const BOUND_FORMAL_RENDERER_IDS = Object.freeze(Object.keys(FORMAL_SCREEN_RENDERERS));

export function renderApp(context) {
  const normalized = { releaseLabel: 'R19', ...context };
  const identity = normalized.screenIdentity || resolveFormalScreen(normalized);
  const renderer = FORMAL_SCREEN_RENDERERS[identity.rendererId];
  if (!renderer) throw new Error(`Formal screen renderer is not bound: ${identity.rendererId}`);
  return renderer(normalized);
}
