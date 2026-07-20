import { EXPANSION_STAGES, expansionStage } from './expansionCanon.js';
import { LORE_HINTS, LORE_STAGES, loreStage } from './lore.js';
import { dossierCatalogs } from './playerFacingDossiers.js';

const freeze = (value) => Object.freeze(value);

const BLACK_MOUNTAIN_CHAPTERS = Object.freeze(LORE_STAGES.map((title, index) => freeze({
  title,
  seal: index === 0 ? '雾外无名' : index === 1 ? '山门点灯' : index === 2 ? '残页回声' : index === 3 ? '妖影成卷' : index === 4 ? '门前会证' : index === 5 ? '真相落墨' : '余波未歇',
  hint: LORE_HINTS[index]
})));

export function blackMountainChapter(stage) {
  return BLACK_MOUNTAIN_CHAPTERS[Math.max(0, Math.min(BLACK_MOUNTAIN_CHAPTERS.length - 1, Number(stage || 0)))] || BLACK_MOUNTAIN_CHAPTERS[0];
}

export function blankDossierChapter(stageId) {
  const entry = EXPANSION_STAGES[stageId] || EXPANSION_STAGES.E;
  return freeze({ title: entry.title, seal: `空白卷宗 · ${entry.title}`, question: entry.question });
}

export function playerLoreVolumeLabel(stage) {
  if (typeof stage === 'number') return `黑山旧案 · ${blackMountainChapter(stage).seal}`;
  return blankDossierChapter(stage).seal;
}

const cause = (quote, story, meaning, related) => freeze({ quote, story, meaning, related });

