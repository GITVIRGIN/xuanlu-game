function role(id, kind, production, fallback = null, dimensions = null, format = 'png') {
  return Object.freeze({ id, kind, production: `r20:${production}`, fallback, dimensions, format });
}

function webpRole(id, kind, production, dimensions) {
  return role(id, kind, production, null, dimensions, 'webp');
}

export const ASSET_ROLES = Object.freeze({
  'scene.home': webpRole('scene.home', 'wide-scene', 'backgrounds/home/home-tavern-night.webp', '1536x1024'),
  'scene.tavern': webpRole('scene.tavern', 'wide-scene', 'backgrounds/tavern/tavern-interior.webp', '1536x1024'),
  'scene.combat': webpRole('scene.combat', 'wide-scene', 'backgrounds/combat/mountain-road.webp', '1536x1024'),
  'scene.boss': webpRole('scene.boss', 'wide-scene', 'backgrounds/combat/boss-summit.webp', '1536x1024'),
  'scene.archive': webpRole('scene.archive', 'wide-scene', 'backgrounds/story/archive-ledger-room.webp', '1536x1024'),
  'scene.partner': webpRole('scene.partner', 'wide-scene', 'backgrounds/story/partner-dawn-threshold.webp', '1536x1024'),
  'scene.rumor': webpRole('scene.rumor', 'wide-scene', 'backgrounds/story/rumor-rain-room.webp', '1536x1024'),
  'route.xuanjia': webpRole('route.xuanjia', 'route-scene', 'backgrounds/routes/xuanjia-old-gate.webp', '1536x1024'),
  'route.leixue': webpRole('route.leixue', 'route-scene', 'backgrounds/routes/leixue-thunder-pass.webp', '1536x1024'),
  'route.zhenyu': webpRole('route.zhenyu', 'route-scene', 'backgrounds/routes/zhenyu-prison-shrine.webp', '1536x1024'),
  'route.zhuoying': webpRole('route.zhuoying', 'route-scene', 'backgrounds/routes/zhuoying-death-notice-road.webp', '1536x1024'),
  'route.guizang': webpRole('route.guizang', 'route-scene', 'backgrounds/routes/guizang-archive-clinic.webp', '1536x1024'),
  'route.wuxiang': webpRole('route.wuxiang', 'route-scene', 'backgrounds/routes/wuxiang-borrowed-stage.webp', '1536x1024'),
  'boss.yaojiang': webpRole('boss.yaojiang', 'boss-cutout', 'bosses/yaojiang.webp', '1024x1536'),
  'boss.shanjun': webpRole('boss.shanjun', 'boss-cutout', 'bosses/shanjun.webp', '1024x1536'),
  'boss.heishan': webpRole('boss.heishan', 'boss-cutout', 'bosses/heishan-laoyao.webp', '1024x1536'),
  'ordinary.old-army-sentinel': webpRole('ordinary.old-army-sentinel', 'enemy-cutout', 'enemies/ordinary-old-army-sentinel.webp', '1024x1536'),
  'ordinary.archive-wraith': webpRole('ordinary.archive-wraith', 'enemy-cutout', 'enemies/ordinary-archive-wraith.webp', '1024x1536'),
  'ordinary.beast-hunter': webpRole('ordinary.beast-hunter', 'enemy-cutout', 'enemies/ordinary-beast-hunter.webp', '1024x1536'),
  'ordinary.thunder-debt-revenant': webpRole('ordinary.thunder-debt-revenant', 'enemy-cutout', 'enemies/ordinary-thunder-debt-revenant.webp', '1024x1536'),
  'ordinary.kiln-ash-effigy': webpRole('ordinary.kiln-ash-effigy', 'enemy-cutout', 'enemies/ordinary-kiln-ash-effigy.webp', '1024x1536'),
  'ordinary.root-marsh-demon': webpRole('ordinary.root-marsh-demon', 'enemy-cutout', 'enemies/ordinary-root-marsh-demon.webp', '1024x1536'),
  'ordinary.lantern-ferryman': webpRole('ordinary.lantern-ferryman', 'enemy-cutout', 'enemies/ordinary-lantern-ferryman.webp', '1024x1536'),
  'ordinary.nail-blade-executioner': webpRole('ordinary.nail-blade-executioner', 'enemy-cutout', 'enemies/ordinary-nail-blade-executioner.webp', '1024x1536'),
  'elite.war-banner-enforcer': webpRole('elite.war-banner-enforcer', 'elite-cutout', 'enemies/elite-war-banner-enforcer.webp', '1024x1536'),
  'elite.debt-magistrate': webpRole('elite.debt-magistrate', 'elite-cutout', 'enemies/elite-debt-magistrate.webp', '1024x1536'),
  'elite.prison-stone-lord': webpRole('elite.prison-stone-lord', 'elite-cutout', 'enemies/elite-prison-stone-lord.webp', '1024x1536'),
  'elite.lantern-psychopomp': webpRole('elite.lantern-psychopomp', 'elite-cutout', 'enemies/elite-lantern-psychopomp.webp', '1024x1536'),
  'elite.wild-hunt-lord': webpRole('elite.wild-hunt-lord', 'elite-cutout', 'enemies/elite-wild-hunt-lord.webp', '1024x1536'),
  'elite.kiln-archive-aberration': webpRole('elite.kiln-archive-aberration', 'elite-cutout', 'enemies/elite-kiln-archive-aberration.webp', '1024x1536'),
  'icon.tavern.heal': role('icon.tavern.heal', 'ui-icon', 'icons/tavern-actions/rest-wine.svg', null, '64x64', 'svg'),
  'icon.tavern.prep': role('icon.tavern.prep', 'ui-icon', 'icons/tavern-actions/polish-weapon.svg', null, '64x64', 'svg'),
  'icon.tavern.intel': role('icon.tavern.intel', 'ui-icon', 'icons/tavern-actions/ask-keeper.svg', null, '64x64', 'svg'),
  'icon.tavern.ward': role('icon.tavern.ward', 'ui-icon', 'icons/tavern-actions/seal-talisman.svg', null, '64x64', 'svg'),
  'icon.tavern.recruit': role('icon.tavern.recruit', 'ui-icon', 'icons/tavern-actions/recruit.svg', null, '64x64', 'svg'),
  'icon.tavern.leave': role('icon.tavern.leave', 'ui-icon', 'icons/tavern-actions/leave-road.svg', null, '64x64', 'svg'),
  'icon.tavern.revive': role('icon.tavern.revive', 'ui-icon', 'icons/tavern-actions/revive-seal.svg', null, '64x64', 'svg'),
  'icon.status.life': role('icon.status.life', 'status-icon', 'icons/status/life.svg', null, '64x64', 'svg'),
  'icon.status.armor': role('icon.status.armor', 'status-icon', 'icons/status/armor.svg', null, '64x64', 'svg'),
  'icon.status.damage': role('icon.status.damage', 'status-icon', 'icons/status/damage.svg', null, '64x64', 'svg'),
  'icon.status.pressure': role('icon.status.pressure', 'status-icon', 'icons/status/pressure.svg', null, '64x64', 'svg'),
  'icon.status.clue': role('icon.status.clue', 'status-icon', 'icons/status/clue.svg', null, '64x64', 'svg'),
  'icon.status.rescue': role('icon.status.rescue', 'status-icon', 'icons/status/rescue.svg', null, '64x64', 'svg'),
  'icon.status.revive': role('icon.status.revive', 'status-icon', 'icons/status/revive.svg', null, '64x64', 'svg'),
  'icon.consequence.immediate': role('icon.consequence.immediate', 'consequence-icon', 'icons/consequence/immediate.svg', null, '64x64', 'svg'),
  'icon.consequence.daomai': role('icon.consequence.daomai', 'consequence-icon', 'icons/consequence/daomai.svg', null, '64x64', 'svg'),
  'icon.consequence.threshold': role('icon.consequence.threshold', 'consequence-icon', 'icons/consequence/threshold.svg', null, '64x64', 'svg'),
  'icon.consequence.old-cause': role('icon.consequence.old-cause', 'consequence-icon', 'icons/consequence/old-cause.svg', null, '64x64', 'svg'),
  'icon.consequence.fulfillment': role('icon.consequence.fulfillment', 'consequence-icon', 'icons/consequence/fulfillment.svg', null, '64x64', 'svg'),
  'icon.consequence.debt': role('icon.consequence.debt', 'consequence-icon', 'icons/consequence/debt.svg', null, '64x64', 'svg'),
  'icon.consequence.clue': role('icon.consequence.clue', 'consequence-icon', 'icons/consequence/clue.svg', null, '64x64', 'svg'),
  'fx.intro': role('fx.intro', 'combat-cue', 'fx/intro.svg', null, '64x64', 'svg'),
  'fx.hit-slash': role('fx.hit-slash', 'combat-cue', 'fx/hit-slash.svg', null, '64x64', 'svg'),
  'fx.pressure-pulse': role('fx.pressure-pulse', 'combat-cue', 'fx/pressure-pulse.svg', null, '64x64', 'svg'),
  'fx.armor-break': role('fx.armor-break', 'combat-cue', 'fx/armor-break.svg', null, '64x64', 'svg'),
  'fx.ally-guard': role('fx.ally-guard', 'combat-cue', 'fx/ally-guard.svg', null, '64x64', 'svg'),
  'fx.ally-revive': role('fx.ally-revive', 'combat-cue', 'fx/ally-revive.svg', null, '64x64', 'svg'),
  'fx.boss-phase-red': role('fx.boss-phase-red', 'combat-cue', 'fx/boss-phase-red.svg', null, '64x64', 'svg'),
  'protagonist.shen-li': role('protagonist.shen-li', 'character-cutout', 'portraits/shen-li.png', null, '1024x1536'),
  'protagonist.yue-chenbei': role('protagonist.yue-chenbei', 'character-cutout', 'portraits/yue-chenbei.png', null, '1024x1536'),
  'protagonist.lu-qinglu': role('protagonist.lu-qinglu', 'character-cutout', 'portraits/lu-qinglu.png', null, '1024x1536'),
  'companion.chi-yao': role('companion.chi-yao', 'character-cutout', 'portraits/chi-yao.png', null, '1024x1536'),
  'companion.wen-fuji': role('companion.wen-fuji', 'character-cutout', 'portraits/wen-fuji.png', null, '1024x1536'),
  'companion.xuan-yu': role('companion.xuan-yu', 'character-cutout', 'portraits/xuan-yu.png', null, '1024x1536'),
  'protagonist.su-yanhui': role('protagonist.su-yanhui', 'character-cutout', 'portraits/su-yanhui.png', null, '1024x1536'),
  'protagonist.bai-heng': role('protagonist.bai-heng', 'character-cutout', 'portraits/bai-heng.png', null, '1024x1536'),
  'protagonist.liu-jisheng': role('protagonist.liu-jisheng', 'character-cutout', 'portraits/liu-jisheng.png', null, '1024x1536'),
  'downed.shen-li': webpRole('downed.shen-li', 'character-downed-cutout', 'portraits/downed/shen-li-downed.webp', '1024x1536'),
  'downed.yue-chenbei': webpRole('downed.yue-chenbei', 'character-downed-cutout', 'portraits/downed/yue-chenbei-downed.webp', '1024x1536'),
  'downed.lu-qinglu': webpRole('downed.lu-qinglu', 'character-downed-cutout', 'portraits/downed/lu-qinglu-downed.webp', '1024x1536'),
  'downed.chi-yao': webpRole('downed.chi-yao', 'character-downed-cutout', 'portraits/downed/chi-yao-downed.webp', '1024x1536'),
  'downed.wen-fuji': webpRole('downed.wen-fuji', 'character-downed-cutout', 'portraits/downed/wen-fuji-downed.webp', '1024x1536'),
  'downed.xuan-yu': webpRole('downed.xuan-yu', 'character-downed-cutout', 'portraits/downed/xuan-yu-downed.webp', '1024x1536'),
  'downed.su-yanhui': webpRole('downed.su-yanhui', 'character-downed-cutout', 'portraits/downed/su-yanhui-downed.webp', '1024x1536'),
  'downed.bai-heng': webpRole('downed.bai-heng', 'character-downed-cutout', 'portraits/downed/bai-heng-downed.webp', '1024x1536'),
  'downed.liu-jisheng': webpRole('downed.liu-jisheng', 'character-downed-cutout', 'portraits/downed/liu-jisheng-downed.webp', '1024x1536')
});

