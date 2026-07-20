import { getCharacter } from '../data/characters.js';
import { availableCharacterIds, INITIAL_CHARACTER_IDS, RELATIONSHIPS } from '../data/expansionCanon.js';
import { FAMILIARITY_STAGES, familiarityStage } from '../data/lore.js';
import { assetRoleId, backgroundAssetStyle, SCENE_ASSETS } from '../data/assets.js';
import { VISUAL_ATLAS } from '../data/visualAtlas.js';
import { image, meter } from './view.js';

function upgradeText(stage) {
  return [
    '名页尚未落墨',
    '可阅人物背景与最近行迹',
    '入山时多携一条破局线索',
    '专属旧因更容易在山路显形',
    '主修道脉入山即添一缕',
    '大成结局的卷页已经显墨'
  ][stage];
}

function cutoutCard(item, tier) {
  return `<article class="atlas-cutout ${tier}" data-testid="atlas-cutout" data-atlas-role="${item.id}">
    ${image(item.asset, item.name, 'atlas-cutout-image', { loading: 'lazy' })}
    <div><b>${item.name}</b><span>${tier === 'boss' ? '首领' : tier === 'elite' ? '精英原型' : '普通原型'}</span><small>${item.description}</small></div>
  </article>`;
}

function sceneCard(item, kind) {
  return `<article class="atlas-scene" role="img" aria-label="${item.name}：${item.description}" data-testid="atlas-scene" data-asset-role="${assetRoleId(item.asset)}">
    ${image(item.asset, '', 'atlas-scene-image', { loading: 'lazy' })}
    <span><b>${item.name}</b><small>${kind} · ${item.description}</small></span>
  </article>`;
}

function symbolCard(item) {
  return `<article class="atlas-symbol" data-testid="atlas-symbol" data-atlas-role="${item.id}">
    ${image(item.asset, '', 'atlas-symbol-image', { loading: 'lazy' })}<span><b>${item.name}</b><small>${item.description}</small></span>
  </article>`;
}

