const option = (config) => ({
  debtMark: '',
  bossClue: '',
  fulfillment: '',
  requirements: {},
  ...config
});

export const CHOICE_SETS = {
  gate: {
    title: '山门下的第一盏灯',
    prompt: '门钉后露出旧军印。第一步会留下旧因，也会决定你如何面对妖将。',
    options: [
      option({ id: 'gate-shield', title: '锁栅引魂幡', immediate: '护甲 +2', delta: { armor: 2 }, daomai: { xuanjia: 1 }, oldCause: '旧因·旧军残阵', fulfillment: '妖将重击会因旧军阵松动', bossClue: '玄甲成势可抗妖将的撕甲连击' }),
      option({ id: 'gate-fire', title: '借炉火照印', immediate: '全队恢复 4，压力 -1', scope: 'party', delta: { hp: 4, pressure: -1 }, daomai: { jiuhuo: 1 }, oldCause: '旧因·炉火余温', fulfillment: '低血长战时会应验', debtMark: '酒债未清' }),
      option({ id: 'gate-read', title: '抄下封条残字', immediate: '破局线索 +1', delta: { clues: 1 }, daomai: { jiuyan: 1 }, oldCause: '旧因·封门旧案', fulfillment: '首领会提起这道封门', bossClue: '旧案成势可预警首领机制' }),
      option({ id: 'gate-token', title: '翻看守卒腰牌', immediate: '护甲 +1，破局线索 +1', delta: { armor: 1, clues: 1 }, daomai: { xuanjia: 1, jiuyan: 1 }, oldCause: '旧因·旧军残阵', fulfillment: '伪装成军令的妖言出现时会应验', bossClue: '腰牌背面的换防刻痕能辨出假军阵' })
    ]
  },
  crossroads: {
    title: '雾里的旧军阵',
    prompt: '路旁的军牌被重新排过。有人想让你按旧阵继续走。',
    options: [
      option({ id: 'cross-thunder', title: '雷契先发', immediate: '伤害 +2，压力 +1', delta: { damage: 2, pressure: 1 }, daomai: { leiqi: 2 }, oldCause: '旧因·雷契旧债', fulfillment: '破甲型首领处应验', debtMark: '压力反噬', bossClue: '雷契成势可先破首领护甲' }),
      option({ id: 'cross-seal', title: '压一道镇符', immediate: '压力 -2', delta: { pressure: -2 }, daomai: { zhenfu: 2 }, oldCause: '旧因·朱砂镇符', fulfillment: '敌势逼命时会被封住一息', bossClue: '镇符成势可压慢首领杀招' }),
      option({ id: 'cross-company', title: '把军牌交给同行者', immediate: '同行者护甲 +1，伙伴联动 +1', scope: 'partners', delta: { armor: 1 }, daomai: { partner: 2 }, requirements: { minPartners: 1 }, oldCause: '旧因·同行之誓', fulfillment: '合击与援护解咒处应验', bossClue: '伙伴成势可分摊并解首领咒' }),
      option({ id: 'cross-unmake', title: '拨乱军牌次序', immediate: '压力 -1，破局线索 +1', delta: { pressure: -1, clues: 1 }, daomai: { zhenfu: 1, jiuyan: 1 }, oldCause: '旧因·封门旧案', fulfillment: '旧阵试图把人引回原位时会应验', bossClue: '被重新排列的军牌指出阵眼并不在路中央' })
    ]
  },
  oldcase: {
    title: '黑山旧案残页',
    prompt: '案页和残账互相压住，只能先追一边。',
    options: [
      option({ id: 'case-truth', title: '追查被抹掉的结论', immediate: '破局线索 +2', delta: { clues: 2 }, daomai: { jiuyan: 2 }, oldCause: '旧因·档案真相', fulfillment: '首领抹除机制出现时应验', bossClue: '旧案三层可保住一条结论' }),
      option({ id: 'case-blood', title: '以血印补齐页角', immediate: '伤害 +3，生命 -5', delta: { damage: 3, hp: -5 }, daomai: { xuezhai: 2 }, oldCause: '旧因·血债契约', fulfillment: '首领逼命时应验', debtMark: '救援压力 +1', bossClue: '血债成势可快速压低首领血线' }),
      option({ id: 'case-armor', title: '把残页缝进旧甲', immediate: '护甲 +3', delta: { armor: 3 }, daomai: { xuanjia: 2 }, oldCause: '旧因·旧军残阵', fulfillment: '撕甲动作出现时应验', bossClue: '旧军页可抵住一次重击' }),
      option({ id: 'case-dry', title: '用余火熏开水痕', immediate: '全队恢复 4，压力 -1', scope: 'party', delta: { hp: 4, pressure: -1 }, daomai: { jiuhuo: 1, jiuyan: 1 }, oldCause: '旧因·档案真相', fulfillment: '被水痕遮住的落款再次出现时会应验', bossClue: '案页受热后显出第二层笔迹' })
    ]
  },
  witnessRoad: {
    title: '无人认领的第三份口供',
    prompt: '雨里躺着第三份口供。纸上没有署名，句尾却夹着三个人不同的停顿；有人把同行者说过的话拼成了一名不存在的证人。',
    options: [
      option({ id: 'witness-escort', title: '先护送仍活着的旁证', immediate: '全队护甲 +2', scope: 'party', delta: { armor: 2 }, daomai: { xuanjia: 1 }, oldCause: '旧因·无名旁证', fulfillment: '敌人试图把证人从队列里抹去时会应验', bossClue: '活人的停顿能证明口供并非出自同一人' }),
      option({ id: 'witness-listen', title: '逐句辨认三种呼吸', immediate: '破局线索 +2，压力 +1', delta: { clues: 2, pressure: 1 }, daomai: { jiuyan: 2 }, oldCause: '旧因·拼接口供', fulfillment: '首领借他人声音作答时会应验', debtMark: '听见了不愿公开的证词', bossClue: '第三种呼吸只出现在被改写的句子后' }),
      option({ id: 'witness-seal', title: '封住会自行续写的页角', immediate: '压力 -2，破局线索 +1', delta: { pressure: -2, clues: 1 }, daomai: { zhenfu: 2 }, oldCause: '旧因·封声纸页', fulfillment: '案页再次替活人作答时会被截断', bossClue: '封线内的墨迹比口供本身更早落下' }),
      option({ id: 'witness-share', title: '让每名同行者各留一句', immediate: '伙伴联动 +2，破局线索 +1', delta: { clues: 1 }, daomai: { partner: 2 }, requirements: { minPartners: 1 }, oldCause: '旧因·分声见证', fulfillment: '队伍被逼着只认一个声音时会应验', bossClue: '各自落款的句子无法被拼成同一名假证人' })
    ]
  },
  echoCase: {
    title: '会替人答话的案页',
    prompt: '案页先写出问题，随后用你的笔迹替你回答。每翻一面，队伍里就少一段真正说过的话。',
    options: [
      option({ id: 'echo-blank', title: '留出一行，拒绝代答', immediate: '压力 -2，破局线索 +1', delta: { pressure: -2, clues: 1 }, daomai: { zhenfu: 1, jiuyan: 1 }, oldCause: '旧因·拒答空行', fulfillment: '首领强迫队伍承认伪答时会应验', bossClue: '空白不是沉默，而是未曾同意' }),
      option({ id: 'echo-company', title: '逐人核对被偷走的话', immediate: '全队恢复 4，伙伴联动 +1', scope: 'party', delta: { hp: 4 }, daomai: { partner: 2 }, requirements: { minPartners: 1 }, oldCause: '旧因·失声名册', fulfillment: '同行者的声音被挪作他用时会应验', bossClue: '只有被本人确认的话才能写入名册' }),
      option({ id: 'echo-blood', title: '用血印圈出伪答', immediate: '伤害 +2，生命 -3', delta: { damage: 2, hp: -3 }, daomai: { xuezhai: 1, leiqi: 1 }, oldCause: '旧因·血圈伪答', fulfillment: '伪答再次靠近血印时会自行焦黑', debtMark: '每次辨伪都要见血', bossClue: '首领的真名不会在血印下留下影子' }),
      option({ id: 'echo-warm', title: '以炉火逼出原声', immediate: '全队恢复 5，压力 +1', scope: 'party', delta: { hp: 5, pressure: 1 }, daomai: { jiuhuo: 2 }, oldCause: '旧因·纸背余声', fulfillment: '被烧去的原话会在长战低血时回响', debtMark: '原声回返会带回当时的恐惧', bossClue: '纸背焦痕标出了替换发生的先后' })
    ]
  },
  pressure: {
    title: '妖气压山',
    prompt: '前路忽然无声。你必须压住压力，或抢在它成形前出手。',
    options: [
      option({ id: 'pressure-ward', title: '镇住山口', immediate: '压力 -3', delta: { pressure: -3 }, daomai: { zhenfu: 2 }, oldCause: '旧因·朱砂镇符', fulfillment: '逼命处决会被削弱', bossClue: '压力低于 7 可避开额外处决' }),
      option({ id: 'pressure-burst', title: '迎着妖气抢攻', immediate: '伤害 +2，生命 -4', delta: { damage: 2, hp: -4 }, daomai: { xuezhai: 1, leiqi: 1 }, oldCause: '旧因·血债契约', fulfillment: '首领显形时应验', debtMark: '血线吃紧', bossClue: '破甲后爆发才会真正奏效' }),
      option({ id: 'pressure-rest', title: '分酒稳住同行者', immediate: '全队恢复 6', scope: 'party', delta: { hp: 6 }, daomai: { jiuhuo: 2, partner: 1 }, requirements: { minPartners: 1 }, oldCause: '旧因·炉火余温', fulfillment: '伙伴低血时应验', debtMark: '酒债未清', bossClue: '长战续航需要酒火成势' }),
      option({ id: 'pressure-listen', title: '贴岩听妖潮回声', immediate: '压力 -1，破局线索 +1', delta: { pressure: -1, clues: 1 }, daomai: { jiuyan: 1, zhenfu: 1 }, oldCause: '旧因·封门旧案', fulfillment: '妖气再次突然收声时会应验', bossClue: '真正的杀招会比山中回声慢半拍' })
    ]
  },
  emptyWrit: {
    title: '仍活着的收件人',
    prompt: '空名牒写着一个仍在呼吸的人。信使的足印继续向山里，收件人却正在被邻里忘掉。',
    options: [
      option({ id: 'writ-protect', title: '先把活人带到灯下', immediate: '护甲 +2，破局线索 +1', delta: { armor: 2, clues: 1 }, daomai: { xuanjia: 1 }, oldCause: '旧因·空名牒活证', fulfillment: '逐影追击将保留活人证词', bossClue: '断名窗口必须建立在旁证仍存活之上' }),
      option({ id: 'writ-pursue', title: '沿封蜡气味追信使', immediate: '伤害 +2，压力 +1', delta: { damage: 2, pressure: 1 }, daomai: { leiqi: 2 }, oldCause: '旧因·第十封回牒', fulfillment: '连续追击同一目标时应验', debtMark: '见证人无人护送', bossClue: '逐影换目标会失去全部追痕' }),
      option({ id: 'writ-witness', title: '请同行者共同验封', immediate: '伙伴联动 +1，破局线索 +1', delta: { clues: 1 }, daomai: { partner: 2, jiuyan: 1 }, requirements: { minPartners: 1 }, oldCause: '旧因·空名牒旁证', fulfillment: '第十封在多人见证下开启时应验', bossClue: '旁证可阻止目标被卷宗再次抹除' }),
      option({ id: 'writ-carve', title: '把收件名刻进路碑', immediate: '护甲 +2，压力 -1', delta: { armor: 2, pressure: -1 }, daomai: { xuanjia: 1, zhenfu: 1 }, oldCause: '旧因·空名牒活证', fulfillment: '卷宗再次抹名时路碑会留下缺口', bossClue: '写在卷外的名字不会随牒页一同消失' })
    ]
  },
  reverseLedger: {
    title: '早于病症的死期',
    prompt: '逆命簿上的死期早于病症。剪去一行可以救人，但隔壁空栏已经开始渗墨。',
    options: [
      option({ id: 'ledger-consent', title: '让病人先看见代偿', immediate: '恢复 5，破局线索 +1', delta: { hp: 5, clues: 1 }, daomai: { jiuhuo: 2, jiuyan: 1 }, oldCause: '旧因·知情代偿', fulfillment: '归藏返箓时会同时返还收益与代价', bossClue: '两份冲突记录都必须保留来源' }),
      option({ id: 'ledger-cut', title: '立刻剪去死期', immediate: '恢复 8，压力 +2', delta: { hp: 8, pressure: 2 }, daomai: { jiuhuo: 2, xuezhai: 1 }, oldCause: '旧因·逆命空栏', fulfillment: '未记录的代偿者出现时应验', debtMark: '死亡转写未明', bossClue: '净化只能移除伪写，不能抹去真实代价' }),
      option({ id: 'ledger-compare', title: '保存两份冲突病案', immediate: '破局线索 +2', delta: { clues: 2 }, daomai: { jiuyan: 2 }, oldCause: '旧因·逆命旁证', fulfillment: '万象归藏偶数轮重放时应验', bossClue: '归藏会把被保存的伤害一起带回' }),
      option({ id: 'ledger-seal', title: '把空栏封存到天明', immediate: '护甲 +2，压力 -1', delta: { armor: 2, pressure: -1 }, daomai: { zhenfu: 2 }, oldCause: '旧因·逆命旁证', fulfillment: '渗墨试图越过封线时会应验', bossClue: '空栏在见光前不会替任何人落下死期' })
    ]
  },
  changingPlaybill: {
    title: '戏单上的陌生罪名',
    prompt: '戏单把在场者姓名改成旧案罪名。柳寄声摘下面具，却拒绝让任何人替她寻找“唯一真名”。',
    options: [
      option({ id: 'playbill-self-name', title: '以柳寄声之名重新落款', immediate: '压力 -2，破局线索 +1', delta: { pressure: -2, clues: 1 }, daomai: { zhenfu: 2 }, oldCause: '旧因·自报名姓', fulfillment: '伙伴在移印失真时唤回真声', bossClue: '无相每次转移都必须保留来源与去向' }),
      option({ id: 'playbill-borrow', title: '借用戏中身份误导追兵', immediate: '护甲 +2，压力 +1', delta: { armor: 2, pressure: 1 }, daomai: { zhenfu: 1, jiuyan: 1 }, oldCause: '旧因·借相脱身', fulfillment: '错误目标承受敌意时应验', debtMark: '失真 +1', bossClue: '重复借相会让规则来源失真' }),
      option({ id: 'playbill-witness', title: '请同行者只见证选定名', immediate: '伙伴联动 +1，压力 -1', delta: { pressure: -1 }, daomai: { partner: 2 }, requirements: { minPartners: 1 }, oldCause: '旧因·寄声见证', fulfillment: '无相失真达到临界时应验', bossClue: '见证不会替当事人决定身份' }),
      option({ id: 'playbill-burn', title: '焚去罪名，留下自署', immediate: '伤害 +1，压力 -1，破局线索 +1', delta: { damage: 1, pressure: -1, clues: 1 }, daomai: { leiqi: 1, jiuyan: 1 }, oldCause: '旧因·自报名姓', fulfillment: '旧罪名再次覆上真声时会应验', bossClue: '火只烧掉强加的罪名，不替人决定名字' })
    ]
  },
  lastcase: {
    title: '首领门前的证词',
    prompt: '三份证词彼此冲突。留下哪一份，会决定首领先读到什么。',
    options: [
      option({ id: 'last-clue', title: '留下守卷人的证词', immediate: '破局线索 +2', delta: { clues: 2 }, daomai: { jiuyan: 2 }, oldCause: '旧因·档案真相', fulfillment: '首领试图抹除名字时应验', bossClue: '一条真证词可削弱显形后的撕名攻势' }),
      option({ id: 'last-ally', title: '让同行者共同落款', immediate: '全队护甲 +2', scope: 'party', delta: { armor: 2 }, daomai: { partner: 2 }, requirements: { minPartners: 1 }, oldCause: '旧因·同行之誓', fulfillment: '首领点名攻击时应验', bossClue: '伙伴成势可分担点名伤害' }),
      option({ id: 'last-thunder', title: '用雷契烧掉伪证', immediate: '伤害 +3，压力 +1', delta: { damage: 3, pressure: 1 }, daomai: { leiqi: 2 }, oldCause: '旧因·雷契旧债', fulfillment: '初势破甲时应验', debtMark: '雷契反噬', bossClue: '先破甲再爆发，才能越过护命旧印' }),
      option({ id: 'last-seal', title: '封存互相抵触的笔迹', immediate: '压力 -2，破局线索 +1', delta: { pressure: -2, clues: 1 }, daomai: { zhenfu: 1, jiuyan: 1 }, oldCause: '旧因·档案真相', fulfillment: '首领逼迫你只认一份证词时会应验', bossClue: '冲突本身证明有人改写过证词次序' })
    ]
  },
  bossTavern: {
    title: '首领门前 · 是否入酒馆修整',
    prompt: '酒旗就在岔路下。进去会得到一次修整，也会留下新的代价。',
    options: [
      option({ id: 'boss-tavern-enter', title: '回黑山酒馆修整', immediate: '进入可选酒馆', delta: {}, daomai: { jiuhuo: 1 }, oldCause: '旧因·炉火余温', fulfillment: '首领长战时应验', debtMark: '停步会让压力 +1', bossClue: '掌柜知道首领最后一道逼命杀招', special: 'enter-boss-tavern' }),
      option({ id: 'boss-tavern-skip', title: '不回头，直接前行', immediate: '压力 -1', delta: { pressure: -1 }, daomai: { leiqi: 1 }, oldCause: '旧因·雷契旧债', fulfillment: '首轮抢攻时应验', bossClue: '直接前行保住先手', special: 'skip-boss-tavern' })
    ]
  },
  bossPrep: {
    title: '首领门前的最后筹备',
    prompt: '已知线索只能压住一重敌势。选择你真正要保住的东西。',
    options: [
      option({ id: 'prep-armor', title: '加固旧甲与队形', immediate: '全队护甲 +4，门前筹备 +1', scope: 'party', delta: { armor: 4, bossPrep: 1 }, daomai: { xuanjia: 1, partner: 1 }, requirements: { minPartners: 1 }, oldCause: '旧因·旧军残阵', fulfillment: '首领重击时应验', bossClue: '护甲与分摊可撑过初势试探' }),
      option({ id: 'prep-clue', title: '复核全部破局线索', immediate: '破局线索 +2，门前筹备 +1', delta: { clues: 2, bossPrep: 1 }, daomai: { jiuyan: 1, zhenfu: 1 }, oldCause: '旧因·档案真相', fulfillment: '首领旧印显形时应验', bossClue: '两条线索可削弱逼命处决' }),
      option({ id: 'prep-blade', title: '磨刃，准备一次决断', immediate: '伤害 +3，门前筹备 +1', delta: { damage: 3, bossPrep: 1 }, daomai: { leiqi: 1, xuezhai: 1 }, oldCause: '旧因·血债契约', fulfillment: '首领逼命时应验', debtMark: '生命上限承压', bossClue: '爆发必须建立在至少一条成势上' }),
      option({ id: 'prep-medicine', title: '清点伤药与退路', immediate: '全队恢复 5，压力 -1，破局把握 +1', scope: 'party', delta: { hp: 5, pressure: -1, bossPrep: 1 }, daomai: { jiuhuo: 1, zhenfu: 1 }, oldCause: '旧因·炉火余温', fulfillment: '逼命长战拖到最后一息时会应验', bossClue: '留有退路才能把最后一次恢复用在刀口上' })
    ]
  }
};

