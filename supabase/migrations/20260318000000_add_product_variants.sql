-- =============================================
-- Product Variants Table
-- Each row is one size/weight option for a product
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,       -- e.g. "500g", "1kg", "Family Pack"
  price       NUMERIC NOT NULL,
  stock       INTEGER DEFAULT 0,
  is_default  BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants (product_id);

-- ── Row Level Security ──────────────────────────────
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product_variants"
  ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert product_variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update product_variants"
  ON public.product_variants FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete product_variants"
  ON public.product_variants FOR DELETE
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.product_variants TO anon, authenticated, service_role;

-- ── Enable realtime ─────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;

-- =============================================
-- Add variant columns to order_items
-- (nullable for backward compatibility)
-- =============================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id    UUID    REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_label TEXT;