const OLD_CAUSE_LORE = Object.freeze({
  '旧军残阵': cause(
    '阵里留下的不是败兵，而是被封山令划到门外的人。',
    '旧军阵图上有两层墨：明墨记录军位，暗墨记录谁能被舍弃。妖将仍按暗墨点名，因此残阵每次重排，都像在重复一次旧日弃守。',
    '读懂暗墨后，守阵者能预先看出撕甲重击落向哪里；旧甲与同行援护也不再只是硬扛，而是在改写那次弃守。',
    '岳沉碑 · 玄狱 · 封山令 · 妖将'
  ),
  '炉火余温': cause(
    '酒馆的火记得围炉者亲口说过的名字。',
    '黑山酒馆的旧炉灰混着历代执灯人的落款。人在血尽之前靠近它，炉火会沿着名字找回尚未散去的气息；可每一次续命，也会把一笔人情留在掌柜账上。',
    '它能在长战和低血时把人从失温中拉回来，却不能替人免去债印，也不能把第二次倒下写成从未发生。',
    '黑山掌柜 · 酒火道脉 · 濒死救援'
  ),
  '封门旧案': cause(
    '门先在纸上关上，山路才真的断掉。',
    '同一道封门令留有三份互相冲突的抄本：军中说为防妖，驿站说为截民，司箓监旧印则把门外者直接从名册删去。门并非只挡脚步，它还决定谁有资格被记住。',
    '保住残字，就能在首领改写场上秩序之前看见征兆；若残字被抹，门外之人会再次成为无人追问的代价。',
    '岳沉碑 · 玄狱 · 镇门旧约'
  ),
  '雷契旧债': cause(
    '雷落在哪里，不只看天，也看债被写在谁名下。',
    '赤遥故乡的无雷之夜不是天意迟到，而是雷契被人买走并转写。铜筹、血印与旧账共同证明，惩罚可以被延后、转移，甚至落到从未同意承担的人身上。',
    '掌握契文能抢在护甲合拢前引雷破势；代价是压力与反噬仍会沿着签名回来，不能用“天罚”两个字抹去责任。',
    '赤遥 · 陆青箓 · 雷契账 · 山君'
  ),
  '朱砂镇符': cause(
    '镇符不是让异动消失，只是替所有人争来一息。',
    '门钉上的朱砂来自同一批旧约印泥。它能让黑山异动暂时承认一道边界，却无法证明边界本身公正。符色越深，越说明曾有人被长久关在边界之外。',
    '镇符成势时能压住高压杀招，让队伍有时间复核证词；若只依赖封镇，保护也可能再次变成囚禁。',
    '玄狱 · 闻扶乩 · 镇门旧约'
  ),
  '同行之誓': cause(
    '军牌交出去以后，名字便不再只由一个人保管。',
    '旧军牌原本成对，一枚记出阵者，一枚由留守者保存。封山败退后，许多留守牌被销毁，活着回来的人也就失去了旁证。如今同行者接过军牌，等于答应在卷宗改写时仍能互相叫出姓名。',
    '誓约必须有真实同行者才能成立。它让协击、援护和解咒有了见证来源，也意味着伙伴受伤时不能把他只当一项战力。',
    '岳沉碑 · 苏雁回 · 所有同行伙伴'
  ),
  '档案真相': cause(
    '被刮掉的结论仍会在下一层纸上留下压痕。',
    '黑山旧案多次更换结论，却没能抹去纸背的凹痕、错页和不同抄手的停笔。把这些痕迹并排，能看见有人长期把“失踪”“妖患”与“自愿离山”改写成同一种说法。',
    '保住一条经过会证的结论，首领就更难把它从战局里抹掉；真相不是加成，而是一份有人愿意共同承担的记录。',
    '闻扶乩 · 黑山残箓 · 司箓监旧印'
  ),
  '血债契约': cause(
    '以血补页，等于让卷宗拥有了向活人追债的地址。',
    '血印能迅速补全残缺契文，也会把执笔者的血认作担保。旧账上许多“自愿偿还”其实没有当事人口供，只有一枚被迫按下的指印。',
    '血债能换来短暂爆发并压低首领血线，但失去的生命与后续救援压力都会留下；力量不能把代价改名为荣耀。',
    '赤遥 · 白蘅 · 雷契账'
  ),
  '空名牒活证': cause(
    '死讯抵达时，收件人仍在灯下呼吸。',
    '苏雁回送出的九封死讯都比死亡更早。只有把活着的收件人带到多人灯下，驿册上逐站消失的名字才第一次有了与官方卷宗对抗的活证。',
    '先护住证人，会失去追信使的片刻，却能让后续断名建立在真实旁证上，而不是另一张未经核实的名单。',
    '苏雁回 · 岳沉碑 · 空名牒'
  ),
  '第十封回牒': cause(
    '第十封写着送牒人的名字，却从未有人见过封内正文。',
    '苏雁回一直带着写给自己的死讯。封蜡与前九封相同，收件时刻却会随她更换落脚处而移动，像有一只看不见的笔仍在追着她写。',
    '追逐封蜡气味可以积累追痕；若为追上信使丢下活证人，第十封即使拆开，也只会留下无人能够复核的答案。',
    '苏雁回 · 柳寄声 · 逐影断名'
  ),
  '空名牒旁证': cause(
    '一封信由两个人同时验封，卷宗便很难只抹掉一个人的记忆。',
    '空名牒会沿送达路径改写驿册，也会侵蚀单独见证者的确信。两名以上同行者分别记录封口、纸纹和收件人，才能留下彼此可核对的第二份记录。',
    '旁证不会自动证明死讯为假，却能阻止目标再次无声消失，并让第十封的开启成为公开选择。',
    '苏雁回 · 黑山酒馆见证簿 · 第十封'
  ),
  '知情代偿': cause(
    '救治的代价若不让病人看见，就只是把死亡偷偷推给别人。',
    '白蘅曾剪去一名病人的死期，同夜另一张空床的病人却被写进空栏。此后她要求病案同时记下受益者、承担者，以及两人是否真正知道会发生什么。',
    '知情不会让代偿消失，却能阻止归藏把收益带回时掩住伤害来源，也给当事人留下拒绝的权利。',
    '白蘅 · 赤遥 · 逆命簿'
  ),
  '逆命空栏': cause(
    '空栏从来不空，它只是还没选定由谁承担。',
    '逆命簿上的空白会在死期被剪去后自行补名。墨色与原页一致，却找不到落笔动作；唯一稳定的规律，是未被记录的人更容易被填进去。',
    '剪去死期能立即救人，但会留下未知承担者与更高压力。净化只能除去伪写，不能假装真实代价从未发生。',
    '白蘅 · 逆命簿 · 无名病案'
  ),
  '逆命旁证': cause(
    '两份互相冲突的病案，比一份完美答案更接近真相。',
    '同一名病人在县册中病死、在药铺账中痊愈、在逆命簿中却从未出生。白蘅拒绝删去冲突，而把三份来源、抄手和日期一起保存。',
    '万象归藏因此能比对并重放已经见证的规则；但被保存的伤害也会一同回来，不能只挑收益归档。',
    '白蘅 · 陆青箓 · 万象归藏'
  ),
  '自报名姓': cause(
    '出生名被夺走以后，柳寄声仍有权选择自己要留下的名字。',
    '易面戏单把演员本名逐一换成戏中罪名。柳寄声逃出后没有等待卷宗归还所谓“真名”，而是在多人面前主动报名，让这个选择成为可追溯的见证。',
    '伙伴唤出“柳寄声”时，能在移印失真中把她带回；见证名字不等于替她定义名字。',
    '柳寄声 · 闻扶乩 · 易面戏单'
  ),
  '借相脱身': cause(
    '借来的身份能骗过追兵，也可能把追兵送向无关的人。',
    '柳寄声靠面具和声线逃出戏班，但每次借相都会留下一个被错误敌意追上的影子。戏单只记成功脱身，不记那个影子后来发生了什么。',
    '借相能让来袭认错目标；重复使用会积累失真和压力，且必须保留敌意从谁转向谁。',
    '柳寄声 · 无相移印 · 易面戏单'
  ),
  '寄声见证': cause(
    '声音寄给未来，不是为了找回过去，而是为了让选择不再被独占。',
    '柳寄声把每次自报名姓分别交给不同伙伴记住。见证内容允许有口音、停顿和矛盾，只要每个人都能说明自己何时、为何听见。',
    '同行者的呼唤能在失真逼近极限时恢复真声；这份力量来自关系，不来自一张替她认证身份的官纸。',
    '柳寄声 · 同行伙伴 · 黑山酒馆见证簿'
  ),
  '灯油浸甲': cause(
    '灯油渗进旧甲的裂缝，也照出了被刮去的军号。',
    '这瓶灯油取自山门废灯，油底沉着细小朱砂。涂甲后，旧军纹会在受击时短暂显形，露出当年阵位和撤路记号。',
    '它能加固护甲，也把旧军残阵的一角带回卷宗；若只取其坚固而不读军号，失踪者仍不会得到名字。',
    '沈砺 · 岳沉碑 · 旧军残阵'
  ),
  '镇符旧甲': cause(
    '旧甲内衬缝着镇符，守住身体的同时也曾锁住穿甲的人。',
    '甲片来自封山守门卒，内侧符文不是防妖，而是禁止守卒擅离。如今拆开符脚，能保留护身部分，并让压在身上的旧令松开。',
    '这件遗物同时滋养玄甲与镇符；它提醒执灯人，坚守若没有退出的权利，就会变成另一座牢门。',
    '岳沉碑 · 玄狱 · 镇门旧约'
  ),
  '雷烧案卷': cause(
    '火烧掉了伪字，却把真正被抹去的笔压显了出来。',
    '残卷遭过雷火，表层结论几乎全毁，纸纤维里的旧墨反而因焦化显形。两层文字互相矛盾，证明同一案件至少被改写过一次。',
    '雷烧案卷既增强雷势，也提供破局线索；它不能证明哪一层绝对正确，只能迫使后人保留冲突。',
    '陆青箓 · 闻扶乩 · 黑山残箓'
  ),
  '撤路药散': cause(
    '药散藏在撤路石龛里，只够把伤者送到下一盏灯。',
    '旧时山卒沿撤路埋下药龛，外刻“不可回头”，内里却留着无名医者的用量笔记。掌柜改路后，伤者会先经过这些早已被遗忘的补给。',
    '它只负责止血与回气，不会让伤势从卷宗消失，也不会添一笔新的代价。',
    '黑山掌柜 · 白蘅 · 撤路灯记'
  ),
  '弃置护臂': cause(
    '有人在撤退时卸下护臂，把还能守住的一次重击留给后来者。',
    '护臂没有姓名，内侧却刻着一串撤路灯位。它不像战利，更像前一名败退者主动留下的接力物。',
    '重新系上能稳住护甲并缓下压力；接受它，也等于承认败退者留下的东西仍能保护别人。',
    '岳沉碑 · 撤路旧卒 · 黑山掌柜'
  ),
  '静息残符': cause(
    '残符只写一个“息”字，命令的不是敌人，而是惊惧中的自己。',
    '符纸出自酒馆后门，笔迹混着多位执灯人的重描。它不能封住首领，却能让逃路上的人重新分清追兵声与心跳。',
    '使用后压力会下降，并能看见一条被慌乱遮住的线索；它不承诺安全，只把判断力还给玩家。',
    '闻扶乩 · 黑山掌柜 · 撤路灯记'
  ),
  '酒馆救援': cause(
    '酒馆能把人从山路上拖回来一次，却不能替他多活一条命。',
    '掌柜循着执灯人的名字、债印和炉火余温找到濒死者，再改走一段仍有灯记的撤路。被救者会带着伤、欠账和已经发生的失败继续前行。',
    '这项旧因解释了为何救援后先有喘息，也解释了第二次倒下为何再无回路：灯火认得的那笔人情已经用尽。',
    '黑山掌柜 · 炉火余温 · 濒死救援'
  ),
  '炉火包扎': cause(
    '酒布在炉边烤热以后，先记住的是伤口，不是胜负。',
    '掌柜把旧酒、草灰与净布分开存放，每次包扎都在见证簿上记明伤从何来。这样做不能让战败消失，却能避免同一处撕裂在下一程被误当成新伤。',
    '它恢复生命并缓下一点压力；后续长战若触发炉火余温，这次包扎会成为酒火找到伤者的引线。',
    '黑山掌柜 · 白蘅 · 炉火余温'
  ),
  '擦拭旧甲': cause(
    '擦掉血垢以后，旧甲上的退路刻痕才重新显出来。',
    '许多甲片由撤回酒馆的人留下，内侧刻着阵位、灯位与谁替谁挡过一击。掌柜只修裂口，不磨掉这些不够体面的败退痕迹。',
    '它补回护甲并滋养玄甲道脉；再次遇到旧军攻势时，甲内刻痕能提醒队伍从哪里退、由谁接住重击。',
    '岳沉碑 · 沈砺 · 旧军残阵'
  ),
  '向掌柜打听旧案': cause(
    '掌柜不卖答案，只把两份互相打架的旧账摊到灯下。',
    '酒馆收留过兵卒、驿使、病人和守门人，同一场黑山异动常留下彼此冲突的说法。掌柜会说明每句话由谁说、何时说，却拒绝替玩家删去矛盾。',
    '这次问话会添入破局线索与门前筹备；线索只有在来源仍可追溯时有效，不能把掌柜的猜测当成已经确认的真相。',
    '黑山掌柜 · 酒馆见证簿 · 档案真相'
  ),
  '压一道镇符': cause(
    '这道符先镇住持符人的呼吸，再去镇山里的异动。',
    '掌柜保存的残符来自不同年代，符脚上都添过“可解”二字。那是后来执灯人留下的改笔，提醒守门者任何封镇都必须留出退出的办法。',
    '它缓下压力并滋养镇符道脉；若在后路应验，争来的是一次重新判断的机会，不是永久取消危险。',
    '玄狱 · 闻扶乩 · 镇门旧约'
  ),
  '空名牒': cause(
    '死讯比死亡先到，活人便要先证明自己没有死。',
    '空名牒沿驿路改写收件人的身份记录。苏雁回带回九名仍活着的收件人，却发现每经过一站，就少一个人记得他们原本的名字。',
    '这份异文开启逐影断名的追查；只有活证、封口痕迹与多人旁证共同保留，追牒才不会变成按名单杀人的另一种旧错。',
    '苏雁回 · 第十封回牒 · 逐影断名'
  ),
  '逆命簿': cause(
    '剪去一个人的死期，空栏就会寻找另一个名字。',
    '白蘅发现病案里的死亡日期早于症状。她曾剪掉一行救回病人，同夜空栏却自行补名，从此坚持把获救者、承担者与知情情况同时记录。',
    '这份异文开启万象归藏的比对；保存收益时也会保存代价，净化只能去掉伪写，不能抹去已经由别人承担的伤害。',
    '白蘅 · 知情代偿 · 万象归藏'
  ),
  '易面戏单': cause(
    '戏单把名字改成罪名，却没有权替台上的人决定余生。',
    '易面戏单会随翻页改写演员姓名。柳寄声摘下面具后拒绝寻找所谓唯一真名，而在多人面前自报名姓，并要求旁人只见证她主动选择的名字。',
    '这份异文开启无相移印；借相能让敌意认错目标，但每次转移都必须留下来源与去向，重复使用还会积累失真。',
    '柳寄声 · 自报名姓 · 无相移印'
  ),
  '空白卷宗': cause(
    '空白不是没有故事，而是旧印还在决定哪些故事有资格显墨。',
    '黑山旧案之后，酒馆收到空名牒、逆命簿与易面戏单。三份异文都证明记录不只描述现实，也可能反过来删名、转写死期或借走身份。',
    '它要求不同人物、路线与结局留下独立见证；任何单一路径都只能补一角，不能提前替整卷指定幕后执笔者。',
    '苏雁回 · 白蘅 · 柳寄声 · 九人会证'
  )
});