export const CHOICE_OFFER_SIZE = 3;
export const CHOICE_OFFER_CYCLE = 4;

// Omitted choices must not line up into one global late-game solve recipe. The
// first three entries remain the canonical seed-20 offer; the two late sets
// use a mirrored tail order so their strongest fallbacks are not omitted in
// the same seed variant. The anti-solve harness owns this correlation gate.
const CHOICE_OFFER_VARIANT_ORDER = Object.freeze({
  lastcase: Object.freeze([0, 1, 3, 2]),
  bossPrep: Object.freeze([0, 1, 3, 2])
});

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function normalizedSeed(seed) {
  return Number.isFinite(Number(seed)) ? Math.trunc(Number(seed)) : 20;
}

export function choiceOfferVariantForSeed(seed) {
  return positiveModulo(normalizedSeed(seed) - 20, CHOICE_OFFER_CYCLE);
}

export function choiceOfferVariantForSet(id, seed) {
  const variant = choiceOfferVariantForSeed(seed);
  return CHOICE_OFFER_VARIANT_ORDER[id]?.[variant] ?? variant;
}

export function avoidImmediateOfferRepeat(candidateSeed, previousSeed) {
  const candidate = normalizedSeed(candidateSeed);
  if (!Number.isFinite(Number(previousSeed))) return candidate;
  return choiceOfferVariantForSet('gate', candidate) === choiceOfferVariantForSet('gate', previousSeed)
    ? candidate + 1
    : candidate;
}

export function getChoiceSet(id, seed = 20) {
  const source = CHOICE_SETS[id] || CHOICE_SETS.gate;
  const offerSize = source.options.length > CHOICE_OFFER_SIZE ? CHOICE_OFFER_SIZE : source.options.length;
  if (offerSize === source.options.length) return { ...source, options: [...source.options] };
  const start = choiceOfferVariantForSet(id, seed) % source.options.length;
  const options = Array.from({ length: offerSize }, (_, offset) => source.options[(start + offset) % source.options.length]);
  return { ...source, options };
}