const PATH_TO_ROLE = new Map();
for (const entry of Object.values(ASSET_ROLES)) {
  PATH_TO_ROLE.set(entry.production, entry);
  if (entry.fallback) PATH_TO_ROLE.set(entry.fallback, entry);
}

export const R20_SCENE_ASSETS = Object.freeze({
  home: ASSET_ROLES['scene.home'].production,
  tavern: ASSET_ROLES['scene.tavern'].production,
  combat: ASSET_ROLES['scene.combat'].production,
  boss: ASSET_ROLES['scene.boss'].production,
  archive: ASSET_ROLES['scene.archive'].production,
  partner: ASSET_ROLES['scene.partner'].production,
  rumor: ASSET_ROLES['scene.rumor'].production
});

export const R20_ROUTE_ASSETS = Object.freeze({
  xuanjia: ASSET_ROLES['route.xuanjia'].production,
  leixue: ASSET_ROLES['route.leixue'].production,
  zhenyu: ASSET_ROLES['route.zhenyu'].production,
  zhuoying: ASSET_ROLES['route.zhuoying'].production,
  guizang: ASSET_ROLES['route.guizang'].production,
  wuxiang: ASSET_ROLES['route.wuxiang'].production
});

export const R20_BOSS_ASSETS = Object.freeze({
  'boss-yaojiang': ASSET_ROLES['boss.yaojiang'].production,
  'boss-shanjun': ASSET_ROLES['boss.shanjun'].production,
  'boss-heishan': ASSET_ROLES['boss.heishan'].production
});

