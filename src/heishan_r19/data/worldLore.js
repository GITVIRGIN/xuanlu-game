import { loreStage } from './lore.js';
import { EXPANSION_ARRIVALS, normalizeExpansionProgress } from './expansionCanon.js';

const entry = (value) => Object.freeze(value);

export const WORLD_LORE_ENTRIES = Object.freeze([
  entry({
    id: 'yaoming-juan',
    title: '妖名卷',
    stage: 1,
    lead: '卷上被改写的并不只是名字。',
    lockedLead: '旧军印旁有一页被刮去姓名的卷册。',
    core: '妖名卷不是记录妖的名字，而是把名字写成妖。',
    confirmed: '被写入卷册的人，会被官府、宗门与斩妖司的旧制一并判作妖患。旧案中的“误判”更像是有人预先改写了分类。',
    related: '沈砺 · 闻扶乩 · 斩妖旧案',
    evidence: ['妖身上出现不属于妖的符纹。', '斩妖旧案与其他账册出现相同卷宗编号。']
  }),
  entry({
    id: 'leiqi-zhang',
    title: '雷契账',
    stage: 2,
    lead: '雷契能被转移，天罚也会照账册落下。',
    lockedLead: '一页账纸只有债目，没有完整债主。',
    core: '雷不是绝对的天罚；雷契可以被改写、转移、延迟、买走。',
    confirmed: '无雷之夜并非雷迟到，而是契约被调走。陆青箓听见的旧声，也可能来自被写进雷中的档案。',
    related: '赤遥 · 陆青箓 · 无雷之夜',
    evidence: ['雷声并非每次都来自天上。', '黑山账册中留有“雷契失效”的记录。']
  }),
  entry({
    id: 'fengshan-ling',
    title: '封山令',
    stage: 2,
    lead: '那道命令先在卷宗里划出了门内门外。',
    lockedLead: '旧军令上，门内与门外被两种墨色分开。',
    core: '封山令不是单纯防妖，而是决定谁在门内、谁在门外。',
    confirmed: '被写成门外之人者，可以在旧制中被合法放弃。岳沉碑背负的并非一纸临时军令，而是一次早已落档的人群划分。',
    related: '岳沉碑 · 玄狱 · 旧军残阵',
    evidence: ['封山令划出的，是谁可以被放弃。', '门内门外的写法与镇门旧约互相对应。']
  }),
  entry({
    id: 'heishan-canlu',
    title: '黑山残箓',
    stage: 3,
    lead: '山不是藏着档案，山本身就是那份坏掉的档案。',
    lockedLead: '地下闷雷里夹着一句没说完的口供。',
    core: '黑山不是藏着真相；黑山本身就是被写坏的真相。',
    confirmed: '旧案证词、死者遗言与失败记录被写进残箓，黑山因此像一座会呼吸的档案库。地下雷声可能是被封存的口供，而非天意。',
    related: '陆青箓 · 闻扶乩 · 雷中旧名',
    evidence: ['黑山深处有来自地下的雷声。', '残留声音反复警告“别译完”。']
  }),
  entry({
    id: 'zhenmen-jiuyue',
    title: '镇门旧约',
    stage: 4,
    lead: '门不只是地点，也是一种把存在封存出世界账册的方式。',
    lockedLead: '残碑背面只剩“门后”二字。',
    core: '门不是地点，而是一种封存方式。',
    confirmed: '旧约试图重新定义“门”：被封存者不仅关在某处，也可能从世界的记录里被移走。玄狱与门后囚徒的旧案因此相连。',
    related: '玄狱 · 岳沉碑 · 门后囚徒',
    evidence: ['山君身上留有镇山锁痕。', '黑山可能不是门后之物，而是门本身长出的妖。']
  }),
  entry({
    id: 'silujian-jiuyin',
    title: '司箓监旧印',
    stage: 5,
    lead: '多份旧案上的残印，最终拼成同一个官署。',
    lockedLead: '多份旧案边角有同一枚残印，印文仍缺。',
    core: '黑山账页、残箓、封山令和妖名卷上，都有同一枚旧印：司箓监校。',
    confirmed: '旧制中的司箓监不斩妖、不问罪，只把不合秩序的人与事写进“正确”的册子。顾无咎曾任司箓监掌籍官。',
    related: '六名主角旧案 · 顾无咎 · 黑山疑案',
    evidence: ['三名不同主角的黑山深层旧案互相印证。', '旧印必须由跨人物证据拼合，首领首胜不能替代。']
  }),
  entry({
    id: 'xuanlu-canye',
    title: '玄箓残页',
    stage: 6,
    lead: '残页不直接杀人，却能让被相信的记录反过来改变现实。',
    lockedLead: '旧印之后还有一页未明来历的玄箓。',
    core: '顾无咎使用的不是普通符箓，而是玄箓残页。',
    confirmed: '残页改变记录；当记录足够古老、权威并被众人相信，现实会顺着记录改变。它的完整来历仍未解开。',
    related: '六名主角旧案 · 黑山归档实验 · 后续玄箓体系',
    evidence: ['司箓监旧印指向更大的玄箓体系。', '本阶段只确认残页存在与作用，不揭示其完整来源。']
  })
]);