function recordName(value, prefix) {
  return String(value || '').replace(new RegExp(`^${prefix}[·：:]?`), '').trim() || '未命名残页';
}

function inferredCause(value) {
  const name = recordName(value, '旧因');
  return cause(
    `${name}被带回酒馆时，至少还有一名执灯人记得它发生过。`,
    `这页来自本局亲历，而不是后来补写的传闻。酒馆保留了发现地点、带回者和与之相连的代价，使“${name}”不会只剩一个没有上下文的条目。`,
    '它尚未与全部旧案互相印证；再次遇到相同人、物或敌势时，若前后记录能够对上，这项旧因才会真正应验。',
    '本局见证 · 黑山酒馆见证簿'
  );
}

function oldCauseDetail(value) {
  const name = recordName(value, '旧因');
  const baseName = name.replace(/（[^）]+）$/, '');
  const lore = OLD_CAUSE_LORE[name] || OLD_CAUSE_LORE[baseName] || inferredCause(value);
  const witness = baseName !== name ? ` · 本次同行见证：${name.slice(baseName.length + 1, -1)}` : '';
  return freeze({
    eyebrow: '旧因详页',
    title: name,
    quote: lore.quote,
    sections: Object.freeze([
      freeze({ title: '这件事从哪里来', body: lore.story }),
      freeze({ title: '它会怎样影响后路', body: lore.meaning }),
      freeze({ title: '牵连的人与旧案', body: `${lore.related}${witness}` })
    ])
  });
}