export const R20_ENEMY_ASSETS = Object.freeze(Object.fromEntries(
  Object.values(ASSET_ROLES)
    .filter((entry) => entry.kind === 'enemy-cutout' || entry.kind === 'elite-cutout')
    .map((entry) => [entry.id, entry.production])
));

export const R20_TAVERN_ICON_ASSETS = Object.freeze({
  heal: ASSET_ROLES['icon.tavern.heal'].production,
  prep: ASSET_ROLES['icon.tavern.prep'].production,
  intel: ASSET_ROLES['icon.tavern.intel'].production,
  ward: ASSET_ROLES['icon.tavern.ward'].production,
  revive: ASSET_ROLES['icon.tavern.revive'].production,
  recruit: ASSET_ROLES['icon.tavern.recruit'].production,
  leave: ASSET_ROLES['icon.tavern.leave'].production
});

export const R20_STATUS_ICON_ASSETS = Object.freeze({
  life: ASSET_ROLES['icon.status.life'].production,
  armor: ASSET_ROLES['icon.status.armor'].production,
  damage: ASSET_ROLES['icon.status.damage'].production,
  pressure: ASSET_ROLES['icon.status.pressure'].production,
  clue: ASSET_ROLES['icon.status.clue'].production,
  rescue: ASSET_ROLES['icon.status.rescue'].production,
  revive: ASSET_ROLES['icon.status.revive'].production
});

