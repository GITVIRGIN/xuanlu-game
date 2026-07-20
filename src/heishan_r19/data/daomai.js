export const THRESHOLDS = [1, 3, 5, 7];

export const DAOMAI = {
  xuanjia: {
    id: 'xuanjia', name: '玄甲', direction: '减伤·破甲·稳守', weakness: '缺少主动爆发',
    benefits: { 1: '来袭威力 -1', 3: '攻击额外破甲 1', 5: '来袭威力 -2', 7: '来袭威力 -4' },
    stages: {
      1: { title: '承势', mechanic: '敌方每次攻击的威力降低 1。', modifiers: { incomingPowerReduction: 1 } },
      3: { title: '破阵', mechanic: '主角每次攻击额外削减 1 点敌方护甲；本线计入成势，门前破局把握 +5。', modifiers: { armorBreakBonus: 1, bossPreparationScore: 5 } },
      5: { title: '镇甲', mechanic: '敌方每次攻击的威力降低量提高为 2。', modifiers: { incomingPowerReduction: 2 } },
      7: { title: '不动', mechanic: '敌方每次攻击的威力降低量提高为 4，且来袭破甲再减少 2。', modifiers: { incomingPowerReduction: 4, incomingArmorBreakReduction: 2 } }
    }
  },
  leiqi: {
    id: 'leiqi', name: '雷契', direction: '增伤·先手·破甲', weakness: '没有减伤与恢复',
    scaling: { attackPowerBonus: { perPoint: 1, cap: 3 } },
    benefits: { 1: '攻击威力 +1', 3: '攻击威力 +3', 5: '攻击额外破甲 1', 7: '首击威力再 +3' },
    stages: {
      1: { title: '引雷', mechanic: '1—2 点期间，每点雷契使主角攻击威力 +1。', modifiers: { attackPowerBonus: 1 } },
      3: { title: '雷走', mechanic: '主角每次攻击的威力加成提高为 3；本线计入成势，门前破局把握 +5。', modifiers: { attackPowerBonus: 3, bossPreparationScore: 5 } },
      5: { title: '裂甲', mechanic: '主角每次攻击额外削减 1 点敌方护甲。', modifiers: { armorBreakBonus: 1 } },
      7: { title: '天罚', mechanic: '每场战斗的第一击额外获得 3 点威力。', modifiers: { openingPowerBonus: 3 } }
    }
  },
  jiuyan: {
    id: 'jiuyan', name: '旧案', direction: '线索·首领预判·破局', weakness: '普通战没有直接收益',
    benefits: { 1: '首领线索计数 +1', 3: '首阶威力 +2', 5: '首阶威力 +5', 7: '首阶反击威力 -3' },
    stages: {
      1: { title: '辨伪', mechanic: '首领交锋前，破局线索计数额外 +1；不会伪造一条收藏记录。', modifiers: { bossClueBonus: 1 } },
      3: { title: '验案', mechanic: '首领战初势时，主角攻击威力提高 2；本线计入成势，门前破局把握 +5。', modifiers: { bossPhaseOnePowerBonus: 2, bossPreparationScore: 5 } },
      5: { title: '归卷', mechanic: '首领战初势时，主角攻击威力加成提高为 5。', modifiers: { bossPhaseOnePowerBonus: 5 } },
      7: { title: '先见', mechanic: '首领战初势时，首领反击威力降低 3。', modifiers: { bossPhaseOneIncomingReduction: 3 } }
    }
  },
  jiuhuo: {
    id: 'jiuhuo', name: '酒火', direction: '回血·续航·低血反击', weakness: '效果依赖半血触发',
    benefits: { 1: '首次半血恢复 2', 3: '首次半血恢复 4', 5: '半血攻击 +2', 7: '恢复 6 且攻击 +4' },
    stages: {
      1: { title: '余温', mechanic: '每场战斗第一次在受击后处于半血或以下时，恢复 2 点生命。', modifiers: { lowHealthHeal: 2 } },
      3: { title: '续杯', mechanic: '首次半血恢复提高为 4；本线计入成势，门前破局把握 +5。', modifiers: { lowHealthHeal: 4, bossPreparationScore: 5 } },
      5: { title: '回燃', mechanic: '主角处于半血或以下时，每次攻击额外获得 2 点威力。', modifiers: { lowHealthPowerBonus: 2 } },
      7: { title: '不熄', mechanic: '首次半血恢复提高为 6，半血攻击威力加成提高为 4。', modifiers: { lowHealthHeal: 6, lowHealthPowerBonus: 4 } }
    }
  },
  zhenfu: {
    id: 'zhenfu', name: '镇符', direction: '压力控制·削弱首领·抗破甲', weakness: '不直接提高伤害',
    benefits: { 1: '解锁镇符稳息', 3: '稳息减压 3', 5: '每战可稳息 2 次', 7: '临界前即可稳息' },
    stages: {
      1: { title: '定息', mechanic: '敌方专门增压少 1；压力达到 8 时，主角可放弃本轮攻击，以镇符稳息减压 2，每战一次。', modifiers: { pressureGainReduction: 1, pressureReliefThreshold: 8, pressureReliefAmount: 2, pressureReliefUses: 1 } },
      3: { title: '封势', mechanic: '镇符稳息减压提高为 3；首领攻击威力降低 2。本线计入成势，门前破局把握 +5。', modifiers: { pressureReliefThreshold: 8, pressureReliefAmount: 3, pressureReliefUses: 1, bossIncomingPowerReduction: 2, bossPreparationScore: 5 } },
      5: { title: '镇门', mechanic: '镇符稳息每战可使用两次；敌方攻击造成的破甲减少 1，最低降到 0。', modifiers: { pressureReliefThreshold: 8, pressureReliefAmount: 3, pressureReliefUses: 2, incomingArmorBreakReduction: 1 } },
      7: { title: '压境', mechanic: '压力达到 7 即可稳息并减压 4；敌方单次专门增压最多增加 1，首领攻击威力降低 4。', modifiers: { pressureGainReduction: 1, pressureGainCap: 1, pressureReliefThreshold: 7, pressureReliefAmount: 4, pressureReliefUses: 2, bossIncomingPowerReduction: 4 } }
    }
  },
  xuezhai: {
    id: 'xuezhai', name: '血债', direction: '低血爆发·快速压线', weakness: '必须承担低血风险',
    benefits: { 1: '半血攻击 +2', 3: '半血攻击 +4', 5: '敌方残血攻击 +3', 7: '两项加成继续提高' },
    stages: {
      1: { title: '借命', mechanic: '主角处于半血或以下时，每次攻击额外获得 2 点威力。', modifiers: { lowHealthPowerBonus: 2 } },
      3: { title: '催债', mechanic: '半血攻击威力加成提高为 4；本线计入成势，门前破局把握 +5。', modifiers: { lowHealthPowerBonus: 4, bossPreparationScore: 5 } },
      5: { title: '压线', mechanic: '敌方处于 35% 生命或以下时，主角每次攻击额外获得 3 点威力。', modifiers: { enemyLowHealthPowerBonus: 3 } },
      7: { title: '偿尽', mechanic: '半血攻击威力加成提高为 6，敌方残血攻击威力加成提高为 5；两项可同时生效。', modifiers: { lowHealthPowerBonus: 6, enemyLowHealthPowerBonus: 5 } }
    }
  },
  partner: {
    id: 'partner', name: '伙伴', direction: '协击·援护·全队联动', weakness: '没有同行者时无法触发',
    scaling: { basicActionBonus: { perPoint: 1, cap: 2 } },
    benefits: { 1: '基础行动效果 +1', 3: '解锁额外合击', 5: '首次援护减伤 3', 7: '全员同阵合击' },
    stages: {
      1: { title: '并肩', mechanic: '同行者原本就会依自身本领行动；1—2 点期间，每点使其基础行动效果 +1。', modifiers: { basicActionBonus: 1 } },
      3: { title: '合击', mechanic: '主角出手后，一名存活同行者追加一次合击；本线计入成势，门前破局把握 +5。', modifiers: { basicActionBonus: 2, comboPower: 3, bossPreparationScore: 5 } },
      5: { title: '援护', mechanic: '每场战斗第一次敌方来袭前，首位可援护的同行者改变受击目标，并使该次伤害降低 3。', modifiers: { basicActionBonus: 2, comboPower: 3, firstGuardReduction: 3 } },
      7: { title: '同阵', mechanic: '每轮由全部存活同行者依加入顺序追加合击；基础行动仍各自照常发生。', modifiers: { basicActionBonus: 2, comboPower: 4, firstGuardReduction: 3, allPartnersCombo: true } }
    }
  }
};

