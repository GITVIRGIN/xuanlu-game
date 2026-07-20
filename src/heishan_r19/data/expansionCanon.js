export const EXPANSION_CONTENT_VERSION = 1;

export const INITIAL_CHARACTER_IDS = Object.freeze([
  'shen-li',
  'yue-chenbei',
  'lu-qinglu',
  'chi-yao',
  'wen-fuji',
  'xuan-yu'
]);

export const EXPANSION_CHARACTER_IDS = Object.freeze(['su-yanhui', 'bai-heng', 'liu-jisheng']);
export const ALL_CHARACTER_IDS = Object.freeze([...INITIAL_CHARACTER_IDS, ...EXPANSION_CHARACTER_IDS]);

export const INITIAL_ROUTE_IDS = Object.freeze(['xuanjia', 'leixue', 'zhenyu']);
export const EXPANSION_ROUTE_IDS = Object.freeze(['zhuoying', 'guizang', 'wuxiang']);
export const ALL_ROUTE_IDS = Object.freeze([...INITIAL_ROUTE_IDS, ...EXPANSION_ROUTE_IDS]);

export const DESIGN_RUNTIME_ID_MAP = Object.freeze({
  char_shenli: 'shen-li',
  char_yuechenbei: 'yue-chenbei',
  char_luqinglu: 'lu-qinglu',
  char_chiyao: 'chi-yao',
  char_wenfuji: 'wen-fuji',
  char_xuanyu: 'xuan-yu',
  char_suyanhui: 'su-yanhui',
  char_baiheng: 'bai-heng',
  char_liujisheng: 'liu-jisheng',
  route_physical_shell: 'xuanjia',
  route_spell_bleed: 'leixue',
  route_control_shell: 'zhenyu',
  route_physical_trace: 'zhuoying',
  route_spell_archive: 'guizang',
  route_control_imprint: 'wuxiang'
});

export const BLANK_DOSSIER_CHAPTER = Object.freeze({
  id: 'blank-dossier',
  title: '空白卷宗',
  premise: '当天下只相信卷宗，一个人要怎样证明自己活过、自己是谁，以及谁有资格作证？',
  uncertainty: '旧印残效、仿造者、幸存实验与司箓监残部都仍是未证实假说。',
  documents: Object.freeze([
    Object.freeze({ id: 'empty-name-writ', name: '空名牒', lead: '收件人仍活着，死讯却先一步抵达。', routeId: 'zhuoying' }),
    Object.freeze({ id: 'reverse-fate-ledger', name: '逆命簿', lead: '死亡日期早于症状，删去一个名字会让空栏补上另一个。', routeId: 'guizang' }),
    Object.freeze({ id: 'changing-face-playbill', name: '易面戏单', lead: '每次翻开，演员姓名都会被戏中罪名替换。', routeId: 'wuxiang' })
  ])
});

export const EXPANSION_STAGES = Object.freeze({
  E: Object.freeze({ id: 'E', title: '黑山余波', question: '旧案已经结算，但旧印是否真的停止运作？' }),
  F: Object.freeze({ id: 'F', title: '回牒入馆', question: '活人收到死讯时，谁先保护作证者？' }),
  G: Object.freeze({ id: 'G', title: '逆命旁证', question: '救下一人时，代偿被写到了谁身上？' }),
  H: Object.freeze({ id: 'H', title: '易面证词', question: '名字被改写以后，谁有权确认当事人是谁？' }),
  I: Object.freeze({ id: 'I', title: '九人会证', question: '彼此冲突的证词能否共同保住一个人的存在？' }),
  J: Object.freeze({ id: 'J', title: '旧印新墨', question: '旧式归档技术仍在运作，但执笔者究竟是谁？' })
});

