-- ============================================================
-- WIN-DIA  |  20261116_create_missing_tables.sql
-- ============================================================
-- PROBLEM
--   The backend repository layer references 6 tables that do not
--   exist in the database. PostgREST reports these as
--       "Could not find the table 'public.X' in the schema cache"
--   which surfaces as HTTP 500 on:
--
--       public.categories      ->  /api/categories
--       public.banners         ->  /api/banners   (also see container.provider fix)
--       public.page_contents   ->  /api/cms       (also see container.provider fix)
--       public.product_images  ->  /api/products  (images:product_images(*) embed)
--       public.product_reviews ->  /api/reviews
--       public.product_variants->  variant management
--
--   It also adds the two `products` columns the domain model needs.
--   `products.category_id` is required both for the
--   `category:categories(*)` embed and for
--   `ProductService.findAll({ category_id })`.
--
-- SAFETY NOTES (verified against the live schema first)
--   * Every statement is idempotent -> safe to run more than once.
--   * products.id / profiles.id are UUID -> all FKs are type-compatible.
--   * public.products is EMPTY (0 rows)   -> adding a column + FK cannot violate
--     existing data.
--   * short_description, image_url and gi_value already exist -> NOT touched.
--   * No rows are inserted, updated or deleted by this file.
--   * Existing tables are only altered with ADD COLUMN IF NOT EXISTS and
--     guarded ADD CONSTRAINT blocks, so nothing already working can change.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run.
--   (The Supabase CLI is not installed and the project is not linked,
--    and PostgREST cannot execute DDL, so the SQL Editor is the path.)
-- ============================================================


-- ------------------------------------------------------------
-- 0. updated_at trigger helper
--    Created ONLY if absent so an existing shared function is never altered.
-- ------------------------------------------------------------
DO $helper$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
    ) THEN
        EXECUTE $fn$
            CREATE FUNCTION public.set_updated_at()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            AS $f$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $f$
        $fn$;
    END IF;
END
$helper$;


-- ------------------------------------------------------------
-- 1. categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    description TEXT,
    parent_id   UUID,
    image_url   TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The seed script relies on this for its ON CONFLICT (slug) clause.
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON public.categories (slug);

DO $fk$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'categories'
          AND constraint_name = 'fk_categories_parent'
    ) THEN
        ALTER TABLE public.categories
            ADD CONSTRAINT fk_categories_parent
            FOREIGN KEY (parent_id) REFERENCES public.categories (id)
            ON DELETE SET NULL;
    END IF;
END
$fk$;


-- ------------------------------------------------------------
-- 2. product_variants   (created before product_images, which references it)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID NOT NULL,
    name             TEXT NOT NULL,
    sku              TEXT NOT NULL,
    price            NUMERIC(12,2) NOT NULL,
    compare_at_price NUMERIC(12,2),
    cost_price       NUMERIC(12,2),
    stock_quantity   INTEGER NOT NULL DEFAULT 0,
    weight_grams     INTEGER,
    attributes       JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $fk$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'product_variants'
          AND constraint_name = 'fk_product_variants_product'
    ) THEN
        ALTER TABLE public.product_variants
            ADD CONSTRAINT fk_product_variants_product
            FOREIGN KEY (product_id) REFERENCES public.products (id)
            ON DELETE CASCADE;
    END IF;
END
$fk$;


-- ------------------------------------------------------------
-- 3. product_images
--    Required for the embed used by ProductRepository.findAll():
--        .select('*, images:product_images(*), category:categories(*)')
--    PostgREST resolves the embed at query-planning time, so the FK must exist
--    even though public.products currently has 0 rows.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID NOT NULL,
    variant_id    UUID,
    image_url     TEXT NOT NULL,
    alt_text      TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary    BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $fk$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'product_images'
          AND constraint_name = 'fk_product_images_product'
    ) THEN
        ALTER TABLE public.product_images
            ADD CONSTRAINT fk_product_images_product
            FOREIGN KEY (product_id) REFERENCES public.products (id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'product_images'
          AND constraint_name = 'fk_product_images_variant'
    ) THEN
        ALTER TABLE public.product_images
            ADD CONSTRAINT fk_product_images_variant
            FOREIGN KEY (variant_id) REFERENCES public.product_variants (id)
            ON DELETE SET NULL;
    END IF;
END
$fk$;


