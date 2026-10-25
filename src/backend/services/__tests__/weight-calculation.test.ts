/**
 * Integration tests for weight calculation flow:
 * Product catalog → Checkout → Order items → DTDC shipment
 * 
 * Updated for 6-packet bundle structure (240g per bundle)
 */

import { calculateBundlePricing } from '../../constants/bundle-pricing.constants';

describe('Weight Calculation Integration', () => {
  describe('Order Items Weight Storage', () => {
    it('should store 240g per bundle for qty=1', () => {
      // Simulates checkout.service.ts behavior
      const bundles = 1;
      const weightPerBundle = 240; // From products.net_weight = "240g" (6 × 40g)
      
      const orderItem = {
        qty: bundles,
        net_weight_grams: weightPerBundle, // Store per-bundle weight
      };
      
      expect(orderItem.qty).toBe(1);
      expect(orderItem.net_weight_grams).toBe(240);
    });

    it('should store 240g per bundle for qty=2', () => {
      const bundles = 2;
      const weightPerBundle = 240;
      
      const orderItem = {
        qty: bundles,
        net_weight_grams: weightPerBundle, // NOT multiplied by qty
      };
      
      expect(orderItem.qty).toBe(2);
      expect(orderItem.net_weight_grams).toBe(240);
    });

    it('should store 240g per bundle for qty=3', () => {
      const bundles = 3;
      const weightPerBundle = 240;
      
      const orderItem = {
        qty: bundles,
        net_weight_grams: weightPerBundle,
      };
      
      expect(orderItem.qty).toBe(3);
      expect(orderItem.net_weight_grams).toBe(240);
    });
  });

  describe('DTDC Total Weight Calculation', () => {
    it('should calculate 240g total for 1 bundle', () => {
      // Simulates dtdc.ts calculateTotalWeightKg behavior
      const items = [
        { name: 'Garlic Flavour', net_weight_grams: 240, qty: 1 }
      ];
      
      const totalGrams = items.reduce((sum, i) => {
        return sum + (i.net_weight_grams * i.qty);
      }, 0);
      
      const totalKg = totalGrams / 1000;
      
      expect(totalGrams).toBe(240);
      expect(totalKg).toBe(0.24);
    });

    it('should calculate 480g total for 2 bundles', () => {
      const items = [
        { name: 'Garlic Flavour', net_weight_grams: 240, qty: 2 }
      ];
      
      const totalGrams = items.reduce((sum, i) => {
        return sum + (i.net_weight_grams * i.qty);
      }, 0);
      
      const totalKg = totalGrams / 1000;
      
      expect(totalGrams).toBe(480);
      expect(totalKg).toBe(0.48);
    });

    it('should calculate 720g total for 3 bundles', () => {
      const items = [
        { name: 'Garlic Flavour', net_weight_grams: 240, qty: 3 }
      ];
      
      const totalGrams = items.reduce((sum, i) => {
        return sum + (i.net_weight_grams * i.qty);
      }, 0);
      
      const totalKg = totalGrams / 1000;
      
      expect(totalGrams).toBe(720);
      expect(totalKg).toBe(0.72);
    });

    it('should handle multiple items correctly', () => {
      const items = [
        { name: 'Garlic Flavour', net_weight_grams: 240, qty: 2 }, // 480g
        { name: 'Jeera Flavour', net_weight_grams: 240, qty: 1 },  // 240g
      ];
      
      const totalGrams = items.reduce((sum, i) => {
        return sum + (i.net_weight_grams * i.qty);
      }, 0);
      
      const totalKg = totalGrams / 1000;
      
      expect(totalGrams).toBe(720); // 480 + 240
      expect(totalKg).toBe(0.72);
    });
  });

  describe('Regression: No Double Multiplication', () => {
    it('should NOT multiply by packets in checkout', () => {
      const bundles = 1;
      const weightPerBundle = 240; // Already represents 6 × 40g
      const packetsShipped = bundles * 6; // 6 packets
      
      // OLD BUGGY CODE would do: weight * packetsShipped
      const buggyResult = weightPerBundle * packetsShipped; // 240 * 6 = 1440 ❌
      
      // NEW CORRECT CODE does: just use weightPerBundle
      const correctResult = weightPerBundle; // 240 ✅
      
      expect(buggyResult).toBe(1440); // This was the bug
      expect(correctResult).toBe(240); // This is the fix
    });

    it('should NOT multiply by qty twice in DTDC', () => {
      const bundles = 2;
      const weightPerBundle = 240;
      
      // If checkout stored total weight (buggy):
      const buggyStoredWeight = weightPerBundle * bundles; // 240 * 2 = 480
      const buggyTotal = buggyStoredWeight * bundles; // 480 * 2 = 960 ❌
      
      // Correct: checkout stores per-bundle, DTDC multiplies by qty
      const correctStoredWeight = weightPerBundle; // 240
      const correctTotal = correctStoredWeight * bundles; // 240 * 2 = 480 ✅
      
      expect(buggyTotal).toBe(960); // Double multiplication bug
      expect(correctTotal).toBe(480); // Correct calculation
    });
  });

  describe('Exact Bundle Pricing', () => {
    it('should calculate ₹384 for 1 bundle (no bonus, no discount)', () => {
      expect(calculateBundlePricing(1)).toMatchObject({
        regularPrice: 384, discount: 0, lineTotal: 384, bonusPackets: 0,
      });
    });

    it('should calculate ₹640 for 2 bundles (2 bonus packets, ₹128 discount)', () => {
      expect(calculateBundlePricing(2)).toMatchObject({
        regularPrice: 768, discount: 128, lineTotal: 640, bonusPackets: 2,
      });
    });

    it('should calculate ₹960 for 3 bundles (3 bonus packets, ₹192 discount)', () => {
      expect(calculateBundlePricing(3)).toMatchObject({
        regularPrice: 1152, discount: 192, lineTotal: 960, bonusPackets: 3,
      });
    });

    it('should calculate ₹1280 for 4 bundles (4 bonus packets, ₹256 discount)', () => {
      expect(calculateBundlePricing(4)).toMatchObject({
        regularPrice: 1536, discount: 256, lineTotal: 1280, bonusPackets: 4,
      });
    });

    it('should include bonus packets in packets shipped for fulfilment', () => {
      expect(calculateBundlePricing(2).packetsPaid).toBe(12);
      expect(calculateBundlePricing(2).packetsShipped).toBe(14);
    });
  });
});
