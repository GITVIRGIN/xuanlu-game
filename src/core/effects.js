import { cards, relics } from "./data.js";
import { drawCards, finishCombatIfWon } from "./combat.js";
import { addStatus, reduceConsumableDebuff, reduceStatus, statusLabel, statusStacks } from "./status.js";

const SPIRIT_BONUS_PER_COST = 4;
const PHYSICAL_INTENT_GAIN = 3;

function combatLog(state, text) {
  state.run?.combat?.log.push(text);
}

function playerFighter(run) {
  return {
    uid: "player",
    hp: run.hp,
    maxHp: run.maxHp,
    block: run.combat?.block ?? 0,
    statuses: run.statuses,
  };
}

function syncPlayerFighter(run, fighter) {
  run.hp = fighter.hp;
  if (run.combat) {
    run.combat.block = fighter.block;
  }
  run.statuses = fighter.statuses;
}

export function applyEffect(state, effect, targetUid) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat) return state;

  if (effect.type === "draw") {
    const drawn = drawCards(state, effect.value ?? 0);
    combatLog(state, `抽 ${drawn} 张牌。`);
    return finishCombatIfWon(state);
  }

  if (effect.type === "gainEnergy") {
    const before = run.energy;
    run.energy = Math.min(run.maxEnergy, run.energy + (effect.value ?? 0));
    combatLog(state, `获得 ${run.energy - before} 点能量。`);
    return finishCombatIfWon(state);
  }

  if (effect.type === "recoverDiscard") {
    startDiscardPick(state, effect.value ?? 1, effect.sourceUid);
    return finishCombatIfWon(state);
  }

  const targets = resolveTargets(run, effect.target, targetUid);

  if (effect.type === "bleedSiphon") {
    applyBleedSiphon(state, targets, effect);
    return finishCombatIfWon(state);
  }

  if (effect.type === "shellReflect") {
    applyShellReflect(state, targets, effect);
    return finishCombatIfWon(state);
  }

  for (const target of targets) {
    if (effect.type === "damage") {
      applyCardDamage(state, target, effect.value ?? 0, effect.cardCost ?? 1, effect.cardStyle);
    }

    if (effect.type === "execute") {
      applyExecute(state, target, effect);
    }

    if (effect.type === "block") {
      target.block += effect.value ?? 0;
      combatLog(state, `获得 ${effect.value} 点格挡。`);
    }

    if (effect.type === "heal") {
      target.hp = Math.min(target.maxHp, target.hp + (effect.value ?? 0));
      combatLog(state, `回复 ${effect.value} 点生命。`);
    }

    if (effect.type === "loseHp") {
      target.hp = Math.max(0, target.hp - (effect.value ?? 0));
      combatLog(state, `失去 ${effect.value} 点生命。`);
      if (target.uid === "player" && target.hp <= 0) {
        syncPlayerFighter(run, target);
        finishDefeat(state, "血誓反噬，残箓染赤。");
        return state;
      }
    }

    if (effect.type === "status" && effect.status) {
      addStatus(target, effect.status, effect.stacks ?? 0);
      combatLog(state, `${target.uid === "player" ? "你" : target.name} 获得 ${statusLabel(effect.status)} ${effect.stacks}。`);
    }

    if (effect.type === "amplifyDebuffs") {
      const added = amplifyDebuffs(target, effect.statuses, effect.value ?? 0);
      if (added > 0) {
        combatLog(state, `${target.uid === "player" ? "你" : target.name} 的负面状态增长 ${added} 层。`);
      }
    }

    if (target.uid === "player") {
      syncPlayerFighter(run, target);
    }
  }

  return finishCombatIfWon(state);
}

export function applyCardDamage(state, target, baseDamage, cardCost = 1, cardStyle = null) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat || target.hp <= 0) return;

  const player = playerFighter(run);
  const spirit = statusStacks(player, "spirit");
  const battleIntent = cardStyle === "physical" ? statusStacks(player, "battleIntent") : 0;
  const curse = statusStacks(target, "curse");
  const spiritBonus = Math.min(spirit, Math.max(1, cardCost) * SPIRIT_BONUS_PER_COST);
  let damage = baseDamage + spiritBonus + battleIntent + curse;

  if (battleIntent > 0) {
    combatLog(state, `战意追加 ${battleIntent} 点物理伤害。`);
  }

  if (run.relics.includes("thunderSeal") && !combat.flags.thunderSealUsed) {
    damage += 4;
    combat.flags.thunderSealUsed = true;
    combatLog(state, `${relics.thunderSeal.name} 追加 4 点雷伤。`);
  }

  damage = applyBlock(target, damage);
  target.hp = Math.max(0, target.hp - damage);
  combatLog(state, `对 ${target.name} 造成 ${damage} 点伤害。`);

  const bleed = statusStacks(target, "bleed");
  if (bleed > 0 && target.hp > 0) {
    const bleedDamage = applyBlock(target, bleed);
    target.hp = Math.max(0, target.hp - bleedDamage);
    const reduced = reduceConsumableDebuff(target, "bleed", 1);
    combatLog(state, `${target.name} 流血爆开，格挡抵消 ${bleed - bleedDamage} 点，额外受到 ${bleedDamage} 点伤害${reduced ? "。" : "，凝滞保留了流血。"}`);
  }

  if (target.hp <= 0) {
    onEnemyKilled(state, target);
  }
}

