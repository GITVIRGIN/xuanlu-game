import { FORMAL_RUN_VIEW } from '../contracts/formalNavigation.js';
import { getBoss } from '../data/bosses.js';
import { getCharacter } from '../data/characters.js';
import { crossedThresholds, DAOMAI, DAOMAI_IDS, nextThreshold } from '../data/daomai.js';
import { getRoute } from '../data/routes.js';
import {
  acquireReward,
  chooseRescue,
  chooseTavernAction,
  confirmCharacter,
  confirmChoice,
  confirmRoute
} from './runState.js';

export const IMPACT_STAT_PRESENTATION = Object.freeze({
  hp: Object.freeze({ id: 'hp', label: '血量' }),
  armor: Object.freeze({ id: 'armor', label: '护甲' }),
  damage: Object.freeze({ id: 'damage', label: '伤害' }),
  pressure: Object.freeze({ id: 'pressure', label: '压力' }),
  clues: Object.freeze({ id: 'clues', label: '破局线索' }),
  bossPrep: Object.freeze({ id: 'bossPrep', label: '破局把握' })
});

const VIEW_LABELS = Object.freeze({
  [FORMAL_RUN_VIEW.ROUTE_SELECT]: '选择路线',
  [FORMAL_RUN_VIEW.CHOICE]: '山路抉择',
  [FORMAL_RUN_VIEW.CHOICE_RESULT]: '选择结果',
  [FORMAL_RUN_VIEW.REWARD_RESULT]: '战利结果',
  [FORMAL_RUN_VIEW.TAVERN_RESULT]: '酒馆结果',
  [FORMAL_RUN_VIEW.BOSS_PRE_TAVERN]: '首领门前歇脚',
  [FORMAL_RUN_VIEW.RESCUE_TAVERN]: '酒馆救援'
});

function selectedSpec(run) {
  if (!run) return null;
  if (run.view === FORMAL_RUN_VIEW.CHARACTER_SELECT && run.selectedCharacterId) {
    const entry = getCharacter(run.selectedCharacterId);
    return { kind: 'character', selectionId: entry.id, selectionName: entry.name, summary: entry.unique, entry, commit: confirmCharacter };
  }
  if (run.view === FORMAL_RUN_VIEW.ROUTE_SELECT && run.selectedRouteId) {
    const entry = getRoute(run.selectedRouteId);
    const boss = getBoss(entry.bossId);
    return { kind: 'route', selectionId: entry.id, selectionName: entry.name, summary: `${entry.risk} 首领：${boss.name}`, entry, commit: confirmRoute };
  }
  if (run.view === FORMAL_RUN_VIEW.CHOICE && run.selectedChoiceId) {
    const entry = run.choiceSet?.options?.find((option) => option.id === run.selectedChoiceId);
    if (!entry) return null;
    return { kind: 'choice', selectionId: entry.id, selectionName: entry.title, summary: entry.immediate, entry, commit: confirmChoice };
  }
  if (run.view === FORMAL_RUN_VIEW.REWARD && run.selectedRewardId) {
    const entry = run.rewardOptions?.find((option) => option.id === run.selectedRewardId);
    if (!entry) return null;
    return { kind: 'reward', selectionId: entry.id, selectionName: entry.name, summary: entry.immediate, entry, commit: acquireReward };
  }
  if ([FORMAL_RUN_VIEW.TAVERN, FORMAL_RUN_VIEW.BOSS_PRE_TAVERN].includes(run.view) && run.selectedTavernActionId) {
    const entry = run.tavernOptions?.find((option) => option.id === run.selectedTavernActionId);
    if (!entry) return null;
    return {
      kind: entry.partnerId ? 'recruit' : 'tavern',
      selectionId: entry.id,
      selectionName: entry.title,
      summary: entry.description,
      entry,
      commit: (source) => chooseTavernAction(source, entry.id)
    };
  }
  if (run.view === FORMAL_RUN_VIEW.RESCUE_TAVERN && run.rescueState?.phase === 'choice' && run.rescueState.selectedId) {
    const entry = run.rescueState.options?.find((option) => option.id === run.rescueState.selectedId);
    if (!entry) return null;
    return {
      kind: 'rescue',
      selectionId: entry.id,
      selectionName: entry.title,
      summary: entry.description,
      entry,
      commit: (source) => chooseRescue(source, entry.id)
    };
  }
  return null;
}

