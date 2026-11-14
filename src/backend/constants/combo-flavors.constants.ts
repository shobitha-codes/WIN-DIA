/**
 * Combo flavour helpers (server side).
 * The combo selector sends `flavorSelections` as { flavorId: packetCount }.
 * Keep the labels in sync with src/frontend/lib/comboFlavors.js.
 *
 * One combo = one bundle = 6 packets. The selection for ONE combo must add up
 * to exactly 6 packets, e.g. { garlic: 2, jeera: 2, onion: 1, 'curry-leaves': 1 }.
 */
import { BundlePricing } from './bundle-pricing.constants';

const FLAVOR_LABELS: Record<string, string> = {
  'curry-leaves': 'Curry Leaves',
  'curry-leaf': 'Curry Leaves',
  garlic: 'Garlic',
  jeera: 'Jeera',
  onion: 'Onion',
};

/** Returns the canonical label for a known flavour id, or null if unknown. */
function knownFlavorLabel(id: string): string | null {
  return Object.prototype.hasOwnProperty.call(FLAVOR_LABELS, id) ? FLAVOR_LABELS[id] : null;
}

export function flavorLabel(id: string): string {
  const known = knownFlavorLabel(String(id || '').toLowerCase());
  if (known) return known;
  return String(id || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// A plain shape (not a discriminated union): the project's tsconfig isn't
// strict, so TypeScript can't narrow a union on `ok` there.
export interface ComboParseResult {
  ok: boolean;
  summary?: string;
  reason?: string;
  /**
   * Canonical flavour label -> packets for ONE combo, e.g.
   * { 'Curry Leaves': 2, Garlic: 2, Jeera: 1, Onion: 1 }.
   * These are exactly the labels the order_combo_selections table accepts.
   */
  selections?: Record<string, number>;
}

/**
 * Validates a combo's flavour selection (must total exactly one bundle of
 * packets, with whole, non-negative counts, using only known flavours) and
 * returns:
 *  - a readable summary such as "Garlic ×2, Jeera ×1, Onion ×1, Curry Leaves ×2"
 *    that is stored in the order item's `flavor` column, and
 *  - the structured selections keyed by canonical flavour label, which are
 *    saved to order_combo_selections so stock can be deducted per flavour.
 *
 * Ids that map to the same flavour (e.g. 'curry-leaf' and 'curry-leaves') are
 * merged into one entry.
 */
export function parseComboSelections(selections: unknown): ComboParseResult {
  if (!selections || typeof selections !== 'object' || Array.isArray(selections)) {
    return { ok: false, reason: 'Invalid combo selection' };
  }

  const byLabel: Record<string, number> = {};
  let total = 0;
  for (const [id, rawCount] of Object.entries(selections as Record<string, unknown>)) {
    const count = Number(rawCount);
    if (!Number.isInteger(count) || count < 0) {
      return { ok: false, reason: 'Invalid combo selection' };
    }
    if (count === 0) continue;
    if (!/^[a-z0-9_-]{1,40}$/i.test(id)) {
      return { ok: false, reason: 'Invalid combo flavour' };
    }

    const label = knownFlavorLabel(id.toLowerCase());
    if (!label) {
      return { ok: false, reason: 'Invalid combo flavour' };
    }

    byLabel[label] = (byLabel[label] || 0) + count;
    total += count;
  }

  if (total !== BundlePricing.PACKETS_PER_BUNDLE) {
    return {
      ok: false,
      reason: `A combo must contain exactly ${BundlePricing.PACKETS_PER_BUNDLE} packets (you selected ${total})`,
    };
  }

  const summary = Object.entries(byLabel)
    .map(([label, count]) => `${label} ×${count}`)
    .join(', ');

  return { ok: true, summary, selections: byLabel };
}