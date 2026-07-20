import { R20_ROUTE_ASSETS } from '../../heishan_r20/data/assetRoles.js';
import { ALL_ROUTE_IDS, INITIAL_ROUTE_IDS } from './expansionCanon.js';

export const ROUTES = [
  { id: 'xuanjia', designId: 'route_physical_shell', archetype: 'physical', name: '玄甲破军', gain: '承压、格挡，并把守住的伤害转成反击。', sacrifice: '追击速度、先手窗口，并消耗一次门前筹备。', question: '谁被允许留在门内？', risk: '承压路线：撕甲频繁，稳守后反击。', bossId: 'boss-yaojiang', delta: { armor: 3, pressure: 4, bossPrep: -1 }, asset: R20_ROUTE_ASSETS.xuanjia },
  { id: 'leixue', designId: 'route_spell_bleed', archetype: 'spell', name: '雷血天罚', gain: '以血换雷，叠加风险后爆发。', sacrifice: '稳定血线与长期证词。', question: '谁能购买、延迟或转移惩罚？', risk: '高压路线：伤害更高，压力连锁更险。', bossId: 'boss-shanjun', delta: { damage: 2, pressure: 2 }, asset: R20_ROUTE_ASSETS.leixue },
  { id: 'zhenyu', designId: 'route_control_shell', archetype: 'control', name: '镇狱玄龟', gain: '禁锢、削弱、拖住压力并反震。', sacrifice: '推进速度与自由移动。', question: '保护从何时开始变成囚禁？', risk: '低压路线：推进慢，保住案卷与准备。', bossId: 'boss-heishan', delta: { armor: 1, pressure: 0, clues: 1 }, asset: R20_ROUTE_ASSETS.zhenyu },
  { id: 'zhuoying', designId: 'route_physical_trace', archetype: 'physical', name: '逐影断名', gain: '锁定一个有旁证的目标，连续追击并打开断名窗口。', sacrifice: '换目标会失去追痕；追击可能错过保护证人的时机。', question: '名单上的目标是否就是真凶？', risk: '追击路线：同一目标越追越强，转火或中断会清空追痕。', bossId: 'boss-yaojiang', delta: { damage: 2, armor: -1 }, asset: R20_ROUTE_ASSETS.zhuoying },
  { id: 'guizang', designId: 'route_spell_archive', archetype: 'spell', name: '万象归藏', gain: '保存、比对、净化，并重放一条已经见证的规则。', sacrifice: '收益和未处理的代价会一起返回。', question: '保存真相是否也会保存伤害？', risk: '归档路线：偶数轮重放攻势，但返箓会额外积累压力。', bossId: 'boss-shanjun', delta: { damage: 1, pressure: 1, clues: 1 }, asset: R20_ROUTE_ASSETS.guizang },
  { id: 'wuxiang', designId: 'route_control_imprint', archetype: 'control', name: '无相移印', gain: '借相并转移敌方意图，使一次攻击认错目标。', sacrifice: '每次移印都会积累失真，规则来源越来越不可靠。', question: '身份和罪责能否被一枚印章转给别人？', risk: '移印路线：前段削弱来袭，重复借相会把压力留在自己身上。', bossId: 'boss-heishan', delta: { pressure: -1, clues: 1 }, asset: R20_ROUTE_ASSETS.wuxiang }
];

export const RECOVERY_CANON_ROUTE_IDS = [...INITIAL_ROUTE_IDS];
export const RECOVERY_CANON_ROUTES = RECOVERY_CANON_ROUTE_IDS
  .map((id) => ROUTES.find((route) => route.id === id));

export function getRoute(id) {
  return ROUTES.find((route) => route.id === id) || RECOVERY_CANON_ROUTES[0];
}

export const ALL_CANON_ROUTE_IDS = [...ALL_ROUTE_IDS];
export const ALL_CANON_ROUTES = ALL_CANON_ROUTE_IDS.map((id) => ROUTES.find((route) => route.id === id));

export function routesForRun(run) {
  const ids = Array.isArray(run?.availableRouteIds) ? run.availableRouteIds : RECOVERY_CANON_ROUTE_IDS;
  return ids.map((id) => ROUTES.find((route) => route.id === id)).filter(Boolean);
}
