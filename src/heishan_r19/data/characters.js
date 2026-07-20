import { ALL_CHARACTER_IDS, INITIAL_CHARACTER_IDS } from './expansionCanon.js';

export const CHARACTERS = [
  { id: 'shen-li', name: '沈砺', epithet: '断锋客', archetype: 'physical', role: '承压·护甲·反击', maxHp: 46, armor: 5, damage: 6, pressure: 2, mainDaomai: 'xuanjia', primaryRoute: 'zhuoying', secondaryRoutes: ['xuanjia'], unique: '开战护甲+4，高压时反击', line: '曾替错误卷宗杀人；如今先替死者留下名字。', question: '目标写在名单上，就一定是真凶吗？', asset: 'r20:portraits/shen-li.png' },
  { id: 'yue-chenbei', name: '岳沉碑', epithet: '负碑甲士', archetype: 'physical', role: '破军·挡线·压阵', maxHp: 48, armor: 4, damage: 6, pressure: 3, mainDaomai: 'xuanjia', primaryRoute: 'xuanjia', secondaryRoutes: ['zhenyu', 'zhuoying'], unique: '首次致命伤额外减免，首领门前筹备+1', line: '为阵亡者立碑，也学习让同伴共同承担。', question: '把所有人背在身上，是否也夺走了别人的选择？', asset: 'r20:portraits/yue-chenbei.png' },
  { id: 'lu-qinglu', name: '陆青箓', epithet: '引雷箓生', archetype: 'spell', role: '雷契·爆发·高风险', maxHp: 40, armor: 1, damage: 9, pressure: 3, mainDaomai: 'leiqi', primaryRoute: 'guizang', secondaryRoutes: ['leixue'], unique: '首轮雷伤+5，高压时承担反噬', line: '能听见雷中人语，也要尊重死者不愿被公开的声音。', question: '保存一段声音，是否也会重复它受害的瞬间？', asset: 'r20:portraits/lu-qinglu.png' },
  { id: 'chi-yao', name: '赤遥', epithet: '血雷巫女', archetype: 'spell', role: '血雷·追击·代价', maxHp: 41, armor: 1, damage: 9, pressure: 3, mainDaomai: 'xuezhai', primaryRoute: 'leixue', secondaryRoutes: ['guizang'], unique: '敌方低血时追加伤害，失血会增压', line: '拒绝让讨债者自己成为下一名掌籍官。', question: '谁有权决定一笔债该用多少血偿还？', asset: 'r20:portraits/chi-yao.png' },
  { id: 'wen-fuji', name: '闻扶乩', epithet: '照心先生', archetype: 'control', role: '预兆·控制·压力', maxHp: 42, armor: 2, damage: 6, pressure: 1, mainDaomai: 'jiuyan', primaryRoute: 'wuxiang', secondaryRoutes: ['zhenyu'], unique: '开局压力-1，预见一次特殊动作', line: '看得见自欺，却必须先取得被照见者的同意。', question: '看得见真相的人，是否天然有权让别人坦白？', asset: 'r20:portraits/wen-fuji.png' },
  { id: 'xuan-yu', name: '玄狱', epithet: '镇门人', archetype: 'control', role: '镇狱·护符·克制', maxHp: 44, armor: 3, damage: 6, pressure: 1, mainDaomai: 'zhenfu', primaryRoute: 'zhenyu', secondaryRoutes: ['xuanjia', 'wuxiang'], unique: '首领战压力-1，抵住一次黑山异动', line: '既是囚徒也是狱卒，开始把选择写进每一道门。', question: '谁决定开关，谁承担门后的后果？', asset: 'r20:portraits/xuan-yu.png' },
  { id: 'su-yanhui', name: '苏雁回', epithet: '追牒客', archetype: 'physical', role: '追痕·连击·断名', maxHp: 43, armor: 2, damage: 8, pressure: 2, mainDaomai: 'leiqi', primaryRoute: 'zhuoying', secondaryRoutes: ['xuanjia'], unique: '连续追击同一目标逐轮增伤；停下护证人可锁住断名窗口', visualKey: '削长脸·高束发·朱封信匣', line: '送达九封让活人消失的死讯，行囊里还留着写给自己的第十封。', question: '追上信使和保住活人证词，哪一件必须先做？', asset: 'r20:portraits/su-yanhui.png' },
  { id: 'bai-heng', name: '白蘅', epithet: '缀命医', archetype: 'spell', role: '藏方·返箓·净化', maxHp: 45, armor: 2, damage: 7, pressure: 1, mainDaomai: 'jiuhuo', primaryRoute: 'guizang', secondaryRoutes: ['leixue'], unique: '首次半血缀命恢复3；归藏重放收益时会一并返还代价', visualKey: '方圆风霜脸·灰发低辫·缀线药囊', line: '曾从命簿剪去一人死期，却看见另一空栏自行补上名字。', question: '救下一人之前，谁看见并同意了代偿？', asset: 'r20:portraits/bai-heng.png' },
  { id: 'liu-jisheng', name: '柳寄声', epithet: '借名伶', archetype: 'control', role: '借相·移印·失真', maxHp: 42, armor: 2, damage: 7, pressure: 1, mainDaomai: 'zhenfu', primaryRoute: 'wuxiang', secondaryRoutes: ['zhenyu'], unique: '首次移印削弱敌势；重复借相会积累失真压力', visualKey: '中性宽颧·短削发·三枚戏面', line: '戏中罪名吞掉了戏外姓名，于是主动选择“柳寄声”留给未来见证者。', question: '出生名消失以后，谁有权否认她选择的名字？', asset: 'r20:portraits/liu-jisheng.png' }
];

export const RECOVERY_CANON_CHARACTER_IDS = [...INITIAL_CHARACTER_IDS];

export const RECOVERY_CANON_CHARACTERS = RECOVERY_CANON_CHARACTER_IDS
  .map((id) => CHARACTERS.find((character) => character.id === id));

export const CHARACTER_IDS = [...RECOVERY_CANON_CHARACTER_IDS];

export const ALL_CANON_CHARACTER_IDS = [...ALL_CHARACTER_IDS];
export const ALL_CANON_CHARACTERS = ALL_CANON_CHARACTER_IDS.map((id) => CHARACTERS.find((character) => character.id === id));

export function charactersForRun(run) {
  const ids = Array.isArray(run?.availableCharacterIds) ? run.availableCharacterIds : RECOVERY_CANON_CHARACTER_IDS;
  return ids.map((id) => CHARACTERS.find((character) => character.id === id)).filter(Boolean);
}

export function getCharacter(id) {
  return ALL_CANON_CHARACTERS.find((character) => character.id === id) || RECOVERY_CANON_CHARACTERS[0];
}