const EXPANSION_LORE_ENTRIES = Object.freeze([
  entry({
    id: 'empty-name-writ',
    title: '空名牒',
    stage: 'F',
    arrivalId: EXPANSION_ARRIVALS.F.id,
    lead: '收件人仍然活着，死讯却先一步抵达。',
    lockedLead: '这一页要先由活着的收件人亲自带进酒馆。',
    core: '空名牒能够先写下死亡，再让沿途账册把活人逐步抹成“已经不存在”。',
    confirmed: '目前只能确认九封死讯都早于死亡，并且沿途驿册会随送达逐站改写；执笔者、原本收件人和第十封状态仍未定论。',
    related: '苏雁回 · 逐影断名 · 第十封死讯',
    evidence: ['九名收件人在死讯送达时仍有活证。', '被改写的不是一处账册，而是一条送达路径。']
  }),
  entry({
    id: 'reverse-fate-ledger',
    title: '逆命簿',
    stage: 'G',
    arrivalId: EXPANSION_ARRIVALS.G.id,
    lead: '死期早于病症；删去一个名字，空栏会补上另一个。',
    lockedLead: '这一册病案尚未进入酒馆会证。',
    core: '逆命簿并非简单预言死亡，而是把治疗收益与未获同意的代偿一并归档。',
    confirmed: '已经确认至少一次“救治”把代价转写给无名者；是否每次改命都必然代偿、空栏由谁选择，仍需更多互相冲突的病案。',
    related: '白蘅 · 万象归藏 · 代偿知情',
    evidence: ['病案日期与症状发生顺序相反。', '剪去死期后，另一页出现同墨新名。']
  }),
  entry({
    id: 'changing-face-playbill',
    title: '易面戏单',
    stage: 'H',
    arrivalId: EXPANSION_ARRIVALS.H.id,
    lead: '翻页时，演员姓名会被戏中罪名替换。',
    lockedLead: '这一份戏单尚未在多人见证下翻开。',
    core: '易面戏单能把角色、罪名和他人对身份的记忆一并移印，却不能替当事人决定她选择留下的名字。',
    confirmed: '柳寄声的出生名仍未找回，也不被当作通关奖励；当前确认的是自报名姓可以在多人见证下抵住一次改写。戏单来源仍是未证实假说。',
    related: '柳寄声 · 无相移印 · 自报名姓',
    evidence: ['同一戏单在不同见证者手中显示不同罪名。', '多人同时复述“柳寄声”时，戏单有一瞬无法改写。']
  })
]);

function includesAny(values, terms) {
  return (values || []).some((value) => terms.some((term) => String(value).includes(term)));
}

export function hasStageEAccess(meta) {
  const characterProgress = Object.values(meta?.characterProgress || {});
  return characterProgress.filter((progress) => Number(progress?.keyStorySeen || 0) >= 4).length >= 3;
}

export function worldLoreUnlocks(meta) {
  const world = meta?.worldProgress || {};
  const stage = loreStage(world);
  const routes = new Set(world.routesSeen || []);
  const corpus = [
    ...(world.oldCausesFound || []),
    ...(world.fulfillmentsSeen || []),
    ...(world.bossCluesFound || []),
    ...(world.truthFragments || [])
  ];
  const stageE = hasStageEAccess(meta);
  return Object.freeze({
    'yaoming-juan': stage >= 1 || includesAny(corpus, ['妖名', '旧军']),
    'leiqi-zhang': routes.has('leixue') || includesAny(corpus, ['雷契', '雷']),
    'fengshan-ling': routes.has('xuanjia') || includesAny(corpus, ['封山', '旧军']),
    'heishan-canlu': stage >= 3 && (routes.has('leixue') || (world.truthFragments || []).length > 0 || includesAny(corpus, ['残箓', '黑山'])),
    'zhenmen-jiuyue': routes.has('zhenyu') || includesAny(corpus, ['镇门', '门后']),
    'silujian-jiuyin': stageE,
    'xuanlu-canye': stageE
  });
}

export function worldLoreEntryStates(meta) {
  const unlocks = worldLoreUnlocks(meta);
  const base = WORLD_LORE_ENTRIES.map((item) => Object.freeze({
    ...item,
    status: unlocks[item.id] ? 'confirmed' : 'unknown',
    unlocked: Boolean(unlocks[item.id])
  }));
  const expansion = normalizeExpansionProgress(meta?.expansionProgress);
  const visibleExpansion = EXPANSION_LORE_ENTRIES
    .filter((item) => expansion.acknowledgedArrivals.includes(item.arrivalId))
    .map((item) => {
      const fragment = expansion.fragments[item.id] || { status: 'unknown', witnesses: [] };
      const witnessCount = fragment.witnesses.length;
      return Object.freeze({
        ...item,
        status: fragment.status,
        unlocked: fragment.status !== 'unknown',
        evidence: Object.freeze([
          ...item.evidence,
          witnessCount ? `已有 ${witnessCount} 名不同执灯人把这份卷宗带回结算。` : '尚缺一次完成本局后的独立见证。'
        ])
      });
    });
  return [...base, ...visibleExpansion];
}

export function worldLoreEntryState(meta, id) {
  return worldLoreEntryStates(meta).find((item) => item.id === id) || null;
}