const THEMES = Object.freeze([
  freeze({ terms: ['玄甲', '旧军', '护甲', '撕甲', '重击'], title: '旧军守势', story: '这条记录把首领的重击与旧军阵位对在一起：先看清点名与撕甲方向，再让护甲或援护承受那一下，反击才有落点。', related: '旧军残阵 · 封山令 · 岳沉碑' }),
  freeze({ terms: ['雷契', '破甲', '爆发', '抢攻'], title: '雷契先手', story: '雷契并非凭空增伤，而是趁旧印护势尚未合拢时先烧开缺口。若没有破甲或成势，后续爆发会被首领护命旧印吞掉。', related: '雷契旧债 · 赤遥 · 陆青箓' }),
  freeze({ terms: ['镇符', '压力', '处决', '高压'], title: '镇符缓势', story: '朱砂镇符能把逼命杀招压慢一息。把压力稳在可控范围，队伍就能避开额外追杀；这不是取消危险，而是争回一次回应的机会。', related: '朱砂镇符 · 玄狱 · 闻扶乩' }),
  freeze({ terms: ['伙伴', '同行', '援护', '点名'], title: '同行会证', story: '首领点名时，同行者能够分担冲击并唤回被咒印抹去的名字。前提是伙伴真实在场，且这份援护不是一枚空军牌。', related: '同行之誓 · 岳沉碑 · 酒馆见证簿' }),
  freeze({ terms: ['旧案', '证词', '结论', '线索', '抹除'], title: '旧案对证', story: '把来源不同的残页放在一起，能在首领改写结论之前保住一条会证记录。线索的作用不是预报数值，而是告诉队伍哪一句话不能再被抹掉。', related: '档案真相 · 闻扶乩 · 黑山残箓' }),
  freeze({ terms: ['血债', '低血', '血线'], title: '血债追偿', story: '血债让伤势变成短暂力量，也让首领低血时的最后反扑更危险。只有先看清承担者与债目，爆发才不会把同伴写成下一笔代偿。', related: '血债契约 · 赤遥 · 白蘅' }),
  freeze({ terms: ['逐影', '断名', '追痕', '旁证', '目标'], title: '逐影追牒', story: '追痕只在同一名有旁证的目标上累积。换目标会丢失足迹；证人若死去，断名就会退化成另一张无人核实的追杀名单。', related: '空名牒 · 苏雁回 · 第十封' }),
  freeze({ terms: ['归藏', '病案', '净化', '代价', '冲突记录'], title: '归藏返箓', story: '归藏保存的是完整记录，因此收益、伤害和来源都会一同返回。净化能剥去伪写，却不能删除已经由别人承担的真实代价。', related: '逆命簿 · 白蘅 · 万象归藏' }),
  freeze({ terms: ['无相', '移印', '借相', '失真', '身份', '名字'], title: '无相见证', story: '移印必须留下来源与去向，才能知道谁把敌意转给了谁。反复借相会让自身声音失真；伙伴的见证只能唤回选定名，不能替当事人定义身份。', related: '易面戏单 · 柳寄声 · 无相移印' }),
  freeze({ terms: ['酒火', '长战', '恢复', '半血'], title: '炉火续命', story: '酒火在长战与低血时沿名字找回尚未散去的气息。它能恢复体力，却不会抹掉债印，也不能把已经发生的失败改写成胜利。', related: '炉火余温 · 黑山掌柜' })
]);

