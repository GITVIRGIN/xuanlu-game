export const FORMAL_PAGE = Object.freeze({
  HOME: 'home',
  ARCHIVE: 'archive',
  WORLD: 'world',
  SETTINGS: 'settings',
  RUN_DETAIL: 'run-detail',
  RUN: 'run'
});

export const FORMAL_RUN_VIEW = Object.freeze({
  CHARACTER_SELECT: 'character-select',
  ROUTE_SELECT: 'route-select',
  CHOICE: 'choice',
  CHOICE_RESULT: 'choice-result',
  REWARD: 'reward',
  REWARD_RESULT: 'reward-result',
  TAVERN: 'tavern',
  TAVERN_RESULT: 'tavern-result',
  BOSS_PRE_TAVERN: 'boss-pre-tavern',
  COMBAT: 'combat',
  RESCUE_TAVERN: 'rescue-tavern',
  SETTLEMENT: 'settlement'
});

const PAGE_SET = new Set(Object.values(FORMAL_PAGE));
const RUN_VIEW_SET = new Set(Object.values(FORMAL_RUN_VIEW));

export function assertFormalPage(page) {
  if (!PAGE_SET.has(page)) throw new Error(`Unknown formal page: ${page}`);
  return page;
}

export function assertFormalRunView(view) {
  if (!RUN_VIEW_SET.has(view)) throw new Error(`Unknown formal run view: ${view}`);
  return view;
}
