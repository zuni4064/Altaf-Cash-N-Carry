import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';
import { useAuth } from "@/context/AuthContext";
import { products as staticProducts, categories as staticCategories, Product, Category, ProductVariant } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;  // the chosen weight/size variant, if any
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
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
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

/* ── Map Supabase row → ProductVariant ─────────────────── */
function mapDbVariant(row: any): ProductVariant {
  return {
    id:         row.id,
    product_id: row.product_id,
    label:      row.label      ?? "",
    price:      row.price      ?? 0,
    stock:      row.stock      ?? 0,
    is_default: row.is_default ?? false,
    sort_order: row.sort_order ?? 0,
  };
}

/* ── Map Supabase row → Product ─────────────────────────── */
function mapDbProduct(row: any, variants?: ProductVariant[]): Product {
  return {
    id:            row.id,
    name:          row.name          ?? "Unknown Product",
    category:      row.category      ?? "other",
    price:         row.price         ?? 0,
    unit:          row.unit          ?? "piece",
    description:   row.description   ?? "",
    image:         row.image         ?? "",
    badge:         row.badge         ?? undefined,
    discount:      row.discount      ?? undefined,
    originalPrice: row.original_price ?? undefined,
    inStock:       row.in_stock      ?? true,
    stock:         row.stock         ?? 0,
    rating:        row.rating        ?? 4.0,
    reviewCount:   row.review_count  ?? 0,
    variants:      variants ?? undefined,
  };
}

/* ── Map Supabase row → Category ────────────────────────── */
function mapDbCategory(row: any): Category {
  return {
    id:    row.id,
    name:  row.name  ?? "",
    icon:  row.icon  ?? "",
    image: row.image ?? "",
    count: row.count ?? 0,
  };
}

/* ── Upload product image to Supabase Storage ───────────── */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext  = file.name.split(".").pop() ?? "jpg";
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

