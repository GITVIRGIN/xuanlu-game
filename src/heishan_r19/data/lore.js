export const FAMILIARITY_STAGES = ['未识', '相逢', '同行', '知旧', '入局', '大成'];
export const LORE_STAGES = ['未入黑山', '山门初启', '旧案浮出', '妖影成形', '首领逼近', '黑山真相', '余波与新局'];

export const LORE_HINTS = [
  '踏入黑山，揭开第一桩旧案。',
  '沿路寻访，旧因会自行浮现。',
  '收集更多旧因，妖影将成形。',
  '寻得破局线索，方能直面首领。',
  '击败首领或抵达结局，触及黑山真相。',
  '真相之后，仍有余波。',
  '新的一局，仍有未解残页。'
];

export function familiarityStage(points = 0) {
  if (points >= 15) return 5;
  if (points >= 10) return 4;
  if (points >= 6) return 3;
  if (points >= 3) return 2;
  if (points >= 1) return 1;
  return 0;
}

export function loreStage(world) {
  if ((world.endingsSeen || []).length && (world.truthFragments || []).length >= 3) return 6;
  if ((world.endingsSeen || []).length) return 5;
  if ((world.bossCluesFound || []).length) return 4;
  if ((world.oldCausesFound || []).length >= 3) return 3;
  if ((world.oldCausesFound || []).length) return 2;
  if ((world.routesSeen || []).length) return 1;
  return 0;
}

export function createDefaultMeta() {
  return {
    appliedRunIds: [],
    characterProgress: {
      'shen-li': {
        familiarity: 1,
        keyStorySeen: 1,
        keyStoryTotal: 5,
        clears: 0,
        bossEncounters: 0,
        endingsSeen: [],
        oldCausesSeen: ['旧因·旧军残阵'],
        bossCluesSeen: ['玄甲成势可抗妖将的撕甲连击'],
        lastRunSummary: '曾在山门下守住第一盏灯。'
      }
    },
    worldProgress: {
      loreStage: 1,
      oldCausesFound: ['旧因·旧军残阵'],
      fulfillmentsSeen: [],
      bossCluesFound: [],
      routesSeen: ['xuanjia'],
      endingsSeen: [],
      truthFragments: [],
      nextHint: LORE_HINTS[1]
    }
  };
}