export function renderArchive(meta) {
  const progress = meta.characterProgress || {};
  const availableIds = availableCharacterIds(meta);
  const cards = availableIds.map((characterId) => getCharacter(characterId)).map((character) => {
    const record = progress[character.id] || {};
    const points = record?.familiarity || 0;
    const stage = familiarityStage(points);
    const introducedByArrival = !INITIAL_CHARACTER_IDS.includes(character.id);
    const unlocked = introducedByArrival || Boolean(points > 0 || record.keyStorySeen > 0);
    if (!unlocked) {
      return `<article class="archive-character locked" data-testid="archive-character" data-unlocked="false">
        <div class="locked-portrait">${character.name.slice(0, 1)}</div><div><b>未知档案</b><span>未识 · 墨迹未显</span><small>等这名执灯人真正入山，酒馆才会为其添页。</small></div>
      </article>`;
    }
    return `<article class="archive-character" data-testid="archive-character" data-unlocked="true">
      ${image(character.asset, character.name, 'archive-portrait')}
      <div class="archive-copy"><div class="archive-head"><b>${character.name}</b><span data-testid="familiarity-stage">${FAMILIARITY_STAGES[stage]} · ${points}</span></div>
        ${meter(points, 15, 'familiarity', '', `${character.name} 熟悉度`)}
        <p><b class="archive-epithet">${character.epithet}</b>${character.line}</p>
        <dl><div><dt>人物旧案</dt><dd>${record.keyStorySeen || 0}/${record.keyStoryTotal || 5}</dd></div><div><dt>相熟所得</dt><dd>${upgradeText(stage)}</dd></div><div><dt>最近一次</dt><dd>${record.lastRunSummary || '尚无摘要'}</dd></div><div><dt>旧因 / 应验</dt><dd>${(record.oldCausesSeen || []).join('、') || '尚无记录'}</dd></div><div><dt>相关首领 / 破局线索</dt><dd>${(record.bossCluesSeen || []).join('、') || '尚未发现'}</dd></div></dl>
      </div>
    </article>`;
  }).join('');
  const relationshipCards = RELATIONSHIPS
    .filter((relationship) => relationship.characters.every((id) => availableIds.includes(id)))
    .map((relationship) => {
      const level = Math.max(0, Math.min(4, Number(meta.expansionProgress?.relationProgress?.[relationship.id] || 0)));
      const names = relationship.characters.map((id) => getCharacter(id).name).join(' × ');
      const current = level ? relationship.steps[level - 1] : '尚未在同一局中形成会证。';
      const next = level < 4 ? relationship.steps[level] : '四段关系已经归档。';
      return `<article class="relationship-card" data-testid="relationship-card" data-relationship-id="${relationship.id}" data-level="${level}">
        <div><span>${names}</span><b>${relationship.title}</b><em>${level}/4</em></div>
        ${meter(level, 4, 'relationship', '', `${relationship.title} 关系进度 ${level}/4`)}
        <p>${current}</p><small>${level < 4 ? `下一段 · ${next}` : next}</small>
      </article>`;
    }).join('');
  const ordinary = VISUAL_ATLAS.ordinary.map((item) => cutoutCard(item, 'ordinary')).join('');
  const elite = VISUAL_ATLAS.elite.map((item) => cutoutCard(item, 'elite')).join('');
  const bosses = VISUAL_ATLAS.bosses.map((item) => cutoutCard(item, 'boss')).join('');
  const scenes = VISUAL_ATLAS.scenes.map((item) => sceneCard(item, '场景')).join('');
  const routes = VISUAL_ATLAS.routes.map((item) => sceneCard(item, '路线')).join('');
  const symbols = [
    ...VISUAL_ATLAS.statusSymbols,
    ...VISUAL_ATLAS.consequenceSymbols,
    ...VISUAL_ATLAS.tavernSymbols,
    ...VISUAL_ATLAS.combatSymbols
  ].map(symbolCard).join('');
  return `<section class="archive-screen" data-testid="screen-task-archive" data-asset-role="${assetRoleId(SCENE_ASSETS.archive)}" style="${backgroundAssetStyle(SCENE_ASSETS.archive)}">
    <div class="archive-heading"><p class="eyebrow">酒馆见证簿</p><h2>任务档案 · 人物熟悉度</h2><p>相熟只会多一页线索、一点入山照应，不会替你受伤或取胜。</p></div>
    <div class="archive-grid" data-testid="character-familiarity-list">${cards}</div>
    <section class="relationship-archive" data-testid="relationship-archive">
      <div class="atlas-heading"><p class="eyebrow">一人所见不能替众人落款</p><h3>会证关系 · ${relationshipCards ? '已显形' : '尚未显形'}</h3><p>同行会逐段经过冲突、合作、路线分歧与最终见证；每次归馆至多添一笔。</p></div>
      <div class="relationship-grid">${relationshipCards || '<p class="metric-empty">空白卷宗中的见证人尚未入馆。</p>'}</div>
    </section>
    <div class="visual-atlas" data-testid="visual-atlas">
      <section class="atlas-section" aria-labelledby="atlas-enemy-title">
        <div class="atlas-heading"><p class="eyebrow">只录轮廓，不揭前路</p><h3 id="atlas-enemy-title">异闻图谱</h3><p>图谱不显示本局未来节点顺序，也不公开首领数值解法。</p></div>
        <h4>普通异闻 · 8 类</h4><div class="atlas-cutout-grid">${ordinary}</div>
        <h4>精英异闻 · 6 类</h4><div class="atlas-cutout-grid">${elite}</div>
        <h4>首领剪影 · 3 名</h4><div class="atlas-cutout-grid boss-grid">${bosses}</div>
      </section>
      <section class="atlas-section" aria-labelledby="atlas-scene-title">
        <div class="atlas-heading"><p class="eyebrow">场景语义</p><h3 id="atlas-scene-title">山中图志</h3><p>背景只说明地点气质，不提前揭示未走到的节点类型。</p></div>
        <div class="atlas-scene-grid">${scenes}${routes}</div>
      </section>
      <section class="atlas-section" aria-labelledby="atlas-symbol-title">
        <div class="atlas-heading"><p class="eyebrow">文字与形状双通道</p><h3 id="atlas-symbol-title">行动与反馈图例</h3><p>颜色只作辅助；每个符号始终保留中文名称与说明。</p></div>
        <div class="atlas-symbol-grid">${symbols}</div>
      </section>
    </div>
    <div class="standalone-action"><button class="command primary" data-action="go-home" data-testid="archive-back-home">返回首页</button></div>
  </section>`;
}
