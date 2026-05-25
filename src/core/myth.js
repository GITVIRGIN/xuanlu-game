export const MYTH_FACTIONS = ["人间", "昆仑", "妖", "幽冥", "山海", "龙宫", "天庭", "洪荒"];
export const MYTH_MASTERY_MAX = 5;

const MIN_DOMINANT_SCORE = 3;
const BOOSTED_EFFECT_TYPES = new Set(["damage", "execute", "block", "heal", "status", "amplifyDebuffs", "thunderMark", "bleedSiphon", "shellReflect"]);

export function createMythMastery() {
  return Object.fromEntries(MYTH_FACTIONS.map((tag) => [tag, 0]));
}

export function migrateMythMastery(meta = {}) {
  meta.mythMastery = { ...createMythMastery(), ...(meta.mythMastery ?? {}) };

  for (const tag of Object.keys(meta.mythMastery)) {
    meta.mythMastery[tag] = clampLevel(meta.mythMastery[tag]);
  }

  return meta.mythMastery;
}

export function snapshotMythMastery(meta = {}) {
  return { ...migrateMythMastery(meta) };
}

export function ensureMythStats(run) {
  run.mythStats = run.mythStats ?? {};
  run.mythStats.plays = run.mythStats.plays ?? {};
  run.mythStats.lastAward = run.mythStats.lastAward ?? null;
  return run.mythStats;
}

export function recordMythCardPlay(run, card) {
  if (!run || !card?.mythTags?.length) return;

  const stats = ensureMythStats(run);
  const weight = round(1 + Math.max(0, card.cost ?? 0) * 0.35 + Math.max(0, (card.grade ?? 1) - 1) * 0.25);
  for (const tag of card.mythTags) {
    stats.plays[tag] = round((stats.plays[tag] ?? 0) + weight);
  }
}

export function dominantMythFaction(run) {
  const plays = ensureMythStats(run).plays;
  const ranked = Object.entries(plays)
    .filter(([, score]) => score > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-Hans"));

  if (ranked.length === 0 || ranked[0][1] < MIN_DOMINANT_SCORE) return null;
  return { tag: ranked[0][0], score: round(ranked[0][1]) };
}

export function awardMythMasteryForVictory(state) {
  const run = state.run;
  if (!run) return null;

  const dominant = dominantMythFaction(run);
  if (!dominant) return null;

  const mastery = migrateMythMastery(state.meta);
  const before = clampLevel(mastery[dominant.tag] ?? 0);
  const after = Math.min(MYTH_MASTERY_MAX, before + 1);
  mastery[dominant.tag] = after;

  const award = {
    ...dominant,
    before,
    after,
    maxed: before >= MYTH_MASTERY_MAX,
  };
  ensureMythStats(run).lastAward = award;
  run.mythMastery = { ...mastery };
  return award;
}

export function cardMythBoost(runOrMeta, card, fallbackMeta = null) {
  const mastery = runOrMeta?.mythMastery ?? fallbackMeta?.mythMastery ?? {};
  const tags = card?.mythTags ?? [];
  let tag = null;
  let level = 0;

  for (const item of tags) {
    const itemLevel = clampLevel(mastery[item] ?? 0);
    if (itemLevel > level) {
      tag = item;
      level = itemLevel;
    }
  }

  return {
    tag,
    level,
    numericBonus: level,
    statusBonus: Math.floor(level / 2),
    active: level > 0 && cardReceivesMythBoost(card),
  };
}

export function cardReceivesMythBoost(card) {
  return (card?.effects ?? []).some((effect) => BOOSTED_EFFECT_TYPES.has(effect.type));
}

export function mythAwardText(award) {
  if (!award) return "";
  if (award.maxed) {
    return `${award.tag}箓印已满，本局主修权重 ${award.score}。`;
  }
  return `${award.tag}箓印 +1（${award.after}/${MYTH_MASTERY_MAX}），下局同派系牌数值 +${award.after}，状态 +${Math.floor(award.after / 2)}。`;
}

function clampLevel(value) {
  return Math.max(0, Math.min(MYTH_MASTERY_MAX, Math.floor(Number(value) || 0)));
}

function round(value) {
  return Math.round(value * 10) / 10;
}
