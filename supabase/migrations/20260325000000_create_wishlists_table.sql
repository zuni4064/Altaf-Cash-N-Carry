-- =============================================
-- Create Wishlists Table for User-Specific Wishlists
-- =============================================

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS public.wishlists;

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlists
CREATE POLICY "Users can view own wishlists" ON public.wishlists
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own wishlist items
CREATE POLICY "Users can insert own wishlist items" ON public.wishlists
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlist items
CREATE POLICY "Users can delete own wishlist items" ON public.wishlists
FOR DELETE USING (auth.uid() = user_id);

-- Allow anyone to view wishlists (for admin purposes)
CREATE POLICY "Anyone can view all wishlists" ON public.wishlists
FOR SELECT USING (true);

-- Allow anyone to insert wishlist items
CREATE POLICY "Anyone can create wishlist items" ON public.wishlists
FOR INSERT WITH CHECK (true);

-- Allow anyone to delete wishlist items
CREATE POLICY "Anyone can delete wishlist items" ON public.wishlists
FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON public.wishlists TO anon, authenticated, service_role;

-- =============================================
-- Create Index for Better Query Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON public.wishlists(user_id, product_id);

-- Verify table creation
SELECT COUNT(*) as wishlists_table_created FROM public.wishlists LIMIT 1;