function themeFor(value) {
  const text = String(value || '');
  return THEMES.find((theme) => theme.terms.some((term) => text.includes(term))) || freeze({
    title: '旧案回声',
    story: '这条记录已经在真实行程中出现，并由酒馆保留了前后状态。它的意义要在相同敌势再次出现时由行动验证，而不是由一行结论替玩家宣布。',
    related: '本局见证 · 黑山酒馆见证簿'
  });
}

function fulfillmentDetail(value) {
  const theme = themeFor(value);
  return freeze({
    eyebrow: '应验详页',
    title: recordName(value, '应验'),
    quote: String(value),
    sections: Object.freeze([
      freeze({ title: '为何算作应验', body: `先前带回的旧因在相同压力下再次发生，并且前后记录能够互相对上。${theme.story}` }),
      freeze({ title: '这次留下了什么', body: '应验会证明一项选择确实改变了后路，但不会把未发生的胜利补写进档案；伤势、债印和见证人状态仍按当时结果保留。' }),
      freeze({ title: '相关卷页', body: theme.related })
    ])
  });
}

function clueDetail(value) {
  const theme = themeFor(value);
  return freeze({
    eyebrow: '破局线索详页',
    title: String(value),
    quote: `“${String(value)}”不是传闻，而是一种已经被旧案与战斗共同验证的破法。`,
    sections: Object.freeze([
      freeze({ title: '线索指向什么', body: theme.story }),
      freeze({ title: '进山时怎样利用', body: '让对应道脉先成势，并保住取得这条线索时所依赖的证词、护甲或同行关系；只记住结论而丢掉来源，首领仍能把它当成伪证。' }),
      freeze({ title: '相关卷页', body: theme.related })
    ])
  });
}

