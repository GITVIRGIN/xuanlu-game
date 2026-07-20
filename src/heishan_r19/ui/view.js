import { assetDescriptor } from '../data/assets.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function image(path, alt, className = '', { loading = 'eager', decoding = 'async' } = {}) {
  if (!path) return `<div class="portrait-fallback ${className}" aria-label="${escapeHtml(alt)}">${escapeHtml(String(alt).slice(0, 1))}</div>`;
  const { roleId, url, fallbackUrl } = assetDescriptor(path);
  const roleAttribute = roleId ? ` data-asset-role="${escapeHtml(roleId)}"` : '';
  const fallbackAttribute = fallbackUrl ? ` data-asset-fallback-src="${escapeHtml(fallbackUrl)}"` : '';
  return `<img class="${className}" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="${escapeHtml(loading)}" decoding="${escapeHtml(decoding)}"${roleAttribute}${fallbackAttribute}>`;
}

export function meter(value, maximum, kind, testId, label = '进度') {
  const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(1, maximum)) * 100)));
  return `<div class="meter ${kind}" role="meter" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="${maximum}" aria-valuenow="${value}" aria-valuetext="${value} / ${maximum}" data-testid="${testId || ''}"><span style="width:${percent}%"></span></div>`;
}

export function daomaiLabels(delta = {}) {
  return Object.entries(delta).map(([id, value]) => `<span class="build-chip" data-daomai-id="${id}">${escapeHtml(id)} +${value}</span>`).join('');
}
