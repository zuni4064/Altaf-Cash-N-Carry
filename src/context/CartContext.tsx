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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("cart_items", JSON.stringify(items));
    } catch (e) { }
  }, [items]);

  const [orders, setOrders] = useState<Order[]>([]);

  // Use the default data from products.ts as the initial state
  const [productsState, setProductsState] = useState<Product[]>([]);
  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from products.ts and merge with Supabase stock data
  React.useEffect(() => {
    if (!isInitialized) {
      const initData = async () => {
        try {
          // First, get categories and products from static file (with image imports)
          const module = await import("@/data/products");
          let initialProducts: Product[] = [...module.products];
          setCategoriesState(module.categories);

          // Create a map of static products by ID for image references
          const staticProductsMap = new Map(initialProducts.map(p => [p.id, p]));

          // Helper function to get image URL from imported image module
          const getImageUrl = (img: any): string => {
            if (!img) return '';
            if (typeof img === 'string') return img;
            if (img.default) return img.default; // Vite/ES modules
            if (img.src) return img.src;
            return String(img);
          };

          // Fetch ALL products from Supabase (including new products added by admin)
          const { data: dbProducts, error: dbError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: true });

          if (dbError) {
            console.error("Error fetching from DB:", dbError);
          }

          // If there are products in the database, merge them with static products
          // This ensures new products added by admin are included
          if (dbProducts && dbProducts.length > 0) {
            // Merge: use database data but keep static images where available
            initialProducts = dbProducts.map((dbProduct: any) => {
              const staticProduct = staticProductsMap.get(dbProduct.id);
              if (staticProduct) {
                // Product exists in both - check if DB has custom image
                const staticImageUrl = getImageUrl(staticProduct.image);
                
                // PRIORITY: Static folder first (admin/store sync)
                const finalImage = staticImageUrl || dbProduct.image || '';
                
                return {
                  ...staticProduct,
                  name: dbProduct.name || staticProduct.name,
                  category: dbProduct.category || staticProduct.category,
                  price: dbProduct.price ?? staticProduct.price,
                  unit: dbProduct.unit || staticProduct.unit,
                  description: dbProduct.description || staticProduct.description,
                  image: finalImage || '',
                  badge: dbProduct.badge || staticProduct.badge,
                  discount: dbProduct.discount ?? staticProduct.discount,
                  inStock: dbProduct.in_stock ?? staticProduct.inStock,
                  stock: dbProduct.stock ?? 0,
                  rating: dbProduct.rating ?? staticProduct.rating ?? 4.0,
                  reviewCount: dbProduct.review_count ?? staticProduct.reviewCount ?? 0,
                };
              } else {
                // New product added by admin - use database data only
                return {
                  id: dbProduct.id,
                  name: dbProduct.name || 'Unknown Product',
                  category: dbProduct.category || 'other',
                  price: dbProduct.price || 0,
                  unit: dbProduct.unit || 'piece',
                  description: dbProduct.description || '',
                  image: dbProduct.image || '', // New products use URL from DB
                  badge: dbProduct.badge,
                  discount: dbProduct.discount,
                  inStock: dbProduct.in_stock ?? true,
                  stock: dbProduct.stock ?? 0,
                  rating: dbProduct.rating ?? 4.0,
                  reviewCount: dbProduct.review_count ?? 0,
                } as Product;
              }
            });

            // Also add any static products that don't exist in database yet
            const existingIds = new Set(dbProducts.map((p: any) => p.id));
            const newStaticProducts = module.products.filter(p => !existingIds.has(p.id))
              .map(p => ({ ...p, image: getImageUrl(p.image) }));
            initialProducts = [...initialProducts, ...newStaticProducts];
          } else {
            // No products in database - seed with initial stock values from static products
            // Use getImageUrl to properly extract image URL from imported modules
            const seedData = initialProducts.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              unit: p.unit,
              description: p.description,
              image: getImageUrl(p.image),
              badge: p.badge || null,
              discount: p.discount || null,
              in_stock: p.inStock,
              stock: p.stock || 50,
              rating: p.rating || 4.0,
              review_count: p.reviewCount || 0
            }));
            
            await supabase.from('products').insert(seedData);
            // Also convert images to URLs for local state
            initialProducts = initialProducts.map(p => ({ 
              ...p, 
              image: getImageUrl(p.image),
              stock: p.stock ?? 0 
            }));
          }

          setProductsState(initialProducts);
          setIsInitialized(true);

          // Listen to real-time product updates from database
          supabase.channel('public:products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
              console.log("Product update received:", payload);
              if (payload.eventType === 'UPDATE') {
                const updatedRow = payload.new as any;
                setProductsState(prev => prev.map(p => {
                  if (p.id === updatedRow.id) {
                    const staticProduct = staticProductsMap.get(p.id);
                    // Get static image URL if available
                    const staticImageUrl = staticProduct ? getImageUrl(staticProduct.image) : '';
                    // Only use static image if the product originally came from static file AND
                    // the database doesn't have a custom image set
                    const hasStaticImage = staticProduct && staticImageUrl;
                    const hasDbImage = updatedRow.image && updatedRow.image.trim() !== '';
                    
                    // For static products: use static image unless DB has custom image
                    // For admin-added products: always use DB image
                    let finalImage: string;
                    if (hasStaticImage && !hasDbImage) {
                      // Static product with no custom DB image - use static
                      finalImage = staticImageUrl;
                    } else if (hasDbImage) {
                      // Either admin-added product or static product with custom DB image
                      finalImage = updatedRow.image;
                    } else {
                      // Fallback to existing
                      finalImage = p.image;
                    }
                    
                    return {
                      ...p,
                      stock: updatedRow.stock ?? 0,
                      inStock: updatedRow.in_stock,
                      name: updatedRow.name || p.name,
                      price: updatedRow.price ?? p.price,
                      category: updatedRow.category || p.category,
                      description: updatedRow.description || p.description,
                      image: finalImage,
                      badge: updatedRow.badge || p.badge,
                      discount: updatedRow.discount ?? p.discount,
                      rating: updatedRow.rating ?? p.rating,
                      reviewCount: updatedRow.review_count ?? p.reviewCount,
                    };
                  }
                  return p;
                }));
              } else if (payload.eventType === 'INSERT') {
                // New product added by admin - add to the list
                const newRow = payload.new as any;
                const newProduct: Product = {
                  id: newRow.id,
                  name: newRow.name || 'Unknown Product',
                  category: newRow.category || 'other',
                  price: newRow.price || 0,
                  unit: newRow.unit || 'piece',
                  description: newRow.description || '',
                  image: newRow.image || '', // New products use URL from DB
                  badge: newRow.badge,
                  discount: newRow.discount,
                  inStock: newRow.in_stock ?? true,
                  stock: newRow.stock ?? 0,
                  rating: newRow.rating ?? 4.0,
                  reviewCount: newRow.review_count ?? 0,
                };
                setProductsState(prev => {
                  // Only add if not already present
                  if (prev.some(p => p.id === newProduct.id)) {
                    return prev;
                  }
                  return [newProduct, ...prev];
                });
              } else if (payload.eventType === 'DELETE') {
                // Product deleted by admin - remove from the list
                const deletedRow = payload.old as any;
                setProductsState(prev => prev.filter(p => p.id !== deletedRow.id));
              }
            })
            .subscribe();

        } catch (error) {
          console.error("Initialization error:", error);
          // Fallback if Supabase fails - convert images to URLs
          const module = await import("@/data/products");
          const getImageUrl = (img: any): string => {
            if (!img) return '';
            if (typeof img === 'string') return img;
            if (img.default) return img.default;
            if (img.src) return img.src;
            return String(img);
          };
            const fallbackProducts = module.products.map(p => ({ 
            ...p, 
            image: getImageUrl(p.image),
            stock: p.stock ?? 0 
          }));
          setProductsState(fallbackProducts);
          setCategoriesState(module.categories);
          setIsInitialized(true);
        }
      };

      initData();
    }
  }, [isInitialized]);

  // Handle User Orders
  useEffect(() => {
    if (!isInitialized) return;

  const fetchUserOrders = async () => {
      console.log("Fetching orders for user:", user?.id);
      
      // Fetch ONLY the current user's orders when logged in
      // Guests get empty orders list (no fetch)
      if (!user) {
        console.log("No user logged in - orders will be empty");
        setOrders([]);
        return;
      }

      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: ordersData, error: ordersError } = await query;
        
      console.log("Orders data:", ordersData, "Error:", ordersError);
      
      const { data: orderItemsData } = await supabase.from('order_items').select('*');
      console.log("Order items data:", orderItemsData);
      console.log("Products state:", productsState.length, "products");

      if (!ordersError && ordersData) {
        const fetchedOrders: Order[] = ordersData.map((o: any) => {
          const itemsForOrder = orderItemsData?.filter(item => item.order_id === o.id) || [];
          console.log("Items for order", o.id, ":", itemsForOrder);
          const mappedItems = itemsForOrder.map(item => {
            const product = productsState.find(p => p.id === item.product_id);
            if (product) {
              return { product, quantity: item.quantity };
            }
            return null;
          }).filter(item => item !== null) as CartItem[];

          console.log("Mapped items for order", o.id, ":", mappedItems);

          return {
            id: o.id,
            items: mappedItems,
            total: o.total,
            customerName: o.customer_name,
            phone: o.phone,
            address: o.address,
            date: new Date(o.created_at).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" }),
            status: o.status,
            paymentMethod: o.payment_method || 'COD',
            paymentStatus: o.payment_status || 'Pending'
          };
        });
        setOrders(fetchedOrders);
      }
    };

    fetchUserOrders();

    // Real-time subscription for logged-in user's own orders only
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    if (user) {
      channel = supabase.channel(`public:orders:${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, payload => {
          const updatedOrd = payload.new as any;
          setOrders(prev => prev.map(o => o.id === updatedOrd.id ? { ...o, status: updatedOrd.status } : o));
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, isInitialized, productsState]);

  const [cartBounce, setCartBounce] = useState(false);

  const triggerBounce = () => {
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  const addToCart = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    triggerBounce();
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product = productsState.find(p => p.id === productId);
    const maxQuantity = product?.stock ?? 0;
    const clampedQuantity = Math.min(quantity, maxQuantity);
    
    if (clampedQuantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: clampedQuantity } : i));
    }
  }, [productsState]);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const price = item.product.discount
        ? item.product.price * (1 - item.product.discount / 100)
        : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const getItemCount = useCallback(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProductsState(prev => [product, ...prev]);
  }, []);

  const updateProduct = useCallback((product: Product) => {
    setProductsState(prev => prev.map(p => p.id === product.id ? product : p));
    // Also update in cart if present
    setItems(prev => prev.map(item => item.product.id === product.id ? { ...item, product } : item));
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProductsState(prev => prev.filter(p => p.id !== productId));
    // Also remove from cart
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      // Start with current products
      const module = await import("@/data/products");
      let refreshedProducts = [...module.products];

      // Fetch stock from database
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*');

      if (error) throw error;

      if (dbProducts && dbProducts.length > 0) {
        // Merge database stock with static products
        refreshedProducts = refreshedProducts.map(p => {
          const dbProduct = dbProducts.find(dp => dp.id === p.id);
          if (dbProduct) {
            return {
              ...p,
              stock: dbProduct.stock ?? 0,
              inStock: dbProduct.in_stock ?? p.inStock
            };
          }
          return { ...p, stock: p.stock ?? 0 };
        });
      }

      setProductsState(refreshedProducts);
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  }, []);

  const placeOrder = useCallback(async (name: string, email: string, phone: string, address: string, paymentMethod: string, paymentStatus: string, deliveryCharge: number = 0): Promise<Order | null> => {
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const subtotal = getTotal();
    const total = subtotal + deliveryCharge;

    const order: Order = {
      id: orderId,
      items: [...items],
      total,
      customerName: name,
      customerEmail: email,
      phone,
      address,
      date: new Date().toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" }),
      status: "Pending",
      paymentMethod,
      paymentStatus
    };

    try {
      console.log("Placing order with user_id:", user?.id);
      
      // 1. Save Order
      const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        user_id: user?.id || null,
        customer_name: name,
        customer_email: email,
        phone,
        address,
        total: Math.round(total),
        payment_method: paymentMethod,
        payment_status: paymentStatus
      });
      if (orderError) {
        console.error("Order insert error:", orderError);
        throw orderError;
      }
      console.log("Order saved successfully with ID:", orderId);

      // 2. Save Items
      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: Math.round(item.product.discount ? item.product.price * (1 - item.product.discount / 100) : item.product.price)
      }));
      console.log("Saving order items:", orderItems);
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error("Order items insert error:", itemsError);
        throw itemsError;
      }
      console.log("Order items saved successfully");

      // 3. Update product stock in products table
      for (const item of items) {
        // Lookup the current stock from the live products array, fallback to 50
        const liveProduct = productsState.find(p => p.id === item.product.id);
        const currentStock = liveProduct?.stock ?? 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        await supabase
          .from('products')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.product.id);
      }

      // Update local state
      setProductsState(prev => prev.map(p => {
        const boughtItem = items.find(i => i.product.id === p.id);
        if (boughtItem) {
        return { ...p, stock: Math.max(0, (p.stock ?? 0) - boughtItem.quantity) };
      }
      return p;
    }));
  setOrders(prev => [order, ...prev]);
  setItems([]);

      // 4. Send Receipt Email
      if (email) {
        try {
          const itemsHtml = order.items.map(item => {
            const price = Math.round(item.product.discount ? item.product.price * (1 - item.product.discount / 100) : item.product.price);
            return `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product.name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">PKR ${price * item.quantity}</td>
            </tr>`;
          }).join("");

          const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1a5c2a,#2d7a3f,#f59e0b);padding:32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:28px;">🛒 Altaf Cash N Carry</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Order Receipt - #${orderId}</p>
                </div>
                <div style="padding:32px;">
                  <p style="font-size:16px;color:#333;">Hi ${name},</p>
                  <p style="color:#666;">Thank you for your order! Here's your receipt:</p>
                  
                  <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="margin:4px 0;"><strong>Order ID:</strong> ${orderId}</p>
                    <p style="margin:4px 0;"><strong>Payment Status:</strong> ${paymentStatus} (${paymentMethod})</p>
                    <p style="margin:4px 0;"><strong>Delivery:</strong> ${address}</p>
                  </div>

                  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <thead>
                      <tr style="background:#f8f9fa;">
                        <th style="padding:10px 12px;text-align:left;font-weight:600;">Item</th>
                        <th style="padding:10px 12px;text-align:center;font-weight:600;">Qty</th>
                        <th style="padding:10px 12px;text-align:right;font-weight:600;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <div style="border-top:2px solid #eee;padding-top:16px;margin-top:8px;">
                    <div style="display:flex;justify-content:space-between;margin:8px 0;font-size:16px;color:#666;">
                      <span>Subtotal</span>
                      <span>PKR ${Math.round(subtotal)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin:8px 0;font-size:16px;color:#666;">
                      <span>Delivery Charge</span>
                      <span>PKR ${Math.round(deliveryCharge)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin:12px 0;font-size:20px;font-weight:700;">
                      <span>Total</span>
                      <span style="color:#1a5c2a;">PKR ${Math.round(total)}</span>
                    </div>
                  </div>

                  <p style="color:#999;font-size:13px;margin-top:24px;text-align:center;">
                    Thank you for shopping with Altaf Cash N Carry! 🎉<br/>
                    Questions? Contact us on WhatsApp.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

          if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
            emailjs.send(
              emailjsServiceId,
              emailjsTemplateId,
              {
                subject: "Order Confirmed",
                to_email: email,
                order_id: orderId, // Optional, can use in subject if defined in template
                html_content: html,
              },
              emailjsPublicKey
            ).then((response) => {
              console.log('SUCCESS!', response.status, response.text);
            }).catch((err) => {
              console.error('FAILED...', err);
            });
          } else {
            console.warn("EmailJS credentials are not fully defined in .env. Email receipt was not sent.");
          }
        } catch (emailError) {
          console.error("Failed to prepare or send receipt email:", emailError);
        }
      }

      return order;

    } catch (error: any) {
      console.error("Order placement failed:", error);
      toast.error(`Order failed: ${error?.message || error?.details || JSON.stringify(error)}`);
      return null;
    }
  }, [items, getTotal]);

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
      placeOrder,
      updateOrderStatus,
      addProduct,
      updateProduct,
      deleteProduct,
      refreshProducts,
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
