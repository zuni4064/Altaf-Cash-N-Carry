import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';
import { useAuth } from "@/context/AuthContext";
import { products as staticProducts, categories as staticCategories, Product, Category } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  deliveryCharge: number;
  customerName: string;
  customerEmail?: string;
  phone: string;
  address: string;
  date: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
}

interface CartContextType {
  items: CartItem[];
  orders: Order[];
  products: Product[];
  categories: Category[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  placeOrder: (name: string, email: string, phone: string, address: string, paymentMethod: string, paymentStatus: string, deliveryCharge?: number) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  refreshProducts: () => Promise<void>;
  cartBounce: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: map Supabase row → Product
───────────────────────────────────────────────────────────────────────────── */
function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name ?? "Unknown Product",
    category: row.category ?? "other",
    price: row.price ?? 0,
    unit: row.unit ?? "piece",
    description: row.description ?? "",
    image: row.image ?? "",
    badge: row.badge ?? undefined,
    discount: row.discount ?? undefined,
    originalPrice: row.original_price ?? undefined,
    inStock: row.in_stock ?? true,
    stock: row.stock ?? 0,
    rating: row.rating ?? 4.0,
    reviewCount: row.review_count ?? 0,
  };
}

function mapDbCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name ?? "",
    icon: row.icon ?? "",
    image: row.image ?? "",
    count: row.count ?? 0,
  };
}

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `products/${productId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("cart_items", JSON.stringify(items)); } catch { }
  }, [items]);

  const [productsState, setProductsState] = useState<Product[]>([]);
  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartBounce, setCartBounce] = useState(false);

  /* ───────────────── INITIAL DATA LOAD ───────────────── */
  useEffect(() => {
    if (isInitialized) return;

    const init = async () => {
      try {

        const { data: dbProducts } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: true });

        setProductsState((dbProducts ?? []).map(mapDbProduct));

        const { data: dbCategories } = await supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true });

        const staticIds = new Set(staticCategories.map(c => c.id));

        const dbOnlyCategories = (dbCategories ?? [])
          .filter(r => !staticIds.has(r.id))
          .map(mapDbCategory);

        setCategoriesState([...staticCategories, ...dbOnlyCategories]);

        setIsInitialized(true);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load products");
        setIsInitialized(true);
      }
    };

    init();
  }, [isInitialized]);

  /* ───────────────── REALTIME PRODUCTS ───────────────── */
  useEffect(() => {
    if (!isInitialized) return;

    const channel = supabase
      .channel("public:products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {

        if (payload.eventType === "INSERT") {
          const newProduct = mapDbProduct(payload.new);
          setProductsState(prev =>
            prev.some(p => p.id === newProduct.id) ? prev : [newProduct, ...prev]
          );
        }

        if (payload.eventType === "UPDATE") {
          const updated = mapDbProduct(payload.new);
          setProductsState(prev => prev.map(p => p.id === updated.id ? updated : p));
        }

        if (payload.eventType === "DELETE") {
          const deletedId = (payload.old as any).id;
          setProductsState(prev => prev.filter(p => p.id !== deletedId));
        }

      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [isInitialized]);

  /* ───────────────── REALTIME CATEGORIES (NEW) ───────────────── */
  useEffect(() => {
    if (!isInitialized) return;

    const channel = supabase
      .channel("public:categories")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "categories" },
        payload => {

          const newCat = mapDbCategory(payload.new);

          setCategoriesState(prev =>
            prev.some(c => c.id === newCat.id)
              ? prev
              : [...prev, newCat]
          );

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [isInitialized]);

  /* ───────────────── CART HELPERS ───────────────── */
  const triggerBounce = () => {
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  const addToCart = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);

      return existing
        ? prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
        : [...prev, { product, quantity: 1 }];
    });

    triggerBounce();
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prev =>
      prev.map(i =>
        i.product.id === productId
          ? { ...i, quantity }
          : i
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const price = item.product.discount
        ? item.product.price * (1 - item.product.discount / 100)
        : item.product.price;

      return sum + price * item.quantity;

    }, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((s, i) => s + i.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      orders,
      products: productsState,
      categories: categoriesState,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
      placeOrder: async () => null,
      updateOrderStatus: () => { },
      addProduct: () => { },
      updateProduct: () => { },
      deleteProduct: () => { },
      refreshProducts: async () => { },
      cartBounce
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};