export const EXPANSION_ARRIVALS = Object.freeze({
  F: Object.freeze({
    id: 'arrival-empty-name-writ',
    stage: 'F',
    eyebrow: '空白卷宗 · 第一封回牒',
    title: '收件人还活着',
    body: '酒馆收到一封写着苏雁回死讯的空名牒。她本人紧随信使入门，要求先找回被卷宗抹去的九名活人。',
    quote: '活着的人，不需要先由卷宗批准。',
    unlockCharacterId: 'su-yanhui',
    unlockRouteId: 'zhuoying',
    fragmentId: 'empty-name-writ'
  }),
  G: Object.freeze({
    id: 'arrival-reverse-fate-ledger',
    stage: 'G',
    eyebrow: '空白卷宗 · 第二份旁证',
    title: '死期早于病症',
    body: '白蘅带来一册逆命簿：她曾剪去一名病人的死期，同夜另一个空栏却自行补上了名字。',
    quote: '我可以救人，但不能替病人偷偷决定由谁代偿。',
    unlockCharacterId: 'bai-heng',
    unlockRouteId: 'guizang',
    fragmentId: 'reverse-fate-ledger'
  }),
  H: Object.freeze({
    id: 'arrival-changing-face-playbill',
    stage: 'H',
    eyebrow: '空白卷宗 · 第三名证人',
    title: '戏单把名字改成罪名',
    body: '易面戏单当众改写在场者姓名。柳寄声摘下面具，自报名姓，并要求伙伴只见证她主动选择的名字。',
    quote: '我不等卷宗还我出生名；柳寄声就是我要留下的名字。',
    unlockCharacterId: 'liu-jisheng',
    unlockRouteId: 'wuxiang',
    fragmentId: 'changing-face-playbill'
  })
});

export const ROUTE_FRAGMENT_MAP = Object.freeze({
  zhuoying: 'empty-name-writ',
  guizang: 'reverse-fate-ledger',
  wuxiang: 'changing-face-playbill'
});

export const STRONG_CHARACTER_ROUTE_MATRIX = Object.freeze({
  'shen-li': Object.freeze({ xuanjia: 'S', zhuoying: 'P' }),
  'yue-chenbei': Object.freeze({ xuanjia: 'P', zhenyu: 'S', zhuoying: 'S' }),
  'lu-qinglu': Object.freeze({ leixue: 'S', guizang: 'P' }),
  'chi-yao': Object.freeze({ leixue: 'P', guizang: 'S' }),
  'wen-fuji': Object.freeze({ zhenyu: 'S', wuxiang: 'P' }),
  'xuan-yu': Object.freeze({ xuanjia: 'S', zhenyu: 'P', wuxiang: 'S' }),
  'su-yanhui': Object.freeze({ xuanjia: 'S', zhuoying: 'P' }),
  'bai-heng': Object.freeze({ leixue: 'S', guizang: 'P' }),
  'liu-jisheng': Object.freeze({ zhenyu: 'S', wuxiang: 'P' })
});

const relation = (id, left, right, title, conflict, cooperation, routeConflict, witness) => Object.freeze({
  id, characters: Object.freeze([left, right]), title,
  steps: Object.freeze([conflict, cooperation, routeConflict, witness])
});

