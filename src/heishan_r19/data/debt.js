export const DEBT_SCORE_PENALTY_EACH = 2;

export const DEBT_RULE = Object.freeze({
  title: '债印账册',
  appliesAt: '踏入首领门前时计入破局把握',
  scorePenaltyEach: DEBT_SCORE_PENALTY_EACH,
  immediateRule: '债印本身不会再次扣除生命、护甲或压力；卡片上的即时变化在确认时已经结算。',
  clearingRule: '债印会跟到这次行程结束；回到酒馆重新点灯后，旧账不再带进下一程。'
});

export function debtImpact(debtMarks = []) {
  const counts = new Map();
  for (const mark of debtMarks) counts.set(mark, (counts.get(mark) || 0) + 1);
  return Object.freeze({
    count: debtMarks.length,
    scorePenalty: debtMarks.length * DEBT_SCORE_PENALTY_EACH,
    marks: Object.freeze([...counts].map(([name, count]) => Object.freeze({ name, count })))
  });
}
