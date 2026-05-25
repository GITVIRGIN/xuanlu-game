import { cards, shopItems } from "../src/core/data.js";
import { createRunGoal, markSpecialGoalBaseline } from "../src/core/goals.js";
import { prepareRouteChoice } from "../src/core/nodes.js";
import { reduceGame } from "../src/core/reducer.js";
import { createInitialState, startRun } from "../src/core/state.js";

const STYLE_IDS = ["physical", "spell", "bleed", "poison", "control"];
const args = parseArgs(process.argv.slice(2));
const runCount = Number(args.runs ?? args.n ?? 100);
const baseSeed = Number(args.seed ?? 2026052500);
const profile = String(args.profile ?? "balanced");

if (!Number.isFinite(runCount) || runCount <= 0) {
  throw new Error("runs must be a positive number");
}

const results = Array.from({ length: runCount }, (_, index) => runOne((baseSeed + index * 7919) >>> 0));
const summary = summarize(results);

if (args.json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  printSummary(summary);
}

function runOne(seed) {
  let state = seededRun(seed);
  let steps = 0;
  const metrics = {
    cardPlays: emptyStyleMap(),
    rewardPicks: emptyStyleMap(),
    maxStatuses: { bleed: 0, poison: 0, burn: 0, battleIntent: 0, spirit: 0 },
    minHp: Infinity,
    maxEnergy: state.run.maxEnergy,
    combats: 0,
    turns: 0,
  };

  while (state.phase !== "gameOver" && steps < 2500) {
    steps += 1;
    collectMetrics(state, metrics);

    if (state.phase === "route") {
      const node = chooseRouteNode(state.run);
      state = reduceGame(state, { type: "chooseNode", nodeId: node.id });
      if (state.phase === "combat") metrics.combats += 1;
      continue;
    }

    if (state.phase === "shop") {
      const item = chooseShopItem(state.run);
      state = item ? reduceGame(state, { type: "buyShopItem", itemId: item.id }) : reduceGame(state, { type: "leaveShop" });
      continue;
    }

    if (state.phase === "reward") {
      const reward = chooseRewardOption(state.run);
      recordReward(metrics, reward);
      state = reduceGame(state, { type: "chooseReward", rewardId: reward.id });
      continue;
    }

    if (state.phase === "combat") {
      const action = chooseCombatAction(state.run);
      if (action.type === "playCard") {
        const instance = state.run.combat.hand.find((card) => card.uid === action.cardUid);
        recordCardPlay(metrics, cards[instance?.cardId]);
      }
      if (action.type === "endTurn") metrics.turns += 1;
      state = reduceGame(state, action);
    }
  }

  collectMetrics(state, metrics);

  return {
    seed,
    phase: state.phase,
    floor: state.run?.floor ?? 0,
    won: Boolean(state.run?.goal?.completedBy),
    completedBy: state.run?.goal?.completedBy ?? "loss",
    deckSize: state.run?.deck.length ?? 0,
    relics: state.run?.relics.length ?? 0,
    maxEnergy: metrics.maxEnergy,
    steps,
    ...metrics,
  };
}

function seededRun(seed) {
  const state = startRun(createInitialState());
  state.run.seed = seed;
  state.run.goal = createRunGoal(seed);
  markSpecialGoalBaseline(state.run);
  return prepareRouteChoice(state);
}

function chooseRouteNode(run) {
  const choices = run.nodeChoices ?? [];
  const finalShop = choices.find((node) => node.id === "shop_final");
  const finalSide = choices.find((node) => node.id === "side_final");
  const shop = choices.find((node) => node.type === "shop");
  const side = choices.find((node) => node.type === "side");
  const main = choices.find((node) => node.type === "main") ?? choices[0];

  if (finalShop && run.gold >= 25) return finalShop;
  if (finalSide && run.hp >= run.maxHp * 0.35) return finalSide;
  if (shop && run.gold >= 35) return shop;
  if (side && run.hp >= run.maxHp * 0.55) return side;
  return main;
}

function chooseShopItem(run) {
  const affordable = (run.shopStock ?? [])
    .filter((item) => !item.sold && run.gold >= item.price)
    .map((item) => ({ ...item, score: shopScore(shopItems[item.id]) }))
    .sort((left, right) => right.score - left.score);
  return affordable[0] ?? null;
}

function chooseRewardOption(run) {
  return [...run.rewards].sort((left, right) => rewardScore(run, right) - rewardScore(run, left))[0];
}

