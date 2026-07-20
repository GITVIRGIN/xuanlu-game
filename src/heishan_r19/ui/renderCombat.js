import { getCharacter } from '../data/characters.js';
import { assetRoleId, backgroundAssetStyle, BOSS_ASSETS, COMBAT_CUES, DOWNED_ASSETS, ENEMY_ASSETS, SCENE_ASSETS } from '../data/assets.js';
import { escapeHtml, image, meter } from './view.js';

const FORMATION_COPY = Object.freeze({
  rear: '稳住阵脚',
  strike: '基础出手',
  guard: '护住队形',
  control: '压住敌势',
  heal: '缀回命线',
  combo: '接上合击',
  intercept: '援护前压',
  relief: '稳住心神',
  targeted: '正受来袭',
  hit: '承受一击',
  revive: '扶魂施救',
  revived: '重新归阵',
  downed: '已经倒地'
});

function partnerStateForLog(run, log, partner) {
  return log?.afterState?.partners?.find((entry) => entry.id === partner.id)
    || { ...partner, hp: partner.hp ?? partner.maxHp, alive: (partner.hp ?? partner.maxHp) > 0 };
}

function formationState(log, partnerState, partnerId) {
  if (partnerState.hp <= 0) return 'downed';
  if (log?.actorId === partnerId) {
    if (log.actionType === 'partner_intercept') return 'intercept';
    if (log.actionType === 'partner_combo') return 'combo';
    if (log.actionType === 'partner_basic_guard') return 'guard';
    if (log.actionType === 'partner_basic_control') return 'control';
    if (log.actionType === 'partner_basic_heal') return 'heal';
    if (log.actionType === 'partner_basic_pressure_relief') return 'relief';
    if (log.actionType === 'partner_basic_revive') return 'revive';
    if (log.actionType === 'partner_basic_strike') return 'strike';
  }
  if (log?.targetId === partnerId) {
    const delta = log.partnerDeltas?.find((entry) => entry.id === partnerId);
    if (delta?.revived) return 'revived';
    return delta?.hpDelta < 0 ? 'hit' : 'targeted';
  }
  return 'rear';
}

export function combatFormationModel(run, log) {
  const partners = (run?.partners || []).map((partner, index) => {
    const partnerState = partnerStateForLog(run, log, partner);
    const state = formationState(log, partnerState, partner.id);
    const active = !['rear', 'downed'].includes(state);
    return {
      partner,
      partnerState,
      joinOrder: index + 1,
      active,
      state,
      callout: FORMATION_COPY[state]
    };
  });
  const heroDowned = Number(log?.afterState?.heroHp || 0) <= 0;
  const layout = [
    ...(heroDowned ? [{ id: run.characterId, kind: 'hero', joinOrder: 0, downed: true }] : []),
    ...partners.filter((slot) => slot.state === 'downed').sort((left, right) => left.joinOrder - right.joinOrder).map((slot) => ({ id: slot.partner.id, kind: 'partner', joinOrder: slot.joinOrder, downed: true })),
    ...partners.filter((slot) => slot.state !== 'downed').sort((left, right) => right.joinOrder - left.joinOrder).map((slot) => ({ id: slot.partner.id, kind: 'partner', joinOrder: slot.joinOrder, downed: false })),
    ...(!heroDowned ? [{ id: run.characterId, kind: 'hero', joinOrder: 0, downed: false }] : [])
  ];
  const slots = new Map(layout.map((entry, index) => [entry.id, { formationSlot: index, downedRank: entry.downed ? layout.slice(0, index + 1).filter((item) => item.downed).length : 0 }]));
  return partners.map((entry) => Object.freeze({ ...entry, ...slots.get(entry.partner.id) }));
}

function heroFormationSlot(run, log, formation) {
  const count = formation.length + 1;
  const used = new Set(formation.map((entry) => entry.formationSlot));
  for (let slot = 0; slot < count; slot += 1) if (!used.has(slot)) return slot;
  return count - 1;
}

function formationStyle(slot, count) {
  const width = 100 / Math.max(1, count);
  const right = (Math.max(1, count) - 1 - slot) * width;
  return `--formation-slot:${slot};--formation-count:${count};--formation-width:${width.toFixed(3)}%;--formation-right:${right.toFixed(3)}%`;
}

