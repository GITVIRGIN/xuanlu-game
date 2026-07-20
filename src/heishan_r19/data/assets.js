import {
  getAssetRole,
  R20_BOSS_ASSETS,
  R20_COMBAT_CUES,
  R20_CONSEQUENCE_ICON_ASSETS,
  R20_DOWNED_ASSETS,
  R20_ENEMY_ASSETS,
  R20_ROUTE_ASSETS,
  R20_SCENE_ASSETS,
  R20_STATUS_ICON_ASSETS,
  R20_TAVERN_ICON_ASSETS
} from '../../heishan_r20/data/assetRoles.js';

export const ASSET_ROOT = '../../assets/heishan_r19/';
export const R20_ASSET_ROOT = '../../assets/heishan_r20/';

export function assetUrl(path) {
  if (path?.startsWith('r20:')) {
    return `${R20_ASSET_ROOT}${path.slice(4)}`;
  }
  return `${ASSET_ROOT}${path}`;
}

export function assetDescriptor(path) {
  const role = getAssetRole(path);
  return {
    roleId: role?.id || null,
    url: assetUrl(path),
    fallbackUrl: role?.fallback ? assetUrl(role.fallback) : null
  };
}

export function backgroundAssetStyle(path, namespace = 'scene') {
  const { url } = assetDescriptor(path);
  return `--${namespace}-image:url('${url}')`;
}

export function assetRoleId(path) {
  return getAssetRole(path)?.id || '';
}

export const SCENE_ASSETS = R20_SCENE_ASSETS;
export const ROUTE_ASSETS = R20_ROUTE_ASSETS;
export const BOSS_ASSETS = R20_BOSS_ASSETS;
export const ENEMY_ASSETS = R20_ENEMY_ASSETS;

export const TAVERN_ICONS = R20_TAVERN_ICON_ASSETS;
export const COMBAT_CUES = R20_COMBAT_CUES;
export const STATUS_ICONS = R20_STATUS_ICON_ASSETS;
export const CONSEQUENCE_ICONS = R20_CONSEQUENCE_ICON_ASSETS;
export const DOWNED_ASSETS = R20_DOWNED_ASSETS;