const ENDING_LORE = Object.freeze({
  '带回被守住的一页': cause('胜利不是把答案写成唯一，而是让一页证词活着回到酒馆。', '执灯人守过首领压迫，把本局真实发生的旧因、应验和破局线索带回见证簿。不同路线可以留下不同答案，酒馆不会替它们强行合并。', '这份结局会推进人物熟悉度与世界卷页，也可能成为后来卷宗的独立旁证。', '本局主角 · 同行伙伴 · 黑山酒馆'),
  '再无救援': cause('灯火曾照到这里一次，第二次倒下时，山路已不再回应。', '掌柜争来的撤路与补给已经真实走完，但旧伤或准备仍不足以撑过后续敌势。死亡不会被写成随机惩罚，也不会伪装成胜利。', '已经亲历并带回的证据仍会归档；未完成的应验与首领结论不会补写。', '黑山掌柜 · 濒死救援 · 本局债印'),
  '败退回酒馆': cause('人可以败退，证词不必跟着死在山里。', '队伍未能完成破局，但在撤离前保住了已经发生的选择、伤势和见证。酒馆记录失败从哪里开始，而不是把整局抹成零。', '败退会保留有限的旧因与人物熟悉度，让下一次进山有可核对的前情。', '本局主角 · 黑山酒馆见证簿')
});

function endingDetail(value) {
  const lore = ENDING_LORE[value] || cause(
    `${value}已经成为酒馆里一页有落款的结局。`,
    '这份结局保留了主角、路线、同行者和最后一次选择。它不会替尚未发生的内容作证，也不会覆盖同一旧案的其他结局。',
    '后来者可以把它作为旁证，但仍需用另一条路线或另一名执灯人的亲历相互核对。',
    '人物档案 · 世界卷页 · 黑山酒馆'
  );
  return freeze({
    eyebrow: '结局详页',
    title: String(value),
    quote: lore.quote,
    sections: Object.freeze([
      freeze({ title: '这段结局发生了什么', body: lore.story }),
      freeze({ title: '它留下的余波', body: lore.meaning }),
      freeze({ title: '相关卷页', body: lore.related })
    ])
  });
}

function fragmentDetail(value) {
  const text = String(value);
  const isBlackMountain = text.includes('黑山');
  return freeze({
    eyebrow: '真相碎片详页',
    title: text,
    quote: isBlackMountain ? '黑山不是藏着真相；黑山本身就是被写坏的真相。' : '碎片不是完整答案，只是再也不能被轻易抹去的一角。',
    sections: Object.freeze([
      freeze({ title: '目前能够确认', body: isBlackMountain ? '旧案证词、死者遗言和失败记录被写进残箓，山体因此像一座会呼吸的档案库。地下雷声更像封存口供，而非天意。' : '这份碎片已经由至少一次真实结算带回，来源与见证者仍被保留。' }),
      freeze({ title: '仍不能下定论', body: '碎片不能单独证明玄箓完整来源、司箓监现状或真正执笔者；这些答案仍需跨人物、跨路线会证。' }),
      freeze({ title: '相关卷页', body: isBlackMountain ? '黑山残箓 · 司箓监旧印 · 玄箓残页' : '空白卷宗 · 酒馆见证簿' })
    ])
  });
}

function metricItem(id, label, kicker, summary, detail) {
  return freeze({ id, label, kicker, summary, detail });
}

function indexedItems(prefix, values, kicker, detailBuilder, labelBuilder = String) {
  return (values || []).map((value, index) => {
    const detail = detailBuilder(value);
    return metricItem(`${prefix}:${index}`, labelBuilder(value), kicker, detail.quote, detail);
  });
}