function combatantLabel(run, combat, id) {
  if (id === 'system') return '战局';
  if (id === 'party') return '全队';
  if (id === run.characterId) return getCharacter(run.characterId).name;
  const partner = run.partners.find((entry) => entry.id === id);
  if (partner) return partner.name;
  if (id === combat.enemy.id || id === combat.result.enemyId) return combat.enemy.name;
  return id || '未知';
}

function stateLine(run, combat, snap) {
  const character = getCharacter(run.characterId);
  const partners = snap.partners.map((partner) => `${partner.name || combatantLabel(run, combat, partner.id)} ${partner.hp}/${partner.maxHp}`).join(' · ');
  return `${character.name} ${snap.heroHp}/${snap.heroMaxHp}${partners ? ` · ${partners}` : ''} · ${combat.enemy.name} ${snap.enemyHp}/${snap.enemyMaxHp} · 压力 ${snap.pressure}/10 · 扶魂符 ${snap.reviveSeals} 枚`;
}

function requirementCopy(current, target, unit) {
  const value = Math.max(0, Number(current || 0));
  const goal = Math.max(1, Number(target || 1));
  return value >= goal
    ? `已满足 · ${value}${unit}`
    : `还需 ${goal - value}${unit} · ${value}/${goal}`;
}

export function bossObjectiveViewModel(combat, log) {
  const read = combat?.result?.bossRead;
  if (!read) return null;
  const phaseLimit = Math.max(1, Number(read.phaseLimit || read.phaseCount || 3));
  const currentPhase = Math.max(1, Math.min(phaseLimit, Number(log?.afterState?.phase || log?.round || 1)));
  const failed = log?.actionType === 'boss_overwhelmed';
  const won = Boolean(log?.isTerminal && combat?.result?.outcome === 'victory');
  const state = failed ? 'failed' : won ? 'won' : currentPhase === phaseLimit ? 'final' : 'active';
  const stageTitle = failed
    ? '山门已封'
    : won
      ? '破局完成'
      : currentPhase === phaseLimit
        ? '最后一势'
        : `第 ${currentPhase} 势`;
  const remaining = Math.max(0, phaseLimit - currentPhase);
  const remainingCopy = failed
    ? '三势机会已经用尽'
    : won
      ? '首领已在封门前倒下'
      : remaining === 0
        ? '本势结束即封门'
        : `本势之后还余 ${remaining} 势`;
  return Object.freeze({
    id: read.objectiveId || 'seal-before-third-form',
    title: read.objectiveTitle || '山门封合前完成破局',
    rule: read.objectiveRule || '第三势结算前击倒首领；首领仍存活则山门封合，队伍被迫退场。',
    phaseLimit,
    currentPhase,
    remaining,
    state,
    stageTitle,
    remainingCopy
  });
}

function renderBossObjective(combat, log) {
  const objective = bossObjectiveViewModel(combat, log);
  if (!objective) return '';
  const marks = Array.from({ length: objective.phaseLimit }, (_, index) => {
    const phase = index + 1;
    const state = phase < objective.currentPhase ? 'spent' : phase === objective.currentPhase ? 'current' : 'waiting';
    return `<span class="${state}" aria-label="第 ${phase} 势${state === 'current' ? '，当前' : state === 'spent' ? '，已过' : '，未到'}">${phase}</span>`;
  }).join('');
  return `<section class="boss-objective-status ${objective.state}" data-testid="boss-objective" data-objective-id="${escapeHtml(objective.id)}" data-objective-state="${objective.state}" data-current-phase="${objective.currentPhase}" data-phase-limit="${objective.phaseLimit}" role="status">
    <div class="boss-objective-heading"><span>${escapeHtml(objective.title)}</span><b${objective.state === 'failed' ? ' data-testid="combat-boss-objective-failed"' : ''}>${escapeHtml(objective.stageTitle)}</b></div>
    <div class="boss-objective-track" data-testid="boss-objective-progress" aria-label="山门三势进度">${marks}<strong>${escapeHtml(objective.remainingCopy)}</strong></div>
    <small data-testid="boss-objective-rule">${escapeHtml(objective.rule)}</small>
  </section>`;
}