function routeBossName(routeId) {
  if (!routeId) return '';
  const route = getRoute(routeId);
  return route ? getBoss(route.bossId)?.name || '' : '';
}

function identityChanges(before, after) {
  return [
    { id: 'character', label: '主角', before: before.characterName || '未定', after: after.characterName || '未定' },
    { id: 'route', label: '路线', before: before.routeName || '未定', after: after.routeName || '未定' },
    { id: 'boss', label: '首领', before: routeBossName(before.routeId) || '未定', after: routeBossName(after.routeId) || '未定' }
  ].filter((change) => change.before !== change.after);
}

function valueKey(value) {
  if (value && typeof value === 'object') return value.id || value.name || JSON.stringify(value);
  return String(value);
}

function valueLabel(value) {
  if (value && typeof value === 'object') return value.name || value.title || value.id || '未命名条目';
  return String(value);
}

function collectionChange(id, label, beforeValues = [], afterValues = []) {
  const beforeCounts = new Map();
  const afterCounts = new Map();
  for (const value of beforeValues) beforeCounts.set(valueKey(value), (beforeCounts.get(valueKey(value)) || 0) + 1);
  for (const value of afterValues) afterCounts.set(valueKey(value), (afterCounts.get(valueKey(value)) || 0) + 1);
  const added = [];
  const removed = [];
  const consumedBefore = new Map(beforeCounts);
  for (const value of afterValues) {
    const key = valueKey(value);
    if ((consumedBefore.get(key) || 0) > 0) consumedBefore.set(key, consumedBefore.get(key) - 1);
    else added.push(valueLabel(value));
  }
  const consumedAfter = new Map(afterCounts);
  for (const value of beforeValues) {
    const key = valueKey(value);
    if ((consumedAfter.get(key) || 0) > 0) consumedAfter.set(key, consumedAfter.get(key) - 1);
    else removed.push(valueLabel(value));
  }
  if (!added.length && !removed.length) return null;
  return Object.freeze({ id, label, added: Object.freeze(added), removed: Object.freeze(removed) });
}

function collectionChanges(before, after) {
  return [
    collectionChange('partners', '同行者', before.partners, after.partners),
    collectionChange('rewards', '战利品', before.rewards, after.rewards),
    collectionChange('oldCauses', '旧因', before.oldCauses, after.oldCauses),
    collectionChange('fulfillments', '应验', before.fulfillments, after.fulfillments),
    collectionChange('debtMarks', '债印', before.debtMarks, after.debtMarks),
    collectionChange('bossClues', '破局线索', before.bossClues, after.bossClues)
  ].filter(Boolean);
}

function statChanges(spec, before, after) {
  return Object.values(IMPACT_STAT_PRESENTATION).flatMap((presentation) => {
    const id = presentation.id;
    const beforeValue = Number(before.stats?.[id] || 0);
    const afterValue = Number(after.stats?.[id] || 0);
    const beforeMax = id === 'hp' ? Number(before.stats?.maxHp || 0) : null;
    const afterMax = id === 'hp' ? Number(after.stats?.maxHp || 0) : null;
    const requestedDelta = spec.entry?.scope === 'partners' ? Number.NaN : Number(spec.entry?.delta?.[id]);
    const hasRequestedDelta = Number.isFinite(requestedDelta);
    if (spec.kind !== 'character' && beforeValue === afterValue && beforeMax === afterMax && (!hasRequestedDelta || requestedDelta === 0)) return [];
    const appliedDelta = afterValue - beforeValue;
    const characterUnset = spec.kind === 'character' && !before.characterId;
    return [Object.freeze({
      ...presentation,
      before: beforeValue,
      after: afterValue,
      beforeMax,
      afterMax,
      beforeText: characterUnset ? '未定' : id === 'hp' ? `${beforeValue}/${beforeMax}` : String(beforeValue),
      afterText: id === 'hp' ? `${afterValue}/${afterMax}` : String(afterValue),
      requestedDelta: hasRequestedDelta ? requestedDelta : null,
      appliedDelta,
      capped: hasRequestedDelta && appliedDelta !== requestedDelta
    })];
  });
}