-- ------------------------------------------------------------
-- 4. product_reviews
--    rating bounds match the application check in review.service.ts:
--        if (dto.rating < 1 || dto.rating > 5) -> ValidationError
--    status values match the ReviewStatus enum:
--        'pending' | 'approved' | 'rejected'
--
--    user_id deliberately has NO foreign key: nothing embeds it, and an FK here
--    could reject an otherwise valid review if a profiles row were missing.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id    UUID NOT NULL,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title      TEXT,
    comment    TEXT,
    status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $fk$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'product_reviews'
          AND constraint_name = 'fk_product_reviews_product'
    ) THEN
        ALTER TABLE public.product_reviews
            ADD CONSTRAINT fk_product_reviews_product
            FOREIGN KEY (product_id) REFERENCES public.products (id)
            ON DELETE CASCADE;
    END IF;
END
$fk$;


-- ------------------------------------------------------------
-- 5. banners
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    image_url     TEXT NOT NULL,
    link_url      TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 6. page_contents
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_contents (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       TEXT NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    metadata   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS page_contents_slug_unique ON public.page_contents (slug);


-- ------------------------------------------------------------
-- 7. products: add the two columns the domain model expects
--    Both are guarded, and public.products has 0 rows, so this is safe.
-- ------------------------------------------------------------
DO $products$
BEGIN
    ALTER TABLE public.products
        ADD COLUMN IF NOT EXISTS category_id UUID;

    ALTER TABLE public.products
        ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN NOT NULL DEFAULT false;

    -- Enables the category:categories(*) embed and
    -- ProductService.findAll({ category_id: ... }).
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'products'
          AND constraint_name = 'fk_products_category'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT fk_products_category
            FOREIGN KEY (category_id) REFERENCES public.categories (id)
            ON DELETE SET NULL;
    END IF;
END
$products$;


-- ------------------------------------------------------------
-- 8. updated_at triggers for the new tables
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_categories_updated_at      ON public.categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_images_updated_at   ON public.product_images;
CREATE TRIGGER trg_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_reviews_updated_at  ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_banners_updated_at          ON public.banners;
CREATE TRIGGER trg_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_page_contents_updated_at    ON public.page_contents;
CREATE TRIGGER trg_page_contents_updated_at
    BEFORE UPDATE ON public.page_contents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- 9. Row Level Security
--    All six repositories are constructed with the request-scoped client
--    (anon key + caller's JWT), so RLS applies to every read. With RLS enabled
--    and NO SELECT policy, queries return 0 rows instead of erroring - so a
--    public read policy is required for these catalog / CMS tables.
--
--    Writes are intentionally left without policies: BaseRepository retries a
--    policy-violating mutation with the admin (service_role) client, which
--    bypasses RLS. That path requires SUPABASE_SERVICE_ROLE_KEY to be set.
-- ------------------------------------------------------------
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_contents    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public can read product variants" ON public.product_variants;
CREATE POLICY "Public can read product variants"
    ON public.product_variants FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public can read product images" ON public.product_images;
CREATE POLICY "Public can read product images"
    ON public.product_images FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.product_reviews;
CREATE POLICY "Public can read approved reviews"
    ON public.product_reviews FOR SELECT
    TO anon, authenticated
    USING (status = 'approved' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can submit own reviews" ON public.product_reviews;
CREATE POLICY "Users can submit own reviews"
    ON public.product_reviews FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can edit own reviews" ON public.product_reviews;
CREATE POLICY "Users can edit own reviews"
    ON public.product_reviews FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can read banners" ON public.banners;
CREATE POLICY "Public can read banners"
    ON public.banners FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public can read page contents" ON public.page_contents;
CREATE POLICY "Public can read page contents"
    ON public.page_contents FOR SELECT
    TO anon, authenticated
    USING (true);


-- ------------------------------------------------------------
-- 10. Tell PostgREST to rebuild its schema cache.
--     Without this, newly created tables keep returning
--     "Could not find the table ... in the schema cache" until the next
--     automatic reload.
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- VERIFICATION (run after executing the above)
-- ============================================================
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public'
--    AND table_name IN ('categories','banners','page_contents',
--                       'product_images','product_reviews','product_variants')
--  ORDER BY table_name;
--  -> expect 6 rows
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='products'
--    AND column_name IN ('category_id','is_gluten_free');
--  -> expect 2 rows
-- ============================================================