export function combatOutcomeExplanationModel(run, combat) {
  const result = combat.result;
  const final = result.finalState;
  const reason = result.resolutionReason;
  const partners = final.partners || [];
  const livingPartners = partners.filter((partner) => partner.hp > 0);
  const partyEvidence = partners.length
    ? `同行者存活 ${livingPartners.length}/${partners.length} · ${partners.map((partner) => `${partner.name || combatantLabel(run, combat, partner.id)} ${partner.hp}/${partner.maxHp}`).join(' · ')}`
    : '本战没有同行者';
  const commonEvidence = [
    `主角生命 ${final.heroHp}/${final.heroMaxHp}`,
    partyEvidence,
    `队伍压力 ${final.pressure}/10`,
    `${combat.enemy.name}生命 ${final.enemyHp}/${final.enemyMaxHp}`
  ];

  if (reason === 'boss_overwhelmed') {
    const bossRead = result.bossRead;
    return Object.freeze({
      tone: 'failure',
      title: '败因 · 山门先一步封合',
      trigger: `开场已经约定须在第三势结算前击倒首领；最后一势结束时，${combat.enemy.name}仍有 ${final.enemyHp}/${final.enemyMaxHp} 生命。`,
      consequence: `破局目标未能在山门封合前完成，所以队伍被迫退场。此时主角仍有 ${final.heroHp}/${final.heroMaxHp} 生命、压力 ${final.pressure}/10；这不是全队倒地，也不是压力崩溃。`,
      evidence: [
        `山门进度 3/3 · 首领尚余 ${final.enemyHp} 点生命`,
        ...(bossRead ? [`入场破局把握 ${bossRead.score}/${bossRead.requirements.score} · 未解山势 ${bossRead.preparationBarrier || 0} · 合阵回响 ${bossRead.partyScaleBarrier || 0} · 落案一击 +${bossRead.finisherBonus || 0}`] : []),
        ...commonEvidence.slice(0, 3),
        `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`
      ]
    });
  }
  if (reason === 'pressure_collapse') {
    return Object.freeze({
      tone: 'failure',
      title: '败因 · 压力失守',
      trigger: `临界后的回应轮已经结束，压力仍为 ${final.pressure}/10，且${combat.enemy.name}仍有 ${final.enemyHp}/${final.enemyMaxHp} 生命。`,
      consequence: '队伍没有在最后的稳息机会中降下压力，也未能抢先结束战斗，因此发生崩溃；这不会消耗濒死救援。',
      evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
    });
  }
  if (reason === 'party_hp_zero') {
    return Object.freeze({
      tone: 'failure',
      title: '败因 · 全队倒地',
      trigger: `主角生命归零，${partners.length ? '最后一名仍在场的同行者也已倒下' : '场上已无人能够继续行动'}。`,
      consequence: '失败由全队失去战斗能力触发，不是压力上限或首领三势结算。',
      evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
    });
  }
  if (reason === 'hero_dead') {
    return Object.freeze({
      tone: 'failure',
      title: '败因 · 无人续战',
      trigger: `主角生命归零，场上没有仍能接手战局的同行者。`,
      consequence: '失败由主角倒下且无人续战触发，不是压力上限或久战罢兵。',
      evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
    });
  }
  if (reason === 'stalemate' || reason === 'prolonged_stalemate') {
    return Object.freeze({
      tone: 'stalemate',
      title: '收束 · 久战罢兵',
      trigger: '连续三轮双方都没有形成有效突破，并且都远离斩杀线。',
      consequence: '队伍选择有序脱离；这不是阵亡，也不会被记录为击败敌人。',
      evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
    });
  }
  if (reason === 'enemy_hp_zero_allies_hold') {
    return Object.freeze({
      tone: 'victory',
      title: '胜因 · 同行者守住战局',
      trigger: `${combat.enemy.name}生命归零；主角虽然倒地，仍有同行者完成最后行动。`,
      consequence: '胜利由敌方生命实际归零触发，同行者把这一战带了回来。',
      evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
    });
  }
  if (reason === 'enemy_hp_zero') {
    return Object.freeze({
      tone: 'victory',
      title: '胜因 · 敌势已破',
      trigger: `${combat.enemy.name}生命已经归零。`,
      consequence: '胜利由战报中的实际伤害结算触发。',
      evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
    });
  }
  return Object.freeze({
    tone: result.outcome === 'victory' ? 'victory' : 'failure',
    title: result.outcome === 'victory' ? '战果 · 已分胜负' : '败因 · 战局已终',
    trigger: result.logs.at(-1)?.text || '战局已经依照最后一条行动结算。',
    consequence: '下方完整战报保留了每一步行动与结算后的队伍状态。',
    evidence: [...commonEvidence, `本战战报 ${result.logs.length} 条，已在右侧按最新到最早完整列出`]
  });
}

