export const MYTH_FACTIONS = ["人间", "昆仑", "妖", "幽冥", "山海", "龙宫", "天庭", "洪荒"];
export const MYTH_MASTERY_MAX = 5;
export const MYTH_MASTERY_TOTAL = MYTH_FACTIONS.length * MYTH_MASTERY_MAX;

const MIN_DOMINANT_SCORE = 3;
const BOOSTED_EFFECT_TYPES = new Set(["damage", "execute", "block", "heal", "status", "amplifyDebuffs", "thunderMark", "bleedSiphon", "shellReflect"]);
const STARTER_IMPRINT_CARD_IDS = new Set(["strike", "guard", "meditate"]);
const RARITY_IMPRINT_WEIGHT = {
  common: 0.35,
  rare: 1.1,
  epic: 1.6,
  legendary: 2.3,
};

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
  const weight = mythPlayWeight(card);
  if (weight <= 0) return;

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
  return awardMythMasteryForRunEnd(state, "boss");
}

export function awardMythMasteryForRunEnd(state, result) {
  const run = state.run;
  if (!run) return null;

  const dominant = dominantMythFaction(run);
  const points = mythMasteryPoints(run, result);
  if (points <= 0) return null;

  const mastery = migrateMythMastery(state.meta);
  const allocations = [];

  for (let index = 0; index < points; index += 1) {
    const preferred = index === 0 ? dominant?.tag : null;
    const tag = chooseAwardTarget(mastery, preferred, (run.seed ?? 0) + (run.floor ?? 0) + index);
    if (!tag) break;

    const before = clampLevel(mastery[tag] ?? 0);
    const after = Math.min(MYTH_MASTERY_MAX, before + 1);
    mastery[tag] = after;
    allocations.push({ tag, before, after });
  }

  if (allocations.length === 0) return null;

  const award = {
    result,
    points,
    dominant,
    allocations,
    tag: allocations[0].tag,
    score: dominant?.score ?? 0,
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
  if (!award.allocations?.length) {
    return "派系箓印已全满。";
  }

  const changes = award.allocations
    .map((item) => `${item.tag} +1（${item.after}/${MYTH_MASTERY_MAX}）`)
    .join("，");
  return `派系箓印：${changes}。`;
}

function mythPlayWeight(card) {
  if (STARTER_IMPRINT_CARD_IDS.has(card.id)) return 0;

  const rarityWeight = RARITY_IMPRINT_WEIGHT[card.rarity] ?? 0.3;
  const styleWeight = card.style ? 0.45 : 0;
  const gradeWeight = Math.max(0, (card.grade ?? 1) - 1) * 0.55;
  const costWeight = Math.max(0, card.cost ?? 0) * 0.2;
  return round(rarityWeight + styleWeight + gradeWeight + costWeight);
}

function mythMasteryPoints(run, result) {
  if (result === "boss" || result === "special") return 2;
  if (result === "defeat" && (run.floor ?? 0) >= 6) return 1;
  if (result === "abandon" && (run.floor ?? 0) >= 10) return 1;
  return 0;
}

function chooseAwardTarget(mastery, preferred, salt = 0) {
  if (preferred && clampLevel(mastery[preferred] ?? 0) < MYTH_MASTERY_MAX) {
    return preferred;
  }

  const candidates = MYTH_FACTIONS.filter((tag) => clampLevel(mastery[tag] ?? 0) < MYTH_MASTERY_MAX);
  if (candidates.length === 0) return null;

  const minLevel = Math.min(...candidates.map((tag) => clampLevel(mastery[tag] ?? 0)));
  const lowest = candidates.filter((tag) => clampLevel(mastery[tag] ?? 0) === minLevel);
  return lowest[Math.abs(salt) % lowest.length];
}

function clampLevel(value) {
  return Math.max(0, Math.min(MYTH_MASTERY_MAX, Math.floor(Number(value) || 0)));
}

function round(value) {
  return Math.round(value * 10) / 10;
}
