const BASE_SEQUENCE = [
  { id: 'gate', kind: 'choice', choiceId: 'gate', title: '山门下的第一盏灯', risk: 'story' },
  { id: 'reward-1', kind: 'reward', title: '封条后的战利', risk: 'normal' },
  { id: 'combat-1', kind: 'combat', title: '山道伏影', risk: 'high' },
  { id: 'tavern-1', kind: 'tavern', title: '黑山酒馆 · 山门灯下', risk: 'tavern-rumor' },
  { id: 'crossroads', kind: 'choice', choiceId: 'crossroads', title: '雾里的旧军阵', risk: 'story' },
  { id: 'reward-2', kind: 'reward', title: '旧军阵遗物', risk: 'normal' },
  { id: 'combat-2', kind: 'combat', title: '封山阻路', risk: 'high' },
  { id: 'oldcase', kind: 'choice', choiceId: 'oldcase', title: '黑山旧案残页', risk: 'story' },
  { id: 'elite-1', kind: 'elite', title: '精锐拦卷', risk: 'elite' },
  { id: 'reward-3', kind: 'reward', title: '精锐残留', risk: 'normal' },
  { id: 'tavern-2', kind: 'tavern', title: '黑山酒馆 · 雨檐歇脚', risk: 'tavern-rumor' },
  { id: 'witness-road', kind: 'choice', choiceId: 'witnessRoad', title: '无人认领的第三份口供', risk: 'story' },
  { id: 'combat-3', kind: 'combat', title: '雨夜追牒', risk: 'high' },
  { id: 'reward-4', kind: 'reward', title: '追牒人遗落的匣扣', risk: 'normal' },
  { id: 'pressure', kind: 'choice', choiceId: 'pressure', title: '妖气压山', risk: 'high' },
  { id: 'elite-2', kind: 'elite', title: '旧狱巡门使', risk: 'elite' },
  { id: 'echo-case', kind: 'choice', choiceId: 'echoCase', title: '会替人答话的案页', risk: 'story' },
  { id: 'tavern-3', kind: 'tavern', title: '黑山酒馆 · 石阶尽头', risk: 'tavern-rumor' },
  { id: 'reward-5', kind: 'reward', title: '第三盏灯下的旧物', risk: 'normal' },
  { id: 'combat-4', kind: 'combat', title: '首领前哨', risk: 'high' },
  { id: 'lastcase', kind: 'choice', choiceId: 'lastcase', title: '首领门前的证词', risk: 'story' },
  { id: 'elite-3', kind: 'elite', title: '封卷执刑者', risk: 'elite' },
  { id: 'reward-6', kind: 'reward', title: '封卷刃后的遗留', risk: 'normal' },
  { id: 'boss-tavern', kind: 'choice', choiceId: 'bossTavern', title: '首领门前 · 是否入酒馆修整', risk: 'tavern-rumor' },
  { id: 'boss-prep', kind: 'choice', choiceId: 'bossPrep', title: '首领门前的最后筹备', risk: 'boss' },
  { id: 'boss', kind: 'boss', title: '首领逼近', risk: 'boss' },
  { id: 'settlement', kind: 'settlement', title: '带回被守住的一页', risk: 'story' }
];

export const HOSTILE_NODE_KINDS = Object.freeze(['combat', 'elite', 'boss']);

export const COMBAT_PACING_POLICY = Object.freeze({
  early: Object.freeze({ sequenceFraction: 0.34, minimumBoundary: 5, rescueSafeNodes: 3 }),
  mid: Object.freeze({ sequenceFraction: 0.7, minimumBoundary: 12, rescueSafeNodes: 2 }),
  late: Object.freeze({ rescueSafeNodes: 1 }),
  allowedChainModes: Object.freeze(['late', 'choice-caused', 'resource-skirmish'])
});

function isHostile(node) {
  return HOSTILE_NODE_KINDS.includes(node?.kind);
}

export function runStageForNode(nodeIndex, sequenceLength = BASE_SEQUENCE.length) {
  const normalizedLength = Math.max(1, Number(sequenceLength) || BASE_SEQUENCE.length);
  const earlyBoundary = Math.max(
    COMBAT_PACING_POLICY.early.minimumBoundary,
    Math.ceil(normalizedLength * COMBAT_PACING_POLICY.early.sequenceFraction)
  );
  const midBoundary = Math.max(
    COMBAT_PACING_POLICY.mid.minimumBoundary,
    Math.ceil(normalizedLength * COMBAT_PACING_POLICY.mid.sequenceFraction)
  );
  if (nodeIndex < earlyBoundary) return 'early';
  if (nodeIndex < midBoundary) return 'mid';
  return 'late';
}

function allowedCombatChain(node, stage) {
  if (!node?.chainMode || !COMBAT_PACING_POLICY.allowedChainModes.includes(node.chainMode) || !node.chainReason) return false;
  if (node.chainMode === 'late') return stage === 'late';
  if (node.chainMode === 'choice-caused') return Boolean(node.playerChoiceId);
  return node.chainMode === 'resource-skirmish' && node.resourceSkirmish === true;
}