/* ════════════════════════════════════════════════════════
   PROVIDER
════════════════════════════════════════════════════════ */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  /* ── Cart persisted to localStorage ── */
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("cart_items", JSON.stringify(items)); } catch { }
  }, [items]);

  const [productsState,   setProductsState]   = useState<Product[]>([]);
  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [isInitialized,   setIsInitialized]   = useState(false);
  const [orders,          setOrders]          = useState<Order[]>([]);
  const [cartBounce,      setCartBounce]      = useState(false);

  /* ── Initial data load ── */
  useEffect(() => {
    if (isInitialized) return;

    const init = async () => {
      try {
        const { data: dbProducts } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: true });

        /* Fetch all variants in one call and group by product_id */
        const { data: dbVariants } = await supabase
          .from("product_variants")
          .select("*")
          .order("sort_order", { ascending: true });

        const variantsByProduct = new Map<string, ProductVariant[]>();
        for (const v of (dbVariants ?? [])) {
          const mapped = mapDbVariant(v);
          if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
          variantsByProduct.get(v.product_id)!.push(mapped);
        }

        setProductsState(
          (dbProducts ?? []).map(row =>
            mapDbProduct(row, variantsByProduct.get(row.id))
          )
        );

        const { data: dbCategories } = await supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true });

        const staticIds = new Set(staticCategories.map(c => c.id));
        const dbOnly    = (dbCategories ?? [])
          .filter(r => !staticIds.has(r.id))
          .map(mapDbCategory);

        setCategoriesState([...staticCategories, ...dbOnly]);
        setIsInitialized(true);
      } catch (err) {
        console.error("CartContext init error:", err);
        toast.error("Failed to load products. Please refresh.");
        setIsInitialized(true);
      }
    };

    init();
  }, [isInitialized]);

  /* ── Realtime product updates ── */
  useEffect(() => {
    if (!isInitialized) return;

    const channel = supabase
      .channel("public:products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, payload => {
        if (payload.eventType === "INSERT") {
          const p = mapDbProduct(payload.new);
          setProductsState(prev => prev.some(x => x.id === p.id) ? prev : [p, ...prev]);
        }
        if (payload.eventType === "UPDATE") {
          const p = mapDbProduct(payload.new);
          setProductsState(prev => prev.map(x => x.id === p.id ? p : x));
          setItems(prev => prev.map(item =>
            item.product.id === p.id ? { ...item, product: p } : item
          ));
        }
        if (payload.eventType === "DELETE") {
          const id = (payload.old as any).id;
          setProductsState(prev => prev.filter(x => x.id !== id));
          setItems(prev => prev.filter(item => item.product.id !== id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isInitialized]);

  /* ── Realtime category inserts ── */
  useEffect(() => {
    if (!isInitialized) return;

    const channel = supabase
      .channel("public:categories")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "categories" }, payload => {
        const newCat = mapDbCategory(payload.new);
        setCategoriesState(prev =>
          prev.some(c => c.id === newCat.id) ? prev : [...prev, newCat]
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isInitialized]);

  /* ── Orders fetch + realtime ── */
  useEffect(() => {
    if (!isInitialized) return;

    const fetchOrders = async () => {
      if (!user) { setOrders([]); return; }

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) { console.error("Orders fetch error:", error); return; }

      const { data: orderItemsData } = await supabase.from("order_items").select("*");

      const fetched: Order[] = (ordersData ?? []).map((o: any) => {
        const itemsForOrder = (orderItemsData ?? []).filter((i: any) => i.order_id === o.id);
        const mappedItems = itemsForOrder
          .map((item: any) => {
            const product = productsState.find(p => p.id === item.product_id);
            return product ? { product, quantity: item.quantity } : null;
          })
          .filter(Boolean) as CartItem[];

        const deliveryCharge = o.delivery_charge ?? 0;
        const total          = o.total           ?? 0;

        return {
          id:             o.id,
          items:          mappedItems,
          total,
          subtotal:       o.subtotal ?? (total - deliveryCharge),
          deliveryCharge,
          customerName:   o.customer_name,
          phone:          o.phone,
          address:        o.address,
          date:           new Date(o.created_at).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" }),
          status:         o.status,
          paymentMethod:  o.payment_method  ?? "COD",
          paymentStatus:  o.payment_status  ?? "Pending",
        };
      });

      setOrders(fetched);
    };

    fetchOrders();

    if (!user) return;

    const orderChannel = supabase
      .channel(`orders:${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "orders",
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const u = payload.new as any;
        setOrders(prev => prev.map(o => o.id === u.id ? { ...o, status: u.status } : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(orderChannel); };
  }, [user, isInitialized, productsState]);

  /* ── Cart helpers ── */
  const triggerBounce = () => {
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  /* ── Cart key helper: same product + same variant = same line ── */
  const cartKey = (productId: string, variantId?: string) =>
    variantId ? `${productId}::${variantId}` : productId;

  const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
    setItems(prev => {
      const key      = cartKey(product.id, variant?.id);
      const existing = prev.find(i => cartKey(i.product.id, i.selectedVariant?.id) === key);
      if (existing) {
        return prev.map(i =>
          cartKey(i.product.id, i.selectedVariant?.id) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selectedVariant: variant }];
    });
    triggerBounce();
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    const key = cartKey(productId, variantId);
    setItems(prev => prev.filter(i => cartKey(i.product.id, i.selectedVariant?.id) !== key));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    const key     = cartKey(productId, variantId);
    const product = productsState.find(p => p.id === productId);
    /* For variant: cap by variant stock; otherwise product stock */
    const variant = product?.variants?.find(v => v.id === variantId);
    const maxQty  = variant ? variant.stock : (product?.stock ?? 999);
    const clamped = Math.min(quantity, maxQty > 0 ? maxQty : 999);
    if (clamped <= 0) {
      setItems(prev => prev.filter(i => cartKey(i.product.id, i.selectedVariant?.id) !== key));
    } else {
      setItems(prev =>
        prev.map(i =>
          cartKey(i.product.id, i.selectedVariant?.id) === key
            ? { ...i, quantity: clamped }
            : i
        )
      );
    }
  }, [productsState]);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(() =>
    items.reduce((sum, item) => {
      /* Variant price takes priority; fall back to product price (with discount) */
      const basePrice = item.selectedVariant
        ? item.selectedVariant.price
        : item.product.discount
          ? item.product.price * (1 - item.product.discount / 100)
          : item.product.price;
      return sum + basePrice * item.quantity;
    }, 0),
  [items]);

  const getItemCount = useCallback(() =>
    items.reduce((s, i) => s + i.quantity, 0),
  [items]);

  /* ── Admin CRUD helpers ── */
  const addProduct = useCallback((p: Product) =>
    setProductsState(prev => [p, ...prev]), []);

  const updateProduct = useCallback((p: Product) => {
    setProductsState(prev => prev.map(x => x.id === p.id ? p : x));
    setItems(prev => prev.map(item =>
      item.product.id === p.id ? { ...item, product: p } : item
    ));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProductsState(prev => prev.filter(p => p.id !== id));
    setItems(prev => prev.filter(item => item.product.id !== id));
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      /* Also refresh variants */
      const { data: dbVariants } = await supabase
        .from("product_variants")
        .select("*")
        .order("sort_order", { ascending: true });
      const variantsByProduct = new Map<string, ProductVariant[]>();
      for (const v of (dbVariants ?? [])) {
        const mapped = mapDbVariant(v);
        if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
        variantsByProduct.get(v.product_id)!.push(mapped);
      }
      setProductsState((data ?? []).map(row => mapDbProduct(row, variantsByProduct.get(row.id))));
    } catch (err) {
      console.error("refreshProducts error:", err);
    }
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  /* ══ PLACE ORDER ════════════════════════════════════════ */
  const placeOrder = useCallback(async (
    name: string,
    email: string,
    phone: string,
    address: string,
    paymentMethod: string,
    paymentStatus: string,
    deliveryCharge = 0,
  ): Promise<Order | null> => {
    const orderId  = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const subtotal = getTotal();
    const total    = subtotal + deliveryCharge;

    const order: Order = {
      id:             orderId,
      items:          [...items],
      total:          Math.round(total),
      subtotal:       Math.round(subtotal),
      deliveryCharge: Math.round(deliveryCharge),
      customerName:   name,
      customerEmail:  email,
      phone,
      address,
      date:    new Date().toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" }),
      status:  "Pending",
      paymentMethod,
      paymentStatus,
    };

    try {
      /* 1 ── Insert order row */
      const { error: orderError } = await supabase.from("orders").insert({
        id:              orderId,
        status:          "pending",        // ← required for order tracking
        user_id:         user?.id ?? null,
        customer_name:   name,
        customer_email:  email,
        phone,
        address,
        subtotal:        Math.round(subtotal),
        delivery_charge: Math.round(deliveryCharge),
        total:           Math.round(total),
        payment_method:  paymentMethod,
        payment_status:  paymentStatus,
      });
      if (orderError) throw orderError;

      /* 2 ── Insert order items */
      const orderItems = items.map(item => {
        const priceAtTime = item.selectedVariant
          ? item.selectedVariant.price
          : Math.round(
              item.product.discount
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price
            );
        return {
          order_id:      orderId,
          product_id:    item.product.id,
          quantity:      item.quantity,
          price_at_time: Math.round(priceAtTime),
          variant_id:    item.selectedVariant?.id    ?? null,
          variant_label: item.selectedVariant?.label ?? null,
        };
      });
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      /* 3 ── Decrement stock (variant stock or product stock) */
      for (const item of items) {
        if (item.selectedVariant) {
          /* Update variant stock */
          const newStock = Math.max(0, (item.selectedVariant.stock ?? 0) - item.quantity);
          await supabase.from("product_variants")
            .update({ stock: newStock })
            .eq("id", item.selectedVariant.id);
        } else {
          /* Update product-level stock */
          const live     = productsState.find(p => p.id === item.product.id);
          const newStock = Math.max(0, (live?.stock ?? 0) - item.quantity);
          await supabase.from("products")
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq("id", item.product.id);
        }
      }

      setProductsState(prev => prev.map(p => {
        const bought = items.find(i => i.product.id === p.id);
        return bought ? { ...p, stock: Math.max(0, (p.stock ?? 0) - bought.quantity) } : p;
      }));

      setOrders(prev => [order, ...prev]);
      setItems([]);

      /* 4 ── Send receipt email */
      if (email) {
        try {
          const itemsHtml = order.items.map(item => {
            const price = item.selectedVariant
              ? Math.round(item.selectedVariant.price)
              : Math.round(
                  item.product.discount
                    ? item.product.price * (1 - item.product.discount / 100)
                    : item.product.price
                );
            const displayName = item.selectedVariant
              ? `${item.product.name} – ${item.selectedVariant.label}`
              : item.product.name;
            return `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;">${displayName}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">PKR ${price * item.quantity}</td>
            </tr>`;
          }).join("");

          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              <div style="background:linear-gradient(135deg,#1a5c2a,#2d7a3f,#f59e0b);padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">🛒 Altaf Cash N Carry</h1>
                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Order Receipt — #${orderId}</p>
              </div>
              <div style="padding:32px;">
                <p style="font-size:16px;color:#333;">Hi ${name},</p>
                <p style="color:#666;">Thank you for your order! Here's your receipt:</p>
                <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:4px 0;"><strong>Order ID:</strong> ${orderId}</p>
                  <p style="margin:4px 0;"><strong>Payment:</strong> ${paymentStatus} (${paymentMethod})</p>
                  <p style="margin:4px 0;"><strong>Delivery:</strong> ${address}</p>
                </div>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                  <thead><tr style="background:#f8f9fa;">
                    <th style="padding:10px 12px;text-align:left;">Item</th>
                    <th style="padding:10px 12px;text-align:center;">Qty</th>
                    <th style="padding:10px 12px;text-align:right;">Price</th>
                  </tr></thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
                <div style="border-top:2px solid #eee;padding-top:16px;">
                  <div style="display:flex;justify-content:space-between;margin:8px 0;color:#666;">
                    <span>Subtotal</span><span>PKR ${Math.round(subtotal)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin:8px 0;color:#666;">
                    <span>Delivery</span><span>${deliveryCharge > 0 ? `PKR ${Math.round(deliveryCharge)}` : "FREE"}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin:12px 0;font-size:20px;font-weight:700;">
                    <span>Total</span><span style="color:#1a5c2a;">PKR ${Math.round(total)}</span>
                  </div>
                </div>
                <p style="color:#999;font-size:13px;margin-top:24px;text-align:center;">
                  Thank you for shopping with Altaf Cash N Carry! 🎉
                </p>
              </div>
            </div>
          </body></html>`;

          const sId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const tId  = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const pKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
          if (sId && tId && pKey) {
            emailjs
              .send(sId, tId, { subject: "Order Confirmed", to_email: email, order_id: orderId, html_content: html }, pKey)
              .catch(err => console.error("Email send failed:", err));
          }
        } catch (emailErr) {
          console.error("Receipt email error:", emailErr);
        }
      }

      return order;
    } catch (err: any) {
      console.error("placeOrder error:", err);
      toast.error(`Order failed: ${err?.message ?? JSON.stringify(err)}`);
      return null;
    }
  }, [items, getTotal, productsState, user]);

  return (
    <CartContext.Provider value={{
      items,
      orders,
      products:   productsState,
      categories: categoriesState,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
      placeOrder,
      updateOrderStatus,
      addProduct,
      updateProduct,
      deleteProduct,
      refreshProducts,
      cartBounce,
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