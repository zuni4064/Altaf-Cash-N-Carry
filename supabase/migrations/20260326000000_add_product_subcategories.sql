-- =============================================
-- Migration: Add sub_category to Products
-- =============================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category TEXT;
