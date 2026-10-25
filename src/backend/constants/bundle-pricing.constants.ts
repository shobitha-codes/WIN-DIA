/**
 * WIN-DIA Bundle Pricing Configuration
 * ─────────────────────────────────────
 * THIS IS THE SINGLE SOURCE OF TRUTH for all pricing/bundle logic.
 * Never duplicate these values in cart, checkout, admin, or frontend.
 *
 * Bundle structure:
 *   - Customers cannot purchase single packets.
 *   - The only purchasable unit is a BUNDLE of 6 packets.
 *   - 1 packet = 40 grams
 *   - 1 bundle = 6 packets = 240 grams
 *   - Each bundle contains ONE flavor
 *
 * Exact bundle offer (order-wide, across all flavours):
 *   | Bundles | Bonus packets | Regular price | Discount | Final price |
 *   |       1 |             0 |          ₹384 |       ₹0 |        ₹384 |
 *   |       2 |             2 |          ₹768 |     ₹128 |        ₹640 |
 *   |       3 |             3 |        ₹1,152 |     ₹192 |        ₹960 |
 *   |       4 |             4 |        ₹1,536 |     ₹256 |      ₹1,280 |
 *
 *   - Price per bundle: ₹384 (never discounted as the base unit price)
 *   - One bundle receives no bonus packets and no discount.
 *   - Two to four bundles receive one bonus packet per bundle and a ₹64
 *     discount per bundle.
 *   - final price = regular price - discount
 *   - Bonus packets are free: they are never added as paid line items.
 *
 * Quantities above four: the offer table above only defines 1–4 bundles.
 * Existing behaviour is deliberately preserved for those quantities (the
 * legacy 384 + (N - 1) × 256 formula) until a business rule is confirmed.
 * No bonus packets are granted above four bundles.
 *
 * Shipping: ALWAYS ₹0 (Free Delivery on every order)
 * This applies identically across ALL varieties/flavors.
 */

export const BundlePricing = {
  /** Number of packets per bundle */
  PACKETS_PER_BUNDLE: 6,

  /** Number of PAID packets per bundle */
  PACKETS_SHIPPED_PER_BUNDLE: 6,

  /** Weight of one packet in grams */
  PACKET_WEIGHT_GRAMS: 40,

  /** Weight of one bundle in grams (PACKETS_PER_BUNDLE × PACKET_WEIGHT_GRAMS) */
  BUNDLE_WEIGHT_GRAMS: 240,

  /** Regular (pre-discount) price of one bundle */
  BUNDLE_PRICE: 384,

  /** Discount per bundle for the multi-bundle offer (bundles 2–4) */
  DISCOUNT_PER_BUNDLE: 64,

  /** Free bonus packets per bundle for the multi-bundle offer (bundles 2–4) */
  BONUS_PACKETS_PER_BUNDLE: 1,

  /** The bundle offer starts at 2 and is defined up to 4 bundles */
  MIN_BUNDLES_FOR_OFFER: 2,
  MAX_BUNDLES_FOR_OFFER: 4,

  /** Tiered final prices for the defined offer (1–4 bundles) */
  TIER_1_BUNDLES: 1,
  TIER_1_PRICE: 384,
  TIER_1_BONUS_PACKETS: 0,

  TIER_2_BUNDLES: 2,
  TIER_2_PRICE: 640,
  TIER_2_BONUS_PACKETS: 2,

  TIER_3_BUNDLES: 3,
  TIER_3_PRICE: 960,
  TIER_3_BONUS_PACKETS: 3,

  TIER_4_BUNDLES: 4,
  TIER_4_PRICE: 1280,
  TIER_4_BONUS_PACKETS: 4,

  /**
   * Legacy price added for every bundle beyond the fourth. Kept only so
   * quantities above the defined offer continue to charge what they did
   * before this change. See the note above about the unresolved ambiguity.
   */
  LEGACY_ADDITIONAL_BUNDLE_PRICE: 256,

  /** Shipping cost — always zero, free delivery on all orders */
  SHIPPING_COST: 0,

  /**
   * Tax rate (GST) — deactivated for now. Customers pay the tiered price
   * with no separate tax line; GST is treated as already included
   * in that price rather than added on top. Re-enable with a real rate once
   * business confirms it and the GSTIN is configured (see
   * app/admin/orders/page.jsx COMPANY_INFO.gstin).
   */
  TAX_RATE: 0,

  /** Minimum quantity: 1 bundle */
  MIN_BUNDLES: 1,

  /** Maximum bundles per order (stock-dependent, this is a sanity cap) */
  MAX_BUNDLES_PER_ITEM: 50,
} as const;