export const RELATIONSHIPS = Object.freeze([
  relation('broken-blade-stone', 'shen-li', 'yue-chenbei', '断锋立碑', '刀要追责，碑先记名。', '共同守住一名活证人。', '追凶与守人发生公开冲突。', '结算时彼此替死者补上姓名。'),
  relation('same-old-case', 'shen-li', 'chi-yao', '旧案同源', '一个要核实名单，一个要立刻讨债。', '核对目标后共同出手。', '惩罚速度与证词完整性冲突。', '共同承认受骗不能免除挥刀责任。'),
  relation('stone-gate', 'yue-chenbei', 'xuan-yu', '碑门同镇', '守门与封门的界线不清。', '让当事人参与制定开关规则。', '保护是否变成禁闭。', '一起托住门槛而不替人决定去留。'),
  relation('thunder-blood-oath', 'lu-qinglu', 'chi-yao', '雷中血誓', '翻译真相与立即追债互相催逼。', '核对雷中声音与债主。', '雷契烧尽证词还是保留账册。', '共同确认惩罚对象与代价。'),
  relation('thunder-asks-heart', 'lu-qinglu', 'wen-fuji', '雷问心声', '一个执意译完，一个执意照见。', '先取得被记录者同意。', '保存真相是否重复伤害。', '允许“我还不知道”成为有效证词。'),
  relation('mirror-prison', 'wen-fuji', 'xuan-yu', '照心镇狱', '照见与封住都可能夺走选择。', '把同意写进照心和镇门规则。', '真相与秩序由谁决定。', '共同承认被观察者也能拒绝。'),
  relation('list-and-blade', 'shen-li', 'su-yanhui', '名单与刀', '沈砺质问她是否又在按名单追杀。', '先核实旁证，再锁定目标。', '追上信使还是停下保护证人。', '把被删去的名字刻进断刀内侧。'),
  relation('keeper-and-courier', 'yue-chenbei', 'su-yanhui', '守人与追牒', '苏雁回害怕停下，岳沉碑坚持先让活人离开。', '岳沉碑托住阵线，苏雁回回收死讯。', '逐影追击与玄甲护送互斥。', '第一次允许同伴替他托住碑角。'),
  relation('early-death-notice', 'su-yanhui', 'bai-heng', '先到的死讯', '一人相信送达时间，一人只信病案症状。', '把死讯日期与病程逐条比对。', '追信使还是留下处理代偿。', '共同证明死期早于病症。'),
  relation('voice-case-record', 'lu-qinglu', 'bai-heng', '残声病案', '陆青箓想译完，白蘅要求先问病人是否愿意公开。', '保存一段经同意的残声。', '重放规则是否也重放伤害。', '病案同时记录症状、选择与代价。'),
  relation('debt-and-cost', 'chi-yao', 'bai-heng', '讨债与代偿', '赤遥认为代偿就是另一种债。', '让承担者知情后再决定治疗。', '立即惩罚与保留证据冲突。', '共同拒绝把空栏当成无名替死者。'),
  relation('behind-the-mirror', 'wen-fuji', 'liu-jisheng', '镜后无名', '闻扶乩想照见面具之后，柳寄声反问谁有权定义“之后”。', '在明确同意下借相一次。', '照见与移印都可能夺走身份。', '只见证她主动选择的名字。'),
  relation('name-is-a-gate', 'xuan-yu', 'liu-jisheng', '名字也是门', '玄狱想固定身份，柳寄声拒绝让稳定变成牢笼。', '共同标明移印来源与去向。', '镇狱固定与无相流动冲突。', '把谁能开关身份规则写进旧约。'),
  relation('tenth-recipient', 'liu-jisheng', 'su-yanhui', '第十封收件人', '第十封只在换面时显出收件人。', '两人让第三名伙伴共同见证封口。', '拆信追踪还是保住自报名姓。', '在多人见证下决定第十封状态。')
]);

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function fragmentRecord() {
  return { status: 'unknown', witnesses: [] };
}

export function createDefaultExpansionProgress() {
  return {
    schemaVersion: EXPANSION_CONTENT_VERSION,
    chapterId: BLANK_DOSSIER_CHAPTER.id,
    stage: 'E',
    unlockedCharacterIds: [...INITIAL_CHARACTER_IDS],
    unlockedRouteIds: [...INITIAL_ROUTE_IDS],
    acknowledgedArrivals: [],
    pendingArrivalId: null,
    legalBlackMountainVictories: 0,
    keyRouteEvents: [],
    routeValidations: [],
    characterTestimonies: [],
    archiveConflictRecords: [],
    controlWitnessRuns: 0,
    relationProgress: {},
    fragments: {
      'empty-name-writ': fragmentRecord(),
      'reverse-fate-ledger': fragmentRecord(),
      'changing-face-playbill': fragmentRecord()
    },
    lastSettlementUpdates: { character: null, relation: null, fragment: null }
  };
}

export function normalizeExpansionProgress(value) {
  const defaults = createDefaultExpansionProgress();
  const source = value && typeof value === 'object' ? value : {};
  const fragments = {};
  for (const document of BLANK_DOSSIER_CHAPTER.documents) {
    const current = source.fragments?.[document.id] || {};
    fragments[document.id] = {
      status: ['unknown', 'contested', 'confirmed'].includes(current.status) ? current.status : 'unknown',
      witnesses: unique(current.witnesses)
    };
  }
  return {
    ...defaults,
    ...source,
    schemaVersion: EXPANSION_CONTENT_VERSION,
    unlockedCharacterIds: unique([...INITIAL_CHARACTER_IDS, ...(source.unlockedCharacterIds || [])]).filter((id) => ALL_CHARACTER_IDS.includes(id)),
    unlockedRouteIds: unique([...INITIAL_ROUTE_IDS, ...(source.unlockedRouteIds || [])]).filter((id) => ALL_ROUTE_IDS.includes(id)),
    acknowledgedArrivals: unique(source.acknowledgedArrivals),
    keyRouteEvents: unique(source.keyRouteEvents),
    routeValidations: unique(source.routeValidations),
    characterTestimonies: unique(source.characterTestimonies),
    archiveConflictRecords: unique(source.archiveConflictRecords),
    relationProgress: source.relationProgress && typeof source.relationProgress === 'object' ? { ...source.relationProgress } : {},
    fragments,
    lastSettlementUpdates: { ...defaults.lastSettlementUpdates, ...(source.lastSettlementUpdates || {}) }
  };
}