function applyExecute(state, target, effect) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat || target.hp <= 0) return;

  const threshold = effect.threshold ?? 35;
  const hpPercent = (target.hp / target.maxHp) * 100;
  if (hpPercent <= threshold) {
    target.hp = 0;
    combatLog(state, `${target.name} 血线低于 ${threshold}%，被无视格挡斩杀。`);
    onEnemyKilled(state, target);
    return;
  }

  applyCardDamage(state, target, effect.fallbackDamage ?? 0, effect.cardCost ?? 1, effect.cardStyle);
}

export function applyIncomingDamage(state, rawDamage) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat) return;

  const player = playerFighter(run);
  let damage = rawDamage + statusStacks(player, "curse");

  const ward = statusStacks(player, "ward");
  if (ward > 0) {
    const blockedByWard = Math.min(ward, damage);
    damage -= blockedByWard;
    reduceStatus(player, "ward", blockedByWard);
    combatLog(state, `护体抵消 ${blockedByWard} 点伤害。`);
  }

  damage = applyBlock(player, damage);
  player.hp = Math.max(0, player.hp - damage);
  syncPlayerFighter(run, player);
  combatLog(state, `你受到 ${damage} 点伤害。`);

  if (run.hp <= 0) {
    finishDefeat(state, "你倒在山道上，残箓化作微光。");
  }
}

export function tickDamageStatus(state, fighter, statusId) {
  const stacks = statusStacks(fighter, statusId);
  if (stacks <= 0) return;

  const damage = applyBlock(fighter, stacks);
  fighter.hp = Math.max(0, fighter.hp - damage);
  const blocked = stacks - damage;
  combatLog(state, `${fighter.uid === "player" ? "你" : fighter.name} 受到 ${statusLabel(statusId)} ${damage} 点伤害${blocked > 0 ? `，格挡抵消 ${blocked} 点` : ""}。`);

  if (["bleed", "poison"].includes(statusId)) {
    const reduced = reduceConsumableDebuff(fighter, statusId, 1);
    if (!reduced) {
      combatLog(state, `${fighter.uid === "player" ? "你" : fighter.name} 的${statusLabel(statusId)}被凝滞保留。`);
    }
  }

  if (statusId === "burn") {
    const burnFade = Math.max(1, Math.ceil(stacks / 2));
    reduceStatus(fighter, "burn", burnFade);
    combatLog(state, `${fighter.uid === "player" ? "你" : fighter.name} 的灼烧消退 ${burnFade} 层。`);
  }

  if (fighter.uid === "player") {
    syncPlayerFighter(state.run, fighter);
    if (state.run.hp <= 0) {
      finishDefeat(state, "毒火入骨，行旅止步。");
    }
  } else if (fighter.hp <= 0) {
    onEnemyKilled(state, fighter);
  }
}

export function applyCardEffects(state, cardInstance, targetUid) {
  const card = cards[cardInstance.cardId];
  const growsBattleIntent = card.style === "physical" && card.effects.some((effect) => ["damage", "execute"].includes(effect.type));
  for (const effect of card.effects) {
    applyEffect(state, { ...effect, sourceUid: cardInstance.uid, cardCost: card.cost, cardStyle: card.style }, targetUid);
    if (state.phase !== "combat") {
      break;
    }
  }

  if (state.phase === "combat" && growsBattleIntent && statusStacks(playerFighter(state.run), "battleIntent") > 0) {
    addStatus({ statuses: state.run.statuses }, "battleIntent", PHYSICAL_INTENT_GAIN);
    combatLog(state, `物理攻势推进，战意 +${PHYSICAL_INTENT_GAIN}。`);
  }
}

export function pickDiscardCard(state, cardUid) {
  const run = state.run;
  const combat = run?.combat;
  const choice = run?.pendingChoice;
  if (!run || !combat || choice?.type !== "discardPick") return state;

  const index = combat.discardPile.findIndex((card) => card.uid === cardUid && card.uid !== choice.sourceUid);
  if (index < 0) return state;

  const [card] = combat.discardPile.splice(index, 1);
  combat.hand.push(card);
  combat.log.push(`从弃牌堆取回 ${cards[card.cardId].name}。`);

  choice.count -= 1;
  if (choice.count <= 0 || recoverableDiscardCards(combat, choice).length === 0) {
    run.pendingChoice = null;
  }

  return state;
}

export function cancelDiscardPick(state) {
  const run = state.run;
  if (run?.pendingChoice?.type === "discardPick") {
    run.pendingChoice = null;
    run.combat?.log.push("放弃回收弃牌。");
  }
  return state;
}

