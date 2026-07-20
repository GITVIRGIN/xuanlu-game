import { charactersForRun } from '../data/characters.js';
import { image, meter } from './view.js';
import { renderCompactImpact } from './selectionImpactView.js';

export function renderCharacterSelect(run) {
  const roster = charactersForRun(run);
  const rosterMaxHp = Math.max(...roster.map((character) => character.maxHp));
  const cards = roster.map((character) => {
    const selected = run.selectedCharacterId === character.id;
    return `<button class="selection-card character-card ${selected ? 'selected' : ''}" data-action="select-character" data-id="${character.id}" data-testid="character-card" aria-pressed="${selected}">
      ${image(character.asset, character.name, 'character-portrait')}
      <span class="selection-copy">
        <span class="selection-title"><b>${character.name}<small>${character.epithet ? ` · ${character.epithet}` : ''}</small></b><em>${character.role}</em></span>
        ${character.visualKey ? `<span class="character-visual-key">形貌 · ${character.visualKey}</span>` : ''}
        <span class="selection-line">${character.line}</span>
        <span class="mini-stats"><span>血 ${character.maxHp}</span><span>甲 ${character.armor}</span><span>伤 ${character.damage}</span></span>
        <span class="character-life-scale" data-testid="character-life-scale"><span>初始生命 ${character.maxHp}</span><small>名册最高 ${rosterMaxHp}</small></span>
        ${meter(character.maxHp, rosterMaxHp, 'hp compact character-initial-hp', 'character-initial-hp', `${character.name} 初始生命 ${character.maxHp}，名册最高 ${rosterMaxHp}`)}
      </span>
    </button>`;
  }).join('');
  const selected = roster.find((character) => character.id === run.selectedCharacterId);
  return `<section class="selection-screen" data-testid="screen-character-select">
    <div class="screen-heading"><p class="eyebrow">第一步 · 执灯人</p><h2>选择主角</h2><p>人物差异决定开局血线、护甲与第一条道脉方向。</p></div>
    <div class="selection-scroll ${roster.length > 6 ? 'is-expanded-roster' : ''}" id="character-grid" data-testid="character-grid" data-roster-size="${roster.length}">${cards}</div>
    <div class="sticky-action" data-testid="character-action-bar">
      <div class="selection-summary" aria-live="polite" aria-atomic="true"><span>${selected ? `已选择 · ${selected.name}` : '请选择一位主角'}</span><small>${selected ? renderCompactImpact(run) : '执灯名册仍待落印；选中后可预览完整开局状态'}</small></div>
      <button class="command primary" data-action="confirm-character" data-testid="confirm-character" ${selected ? '' : 'disabled'}>确认入局</button>
    </div>
  </section>`;
}