export function combatPacingAudit(sequence = BASE_SEQUENCE) {
  const pairs = [];
  const violations = [];
  let previous = null;
  sequence.forEach((node, index) => {
    if (!isHostile(node)) return;
    if (previous) {
      const safeNodes = index - previous.index - 1;
      const stage = runStageForNode(index, sequence.length);
      const chainAllowed = safeNodes > 0 || allowedCombatChain(node, stage);
      const pair = {
        from: previous.node.id,
        to: node.id,
        stage,
        safeNodes,
        chainMode: node.chainMode || null,
        chainReason: node.chainReason || null,
        allowed: chainAllowed
      };
      pairs.push(pair);
      if (!chainAllowed) violations.push(pair);
    }
    previous = { node, index };
  });
  return Object.freeze({ pairs: Object.freeze(pairs), violations: Object.freeze(violations), pass: violations.length === 0 });
}

export function planPostRescuePacing(sequence, sourceNodeIndex) {
  const stage = runStageForNode(sourceNodeIndex, sequence.length);
  const requiredSafeNodes = COMBAT_PACING_POLICY[stage].rescueSafeNodes;
  const nextHostileIndex = sequence.findIndex((node, index) => index > sourceNodeIndex && isHostile(node));
  const existingSafeNodes = nextHostileIndex < 0
    ? 0
    : sequence.slice(sourceNodeIndex + 1, nextHostileIndex).filter((node) => !isHostile(node) && node.kind !== 'settlement').length;
  const insertionCount = nextHostileIndex < 0 ? 0 : Math.max(0, requiredSafeNodes - existingSafeNodes);
  return Object.freeze({
    stage,
    sourceNodeIndex,
    sourceNodeId: sequence[sourceNodeIndex]?.id || 'unknown-combat',
    nextHostileIndex,
    nextHostileId: nextHostileIndex < 0 ? null : sequence[nextHostileIndex].id,
    requiredSafeNodes,
    existingSafeNodes,
    insertionCount
  });
}

export function applyPostRescuePacing(sequence, plan) {
  const next = sequence.map((node) => ({ ...node }));
  if (!plan || plan.insertionCount <= 0 || plan.nextHostileIndex < 0) return next;
  const recoveryNodes = Array.from({ length: plan.insertionCount }, (_, index) => ({
    id: `rescue-recovery-${plan.sourceNodeId}-${index + 1}`,
    kind: 'reward',
    title: '撤离路上的遗落补给',
    risk: 'relief',
    rescueRecovery: true,
    pacingSourceId: plan.sourceNodeId
  }));
  next.splice(plan.nextHostileIndex, 0, ...recoveryNodes);
  return next;
}

export function buildRunSequence() {
  return BASE_SEQUENCE.map((node) => ({ ...node }));
}

const EXPANSION_CHOICE_BY_ROUTE = Object.freeze({
  zhuoying: Object.freeze({ choiceId: 'emptyWrit', title: '仍活着的收件人' }),
  guizang: Object.freeze({ choiceId: 'reverseLedger', title: '早于病症的死期' }),
  wuxiang: Object.freeze({ choiceId: 'changingPlaybill', title: '戏单上的陌生罪名' })
});

const EXPANSION_ROUTE_BY_CHARACTER = Object.freeze({
  'su-yanhui': 'zhuoying',
  'bai-heng': 'guizang',
  'liu-jisheng': 'wuxiang'
});

export function bindExpansionStorySequence(sequence, characterId, routeId) {
  const storyRouteId = EXPANSION_ROUTE_BY_CHARACTER[characterId] || (EXPANSION_CHOICE_BY_ROUTE[routeId] ? routeId : null);
  const replacement = EXPANSION_CHOICE_BY_ROUTE[storyRouteId];
  if (!replacement) return sequence.map((node) => ({ ...node }));
  return sequence.map((node) => node.id === 'gate'
    ? { ...node, choiceId: replacement.choiceId, title: replacement.title, expansionStory: true }
    : { ...node });
}

export function traceFor(run) {
  if (run.nodeIndex < 0 || !run.sequence.length) {
    return { started: false, visited: [], current: [], future: [] };
  }
  const visited = run.sequence.slice(0, run.nodeIndex).map((node, index) => ({
    index,
    id: node.id,
    kind: node.kind,
    title: node.title,
    risk: node.risk
  }));
  const currentNode = run.sequence[run.nodeIndex];
  const futureNode = run.sequence[run.nodeIndex + 1];
  return {
    started: true,
    visited,
    current: currentNode ? [{ index: run.nodeIndex, id: currentNode.id, kind: currentNode.kind, title: currentNode.title, risk: currentNode.risk }] : [],
    future: futureNode ? [{ index: run.nodeIndex + 1, kind: 'unknown', title: '未知', risk: futureNode.risk }] : []
  };
}

export function tavernPacingAudit(sequence = BASE_SEQUENCE) {
  const taverns = sequence.map((node, index) => ({ node, index })).filter(({ node }) => node.kind === 'tavern');
  const openingTaverns = taverns.filter(({ index }) => index < 4).length;
  let minimumGap = Infinity;
  for (let index = 1; index < taverns.length; index += 1) {
    minimumGap = Math.min(minimumGap, taverns[index].index - taverns[index - 1].index - 1);
  }
  return {
    openingTaverns,
    consecutive: minimumGap === 0,
    minimumNonTavernGap: Number.isFinite(minimumGap) ? minimumGap : null,
    bossPreTavernOptional: sequence.some((node) => node.choiceId === 'bossTavern')
  };
}
