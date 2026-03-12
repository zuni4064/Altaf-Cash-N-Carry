-- =============================================
-- Products Table for Admin Product Management
-- This table stores stock/inStock for each product
-- Product details (images, names, etc.) come from the static products.ts file
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  price NUMERIC,
  unit TEXT DEFAULT 'kg',
  description TEXT,
  image TEXT,
  badge TEXT,
  discount NUMERIC,
  in_stock BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 50,
  rating NUMERIC DEFAULT 4.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Public can read products" ON public.products
FOR SELECT USING (true);

-- Allow authenticated users to manage products (admins)
CREATE POLICY "Authenticated can insert products" ON public.products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update products" ON public.products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete products" ON public.products
FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.products TO anon, authenticated, service_role;

-- =============================================
-- Updated_at Trigger Function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_products_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_products_updated_at_column();

-- =============================================
-- Enable real-time for products table
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

