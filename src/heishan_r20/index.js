import { mountHeishanR19 } from '../heishan_r19/index.js';

export function mountHeishanR20(root) {
  return mountHeishanR19(root, { release: 'R20', globalName: 'HeishanR20' });
}
