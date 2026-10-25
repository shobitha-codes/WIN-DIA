/**
 * WIN-DIA Frontend Pricing Utilities
 * ───────────────────────────────────
 * Client-side pricing helpers that delegate to the SAME source of truth as the
 * backend (src/backend/constants/bundle-pricing.constants.ts).
 *
 * IMPORTANT: These are for DISPLAY ONLY. The backend independently validates all
 * prices and never trusts a client-submitted discount or final price.
 */

import {
  BundlePricing,
  calculateBundlePricing,
  calculateOrderBundlePricing,
} from "@/src/backend/constants/bundle-pricing.constants";

export { BundlePricing, calculateBundlePricing, calculateOrderBundlePricing };

/**
 * Bundle configuration (kept for existing frontend imports).
 */
export const BUNDLE_CONFIG = {
  PACKETS_PER_BUNDLE: BundlePricing.PACKETS_PER_BUNDLE,
  PACKET_WEIGHT_GRAMS: BundlePricing.PACKET_WEIGHT_GRAMS,
  BUNDLE_WEIGHT_GRAMS: BundlePricing.BUNDLE_WEIGHT_GRAMS,
  MIN_BUNDLES: BundlePricing.MIN_BUNDLES,
  MAX_BUNDLES: BundlePricing.MAX_BUNDLES_PER_ITEM,
} as const;

/**
 * Total final price for N bundles (regular price minus bundle discount).
 *
 * Examples:
 * - 1 bundle = ₹384
 * - 2 bundles = ₹640
 * - 3 bundles = ₹960
 * - 4 bundles = ₹1,280
 */
export function calculateBundlePrice(bundles: number): number {
  return calculateBundlePricing(bundles).lineTotal;
}

/**
 * Average per-bundle price for a given quantity.
 */
export function calculateUnitPrice(bundles: number): number {
  return calculateBundlePricing(bundles).unitPrice;
}

/**
 * Formats a price for display with rupee symbol.
 */
export function formatPrice(amount: number, showDecimals = false): string {
  if (showDecimals) {
    return `₹${amount.toFixed(2)}`;
  }
  return `₹${Math.round(amount)}`;
}

/**
 * Total weight in grams for a given number of paid bundles (bonus excluded).
 */
export function calculateTotalWeight(bundles: number): number {
  return calculateBundlePricing(bundles).packetsPaid * BundlePricing.PACKET_WEIGHT_GRAMS;
}

/**
 * Returns the exact offer tiers for display.
 */
export function getPricingTiers() {
  return [1, 2, 3, 4].map((bundles) => {
    const pricing = calculateBundlePricing(bundles);
    return {
      bundles,
      bonusPackets: pricing.bonusPackets,
      regularPrice: pricing.regularPrice,
      discount: pricing.discount,
      price: pricing.lineTotal,
      pricePerBundle: pricing.unitPrice,
      savings: pricing.discount,
    };
  });
}
