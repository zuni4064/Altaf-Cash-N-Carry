import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product, Category } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
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
   Helper: map a raw Supabase DB row → Product shape used in the app
───────────────────────────────────────────────────────────────────────────── */
function mapDbProduct(row: any): Product {
  return {
    id:            row.id,
    name:          row.name          ?? "Unknown Product",
    category:      row.category      ?? "other",
    price:         row.price         ?? 0,
    unit:          row.unit          ?? "piece",
    description:   row.description   ?? "",
    image:         row.image         ?? "",   // direct Supabase Storage URL
    badge:         row.badge         ?? undefined,
    discount:      row.discount      ?? undefined,
    originalPrice: row.original_price ?? undefined,
    inStock:       row.in_stock      ?? true,
    stock:         row.stock         ?? 0,
    rating:        row.rating        ?? 4.0,
    reviewCount:   row.review_count  ?? 0,
  };
}

function mapDbCategory(row: any): Category {
  return {
    id:    row.id,
    name:  row.name  ?? "",
    icon:  row.icon  ?? "",
    image: row.image ?? "",
    count: row.count ?? 0,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: upload an image file to Supabase Storage and return the public URL
   Call this from the admin panel when adding/editing a product.
───────────────────────────────────────────────────────────────────────────── */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext      = file.name.split(".").pop() ?? "jpg";
  const path     = `products/${productId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────────────────────────────────────── */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // ── Cart persisted to localStorage ──────────────────────────────────────
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("cart_items", JSON.stringify(items)); } catch { }
  }, [items]);

  // ── Products & Categories — fetched purely from Supabase ─────────────────
  const [productsState,   setProductsState]   = useState<Product[]>([]);
  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [isInitialized,   setIsInitialized]   = useState(false);
  const [orders,          setOrders]          = useState<Order[]>([]);
  const [cartBounce,      setCartBounce]      = useState(false);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized) return;

    const init = async () => {
      try {
        // Fetch products
        const { data: dbProducts, error: prodError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: true });

        if (prodError) throw prodError;
        setProductsState((dbProducts ?? []).map(mapDbProduct));

        // Fetch categories
        const { data: dbCategories, error: catError } = await supabase
          .from("categories")
          .select("*")
          .order("id", { ascending: true });

        if (catError) throw catError;
        setCategoriesState((dbCategories ?? []).map(mapDbCategory));

        setIsInitialized(true);
      } catch (err) {
        console.error("CartContext init error:", err);
        toast.error("Failed to load products. Please refresh.");
        setIsInitialized(true);
      }
    };

    init();
  }, [isInitialized]);

  // ── Real-time product updates ─────────────────────────────────────────────
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
        } else if (payload.eventType === "UPDATE") {
          const updated = mapDbProduct(payload.new);
          setProductsState(prev => prev.map(p => p.id === updated.id ? updated : p));
          setItems(prev => prev.map(item =>
            item.product.id === updated.id ? { ...item, product: updated } : item
          ));
        } else if (payload.eventType === "DELETE") {
          const deletedId = (payload.old as any).id;
          setProductsState(prev => prev.filter(p => p.id !== deletedId));
          setItems(prev => prev.filter(item => item.product.id !== deletedId));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isInitialized]);

  // ── Orders ────────────────────────────────────────────────────────────────
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

      const { data: orderItemsData } = await supabase
        .from("order_items")
        .select("*");

      const fetchedOrders: Order[] = (ordersData ?? []).map((o: any) => {
        const itemsForOrder = (orderItemsData ?? []).filter(i => i.order_id === o.id);
        const mappedItems = itemsForOrder
          .map(item => {
            const product = productsState.find(p => p.id === item.product_id);
            return product ? { product, quantity: item.quantity } : null;
          })
          .filter(Boolean) as CartItem[];

        return {
          id:            o.id,
          items:         mappedItems,
          total:         o.total,
          customerName:  o.customer_name,
          phone:         o.phone,
          address:       o.address,
          date:          new Date(o.created_at).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" }),
          status:        o.status,
          paymentMethod: o.payment_method  ?? "COD",
          paymentStatus: o.payment_status  ?? "Pending",
        };
      });

      setOrders(fetchedOrders);
    };

    fetchOrders();

    if (!user) return;

    const orderChannel = supabase
      .channel(`orders:${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const updated = payload.new as any;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(orderChannel); };
  }, [user, isInitialized, productsState]);

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const triggerBounce = () => {
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  const addToCart = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      return existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }];
    });
    triggerBounce();
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product    = productsState.find(p => p.id === productId);
    const maxQty     = product?.stock ?? 999;
    const clamped    = Math.min(quantity, maxQty);
    if (clamped <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: clamped } : i));
    }
  }, [productsState]);

  const clearCart    = useCallback(() => setItems([]), []);
  const getTotal     = useCallback(() =>
    items.reduce((sum, item) => {
      const price = item.product.discount
        ? item.product.price * (1 - item.product.discount / 100)
        : item.product.price;
      return sum + price * item.quantity;
    }, 0), [items]);
  const getItemCount = useCallback(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  // ── Product CRUD (admin) ──────────────────────────────────────────────────
  const addProduct    = useCallback((p: Product) => setProductsState(prev => [p, ...prev]), []);
  const updateProduct = useCallback((p: Product) => {
    setProductsState(prev => prev.map(x => x.id === p.id ? p : x));
    setItems(prev => prev.map(item => item.product.id === p.id ? { ...item, product: p } : item));
  }, []);
  const deleteProduct = useCallback((id: string) => {
    setProductsState(prev => prev.filter(p => p.id !== id));
    setItems(prev => prev.filter(item => item.product.id !== id));
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setProductsState((data ?? []).map(mapDbProduct));
    } catch (err) {
      console.error("refreshProducts error:", err);
    }
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  // ── Place order ───────────────────────────────────────────────────────────
  const placeOrder = useCallback(async (
    name: string, email: string, phone: string, address: string,
    paymentMethod: string, paymentStatus: string, deliveryCharge = 0
  ): Promise<Order | null> => {
    const orderId  = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const subtotal = getTotal();
    const total    = subtotal + deliveryCharge;

    const order: Order = {
      id: orderId, items: [...items], total,
      customerName: name, customerEmail: email, phone, address,
      date: new Date().toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" }),
      status: "Pending", paymentMethod, paymentStatus,
    };

    try {
      // 1. Insert order row
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId, user_id: user?.id ?? null,
        customer_name: name, customer_email: email,
        phone, address, total: Math.round(total),
        payment_method: paymentMethod, payment_status: paymentStatus,
      });
      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItems = items.map(item => ({
        order_id:      orderId,
        product_id:    item.product.id,
        quantity:      item.quantity,
        price_at_time: Math.round(
          item.product.discount
            ? item.product.price * (1 - item.product.discount / 100)
            : item.product.price
        ),
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Decrement stock for each item
      for (const item of items) {
        const live     = productsState.find(p => p.id === item.product.id);
        const newStock = Math.max(0, (live?.stock ?? 0) - item.quantity);
        await supabase.from("products")
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq("id", item.product.id);
      }

      // Update local stock state
      setProductsState(prev => prev.map(p => {
        const bought = items.find(i => i.product.id === p.id);
        return bought ? { ...p, stock: Math.max(0, (p.stock ?? 0) - bought.quantity) } : p;
      }));

      setOrders(prev => [order, ...prev]);
      setItems([]);

      // 4. Send receipt email
      if (email) {
        try {
          const itemsHtml = order.items.map(item => {
            const price = Math.round(item.product.discount
              ? item.product.price * (1 - item.product.discount / 100)
              : item.product.price);
            return `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product.name}</td>
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
                    <span>Delivery</span><span>PKR ${Math.round(deliveryCharge)}</span>
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

          const sId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const tId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const pKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
          if (sId && tId && pKey) {
            emailjs.send(sId, tId, { subject: "Order Confirmed", to_email: email, order_id: orderId, html_content: html }, pKey)
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
      items, orders, products: productsState, categories: categoriesState,
      addToCart, removeFromCart, updateQuantity, clearCart,
      getTotal, getItemCount, placeOrder, updateOrderStatus,
      addProduct, updateProduct, deleteProduct, refreshProducts,
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