function renderOutcomeExplanation(run, combat) {
  const outcome = combatOutcomeExplanationModel(run, combat);
  return `<section class="combat-outcome-explanation ${outcome.tone}" data-testid="combat-outcome-explanation" data-resolution-reason="${escapeHtml(combat.result.resolutionReason)}" aria-label="本战为何结束">
    <div class="combat-outcome-heading"><span>本战为何结束</span><b>${escapeHtml(outcome.title)}</b></div>
    <p data-testid="combat-outcome-trigger">${escapeHtml(outcome.trigger)}</p>
    <small>${escapeHtml(outcome.consequence)}</small>
    <ul>${outcome.evidence.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>
  </section>`;
}

function renderFullReport(run, combat, visible) {
  if (!visible) return '';
  const entries = combat.result.logs.map((log, index) => ({ log, index })).reverse().map(({ log, index }) => {
    const actor = combatantLabel(run, combat, log.actorId);
    const target = combatantLabel(run, combat, log.targetId);
    const phase = log.phaseLabel || (log.round ? `第 ${log.round} 轮` : '交锋起始');
    return `<li class="combat-report-entry ${log.isTerminal ? 'is-terminal' : ''}" data-testid="combat-report-entry" data-original-index="${index}" data-action-type="${escapeHtml(log.actionType)}">
      <div class="combat-report-meta"><b>${escapeHtml(phase)}</b><span>${escapeHtml(actor)} → ${escapeHtml(target)}</span></div>
      <p>${escapeHtml(log.text)}</p>
      <small>${escapeHtml(stateLine(run, combat, log.afterState))}</small>
    </li>`;
  }).join('');
  return `<section class="combat-full-report" data-testid="combat-full-report" data-report-order="newest-first" aria-label="完整战报，按最新到最早排列">
    <div class="combat-full-report-title"><h3>完整战报</h3><span>最新在前 · 共 ${combat.result.logs.length} 条</span></div>
    <ol>${entries}</ol>
  </section>`;
}