function partnerChanges(before, after) {
  const afterById = new Map((after.partners || []).map((partner) => [partner.id, partner]));
  const labels = { hp: '生命', armor: '护甲', damage: '伤害' };
  return Object.freeze((before.partners || []).flatMap((partner) => {
    const projected = afterById.get(partner.id);
    if (!projected) return [];
    const stats = Object.freeze(['hp', 'armor', 'damage'].flatMap((id) => {
      const beforeValue = Number(partner[id] ?? (id === 'hp' ? partner.maxHp : 0));
      const afterValue = Number(projected[id] ?? (id === 'hp' ? projected.maxHp : 0));
      if (beforeValue === afterValue) return [];
      return [Object.freeze({
        id,
        label: labels[id],
        before: beforeValue,
        after: afterValue,
        beforeText: id === 'hp' ? `${beforeValue}/${partner.maxHp}` : String(beforeValue),
        afterText: id === 'hp' ? `${afterValue}/${projected.maxHp}` : String(afterValue)
      })];
    }));
    return stats.length ? [Object.freeze({ id: partner.id, name: partner.name, stats })] : [];
  }));
}

function daomaiChanges(before, after) {
  return DAOMAI_IDS.flatMap((id) => {
    const beforeValue = Number(before.daomai?.[id] || 0);
    const afterValue = Number(after.daomai?.[id] || 0);
    if (beforeValue === afterValue) return [];
    return [Object.freeze({
      id,
      label: DAOMAI[id].name,
      before: beforeValue,
      after: afterValue,
      amount: afterValue - beforeValue,
      crossed: Object.freeze(crossedThresholds(beforeValue, afterValue, id)),
      nextBefore: nextThreshold(beforeValue),
      nextAfter: nextThreshold(afterValue)
    })];
  });
}

function counterChanges(before, after) {
  return [
    { id: 'rescueCharges', label: '濒死救援', before: Number(before.rescueCharges || 0), after: Number(after.rescueCharges || 0), suffix: '次' },
    { id: 'reviveSeals', label: '扶魂符', before: Number(before.reviveSeals || 0), after: Number(after.reviveSeals || 0), suffix: '枚' }
  ].filter((change) => change.before !== change.after).map(Object.freeze);
}

export function selectionImpactPreview(run) {
  const spec = selectedSpec(run);
  if (!spec) return null;
  const projected = spec.commit(run);
  if (!projected || projected === run) return null;
  const stats = Object.freeze(statChanges(spec, run, projected));
  const daomai = Object.freeze(daomaiChanges(run, projected));
  const partners = partnerChanges(run, projected);
  const identities = Object.freeze(identityChanges(run, projected).map(Object.freeze));
  const collections = Object.freeze(collectionChanges(run, projected));
  const counters = Object.freeze(counterChanges(run, projected));
  const crossed = Object.freeze(daomai.flatMap((change) => change.crossed));
  const destination = run.view !== projected.view ? VIEW_LABELS[projected.view] || '' : '';
  return Object.freeze({
    kind: spec.kind,
    selectionId: spec.selectionId,
    selectionName: spec.selectionName,
    summary: spec.summary || '',
    pending: true,
    statChanges: stats,
    partnerChanges: partners,
    daomaiChanges: daomai,
    identityChanges: identities,
    collectionChanges: collections,
    counterChanges: counters,
    crossed,
    destination,
    hasChanges: Boolean(stats.length || partners.length || daomai.length || identities.length || collections.length || counters.length || destination)
  });
}