function chooseCombatAction(run) {
  if (run.pendingChoice?.type === "discardPick") {
    const pick = run.combat.discardPile.find((card) => card.uid !== run.pendingChoice.sourceUid);
    return pick ? { type: "pickDiscardCard", cardUid: pick.uid } : { type: "cancelDiscardPick" };
  }

  const playable = run.combat.hand
    .map((instance) => ({ instance, card: cards[instance.cardId] }))
    .filter(({ card }) => run.energy >= card.cost && !(card.id === "meditate" && run.energy >= run.maxEnergy));

  if (playable.length === 0) return { type: "endTurn" };

  playable.sort((left, right) => combatScore(run, right.card) - combatScore(run, left.card));
  const best = playable[0];
  if (combatScore(run, best.card) < -50) return { type: "endTurn" };

  return {
    type: "playCard",
    cardUid: best.instance.uid,
    targetUid: preferredTarget(run)?.uid ?? null,
  };
}

function combatScore(run, card) {
  const target = preferredTarget(run);
  const targetBleed = statusValue(target, "bleed");
  const lowHp = run.hp <= run.maxHp * 0.35;
  let score = profileScore(card, 18);

  if (effectType(card, "damage") || effectType(card, "execute")) score += 20;
  if (effectType(card, "status")) score += 16;
  if (effectType(card, "amplifyDebuffs")) score += targetHasDebuff(target) ? 36 : -12;
  if (effectType(card, "block")) score += lowHp ? 42 : 8;
  if (effectType(card, "heal")) score += lowHp ? 55 : 8;
  if (effectType(card, "draw")) score += 10;
  if (effectType(card, "gainEnergy")) score += run.energy < run.maxEnergy ? 22 : -20;
  if (effectType(card, "recoverDiscard")) score += run.combat.discardPile.length > 0 ? 18 : -8;
  if (effectType(card, "loseHp")) score += lowHp ? -70 : -10;
  if (effectType(card, "bleedSiphon")) score += targetBleed >= 5 ? 70 : targetBleed >= 3 ? 25 : -25;
  if (card.id === "meditate" && run.energy >= run.maxEnergy) score -= 999;
  return score - card.cost * 3;
}

function rewardScore(run, reward) {
  if (reward.type === "heal") return run.hp <= run.maxHp * 0.45 ? 95 : 12;
  if (reward.type === "relic") return 74;
  if (reward.type === "gold") return 28;

  const card = cards[reward.value];
  let score = profileScore(card, 36) + rarityScore(card.rarity) + (card.grade ?? 1) * 10;
  if (effectType(card, "draw") || effectType(card, "gainEnergy")) score += 8;
  if (profile === "bleed" && effectType(card, "bleedSiphon")) score += 45;
  return score;
}

function shopScore(item) {
  if (!item) return 0;
  let score = 0;
  for (const effect of item.effects) {
    if (effect.type === "maxEnergy") score += 80 + effect.value * 30;
    if (effect.type === "rareCard") score += 62;
    if (effect.type === "relic") score += 58;
    if (effect.type === "handLimit") score += 48;
    if (effect.type === "maxHp") score += 40;
    if (effect.type === "deckLimit") score += 20;
    if (effect.type === "heal") score += 18;
  }
  return score;
}

function preferredTarget(run) {
  const enemies = run.combat?.enemies.filter((enemy) => enemy.hp > 0) ?? [];
  if (profile === "bleed") {
    return enemies.sort((left, right) => statusValue(right, "bleed") - statusValue(left, "bleed") || left.hp - right.hp)[0];
  }
  return enemies.sort((left, right) => left.hp - right.hp)[0];
}

function profileScore(card, weight) {
  if (!card?.style) return 0;
  if (profile === "balanced") return card.style === "physical" || card.style === "bleed" ? weight * 0.25 : weight * 0.15;
  return card.style === profile ? weight : 0;
}

function collectMetrics(state, metrics) {
  const run = state.run;
  if (!run) return;

  metrics.minHp = Math.min(metrics.minHp, run.hp);
  metrics.maxEnergy = Math.max(metrics.maxEnergy, run.maxEnergy);
  metrics.maxStatuses.battleIntent = Math.max(metrics.maxStatuses.battleIntent, statusValue({ statuses: run.statuses }, "battleIntent"));
  metrics.maxStatuses.spirit = Math.max(metrics.maxStatuses.spirit, statusValue({ statuses: run.statuses }, "spirit"));

  for (const enemy of run.combat?.enemies ?? []) {
    metrics.maxStatuses.bleed = Math.max(metrics.maxStatuses.bleed, statusValue(enemy, "bleed"));
    metrics.maxStatuses.poison = Math.max(metrics.maxStatuses.poison, statusValue(enemy, "poison"));
    metrics.maxStatuses.burn = Math.max(metrics.maxStatuses.burn, statusValue(enemy, "burn"));
  }
}