/**
 * Calculates pricing for a given number of bundles.
 * This function is the ONLY place bundle math should happen.
 *
 * For 1–4 bundles the exact offer table applies. For quantities above four,
 * the legacy price (384 + (N - 1) × 256) is preserved and no bonus packets
 * are granted, because the offer is not defined beyond four bundles.
 *
 * @param bundles - Number of bundles ordered (must be >= 1)
 * @returns Pricing breakdown
 */
export function calculateBundlePricing(bundles: number) {
  const validBundles = Math.max(1, Math.floor(bundles));

  // Regular price is always the full per-bundle price × quantity.
  const regularPrice = validBundles * BundlePricing.BUNDLE_PRICE;

  let discount: number;
  let lineTotal: number;
  let bonusPackets: number;

  if (validBundles <= BundlePricing.MAX_BUNDLES_FOR_OFFER) {
    // Exact offer table: discount and bonus packets are one per bundle,
    // except for the single-bundle tier which gets neither.
    const offerApplies = validBundles >= BundlePricing.MIN_BUNDLES_FOR_OFFER;
    discount = offerApplies ? validBundles * BundlePricing.DISCOUNT_PER_BUNDLE : 0;
    bonusPackets = offerApplies ? validBundles * BundlePricing.BONUS_PACKETS_PER_BUNDLE : 0;
    lineTotal = regularPrice - discount;
  } else {
    // Above the defined offer: preserve the legacy behaviour exactly.
    lineTotal = BundlePricing.TIER_1_PRICE +
      (validBundles - 1) * BundlePricing.LEGACY_ADDITIONAL_BUNDLE_PRICE;
    discount = regularPrice - lineTotal;
    bonusPackets = 0;
  }

  // Calculate per-bundle average price for display purposes
  const unitPrice = Math.round(lineTotal / validBundles);

  const packetsPaid = validBundles * BundlePricing.PACKETS_SHIPPED_PER_BUNDLE;
  const packetsShipped = packetsPaid + bonusPackets;

  return {
    bundles: validBundles,
    regularPrice,
    discount,
    bonusPackets,
    unitPrice,
    lineTotal,
    packetsPaid,
    packetsShipped,
  };
}

/**
 * Prices a whole ORDER from the bundle count of each line.
 *
 * The offer applies to the TOTAL number of bundles in the order, across every
 * flavour/product, so the customer pays the same whether they buy 2 bundles of
 * one flavour or one bundle each of two flavours. Bundle eligibility is never
 * reset per flavour.
 *
 * @param bundleCounts - bundles per order line (each >= 1)
 * @returns Order-level regular price, bundle discount, final subtotal, bonus
 *          packets, and the average per-bundle price to store on each line
 */
export function calculateOrderBundlePricing(bundleCounts: number[]) {
  const totalBundles = bundleCounts.reduce((sum, n) => sum + Math.max(0, Math.floor(n)), 0);
  if (totalBundles < 1) {
    return {
      totalBundles: 0,
      regularPrice: 0,
      discount: 0,
      subtotal: 0,
      unitPrice: 0,
      bonusPackets: 0,
      packetsPaid: 0,
      packetsShipped: 0,
    };
  }
  const pricing = calculateBundlePricing(totalBundles);
  return {
    totalBundles,
    regularPrice: pricing.regularPrice,
    discount: pricing.discount,
    subtotal: pricing.lineTotal,
    unitPrice: pricing.unitPrice,
    bonusPackets: pricing.bonusPackets,
    packetsPaid: pricing.packetsPaid,
    packetsShipped: pricing.packetsShipped,
  };
}

/**
 * Calculates the full order pricing given line items and optional discount.
 *
 * @param itemsSubtotal - Sum of all line totals (bundles × BUNDLE_PRICE)
 * @param discountAmount - Coupon + bundle discount in ₹ (already validated)
 * @returns Full pricing object for the order
 */
export function calculateOrderTotal(itemsSubtotal: number, discountAmount: number = 0) {
  const shipping = BundlePricing.SHIPPING_COST; // Always 0
  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount);
  const tax = Math.round(taxableAmount * BundlePricing.TAX_RATE * 100) / 100;
  const total = Math.round((taxableAmount + tax + shipping) * 100) / 100;

  return {
    subtotal: itemsSubtotal,
    discount: discountAmount,
    tax,
    shipping,
    total,
  };
}