function startDiscardPick(state, count, sourceUid) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat) return;

  const choice = {
    type: "discardPick",
    count,
    sourceUid,
    title: `从弃牌堆选择 ${count} 张牌加入手牌`,
  };

  if (recoverableDiscardCards(combat, choice).length === 0) {
    combat.log.push("弃牌堆没有可回收的牌。");
    return;
  }

  run.pendingChoice = choice;
  combat.log.push(choice.title + "。");
}

function recoverableDiscardCards(combat, choice) {
  return combat.discardPile.filter((card) => card.uid !== choice.sourceUid);
}

function resolveTargets(run, targetType, targetUid) {
  const combat = run.combat;
  if (!combat) return [];

  if (targetType === "self") {
    return [playerFighter(run)];
  }

  if (targetType === "allEnemies") {
    return combat.enemies.filter((enemy) => enemy.hp > 0);
  }

  const selected = combat.enemies.find((enemy) => enemy.uid === targetUid && enemy.hp > 0);
  return selected ? [selected] : combat.enemies.filter((enemy) => enemy.hp > 0).slice(0, 1);
}

function amplifyDebuffs(target, statuses, value) {
  const debuffs = statuses ?? ["burn", "bleed", "poison", "curse", "chaos", "stasis"];
  let added = 0;

  for (const statusId of debuffs) {
    const stacks = statusStacks(target, statusId);
    if (stacks > 0) {
      addStatus(target, statusId, value);
      added += value;
    }
  }

  return added;
}

function applyBleedSiphon(state, targets, effect) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat || targets.length === 0) return;

  const totalBleed = targets.reduce((sum, target) => sum + statusStacks(target, "bleed"), 0);
  if (totalBleed <= 0) {
    combatLog(state, "没有可汲取的流血。");
    return;
  }

  const ratio = Math.max(1, effect.ratio ?? 3);
  const heal = Math.floor(totalBleed / ratio) + (effect.value ?? 0);
  if (heal <= 0) {
    combatLog(state, `流血不足 ${ratio} 层，未能回血。`);
    return;
  }

  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + heal);
  const actual = run.hp - before;
  const source = targets.length > 1 ? `敌方流血合计 ${totalBleed} 层` : `${targets[0].name} 流血 ${totalBleed} 层`;
  combatLog(state, `血魔汲血：${source}，回复 ${actual} 点生命。`);
}

function applyShellReflect(state, targets, effect) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat || targets.length === 0) return;

  const block = combat.block ?? 0;
  if (block <= 0) {
    combatLog(state, "没有格挡可用于反震。");
    return;
  }

  const ratio = Math.max(0, effect.ratio ?? 0.5);
  const rawDamage = Math.floor(block * ratio) + (effect.value ?? 0);
  if (rawDamage <= 0) {
    combatLog(state, "反震力道不足。");
    return;
  }

  for (const target of targets) {
    if (target.hp <= 0) continue;
    const damage = applyBlock(target, rawDamage);
    target.hp = Math.max(0, target.hp - damage);
    combatLog(state, `以 ${block} 点格挡反震 ${target.name}，造成 ${damage} 点伤害。`);
    if (target.hp <= 0) {
      onEnemyKilled(state, target);
    }
  }

  const consumeRatio = Math.max(0, effect.consumeRatio ?? 0);
  const consumed = Math.min(combat.block, Math.ceil(block * consumeRatio));
  if (consumed > 0) {
    combat.block -= consumed;
    combatLog(state, `反震消耗 ${consumed} 点格挡。`);
  }
}

function applyBlock(fighter, rawDamage) {
  const blocked = Math.min(fighter.block, rawDamage);
  fighter.block -= blocked;
  return rawDamage - blocked;
}

function onEnemyKilled(state, enemy) {
  const run = state.run;
  const combat = run?.combat;
  if (!run || !combat || combat.flags[`killed_${enemy.uid}`]) return;

  combat.flags[`killed_${enemy.uid}`] = true;
  combatLog(state, `${enemy.name} 被击败。`);

  if (run.relics.includes("bloodGourd") && !combat.flags.bloodGourdUsed) {
    run.hp = Math.min(run.maxHp, run.hp + 5);
    combat.flags.bloodGourdUsed = true;
    combatLog(state, "血葫芦回涌，回复 5 点生命。");
  }

  if (run.relics.includes("ghostLantern")) {
    for (const other of combat.enemies) {
      if (other.hp > 0) {
        addStatus(other, "curse", 2);
      }
    }
    combatLog(state, "引魂灯摇动，余敌皆染诅咒 2。");
  }
}

function finishDefeat(state, message) {
  const run = state.run;
  if (!run || run.finished) return;

  run.finished = true;
  state.phase = "gameOver";
  state.message = message;
  state.meta.soul += Math.max(3, run.floor * 2);
  state.meta.lossStreak = (state.meta.lossStreak ?? 0) + 1;
}
