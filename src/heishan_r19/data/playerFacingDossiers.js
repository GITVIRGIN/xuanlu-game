import { ALL_CANON_CHARACTERS } from './characters.js';
import {
  BLANK_DOSSIER_CHAPTER,
  EXPANSION_ARRIVALS,
  INITIAL_CHARACTER_IDS,
  INITIAL_ROUTE_IDS,
  normalizeExpansionProgress
} from './expansionCanon.js';
import { ALL_CANON_ROUTES } from './routes.js';

const freeze = (value) => Object.freeze(value);

const UNLOCK_CLUES = Object.freeze({
  'empty-name-writ': '让三名执灯人的黑山旧案各写到第四页，并至少带回一场胜局。回到酒馆时，留意一封比死亡更早抵达的回牒，并亲自确认来客。',
  'reverse-fate-ledger': '先迎苏雁回与逐影断名入馆；让苏雁回的旧案写到第二页，再由另一名执灯人见证空名牒，并在逐影断名的尽头护住一名活证人。',
  'changing-face-playbill': '先迎白蘅与万象归藏入馆；让白蘅的旧案写到第二页，带回两份彼此冲突的记录，并让擅长封镇或照心的伙伴共同见证万象归藏。'
});

const LOCKED_CHARACTER_PREMISE = Object.freeze({
  'su-yanhui': '一名总比死讯更早抵达的追牒客，正循着被驿册抹去的收件人追进黑山。',
  'bai-heng': '一名拒绝让获救者看不见代价的缀命医，随身带着一册会自行补名的病簿。',
  'liu-jisheng': '一名坚持亲自决定留下何种名字的借名伶，仍在寻找可以共同作证的人。'
});

const LOCKED_ROUTE_PREMISE = Object.freeze({
  zhuoying: '一条沿死讯与活证追索真凶的山路；追得越紧，越要记得名单也可能撒谎。',
  guizang: '一条把冲突记录并排保存的山路；被留下的不只收益，也包括真实发生的代价。',
  wuxiang: '一条借相、移印并追问姓名归属的山路；每次换面都必须有人记得来处与去向。'
});

const arrivalGroups = Object.freeze(Object.values(EXPANSION_ARRIVALS).map((arrival) => {
  const character = ALL_CANON_CHARACTERS.find((entry) => entry.id === arrival.unlockCharacterId);
  const route = ALL_CANON_ROUTES.find((entry) => entry.id === arrival.unlockRouteId);
  const document = BLANK_DOSSIER_CHAPTER.documents.find((entry) => entry.id === arrival.fragmentId);
  return freeze({ arrival, character, route, document, clue: UNLOCK_CLUES[arrival.fragmentId] });
}));

function groupForCharacter(id) {
  return arrivalGroups.find((group) => group.character?.id === id) || null;
}

function groupForRoute(id) {
  return arrivalGroups.find((group) => group.route?.id === id) || null;
}

function groupForDocument(id) {
  return arrivalGroups.find((group) => group.document?.id === id) || null;
}

function detail(eyebrow, title, quote, sections, media = null, locked = false) {
  return freeze({
    eyebrow,
    title,
    quote,
    sections: Object.freeze(sections.map((section) => freeze(section))),
    media: media ? freeze(media) : null,
    locked
  });
}

function item(id, label, kicker, summary, entryDetail, unlocked) {
  return freeze({ id, label, kicker, summary, detail: entryDetail, unlocked });
}

function characterEntry(character, progress) {
  const unlocked = progress.unlockedCharacterIds.includes(character.id);
  const group = groupForCharacter(character.id);
  const initial = INITIAL_CHARACTER_IDS.includes(character.id);
  const entryDetail = unlocked
    ? detail(
      '人物档案 · 已入馆',
      `${character.name} · ${character.epithet}`,
      character.line,
      [
        { title: '入山本领', body: `${character.role}。${character.unique}` },
        { title: '他所背负的旧案', body: character.line },
        { title: '仍在追问', body: character.question }
      ],
      { kind: 'character', asset: character.asset, alt: `${character.name}人物立绘`, locked: false }
    )
    : detail(
      '人物档案 · 尚未入馆',
      `${character.name} · ${character.epithet}`,
      LOCKED_CHARACTER_PREMISE[character.id] || '这名执灯人的名字已经显墨，但尚无人能为其来历作证。',
      [
        { title: '目前能辨认的线索', body: LOCKED_CHARACTER_PREMISE[character.id] || character.question },
        { title: '人物解锁线索', body: group?.clue || '让更多人物旧案、路线见证与结局在酒馆互相会证。' },
        { title: '与此人同时显墨', body: group ? `${group.route.name} · ${group.document.name}` : '入馆后才会补上对应卷页。' }
      ],
      { kind: 'character', asset: character.asset, alt: `${character.name}人物剪影`, locked: true },
      true
    );
  return item(
    `character:${character.id}`,
    `${character.name} · ${character.epithet}`,
    unlocked ? (initial ? '初始在册' : '已入馆') : '尚未入馆',
    unlocked ? character.role : (LOCKED_CHARACTER_PREMISE[character.id] || '姓名已显，来历待证。'),
    entryDetail,
    unlocked
  );
}

