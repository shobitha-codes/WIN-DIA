import {
  calculateBundlePricing,
  calculateOrderBundlePricing,
} from '../../constants/bundle-pricing.constants';
import { parseComboSelections } from '../../constants/combo-flavors.constants';

describe('calculateOrderBundlePricing (exact offer across the whole order)', () => {
  it('produces the exact pricing table for 1–4 bundles', () => {
    expect(calculateOrderBundlePricing([1])).toMatchObject({
      totalBundles: 1, regularPrice: 384, discount: 0, subtotal: 384, bonusPackets: 0,
    });
    expect(calculateOrderBundlePricing([2])).toMatchObject({
      totalBundles: 2, regularPrice: 768, discount: 128, subtotal: 640, bonusPackets: 2,
    });
    expect(calculateOrderBundlePricing([3])).toMatchObject({
      totalBundles: 3, regularPrice: 1152, discount: 192, subtotal: 960, bonusPackets: 3,
    });
    expect(calculateOrderBundlePricing([4])).toMatchObject({
      totalBundles: 4, regularPrice: 1536, discount: 256, subtotal: 1280, bonusPackets: 4,
    });
  });

  it('charges the same for 2 bundles of one flavour as 1 bundle each of two flavours', () => {
    const oneLine = calculateOrderBundlePricing([2]);
    const twoLines = calculateOrderBundlePricing([1, 1]);
    expect(twoLines.subtotal).toBe(oneLine.subtotal);
    expect(twoLines.subtotal).toBe(640);
    expect(twoLines.bonusPackets).toBe(2);
  });

  it('applies one order-wide offer for any split of 3 bundles', () => {
    for (const split of [[3], [2, 1], [1, 1, 1]]) {
      const r = calculateOrderBundlePricing(split);
      expect(r.subtotal).toBe(960);
      expect(r.discount).toBe(192);
      expect(r.bonusPackets).toBe(3);
    }
  });

  it('stores the average per-bundle price and total packets shipped', () => {
    const r = calculateOrderBundlePricing([1, 2]);
    expect(r.totalBundles).toBe(3);
    expect(r.subtotal).toBe(960);
    expect(r.unitPrice).toBe(320);
    expect(r.packetsPaid).toBe(18);
    expect(r.packetsShipped).toBe(21); // 18 paid + 3 bonus
  });

  it('preserves the legacy price and grants no bonus above four bundles', () => {
    const r = calculateOrderBundlePricing([5]);
    expect(r.subtotal).toBe(384 + (5 - 1) * 256);
    expect(r.bonusPackets).toBe(0);
  });

  it('returns zeros for an empty order', () => {
    expect(calculateOrderBundlePricing([])).toEqual({
      totalBundles: 0,
      regularPrice: 0,
      discount: 0,
      subtotal: 0,
      unitPrice: 0,
      bonusPackets: 0,
      packetsPaid: 0,
      packetsShipped: 0,
    });
  });

  it('keeps calculateBundlePricing consistent with the table', () => {
    expect(calculateBundlePricing(3).lineTotal).toBe(960);
  });
});

describe('parseComboSelections', () => {
  it('accepts exactly 6 packets and builds a readable summary', () => {
    const r = parseComboSelections({ garlic: 2, jeera: 1, onion: 1, 'curry-leaves': 2 });
    expect(r).toEqual({ ok: true, summary: 'Garlic ×2, Jeera ×1, Onion ×1, Curry Leaves ×2' });
  });

  it('treats both curry-leaf spellings as Curry Leaves', () => {
    const r = parseComboSelections({ 'curry-leaf': 3, garlic: 3 });
    expect(r.ok && r.summary).toBe('Curry Leaves ×3, Garlic ×3');
  });

  it('ignores zero counts', () => {
    const r = parseComboSelections({ garlic: 6, jeera: 0 });
    expect(r).toEqual({ ok: true, summary: 'Garlic ×6' });
  });

  it('rejects totals other than 6', () => {
    expect(parseComboSelections({ garlic: 2, jeera: 2 }).ok).toBe(false);
    expect(parseComboSelections({ garlic: 4, jeera: 4 }).ok).toBe(false);
  });

  it('rejects negative, fractional or malformed selections', () => {
    expect(parseComboSelections({ garlic: -1, jeera: 7 }).ok).toBe(false);
    expect(parseComboSelections({ garlic: 1.5, jeera: 4.5 }).ok).toBe(false);
    expect(parseComboSelections(null).ok).toBe(false);
    expect(parseComboSelections([1, 2, 3]).ok).toBe(false);
    expect(parseComboSelections({ 'bad id!': 6 }).ok).toBe(false);
  });
});
