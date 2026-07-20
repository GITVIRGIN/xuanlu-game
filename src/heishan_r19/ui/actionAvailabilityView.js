import { evaluateActionAvailability } from '../engine/actionAvailability.js';
import { escapeHtml } from './view.js';

export function actionAvailabilityView(run, action) {
  const availability = evaluateActionAvailability(run, action);
  return {
    ...availability,
    className: availability.available ? '' : 'is-unavailable',
    attributes: availability.available
      ? 'aria-disabled="false" data-availability-code="available"'
      : `disabled aria-disabled="true" data-availability-code="${escapeHtml(availability.code)}"`,
    reasonHtml: availability.available
      ? ''
      : `<span class="availability-reason" data-testid="action-unavailable-reason">不可用：${escapeHtml(availability.reason)}</span>`
  };
}