function routeEntry(route, progress, world) {
  const unlocked = progress.unlockedRouteIds.includes(route.id);
  const walked = (world.routesSeen || []).includes(route.id);
  const group = groupForRoute(route.id);
  const initial = INITIAL_ROUTE_IDS.includes(route.id);
  const entryDetail = unlocked
    ? detail(
      `路线档案 · ${walked ? '已有足迹' : '已入馆待见证'}`,
      route.name,
      route.question,
      [
        { title: '这条路给你的', body: route.gain },
        { title: '选择它要舍下的', body: route.sacrifice },
        { title: '沿路会面对什么', body: route.risk }
      ],
      { kind: 'route', asset: route.asset, alt: `${route.name}路线场景`, locked: false }
    )
    : detail(
      '路线档案 · 尚未入馆',
      route.name,
      LOCKED_ROUTE_PREMISE[route.id] || route.question,
      [
        { title: '这条路正在追问', body: route.question },
        { title: '路线解锁线索', body: group?.clue || '让更多人物旧案、路线见证与结局在酒馆互相会证。' },
        { title: '与此路同时显墨', body: group ? `${group.character.name} · ${group.document.name}` : '入馆后才会补上对应卷页。' }
      ],
      { kind: 'route', asset: route.asset, alt: `${route.name}路线残影`, locked: true },
      true
    );
  return item(
    `route:${route.id}`,
    route.name,
    unlocked ? (walked ? '已有足迹' : initial ? '初始入馆' : '已入馆') : '尚未入馆',
    unlocked ? route.question : (LOCKED_ROUTE_PREMISE[route.id] || '路名已显，山门未开。'),
    entryDetail,
    unlocked
  );
}

function witnessNames(ids) {
  return ids.map((id) => ALL_CANON_CHARACTERS.find((entry) => entry.id === id)?.name || '未署名见证人');
}

function artifactEntry(document, progress) {
  const record = progress.fragments[document.id];
  const unlocked = record.status !== 'unknown';
  const group = groupForDocument(document.id);
  const witnesses = witnessNames(record.witnesses);
  const status = record.status === 'confirmed' ? '已经会证' : record.status === 'contested' ? '会证中' : '尚未入馆';
  const entryDetail = unlocked
    ? detail(
      `物件档案 · ${status}`,
      document.name,
      document.lead,
      [
        { title: '卷宗所记', body: document.lead },
        { title: '当前见证', body: witnesses.length ? `${witnesses.join('、')}已经留下落款。` : '异文已经入馆，仍等待执灯人留下独立落款。' },
        { title: '它牵出的路', body: `${group?.route?.name || '一条尚未显墨的路线'}与${group?.character?.name || '一名尚未入馆者'}会在这份异文上相遇。它是关键卷宗物件，不是本局消耗品。` }
      ],
      { kind: 'artifact', label: document.name, locked: false }
    )
    : detail(
      '物件档案 · 尚未入馆',
      document.name,
      document.lead,
      [
        { title: '目前留下的传闻', body: document.lead },
        { title: '异文入馆线索', body: group?.clue || '让更多人物旧案、路线见证与结局在酒馆互相会证。' },
        { title: '与此物同时显墨', body: group ? `${group.character.name} · ${group.route.name}` : '入馆后才会补上对应卷页。' }
      ],
      { kind: 'artifact', label: document.name, locked: true },
      true
    );
  return item(
    `artifact:${document.id}`,
    document.name,
    status,
    document.lead,
    entryDetail,
    unlocked
  );
}

export function dossierCatalogs(meta) {
  const progress = normalizeExpansionProgress(meta?.expansionProgress);
  const world = meta?.worldProgress || {};
  const characters = Object.freeze(ALL_CANON_CHARACTERS.map((character) => characterEntry(character, progress)));
  const routes = Object.freeze(ALL_CANON_ROUTES.map((route) => routeEntry(route, progress, world)));
  const artifacts = Object.freeze(BLANK_DOSSIER_CHAPTER.documents.map((document) => artifactEntry(document, progress)));
  return freeze({
    characters: freeze({ unlocked: characters.filter((entry) => entry.unlocked).length, total: characters.length, items: characters }),
    routes: freeze({ unlocked: routes.filter((entry) => entry.unlocked).length, total: routes.length, walked: routes.filter((entry) => entry.detail.eyebrow.includes('已有足迹')).length, items: routes }),
    artifacts: freeze({ unlocked: artifacts.filter((entry) => entry.unlocked).length, total: artifacts.length, items: artifacts })
  });
}

export const DOSSIER_TOTALS = Object.freeze({
  characters: ALL_CANON_CHARACTERS.length,
  routes: ALL_CANON_ROUTES.length,
  artifacts: BLANK_DOSSIER_CHAPTER.documents.length
});
