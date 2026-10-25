-- =====================================================
-- WIN-DIA Exact Bundle Pricing (1–4 bundles)
-- =====================================================
-- This keeps the database helper in sync with the application's single source
-- of truth (src/backend/constants/bundle-pricing.constants.ts).
--
--   | Bundles | Bonus packets | Regular | Discount | Final |
--   |       1 |             0 |    ₹384 |       ₹0 |  ₹384 |
--   |       2 |             2 |    ₹768 |     ₹128 |  ₹640 |
--   |       3 |             3 |  ₹1,152 |     ₹192 |  ₹960 |
--   |       4 |             4 |  ₹1,536 |     ₹256 | ₹1,280 |
--
-- Quantities above four are not part of the defined offer. Their previous
-- 3-bundle-set behaviour is preserved unchanged so this migration does not
-- invent a new tier.

CREATE OR REPLACE FUNCTION calculate_windia_price(bundle_count integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base_packet_price numeric := 64; -- ₹64 per packet (₹384 per 6-packet bundle)
  total_price numeric;
BEGIN
  IF bundle_count IS NULL OR bundle_count < 1 THEN
    RAISE EXCEPTION 'bundle_count must be at least 1';
  END IF;

  CASE
    -- Exact offer table (final price after the bundle discount).
    WHEN bundle_count = 1 THEN
      total_price := 384;

    WHEN bundle_count = 2 THEN
      total_price := 640;

    WHEN bundle_count = 3 THEN
      total_price := 960;

    WHEN bundle_count = 4 THEN
      total_price := 1280;

    -- Above the defined offer: preserve the previous behaviour exactly.
    ELSE
      DECLARE
        complete_sets integer := bundle_count / 3;
        remaining_bundles integer := bundle_count % 3;
        complete_set_price numeric := base_packet_price * 14;
        remaining_price numeric;
      BEGIN
        IF remaining_bundles = 1 THEN
          remaining_price := base_packet_price * 6;
        ELSIF remaining_bundles = 2 THEN
          remaining_price := base_packet_price * 10;
        ELSE
          remaining_price := 0;
        END IF;

        total_price := (complete_sets * complete_set_price) + remaining_price;
      END;
  END CASE;

  RETURN total_price;
END;
$$;

COMMENT ON FUNCTION calculate_windia_price(integer) IS
'Calculates WIN-DIA bundle pricing. 1=₹384, 2=₹640, 3=₹960, 4=₹1,280; '
'quantities above four preserve the legacy 3-bundle-set calculation.';

DO $$
BEGIN
  ASSERT calculate_windia_price(1) = 384, '1 bundle should be ₹384';
  ASSERT calculate_windia_price(2) = 640, '2 bundles should be ₹640';
  ASSERT calculate_windia_price(3) = 960, '3 bundles should be ₹960';
  ASSERT calculate_windia_price(4) = 1280, '4 bundles should be ₹1,280';

  RAISE NOTICE 'All exact bundle pricing tests passed!';
END $$;