function nextPageRequirement(stage, expansionId) {
  const expansionRequirements = {
    E: '让三名执灯人的人物旧案各写到第四页，并至少带回一次胜局。那之后，酒馆门缝才会出现第一封不该存在的回牒。',
    F: '让苏雁回的旧案写到第二页；再由另一名执灯人见证空名牒，并在逐影断名的尽头保住一名活证人。',
    G: '让白蘅的旧案写到第二页；把两份互相冲突的记录一并带回，并让一名擅长封镇或照心的同行者共同见证万象归藏。',
    H: '让三名后来入馆者的旧案都写到第二页；六条山路各留下一次足迹，三份异文也都要有活人落款。',
    I: '让至少六名不同执灯人留下证词，其中包括三名后来入馆者；六条山路都需经受终局检验，三份异文各要两名独立见证。',
    J: '这一卷的答案已暂时落墨。继续补齐人物之间的十四组会证与不同结局，才能分辨旧印余波究竟由谁续写。'
  };
  if (expansionId && expansionRequirements[expansionId]) return expansionRequirements[expansionId];
  return [
    '选定一条入山之路，让山门记住你的第一步。',
    '在山路抉择中带回第一项旧因。',
    '让三项不同旧因在见证簿上彼此照面。',
    '找到一条能够真实改变首领战局的破局线索。',
    '让一次胜败完整落款，留下不可撤回的结局。',
    '让三份真相碎片互相会证，触及黑山真正的来历。',
    '黑山旧案已经落墨；继续沿空白卷宗追查余波。'
  ][stage];
}

function archiveCategoryDetail(title, quote, story, meaning) {
  return freeze({
    eyebrow: '卷宗总览', title, quote,
    sections: Object.freeze([
      freeze({ title: '这类记录是什么', body: story }),
      freeze({ title: '为什么需要继续追查', body: meaning })
    ])
  });
}