function characterStoryStage(meta, characterId) {
  const record = meta?.characterProgress?.[characterId];
  const familiarity = Number(record?.familiarity || 0);
  if (familiarity >= 3 || Number(record?.keyStorySeen || 0) >= 2) return 2;
  if (familiarity >= 1 || Number(record?.keyStorySeen || 0) >= 1) return 1;
  return 0;
}

function hasLegacyStageE(meta) {
  const progressed = Object.values(meta?.characterProgress || {}).filter((record) => Number(record?.keyStorySeen || 0) >= 4).length;
  return progressed >= 3 && Object.values(meta?.characterProgress || {}).some((record) => Number(record?.clears || 0) >= 1);
}

function arrivalById(id) {
  return Object.values(EXPANSION_ARRIVALS).find((arrival) => arrival.id === id) || null;
}

export function evaluateExpansionProgress(meta) {
  const next = normalizeExpansionProgress(meta?.expansionProgress);
  next.legalBlackMountainVictories = Math.max(
    Number(next.legalBlackMountainVictories || 0),
    Object.values(meta?.characterProgress || {}).reduce((sum, record) => sum + Number(record?.clears || 0), 0)
  );
  const pending = arrivalById(next.pendingArrivalId);
  if (pending && !next.acknowledgedArrivals.includes(pending.id)) return next;

  const fAcknowledged = next.acknowledgedArrivals.includes(EXPANSION_ARRIVALS.F.id);
  const gAcknowledged = next.acknowledgedArrivals.includes(EXPANSION_ARRIVALS.G.id);
  const hAcknowledged = next.acknowledgedArrivals.includes(EXPANSION_ARRIVALS.H.id);

  if (!fAcknowledged && hasLegacyStageE(meta) && next.legalBlackMountainVictories > 0) {
    next.pendingArrivalId = EXPANSION_ARRIVALS.F.id;
    return next;
  }
  const emptyWritWitnesses = next.fragments['empty-name-writ'].witnesses.filter((id) => id !== 'su-yanhui');
  if (fAcknowledged && !gAcknowledged
    && characterStoryStage(meta, 'su-yanhui') >= 2
    && emptyWritWitnesses.length >= 1
    && next.keyRouteEvents.includes('zhuoying-protected-living-witness')) {
    next.pendingArrivalId = EXPANSION_ARRIVALS.G.id;
    return next;
  }
  if (gAcknowledged && !hAcknowledged
    && characterStoryStage(meta, 'bai-heng') >= 2
    && next.archiveConflictRecords.length >= 2
    && Number(next.controlWitnessRuns || 0) >= 1) {
    next.pendingArrivalId = EXPANSION_ARRIVALS.H.id;
    return next;
  }

  const allNewStageTwo = EXPANSION_CHARACTER_IDS.every((id) => characterStoryStage(meta, id) >= 2);
  const everyRouteSeen = ALL_ROUTE_IDS.every((id) => (meta?.worldProgress?.routesSeen || []).includes(id));
  const allFragmentsWitnessed = Object.values(next.fragments).every((fragment) => fragment.witnesses.length >= 1);
  if (hAcknowledged && allNewStageTwo && everyRouteSeen && allFragmentsWitnessed) next.stage = 'I';

  const allNewTestified = EXPANSION_CHARACTER_IDS.every((id) => next.characterTestimonies.includes(id));
  const sixTestimonies = next.characterTestimonies.length >= 6 && allNewTestified;
  const allRoutesValidated = ALL_ROUTE_IDS.every((id) => next.routeValidations.includes(id));
  const allFragmentsCorroborated = Object.values(next.fragments).every((fragment) => fragment.witnesses.length >= 2);
  if (sixTestimonies && allRoutesValidated && allFragmentsCorroborated) next.stage = 'J';
  else if (next.stage === 'I') next.stage = 'I';
  else if (hAcknowledged) next.stage = 'H';
  else if (gAcknowledged) next.stage = 'G';
  else if (fAcknowledged) next.stage = 'F';
  else next.stage = 'E';
  next.pendingArrivalId = null;
  return next;
}

