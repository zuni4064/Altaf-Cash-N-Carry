// ─────────────────────────────────────────────────────────────────────────────
// products.ts  —  TYPE DEFINITIONS ONLY
// All product data now lives in Supabase.
// CartContext fetches everything from the database at runtime.
// Admin uploads images to Supabase Storage; URLs are stored in the DB.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;          // UUID from product_variants table
  product_id: string;
  label: string;       // e.g. "500g", "1kg", "Family Pack"
  price: number;
  stock: number;
  is_default: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
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
  variants?: ProductVariant[];  // weight/size options with individual prices
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;           // Supabase Storage public URL
  count: number;
}

// Empty arrays kept for backward compatibility with any direct imports.
// All real data is fetched from Supabase in CartContext.
export const products: Product[] = [];
export const categories: Category[] = [];

export const getFeaturedProducts   = (): Product[]           => [];
export const getDiscountedProducts = (): Product[]           => [];
export const getProductsByCategory = (_id: string): Product[] => [];
export const getProductById        = (_id: string): Product | undefined => undefined;