export const DAOMAI_IDS = Object.keys(DAOMAI);

export function emptyDaomai() {
  return Object.fromEntries(DAOMAI_IDS.map((id) => [id, 0]));
}

export function crossedThresholds(before, after, id) {
  return THRESHOLDS.filter((threshold) => before < threshold && after >= threshold).map((threshold) => ({
    id,
    threshold,
    line: DAOMAI[id].name,
    benefit: DAOMAI[id].benefits[threshold]
  }));
}

export function nextThreshold(value) {
  return THRESHOLDS.find((threshold) => threshold > value) ?? null;
}

export function currentThreshold(value) {
  return [...THRESHOLDS].reverse().find((threshold) => value >= threshold) ?? 0;
}

export function daomaiEffectValue(id, modifier, value) {
  const line = DAOMAI[id];
  if (!line) return 0;
  let resolved = 0;
  for (const threshold of THRESHOLDS) {
    if (value < threshold) break;
    if (Object.hasOwn(line.stages[threshold].modifiers, modifier)) {
      resolved = line.stages[threshold].modifiers[modifier];
    }
  }
  const scaling = line.scaling?.[modifier];
  if (scaling) resolved = Math.max(Number(resolved) || 0, Math.min(value * scaling.perPoint, scaling.cap));
  return resolved;
}