export function acknowledgeExpansionArrival(meta, arrivalId) {
  const nextMeta = structuredClone(meta);
  const expansion = evaluateExpansionProgress(nextMeta);
  const arrival = arrivalById(arrivalId);
  if (!arrival || expansion.pendingArrivalId !== arrival.id) return nextMeta;
  expansion.acknowledgedArrivals = unique([...expansion.acknowledgedArrivals, arrival.id]);
  expansion.unlockedCharacterIds = unique([...expansion.unlockedCharacterIds, arrival.unlockCharacterId]);
  expansion.unlockedRouteIds = unique([...expansion.unlockedRouteIds, arrival.unlockRouteId]);
  expansion.fragments[arrival.fragmentId].status = 'contested';
  expansion.stage = arrival.stage;
  expansion.pendingArrivalId = null;
  nextMeta.expansionProgress = evaluateExpansionProgress({ ...nextMeta, expansionProgress: expansion });
  return nextMeta;
}

function firstRelationForRun(run) {
  const partyIds = [run.characterId, ...(run.partners || []).map((partner) => partner.characterId)];
  return RELATIONSHIPS.find((item) => item.characters.every((id) => partyIds.includes(id))) || null;
}

function hasControlWitness(run) {
  return (run.partners || []).some((partner) => ['wen-fuji', 'xuan-yu'].includes(partner.characterId));
}

export function applyRunToExpansionProgress(meta, run) {
  const nextMeta = structuredClone(meta);
  const expansion = evaluateExpansionProgress(nextMeta);
  const updates = { character: null, relation: null, fragment: null };

  if (run.outcome === 'victory') {
    expansion.legalBlackMountainVictories += 1;
    if (!expansion.routeValidations.includes(run.routeId)) expansion.routeValidations.push(run.routeId);
  }
  if (run.characterId && (run.oldCauses || []).length > 0) {
    if (!expansion.characterTestimonies.includes(run.characterId)) {
      expansion.characterTestimonies.push(run.characterId);
      updates.character = run.characterId;
    }
  }

  const relationEntry = firstRelationForRun(run);
  if (relationEntry) {
    const before = Number(expansion.relationProgress[relationEntry.id] || 0);
    if (before < 4) {
      expansion.relationProgress[relationEntry.id] = before + 1;
      updates.relation = relationEntry.id;
    }
  }

  const fragmentId = ROUTE_FRAGMENT_MAP[run.routeId];
  if (fragmentId && (run.oldCauses || []).length > 0) {
    const fragment = expansion.fragments[fragmentId];
    const beforeWitnessCount = fragment.witnesses.length;
    fragment.witnesses = unique([...fragment.witnesses, run.characterId]);
    fragment.status = fragment.witnesses.length >= 2 ? 'confirmed' : 'contested';
    if (fragment.witnesses.length > beforeWitnessCount) updates.fragment = fragmentId;
  }

  if (run.routeId === 'zhuoying' && run.outcome === 'victory' && (run.partners || []).length > 0) {
    expansion.keyRouteEvents = unique([...expansion.keyRouteEvents, 'zhuoying-protected-living-witness']);
  }
  if (run.routeId === 'guizang') {
    const records = unique([...(run.oldCauses || []), ...(run.fulfillments || [])]).slice(0, 2);
    expansion.archiveConflictRecords = unique([...expansion.archiveConflictRecords, ...records]);
    if (hasControlWitness(run)) expansion.controlWitnessRuns += 1;
  }
  if (run.routeId === 'wuxiang' && run.characterId === 'liu-jisheng' && (run.partners || []).length > 0) {
    expansion.keyRouteEvents = unique([...expansion.keyRouteEvents, 'wuxiang-self-name-witnessed']);
  }

  expansion.lastSettlementUpdates = updates;
  nextMeta.expansionProgress = evaluateExpansionProgress({ ...nextMeta, expansionProgress: expansion });
  return nextMeta;
}

export function availableCharacterIds(source) {
  return normalizeExpansionProgress(source?.expansionProgress || source).unlockedCharacterIds;
}

export function availableRouteIds(source) {
  return normalizeExpansionProgress(source?.expansionProgress || source).unlockedRouteIds;
}

export function pendingExpansionArrival(meta) {
  const progress = evaluateExpansionProgress(meta);
  return arrivalById(progress.pendingArrivalId);
}

export function expansionStage(meta) {
  const progress = evaluateExpansionProgress(meta);
  return EXPANSION_STAGES[progress.stage] || EXPANSION_STAGES.E;
}
