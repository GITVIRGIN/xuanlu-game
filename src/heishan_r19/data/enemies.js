import { R20_ENEMY_ASSETS } from '../../heishan_r20/data/assetRoles.js';

const ORDINARY_NAMES = [
  '门钉妖影','账页游魂','封条兽群','妖将部曲','山君爪影','黑山档案影','渡口尸傀','雷血债鬼',
  '镇狱石卒','司箓残吏','妖名蛊虫','断魂钉煞','灰烬行者','铜钱蛛','朱砂窑鬼','旧军阵魂',
  '封山藤妖','雷契收债','玄龟甲影','引魂灯怪','案卷抹手','妖将斥候','猎场犬妖','寒霜刀灵',
  '钉封木傀','渡厄船工','司箓封笔','黑山灯蛾','军牌锈魂','雷血脉煞','镇狱潭影','妖名残页',
  '断桥拦客','灰林游猎','铜窟守钱','窑火陶偶','旧账缠魂','藤缚山客','契约催收','龟甲滞煞',
  '幡下引者','抹除之手','斥候旗魂','犬牙猎影','霜刃独行','钉桩木煞','船头掌灯','封笔断句'
];

const ELITE_NAMES = [
  '封山令使','雷血债主','镇狱龟将','引魂舵首','司箓监令','档案抹官','妖将牙旗','山君头狼',
  '断魂钉宗','灰烬祭主','铜钱蛛母','朱砂窑君','旧军阵将','藤妖之王','契约判官','玄龟甲君',
  '引魂灯主','案卷主笔','斥候统领','猎场巡王','寒霜刀宗','钉封巧匠','渡厄摆渡','封笔御史'
];

const ORDINARY_ARCHETYPE_GROUPS = Object.freeze({
  'ordinary.old-army-sentinel': ['门钉妖影','妖将部曲','镇狱石卒','旧军阵魂','妖将斥候','军牌锈魂'],
  'ordinary.archive-wraith': ['账页游魂','黑山档案影','司箓残吏','案卷抹手','司箓封笔','妖名残页','旧账缠魂','抹除之手','封笔断句'],
  'ordinary.beast-hunter': ['封条兽群','山君爪影','妖名蛊虫','铜钱蛛','猎场犬妖','黑山灯蛾','灰林游猎','犬牙猎影','铜窟守钱'],
  'ordinary.thunder-debt-revenant': ['雷血债鬼','雷契收债','断魂钉煞','雷血脉煞','契约催收'],
  'ordinary.kiln-ash-effigy': ['灰烬行者','朱砂窑鬼','窑火陶偶'],
  'ordinary.root-marsh-demon': ['封山藤妖','玄龟甲影','镇狱潭影','藤缚山客','龟甲滞煞'],
  'ordinary.lantern-ferryman': ['渡口尸傀','引魂灯怪','渡厄船工','幡下引者','船头掌灯'],
  'ordinary.nail-blade-executioner': ['寒霜刀灵','钉封木傀','断桥拦客','斥候旗魂','霜刃独行','钉桩木煞']
});

const ELITE_ARCHETYPE_GROUPS = Object.freeze({
  'elite.war-banner-enforcer': ['封山令使','妖将牙旗','旧军阵将','斥候统领'],
  'elite.debt-magistrate': ['雷血债主','司箓监令','契约判官','封笔御史'],
  'elite.prison-stone-lord': ['镇狱龟将','断魂钉宗','玄龟甲君','钉封巧匠'],
  'elite.lantern-psychopomp': ['引魂舵首','引魂灯主','案卷主笔','渡厄摆渡'],
  'elite.wild-hunt-lord': ['山君头狼','藤妖之王','猎场巡王','寒霜刀宗'],
  'elite.kiln-archive-aberration': ['档案抹官','灰烬祭主','铜钱蛛母','朱砂窑君']
});

function archetypeIndex(groups) {
  return new Map(Object.entries(groups).flatMap(([archetype, names]) => names.map((name) => [name, archetype])));
}

const ORDINARY_ARCHETYPE_BY_NAME = archetypeIndex(ORDINARY_ARCHETYPE_GROUPS);
const ELITE_ARCHETYPE_BY_NAME = archetypeIndex(ELITE_ARCHETYPE_GROUPS);

export const ENEMIES = ORDINARY_NAMES.map((name, index) => {
  const archetype = ORDINARY_ARCHETYPE_BY_NAME.get(name);
  return {
    id: `enemy-${String(index + 1).padStart(2, '0')}`,
    name,
    tier: 'ordinary',
    archetype,
    assetRole: archetype,
    maxHp: 32 + ((index * 5) % 14),
    armor: 2 + (index % 4),
    attack: 8 + (index % 3),
    intent: index % 2 ? '试探血线并累积压力' : '先撕护甲，再压向队伍',
    asset: R20_ENEMY_ASSETS[archetype]
  };
});

export const ELITES = ELITE_NAMES.map((name, index) => {
  const archetype = ELITE_ARCHETYPE_BY_NAME.get(name);
  return {
    id: `elite-${String(index + 1).padStart(2, '0')}`,
    name,
    tier: 'elite',
    archetype,
    assetRole: archetype,
    maxHp: 58 + ((index * 7) % 15),
    armor: 6 + (index % 4),
    attack: 11 + (index % 3),
    intent: index % 2 ? '锁定旧案并发动精锐连击' : '重压护甲，逼迫队伍失位',
    asset: R20_ENEMY_ASSETS[archetype]
  };
});

export function enemyFor(seed, tier = 'ordinary') {
  const pool = tier === 'elite' ? ELITES : ENEMIES;
  return pool[Math.abs(seed) % pool.length];
}

export const ENEMY_ARCHETYPE_GROUPS = Object.freeze({
  ordinary: ORDINARY_ARCHETYPE_GROUPS,
  elite: ELITE_ARCHETYPE_GROUPS
});