export const R20_CONSEQUENCE_ICON_ASSETS = Object.freeze({
  immediate: ASSET_ROLES['icon.consequence.immediate'].production,
  daomai: ASSET_ROLES['icon.consequence.daomai'].production,
  threshold: ASSET_ROLES['icon.consequence.threshold'].production,
  oldCause: ASSET_ROLES['icon.consequence.old-cause'].production,
  fulfillment: ASSET_ROLES['icon.consequence.fulfillment'].production,
  debt: ASSET_ROLES['icon.consequence.debt'].production,
  clue: ASSET_ROLES['icon.consequence.clue'].production
});

export const R20_COMBAT_CUES = Object.freeze({
  intro: Object.freeze({ key: 'intro', label: '交锋', asset: ASSET_ROLES['fx.intro'].production }),
  'hit-slash': Object.freeze({ key: 'hit-slash', label: '斩击', asset: ASSET_ROLES['fx.hit-slash'].production }),
  'pressure-pulse': Object.freeze({ key: 'pressure-pulse', label: '压迫', asset: ASSET_ROLES['fx.pressure-pulse'].production }),
  'armor-break': Object.freeze({ key: 'armor-break', label: '破甲', asset: ASSET_ROLES['fx.armor-break'].production }),
  'ally-guard': Object.freeze({ key: 'ally-guard', label: '护持', asset: ASSET_ROLES['fx.ally-guard'].production }),
  'ally-revive': Object.freeze({ key: 'ally-revive', label: '扶魂', asset: ASSET_ROLES['fx.ally-revive'].production }),
  'boss-phase-red': Object.freeze({ key: 'boss-phase-red', label: '阶段', asset: ASSET_ROLES['fx.boss-phase-red'].production })
});

export const R20_DOWNED_ASSETS = Object.freeze({
  'shen-li': ASSET_ROLES['downed.shen-li'].production,
  'yue-chenbei': ASSET_ROLES['downed.yue-chenbei'].production,
  'lu-qinglu': ASSET_ROLES['downed.lu-qinglu'].production,
  'chi-yao': ASSET_ROLES['downed.chi-yao'].production,
  'wen-fuji': ASSET_ROLES['downed.wen-fuji'].production,
  'xuan-yu': ASSET_ROLES['downed.xuan-yu'].production,
  'su-yanhui': ASSET_ROLES['downed.su-yanhui'].production,
  'bai-heng': ASSET_ROLES['downed.bai-heng'].production,
  'liu-jisheng': ASSET_ROLES['downed.liu-jisheng'].production
});

export function getAssetRole(pathOrRoleId) {
  return ASSET_ROLES[pathOrRoleId] || PATH_TO_ROLE.get(pathOrRoleId) || null;
}