function recordCardPlay(metrics, card) {
  const style = card?.style ?? "neutral";
  metrics.cardPlays[style] = (metrics.cardPlays[style] ?? 0) + 1;
}

function recordReward(metrics, reward) {
  if (reward.type !== "card") return;
  const style = cards[reward.value]?.style ?? "neutral";
  metrics.rewardPicks[style] = (metrics.rewardPicks[style] ?? 0) + 1;
}

function summarize(items) {
  const count = (predicate) => items.filter(predicate).length;
  const avg = (values) => round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return {
    runs: items.length,
    profile,
    seed: baseSeed,
    winRate: ratio(count((item) => item.won), items.length),
    bossWinRate: ratio(count((item) => item.completedBy === "boss"), items.length),
    specialWinRate: ratio(count((item) => item.completedBy === "special"), items.length),
    lossRate: ratio(count((item) => !item.won), items.length),
    avgFinalFloor: avg(items.map((item) => item.floor)),
    avgDeckSize: avg(items.map((item) => item.deckSize)),
    avgRelics: avg(items.map((item) => item.relics)),
    avgMaxEnergy: avg(items.map((item) => item.maxEnergy)),
    avgCombats: avg(items.map((item) => item.combats)),
    avgTurnsEnded: avg(items.map((item) => item.turns)),
    avgMinHp: avg(items.map((item) => Number.isFinite(item.minHp) ? item.minHp : 0)),
    maxStatuses: {
      bleed: avg(items.map((item) => item.maxStatuses.bleed)),
      poison: avg(items.map((item) => item.maxStatuses.poison)),
      burn: avg(items.map((item) => item.maxStatuses.burn)),
      battleIntent: avg(items.map((item) => item.maxStatuses.battleIntent)),
      spirit: avg(items.map((item) => item.maxStatuses.spirit)),
    },
    cardPlays: mergeStyleMaps(items.map((item) => item.cardPlays)),
    rewardPicks: mergeStyleMaps(items.map((item) => item.rewardPicks)),
  };
}

function printSummary(summary) {
  console.log(`玄箓行发布前模拟：${summary.runs} 局 / profile=${summary.profile} / seed=${summary.seed}`);
  console.log(`胜率 ${pct(summary.winRate)}，Boss 通关 ${pct(summary.bossWinRate)}，特殊通关 ${pct(summary.specialWinRate)}，失败 ${pct(summary.lossRate)}`);
  console.log(`平均层数 ${summary.avgFinalFloor}，平均牌组 ${summary.avgDeckSize}，平均遗物 ${summary.avgRelics}，平均能量上限 ${summary.avgMaxEnergy}`);
  console.log(`状态峰值均值：流血 ${summary.maxStatuses.bleed}，毒瘴 ${summary.maxStatuses.poison}，灼烧 ${summary.maxStatuses.burn}，战意 ${summary.maxStatuses.battleIntent}，灵气 ${summary.maxStatuses.spirit}`);
  console.log(`出牌分布：${styleLine(summary.cardPlays)}`);
  console.log(`奖励选择：${styleLine(summary.rewardPicks)}`);
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      parsed[key] = value ?? true;
    }
  }
  return parsed;
}

function emptyStyleMap() {
  return Object.fromEntries([...STYLE_IDS, "neutral"].map((style) => [style, 0]));
}

function mergeStyleMaps(maps) {
  const result = emptyStyleMap();
  for (const map of maps) {
    for (const [style, value] of Object.entries(map)) {
      result[style] = (result[style] ?? 0) + value;
    }
  }
  return result;
}

function statusValue(fighter, statusId) {
  return fighter?.statuses?.find((status) => status.id === statusId)?.stacks ?? 0;
}

function targetHasDebuff(target) {
  return ["burn", "bleed", "poison", "curse", "chaos", "stasis"].some((status) => statusValue(target, status) > 0);
}

function effectType(card, type) {
  return card.effects.some((effect) => effect.type === type);
}

function rarityScore(rarity) {
  return { common: 4, rare: 12, epic: 22, legendary: 34 }[rarity] ?? 0;
}

function ratio(value, total) {
  return round(value / total);
}

function round(value) {
  return Number(value.toFixed(3));
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function styleLine(map) {
  return [...STYLE_IDS, "neutral"].map((style) => `${style} ${map[style] ?? 0}`).join(" / ");
}
