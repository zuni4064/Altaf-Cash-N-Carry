// ─────────────────────────────────────────────────────────────────────────────
// products.ts  —  TYPE DEFINITIONS ONLY
// All product data now lives in Supabase.
// CartContext fetches everything from the database at runtime.
// Admin uploads images to Supabase Storage; URLs are stored in the DB.
// ─────────────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  image: string;           // Supabase Storage public URL
  badge?: "bestseller" | "discount" | "new" | "out-of-stock";
  discount?: number;       // percentage e.g. 15 = 15%
  originalPrice?: number;  // price before discount
  inStock: boolean;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;           // Supabase Storage public URL
  count: number;
}