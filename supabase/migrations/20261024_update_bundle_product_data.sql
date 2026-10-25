-- =====================================================
-- WIN-DIA Bundle Product Data
-- =====================================================
-- Aligns the catalog with the 6-packet bundle structure and the exact
-- order-wide offer implemented in
-- src/backend/constants/bundle-pricing.constants.ts:
--
--   1 bundle = 6 packets × 40g = 240g, ₹384
--   2 bundles = 12 paid packets + 2 bonus, ₹640
--   3 bundles = 18 paid packets + 3 bonus, ₹960
--   4 bundles = 24 paid packets + 4 bonus, ₹1,280
--
-- A per-bundle product price stays at the regular ₹384. Multi-bundle
-- discounts and bonus packets are calculated order-wide by the application.
--
-- Safe to run multiple times.

UPDATE public.products
SET
  price = 384,
  original_price = NULL,
  net_weight = '240g',
  updated_at = now()
WHERE slug IN (
  'jeera-thins',
  'methi-thins',
  'moringa-thins',
  'onion-thins',
  'garlic-thins',
  'curry-leaf-thins',
  'curry-leaves-thins',
  'windia-assorted-combo-v2'
);

COMMENT ON COLUMN public.products.price IS
'Regular per-bundle price in INR. Multi-bundle discounts are applied order-wide.';
