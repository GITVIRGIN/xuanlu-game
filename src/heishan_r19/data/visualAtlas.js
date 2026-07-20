import {
  BOSS_ASSETS,
  COMBAT_CUES,
  CONSEQUENCE_ICONS,
  ENEMY_ASSETS,
  ROUTE_ASSETS,
  SCENE_ASSETS,
  STATUS_ICONS,
  TAVERN_ICONS
} from './assets.js';

const entry = (id, name, description, asset) => Object.freeze({ id, name, description, asset });

export const VISUAL_ATLAS = Object.freeze({
  scenes: Object.freeze([
    entry('scene.home', '归山灯火', '雨夜山路之外，可返回的酒馆灯火。', SCENE_ASSETS.home),
    entry('scene.tavern', '黑山酒馆', '旧木梁、炭炉与未清的账。', SCENE_ASSETS.tavern),
    entry('scene.combat', '湿石山道', '雾层压低，留出交锋轮廓。', SCENE_ASSETS.combat),
    entry('scene.boss', '封山仪场', '旧门与朱砂天象围住终局。', SCENE_ASSETS.boss),
    entry('scene.archive', '旧案账房', '只收录已经能够核对的事实。', SCENE_ASSETS.archive),
    entry('scene.partner', '同行余温', '并置旧物记下同行而不替人落款。', SCENE_ASSETS.partner),
    entry('scene.rumor', '雨夜传闻', '半掩门与旧符只表示传闻，未作实证。', SCENE_ASSETS.rumor)
  ]),
  routes: Object.freeze([
    entry('route.xuanjia', '玄甲破军', '废军关、旧甲与沉重门轴。', ROUTE_ASSETS.xuanjia),
    entry('route.leixue', '雷血天罚', '雷痕山隘与焦土天光。', ROUTE_ASSETS.leixue),
    entry('route.zhenyu', '镇狱玄龟', '半淹狱祠、龟石与玉雾。', ROUTE_ASSETS.zhenyu),
    entry('route.zhuoying', '逐影断名', '空名牒、断足印与一路拖入雾中的追索链。', ROUTE_ASSETS.zhuoying),
    entry('route.guizang', '万象归藏', '互相冲突的病案、药柜与会返还代价的归档池。', ROUTE_ASSETS.guizang),
    entry('route.wuxiang', '无相移印', '雨中戏台、错认影子与不属于任何人的面具。', ROUTE_ASSETS.wuxiang)
  ]),
  ordinary: Object.freeze([
    entry('ordinary.old-army-sentinel', '旧军守影', '残甲、折枪与不对称肩甲。', ENEMY_ASSETS['ordinary.old-army-sentinel']),
    entry('ordinary.archive-wraith', '案卷游魂', '残页束带、空袖与账册轮廓。', ENEMY_ASSETS['ordinary.archive-wraith']),
    entry('ordinary.beast-hunter', '山猎伏兽', '猎夹、兽影与低伏重心。', ENEMY_ASSETS['ordinary.beast-hunter']),
    entry('ordinary.thunder-debt-revenant', '雷契债鬼', '焦骨、铜契链与雷痕。', ENEMY_ASSETS['ordinary.thunder-debt-revenant']),
    entry('ordinary.kiln-ash-effigy', '窑灰陶偶', '破陶躯、窑火胸腔与灰臂。', ENEMY_ASSETS['ordinary.kiln-ash-effigy']),
    entry('ordinary.root-marsh-demon', '泽根藤妖', '湿根、石壳与潭泥下肢。', ENEMY_ASSETS['ordinary.root-marsh-demon']),
    entry('ordinary.lantern-ferryman', '引魂摆渡', '长篙、冷灯与尸布。', ENEMY_ASSETS['ordinary.lantern-ferryman']),
    entry('ordinary.nail-blade-executioner', '钉刃刑客', '巨钉、霜刃与木刑具。', ENEMY_ASSETS['ordinary.nail-blade-executioner'])
  ]),
  elite: Object.freeze([
    entry('elite.war-banner-enforcer', '军旗令使', '牙旗、厚甲与长柄军械。', ENEMY_ASSETS['elite.war-banner-enforcer']),
    entry('elite.debt-magistrate', '债印司箓', '铜秤、契卷与锁链。', ENEMY_ASSETS['elite.debt-magistrate']),
    entry('elite.prison-stone-lord', '镇狱石君', '龟甲石盾、钉封柱与低重心。', ENEMY_ASSETS['elite.prison-stone-lord']),
    entry('elite.lantern-psychopomp', '引魂灯主', '舵杖、双灯与渡船残木。', ENEMY_ASSETS['elite.lantern-psychopomp']),
    entry('elite.wild-hunt-lord', '山野猎王', '虎狼首、藤角与猎主披挂。', ENEMY_ASSETS['elite.wild-hunt-lord']),
    entry('elite.kiln-archive-aberration', '窑卷异形', '窑冠、铜钱肢与燃烧档页。', ENEMY_ASSETS['elite.kiln-archive-aberration'])
  ]),
  bosses: Object.freeze([
    entry('boss.yaojiang', '妖将', '被败军执念与旧军册束缚的黑甲旧将。', BOSS_ASSETS['boss-yaojiang']),
    entry('boss.shanjun', '山君', '山野秩序中的虎形猎主。', BOSS_ASSETS['boss-shanjun']),
    entry('boss.heishan', '黑山老妖', '由山石、根系与封存符契构成的守卷者。', BOSS_ASSETS['boss-heishan'])
  ]),
  tavernSymbols: Object.freeze([
    entry('icon.tavern.heal', '炉火包扎', '恢复与缓压。', TAVERN_ICONS.heal),
    entry('icon.tavern.prep', '擦拭旧甲', '整备护甲。', TAVERN_ICONS.prep),
    entry('icon.tavern.intel', '打听旧案', '取得破局线索。', TAVERN_ICONS.intel),
    entry('icon.tavern.ward', '压镇符', '封住压力。', TAVERN_ICONS.ward),
    entry('icon.tavern.recruit', '招募同行', '邀请伙伴入队。', TAVERN_ICONS.recruit),
    entry('icon.tavern.leave', '离开酒馆', '结束修整，回到山路。', TAVERN_ICONS.leave),
    entry('icon.tavern.revive', '重描扶魂符', '为战内复起同行者备下一次机会。', TAVERN_ICONS.revive)
  ]),
  combatSymbols: Object.freeze(Object.values(COMBAT_CUES).map((cue) => entry(`fx.${cue.key}`, cue.label, '战斗日志会同时给出文字说明。', cue.asset))),
  statusSymbols: Object.freeze([
    entry('icon.status.life', '生命', '当前与最大生命。', STATUS_ICONS.life),
    entry('icon.status.armor', '护甲', '削减迎面伤害。', STATUS_ICONS.armor),
    entry('icon.status.damage', '伤害', '队伍基础攻势。', STATUS_ICONS.damage),
    entry('icon.status.pressure', '压力', '普通攻击不增压；敌方会放弃攻击专门施压，临界后下一轮未能稳息才会崩溃。', STATUS_ICONS.pressure),
    entry('icon.status.clue', '线索', '用于识别破局条件。', STATUS_ICONS.clue),
    entry('icon.status.rescue', '濒死救援', '每局有限的脱离机会。', STATUS_ICONS.rescue),
    entry('icon.status.revive', '扶魂符', '主角可放弃本轮攻击，让一名倒地同行者重新归阵。', STATUS_ICONS.revive)
  ]),
  consequenceSymbols: Object.freeze([
    entry('icon.consequence.immediate', '立即', '选择落定后的直接变化。', CONSEQUENCE_ICONS.immediate),
    entry('icon.consequence.daomai', '道脉', '本次选择推进的构筑方向。', CONSEQUENCE_ICONS.daomai),
    entry('icon.consequence.threshold', '成势将至', '下一层阈值与收益。', CONSEQUENCE_ICONS.threshold),
    entry('icon.consequence.old-cause', '旧因', '会进入本局记录的前因。', CONSEQUENCE_ICONS.oldCause),
    entry('icon.consequence.fulfillment', '应验', '旧因可能回应的时机。', CONSEQUENCE_ICONS.fulfillment),
    entry('icon.consequence.debt', '债印', '选择留下的代价。', CONSEQUENCE_ICONS.debt),
    entry('icon.consequence.clue', '破局线索', '首领机制的可读提示。', CONSEQUENCE_ICONS.clue)
  ])
});