export function renderCombat(run) {
  const combat = run.combat;
  const log = combat.result.logs[combat.logIndex];
  const snap = log.afterState;
  const terminalRevealed = Boolean(log.isTerminal && combat.legalTerminal && combat.allLogsRevealed);
  const showFullReport = combat.reportMode === 'full' || terminalRevealed;
  const character = getCharacter(run.characterId || 'shen-li');
  const isBoss = combat.result.tier === 'boss';
  const enemyAsset = combat.enemy.asset || (isBoss ? BOSS_ASSETS['boss-yaojiang'] : ENEMY_ASSETS['ordinary.old-army-sentinel']);
  const formation = combatFormationModel(run, log);
  const formationCount = formation.length + 1;
  const heroSlot = heroFormationSlot(run, log, formation);
  const activePartnerId = formation.find((slot) => slot.active)?.partner.id || '';
  const fieldPartners = formation.map(({ partner, partnerState, joinOrder, formationSlot, downedRank, active, state, callout }) => `<div class="combatant ally combat-field-partner partner-order-${joinOrder} formation-${state} ${active ? 'is-active' : ''} ${log.targetId === partner.id ? 'targeted' : ''}" data-testid="combat-field-partner" data-partner-id="${escapeHtml(partner.id)}" data-join-order="${joinOrder}" data-formation-slot="${formationSlot}" data-downed-rank="${downedRank}" data-formation-state="${state}" style="${formationStyle(formationSlot, formationCount)}" aria-label="同行第 ${joinOrder} 位 ${escapeHtml(partner.name)}，${callout}">
      ${image(state === 'downed' ? DOWNED_ASSETS[partner.characterId] : partner.asset, partner.name, `combat-portrait ally-image ${state === 'downed' ? 'downed-pose' : ''}`)}
      <div class="combat-name"><b>${escapeHtml(partner.name)}</b><span>同行 ${joinOrder} · 护甲 ${partnerState.armor}</span></div>
      ${meter(partnerState.hp, partnerState.maxHp, 'partner-hp', '', `${partner.name} 生命`)}
      <small>${partnerState.hp}/${partnerState.maxHp} · 伤害 ${partnerState.damage}</small>
      <span class="formation-callout"${active ? ' data-testid="combat-field-partner-active"' : ''}><span data-testid="combat-state-${state}">${callout}</span></span>
    </div>`).join('');
  const controls = combat.legalTerminal && combat.allLogsRevealed
    ? `<button class="command primary" data-action="continue-combat" data-testid="combat-continue">${isBoss ? '收束此战' : '继续前行'}</button>`
    : `<button class="command" data-action="next-combat-log" data-testid="combat-next">下一条</button><button class="command" data-action="auto-combat" data-testid="combat-auto">自动播放</button><button class="command" data-action="direct-settle" data-testid="combat-direct-settle">直接结算</button>`;
  const read = combat.result.bossRead;
  const bossRead = read ? `<div class="boss-read" data-testid="boss-pressure-read" data-prepared="${read.prepared}" data-readiness-tier="${read.readinessTier}" data-party-scale-barrier="${read.partyScaleBarrier || 0}" data-partner-daomai-ready="${read.partnerDaomaiReady}" data-formation-ready="${read.formationReady}">
    <span>破局筹备</span>
    <span class="${read.thresholdCount >= read.requirements.thresholdCount ? 'is-ready' : 'is-pending'}">道脉成势 · ${requirementCopy(read.thresholdCount, read.requirements.thresholdCount, ' 条')}</span>
    <span class="${read.oldCauseCount >= read.requirements.oldCauseCount ? 'is-ready' : 'is-pending'}">旧因 · ${requirementCopy(read.oldCauseCount, read.requirements.oldCauseCount, ' 项')}</span>
    <span class="${read.clueCount >= read.requirements.clueCount ? 'is-ready' : 'is-pending'}">破局线索 · ${requirementCopy(read.clueCount, read.requirements.clueCount, ' 条')}</span>
    <span class="${read.bossPrepCount >= read.requirements.nearBossPrepCount ? 'is-ready' : 'is-pending'}">门前筹备 · ${requirementCopy(read.bossPrepCount, read.requirements.nearBossPrepCount, ' 次')}</span>
    <span class="${read.partnerDaomaiReady ? 'is-ready' : 'is-pending'}" data-testid="boss-preparation-partner-status" data-ready="${read.partnerDaomaiReady}">伙伴同阵 · ${read.partnerDaomaiReady ? `已大成 · ${read.partnerDaomaiValue}` : `距大成还需 ${read.partnerDaomaiRemaining} · ${read.partnerDaomaiValue}/${read.partnerDaomaiGoal}`}</span>
    <span class="${read.formationReady ? 'is-ready' : 'is-pending'}" data-testid="boss-preparation-formation-status" data-ready="${read.formationReady}">群脉共鸣 · ${read.formationReady ? `已成 · ${read.formationLineCount}/${read.formationLineGoal} · 破局把握 +${read.formationBonus}` : `还需 ${read.formationRemaining} 条成势 · ${read.formationLineCount}/${read.formationLineGoal}`}</span>
    <span>未解山势 · ${read.preparationBarrier || 0}</span>
    <span>合阵回响 · ${read.partyScaleBarrier || 0}<small>同行者越多，首领血线越厚；我方也会逐势行动</small></span>
    <span>落案一击 · +${read.finisherBonus || 0}<small>破局完成后封顶，不再按总分无限增长</small></span>
    <b>${read.prepared ? '破局已成' : read.nearReady ? '只欠临门一笔' : '破局未成'} · ${read.score}/${read.requirements.score}</b>
  </div>` : '';
  const bossObjective = isBoss ? renderBossObjective(combat, log) : '';
  const combatAsset = isBoss ? SCENE_ASSETS.boss : SCENE_ASSETS.combat;
  const visualCue = COMBAT_CUES[log.visualCue] || COMBAT_CUES.intro;
  const battleKind = isBoss ? '首领战' : combat.result.tier === 'elite' ? '精锐战' : '遭遇战';
  const stalemateWarningNumber = log.actionType === 'stalemate_warning' ? combat.result.logs.slice(0, combat.logIndex + 1).filter((entry) => entry.actionType === 'stalemate_warning').length : 0;
  const terminalStatus = log.actionType === 'hero_revive_partner' || log.actionType === 'partner_basic_revive'
    ? `<div class="combat-terminal-status revival" data-testid="combat-revival-status" role="status"><b>${log.actionType === 'hero_revive_partner' ? '扶魂符施救' : '缀命回针'}</b><span>${escapeHtml(combatantLabel(run, combat, log.targetId))} 已重新归阵 · 生命 ${log.afterState.partners.find((partner) => partner.id === log.targetId)?.hp || 0} · 扶魂符余 ${snap.reviveSeals} 枚</span></div>`
    : log.actionType === 'enemy_pressure_action'
    ? `<div class="combat-terminal-status warning" data-testid="combat-enemy-pressure-status" data-critical="${snap.pressure >= 10}" role="status"><b>${snap.pressure >= 10 ? '压力临界' : '敌方专门增压'}</b><span>${snap.pressure >= 10 ? '下轮必须稳住心神或结束战斗，否则队伍将崩溃' : '敌方放弃本轮攻击，只施展增压动作'}</span></div>`
    : log.actionType === 'hero_pressure_relief' || log.actionType === 'partner_basic_pressure_relief'
      ? '<div class="combat-terminal-status relief" data-testid="combat-pressure-relief-status" role="status"><b>减压行动</b><span>压力已经回落；行动者本轮放弃原本出手</span></div>'
      : stalemateWarningNumber
    ? `<div class="combat-terminal-status warning" data-testid="combat-stalemate-status" role="status"><b>久战预警 · ${stalemateWarningNumber}/3</b><span>${stalemateWarningNumber === 1 ? '双方仍远离斩杀线；继续观察能否形成突破' : '下一轮仍无有效突破，才会有序罢兵'}</span></div>`
    : log.actionType === 'stalemate_disengagement'
      ? '<div class="combat-terminal-status stalemate" data-testid="combat-stalemate-status" role="status"><b>久战罢兵</b><span>连续三轮无有效突破，且双方均远离斩杀线</span></div>'
      : log.actionType === 'pressure_collapse'
        ? '<div class="combat-terminal-status collapse" data-testid="combat-pressure-collapse-status" role="status"><b>压力崩溃</b><span>压力达到上限；这不是濒死，不会消耗濒死救援</span></div>'
        : combat.result.resolutionReason === 'enemy_hp_zero_allies_hold' && log.isTerminal
          ? '<div class="combat-terminal-status allies-hold" data-testid="combat-allies-hold-status" role="status"><b>同行者守住战局</b><span>主角虽已倒地，同行者仍把这一战带回来了</span></div>'
          : '';
  const partnerDelta = log.partnerDeltas?.find((entry) => entry.hpDelta !== 0)?.hpDelta || 0;
  const floatingDelta = log.enemyHpDelta < 0 ? log.enemyHpDelta : log.hpDelta || partnerDelta;
  const floatingPressure = !floatingDelta && log.pressureDelta ? `${log.pressureDelta > 0 ? '+' : ''}${log.pressureDelta} 压力` : '';
  return `<section class="combat-screen ${isBoss ? 'boss-combat' : ''} ${showFullReport ? 'show-full-report' : ''}" data-testid="screen-combat" data-log-index="${combat.logIndex}" data-asset-role="${assetRoleId(combatAsset)}" style="${backgroundAssetStyle(combatAsset)}">
    <header class="combat-screen-title"><span>${battleKind}</span><h2 tabindex="-1">迎战 · ${escapeHtml(combat.enemy.name)}</h2></header>
    <div class="combat-stage">
      <div class="combat-party-formation" data-testid="combat-party-formation" data-partner-count="${formation.length}" data-active-partner="${escapeHtml(activePartnerId)}">
        ${fieldPartners}
        <div class="combatant hero ${log.targetId === run.characterId ? 'targeted' : ''} ${snap.heroHp <= 0 ? 'is-downed' : ''} ${log.actionType === 'hero_revive_partner' ? 'is-reviving' : ''}" data-testid="hero-combatant" data-formation-slot="${heroSlot}" data-formation-state="${snap.heroHp <= 0 ? 'downed' : log.actionType === 'hero_revive_partner' ? 'revive' : log.actorId === run.characterId ? 'acting' : 'ready'}" style="${formationStyle(heroSlot, formationCount)}">
          ${image(snap.heroHp <= 0 ? DOWNED_ASSETS[character.id] : character.asset, character.name, `combat-portrait hero-image ${snap.heroHp <= 0 ? 'downed-pose' : ''}`)}
          <div class="combat-name"><b>${character.name}</b><span>护甲 ${snap.heroArmor}</span></div>
          ${meter(snap.heroHp, snap.heroMaxHp, 'hp', 'combat-hero-hp-bar', `${character.name} 生命`)}
          <small data-testid="combat-hero-hp">${snap.heroHp}/${snap.heroMaxHp}${snap.heroHp <= 0 ? ' · <span data-testid="combat-hero-downed-state">倒地</span>' : ''}</small>
        </div>
      </div>
      <div class="combat-center"><span class="phase-label">${escapeHtml(log.phaseLabel || battleKind)}</span><div class="combat-visual-cue cue-${visualCue.key}" data-testid="combat-visual-cue" data-cue="${visualCue.key}">${image(visualCue.asset, '', 'combat-cue-icon')}<span>${visualCue.label}</span></div>${terminalStatus}<div class="pressure-read">压力 ${snap.pressure}/10${meter(snap.pressure, 10, 'pressure', 'combat-pressure-bar', '队伍压力')}<small class="combat-pressure-rule" data-testid="combat-pressure-rule">攻击不增压 · 敌方施压会放弃攻击 · 临界后留一轮稳息</small></div></div>
      <div class="combatant enemy ${log.targetId === combat.enemy.id ? 'targeted' : ''}" data-testid="enemy-combatant">
        ${image(enemyAsset, combat.enemy.name, 'combat-portrait enemy-image')}
        <div class="combat-name"><b>${escapeHtml(combat.enemy.name)}</b><span>护甲 ${snap.enemyArmor}</span></div>
        ${meter(snap.enemyHp, snap.enemyMaxHp, 'enemy-hp', 'combat-enemy-hp-bar', `${combat.enemy.name} 生命`)}
        <small data-testid="combat-enemy-hp">${snap.enemyHp}/${snap.enemyMaxHp}</small>
      </div>
      ${floatingDelta || floatingPressure ? `<div class="damage-float cue-${escapeHtml(log.visualCue)}" data-testid="combat-delta-float" aria-hidden="true">${floatingDelta || floatingPressure}</div>` : ''}
    </div>
    <div class="combat-lower">
      <div class="combat-log-panel">${bossObjective}<div class="combat-log-heading"><span>${battleKind}</span><span>${combat.logIndex + 1}/${combat.result.logs.length}</span></div><p data-testid="combat-log-current" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(log.text)}</p>${terminalRevealed ? `<div class="combat-controls terminal-controls" data-testid="combat-controls">${controls}</div>${renderOutcomeExplanation(run, combat)}${bossRead}` : `<div class="combat-controls" data-testid="combat-controls">${controls}</div>${bossRead}`}</div>
      ${renderFullReport(run, combat, showFullReport)}
    </div>
  </section>`;
}