export function worldMetricModel(meta, metricId) {
  const world = meta?.worldProgress || {};
  const stage = loreStage(world);
  const current = blackMountainChapter(stage);
  const future = expansionStage(meta);
  const futurePlayer = blankDossierChapter(future.id);
  const oldCauses = world.oldCausesFound || [];
  const fulfillments = world.fulfillmentsSeen || [];
  const clues = world.bossCluesFound || [];
  const endings = world.endingsSeen || [];
  const truth = world.truthFragments || [];
  const dossiers = dossierCatalogs(meta);

  const models = {
    'archive-progress': freeze({
      title: '黑山旧案与空白卷宗',
      lead: `黑山旧案已写到“${current.seal}”；余波卷正在追问“${futurePlayer.title}”。每一类记录都可以展开查看，不再用一个百分比遮住缺页。`,
      sections: Object.freeze([freeze({ title: '四类归档', empty: '', items: Object.freeze([
        metricItem('archive:causes', '旧因', `${oldCauses.length} 项`, '发生过、能追溯来源的旧事。', archiveCategoryDetail('旧因', '旧因回答“这件事为什么会发生”。', '它必须来自玩家亲历的选择、遗物或证词，并保留带回者与上下文。', '旧因只有在后来相同压力下再次发生，才算应验。')),
        metricItem('archive:clues', '破局线索', `${clues.length} 条`, '已经能改变首领战局的破法。', archiveCategoryDetail('破局线索', '线索回答“下一次怎样不再重蹈覆辙”。', '它必须同时有旧案来源与战斗验证，不能只是一句数值提示。', '线索需要对应道脉、证词或同行关系仍在，才真正可用。')),
        metricItem('archive:endings', '结局', `${endings.length} 页`, '每一次完整胜败留下的落款。', archiveCategoryDetail('结局', '结局回答“这一次到底保住了什么”。', '胜利与失败都会保留真实发生的选择，但不会替未完成的内容作证。', '不同人物和路线能留下彼此冲突的结局，它们应被并排保存。')),
        metricItem('archive:truth', '真相碎片', `${truth.length} 份`, '跨人物、跨路线才能拼合的答案。', archiveCategoryDetail('真相碎片', '碎片回答“哪些事实再也不能被抹去”。', '它来自终局、旧印与卷宗的交叉证据，不等于完整真相。', '至少三份不同来源互相会证后，黑山旧案才会写到更深一卷。'))
      ]) })])
    }),
    'old-causes': freeze({
      title: `已发现旧因 · ${oldCauses.length}`,
      lead: '点击任意一项查看来历、后路影响和牵连人物；已经应验的记录也能单独展开。',
      sections: Object.freeze([
        freeze({ title: '旧因', empty: '尚未带回新的旧因。', items: Object.freeze(indexedItems('cause', oldCauses, '已归档', oldCauseDetail, (value) => recordName(value, '旧因'))) }),
        freeze({ title: '已经应验', empty: '尚无旧因在后路得到验证。', items: Object.freeze(indexedItems('fulfillment', fulfillments, '已应验', fulfillmentDetail)) })
      ])
    }),
    'boss-clues': freeze({
      title: `首领破局线索 · ${clues.length}`,
      lead: '每条线索都说明它来自哪一页旧案、如何改变战局，以及失去什么条件时会失效。',
      sections: Object.freeze([freeze({ title: '已确认破法', empty: '尚未确认破局线索；未发现内容仍被墨遮住。', items: Object.freeze(indexedItems('clue', clues, '可用于破局', clueDetail)) })])
    }),
    'character-dossiers': freeze({
      title: `人物档案 · ${dossiers.characters.unlocked} / ${dossiers.characters.total}`,
      lead: '九名执灯人的名字都已列入名册。已入馆者保留完整人物旧案；尚未入馆者只显露公开身份、来意与不剧透的寻访线索。',
      sections: Object.freeze([freeze({ title: '九人名册', empty: '', items: dossiers.characters.items })])
    }),
    routes: freeze({
      title: `路线档案 · ${dossiers.routes.unlocked} / ${dossiers.routes.total}`,
      lead: `六条山路都可以查阅。已入馆路线会说明所得、所舍与风险；尚未入馆路线只留下路名、疑问与开路线索。当前已有 ${dossiers.routes.walked} 条路线留下足迹。`,
      sections: Object.freeze([freeze({ title: '六路卷页', empty: '', items: dossiers.routes.items })])
    }),
    'artifact-dossiers': freeze({
      title: `物件档案 · ${dossiers.artifacts.unlocked} / ${dossiers.artifacts.total}`,
      lead: '三份会改写姓名、死期或身份的关键异文各有一页。未入馆时仍可查看传闻与线索；入馆后才会记录实际见证人与会证状态。',
      sections: Object.freeze([freeze({ title: '三份关键异文', empty: '', items: dossiers.artifacts.items })])
    }),
    endings: freeze({
      title: `已见结局 · ${endings.length}`,
      lead: '点击任意结局查看当时发生了什么、留下了什么余波，以及它能为后续旧案提供哪一种旁证。',
      sections: Object.freeze([freeze({ title: '有落款的结局', empty: '尚未留下完整结局。', items: Object.freeze(indexedItems('ending', endings, '已有落款', endingDetail)) })])
    }),
    'next-stage': freeze({
      title: '下一页何时显墨',
      lead: future.id === 'E' ? (world.nextHint || current.hint) : futurePlayer.question,
      sections: Object.freeze([freeze({ title: '卷首两问', empty: '', items: Object.freeze([
        metricItem('next:question', '余波在问什么', futurePlayer.title, futurePlayer.question, freeze({ eyebrow: '卷首疑问', title: futurePlayer.title, quote: futurePlayer.question, sections: Object.freeze([freeze({ title: '为何现在追问', body: '黑山旧案已有阶段性结论，但“记录反过来改变现实”的灾害没有随黑山一同消失。酒馆必须先保住互相矛盾、却能追溯来源的第二份记录。' }), freeze({ title: '此刻仍不能确认', body: '旧印残效、仿造者、幸存实验与司箓监残部都仍是假说；卷宗不会提前指定唯一幕后黑手。' })]) })),
        metricItem('next:unseal', '怎样让下一页显墨', current.seal, nextPageRequirement(stage, future.id), freeze({ eyebrow: '显墨条件', title: '让见证足够多，墨迹才会出现', quote: nextPageRequirement(stage, future.id), sections: Object.freeze([freeze({ title: '为什么需要这些见证', body: '玄箓会利用单一记录的权威改写现实。不同人物、路线与结局留下的独立证词越多，酒馆越能确认新页不是又一次伪写。' }), freeze({ title: '不会提前出现什么', body: '尚未入馆的人物、路线与卷宗姓名仍会保持模糊；玩家先见证事件，名册才会添页。' })]) }))
      ]) })])
    })
  };
  return models[metricId] || null;
}

export function firstWorldMetricEntryId(meta, metricId) {
  const model = worldMetricModel(meta, metricId);
  return model?.sections.flatMap((section) => section.items)[0]?.id || null;
}

export function worldMetricEntry(meta, metricId, entryId) {
  const model = worldMetricModel(meta, metricId);
  return model?.sections.flatMap((section) => section.items).find((item) => item.id === entryId) || null;
}
