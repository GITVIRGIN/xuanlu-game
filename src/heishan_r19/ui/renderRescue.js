import { assetRoleId, backgroundAssetStyle, SCENE_ASSETS } from '../data/assets.js';
import { actionAvailabilityView } from './actionAvailabilityView.js';
import { renderCompactImpact } from './selectionImpactView.js';

function rescuePacingCopy(pacing) {
  if (!pacing) return {
    title: '掌柜已替你改过山路',
    body: '离店后先循灯记退到能包扎与辨路的落脚处。追兵不会凭空出现在门外，也不会因为这次救援多出一场恶战。'
  };
  if (pacing.nextHostileIndex < 0) return {
    title: '前路已没有紧追的敌声',
    body: '掌柜只把你送回仍有灯火的山路；这次救援不会凭空招来新的追兵。'
  };
  if (pacing.insertionCount > 0) {
    if (pacing.stage === 'early') return {
      title: '先离血路，再谈下一战',
      body: '掌柜把你引向药龛、旧案与可歇脚的灯火。伤口收住以前，刚才那样的敌势不会紧跟着压上来。'
    };
    if (pacing.stage === 'mid') return {
      title: '山路已经转向撤路灯记',
      body: '你会先经过旧案落脚处，再找到一份撤路补给。等阵脚真正稳住，后面的精锐才可能追得上。'
    };
    return {
      title: '山顶只肯让出一段喘息',
      body: '围猎已经看得见，掌柜仍替你争来一次整甲、饮药和重认方向的机会；那之后才是写在前方的恶战。'
    };
  }
  return {
    title: '前路已有足够的灯火',
    body: '现成的旧案、补给与落脚处足够让你收住伤势。掌柜不会另添敌势，也不会把你直接推回同样凶险的战斗。'
  };
}

export function renderRescue(run) {
  const state = run.rescueState;
  if (state.phase === 'result') {
    const promise = rescuePacingCopy(run.pendingRescuePacing);
    return `<section class="rescue-screen" data-testid="screen-rescue-tavern" data-asset-role="${assetRoleId(SCENE_ASSETS.tavern)}" style="${backgroundAssetStyle(SCENE_ASSETS.tavern)}"><div class="rescue-copy"><p class="eyebrow">救援已施</p><h2>命悬一线，账已记下</h2><p data-testid="rescue-result">${state.resultText}</p><div class="rescue-pacing-promise" data-testid="rescue-pacing-promise"><b>${promise.title}</b><span>${promise.body}</span><small>这笔人情只保你免于立刻再战。若你亲手招来追兵，或山顶围猎早已写在路上，酒馆也不能替你抹掉后果。</small></div><div class="rescue-count">本局救援剩余 <b data-testid="rescue-charges">${run.rescueCharges}</b> 次</div><button class="command primary" data-action="continue-rescue" data-testid="rescue-continue">循灯记撤离</button></div></section>`;
  }
  const options = state.options.map((option) => {
    const availability = actionAvailabilityView(run, option);
    const selected = availability.available && state.selectedId === option.id;
    return `<button class="rescue-option ${selected ? 'selected' : ''} ${availability.className}" data-action="select-rescue" data-id="${option.id}" data-testid="rescue-option" aria-pressed="${selected}" ${availability.attributes}><b>${option.title}</b><span>${option.description}</span>${availability.reasonHtml}</button>`;
  }).join('');
  const selected = state.options.find((option) => option.id === state.selectedId) || null;
  const selectionIsAvailable = selected ? actionAvailabilityView(run, selected).available : false;
  return `<section class="rescue-screen" data-testid="screen-rescue-tavern" data-asset-role="${assetRoleId(SCENE_ASSETS.tavern)}" style="${backgroundAssetStyle(SCENE_ASSETS.tavern)}"><div class="rescue-copy"><p class="eyebrow">濒死脱离 · 黑山酒馆救援</p><h2>一救，从来不是免费的</h2><p>当前救援剩余 <b data-testid="rescue-charges">${run.rescueCharges}</b> 次。选择代价后先预览，确认才会扣除。</p><div class="rescue-options">${options}</div></div><div class="sticky-action rescue-confirm-bar" data-testid="rescue-action-bar"><div class="selection-summary" aria-live="polite" aria-atomic="true"><span>${selectionIsAvailable ? `已选 · ${selected.title}` : '请选择一种救援代价'}</span><small>${selectionIsAvailable ? renderCompactImpact(run) : '选中后可预览恢复、资源损失与债印。'}</small></div><button class="command primary" data-action="confirm-rescue" data-testid="confirm-rescue" ${selectionIsAvailable ? '' : 'disabled'}>确认救援</button></div></section>`;
}
