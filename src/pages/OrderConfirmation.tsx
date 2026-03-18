import { useParams, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Share2, ShoppingBag, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import OrderTrackingTimeline from "@/components/OrderTrackingTimeline";

import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

/* ── Types ─────────────────────────────────────────────────── */
interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    discount?: number;
    image?: string;
    unit?: string;
  };
  quantity: number;
}

interface OrderData {
  id: string;
  date: string;
  status: string;
  subtotal: number;       // products-only total
  deliveryCharge: number; // delivery fee
  total: number;          // grand total = subtotal + deliveryCharge
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  paymentMethod?: string;
}

/* ── Confetti ───────────────────────────────────────────────── */
const CONFETTI_COLORS = [
  "hsl(var(--primary))", "hsl(var(--secondary))",
  "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6",
];

const Confetti = () => {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x:      (Math.random() - 0.5) * 600,
    y:      -(Math.random() * 400 + 100),
    rotate: Math.random() * 720 - 360,
    size:   Math.random() * 8 + 5,
    delay:  Math.random() * 0.4,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size * 0.5, background: p.color, top: "40%", left: "50%" }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.4 + Math.random() * 0.6, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

/* ── Helpers ────────────────────────────────────────────────── */
const normalizeStatus = (status: string): string => {
  const map: Record<string, string> = {
    confirmed:          "Confirmed",
    preparing:          "Preparing",
    "out-for-delivery": "Out for Delivery",
    delivered:          "Delivered",
    pending:            "Pending",
    cancelled:          "Cancelled",
  };
  return map[status?.toLowerCase()] || "Pending";
};

const STATUS_COLOR: Record<string, string> = {
  Pending:            "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Confirmed:          "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Preparing:          "bg-orange-500/15 text-orange-600 border-orange-500/30",
  "Out for Delivery": "bg-primary/15 text-primary border-primary/30",
  Delivered:          "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Cancelled:          "bg-destructive/15 text-destructive border-destructive/30",
};

/* ── Fetch order from Supabase ──────────────────────────────── */
const fetchOrderFromDB = async (orderId: string): Promise<OrderData | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) return null;

    const rawItems = typeof data.items === "string"
      ? JSON.parse(data.items)
      : data.items || [];

    // FIX: read delivery_charge and subtotal as distinct fields.
    // Fall back gracefully for old orders that predate this fix.
    const deliveryCharge = data.delivery_charge ?? 0;
    const total          = data.total           ?? 0;
    // If subtotal was stored use it; otherwise derive it from total - delivery_charge.
    const subtotal       = data.subtotal        ?? (total - deliveryCharge);

    return {
      id:            data.id,
      date:          data.created_at
        ? new Date(data.created_at).toLocaleDateString("en-PK", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })
        : "",
      status:        data.status        || "pending",
      subtotal,
      deliveryCharge,
      total,
      customerName:  data.customer_name  || data.name || "",
      phone:         data.phone          || "",
      address:       data.address        || "",
      paymentMethod: data.payment_method || "COD",
      items:         rawItems,
    };
  } catch {
    return null;
  }
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const OrderConfirmation = () => {
  const { orderId }            = useParams();
  const { orders, loadOrders } = useCart() as any;

  const localOrder = orders?.find((o: any) => o.id === orderId);

  const [order,        setOrder]        = useState<OrderData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    // Always fetch fresh from DB so we get the correct subtotal / delivery_charge
    (async () => {
      setLoading(true);
      const fetched = await fetchOrderFromDB(orderId);

      if (fetched) {
        setOrder(fetched);
      } else if (localOrder) {
        // Fallback: map local Order shape → OrderData shape
        const dc = localOrder.deliveryCharge ?? 0;
        const tot = localOrder.total ?? 0;
        setOrder({
          id:            localOrder.id,
          date:          localOrder.date ?? "",
          status:        localOrder.status ?? "Pending",
          subtotal:      localOrder.subtotal ?? (tot - dc),
          deliveryCharge: dc,
          total:         tot,
          customerName:  localOrder.customerName  ?? "",
          phone:         localOrder.phone         ?? "",
          address:       localOrder.address       ?? "",
          paymentMethod: localOrder.paymentMethod ?? "COD",
          items:         localOrder.items         ?? [],
        });
      }

      setLoading(false);

      if (typeof loadOrders === "function") {
        try { await loadOrders(); } catch { /* silent */ }
      }
    })();
  }, [orderId]);

  // Confetti on first load
  useEffect(() => {
    if (!order) return;
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 2200);
    return () => clearTimeout(t);
  }, [order?.id]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Order link copied!");
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="container py-28 flex flex-col items-center gap-5">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="h-12 w-12 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium">Loading your order…</p>
    </div>
  );

  /* ── Not found ── */
  if (!order) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground mb-4">Order not found.</p>
      <Link to="/" className="text-primary underline">Go Home</Link>
    </div>
  );

  const finalPrice = (item: OrderItem) =>
    item.product.discount
      ? Math.round(item.product.price * (1 - item.product.discount / 100))
      : item.product.price;

  const currentStatus  = normalizeStatus(order.status);
  const isFreeDelivery = order.deliveryCharge === 0 && order.subtotal >= 2000;

  return (
    <>
      <AnimatePresence>{showConfetti && <Confetti key="confetti" />}</AnimatePresence>

      <div className="container py-10 max-w-2xl">

        {/* ── Success header ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 16 }}
          className="text-center mb-10"
        >
          <div className="relative inline-block mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.3 }}
              >
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              </motion.div>
            </motion.div>
            {[1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.2, repeat: 1, ease: "easeOut" }}
              />
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-display font-extrabold mb-2"
          >
            Order Placed! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-muted-foreground"
          >
            Thank you for shopping with{" "}
            <span className="font-semibold text-foreground">Altaf Cash &amp; Carry</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex items-center justify-center gap-3 mt-4 flex-wrap"
          >
            <span className="font-mono text-xs bg-muted px-3 py-1.5 rounded-full font-bold">
              #{order.id?.toString().slice(-10).toUpperCase()}
            </span>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLOR[currentStatus] || STATUS_COLOR.Pending}`}>
              {currentStatus}
            </span>
            {isFreeDelivery && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                ✨ Free Delivery
              </span>
            )}
          </motion.div>
        </motion.div>

        {/* ── Tracking timeline ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mb-10"
        >
          <OrderTrackingTimeline currentStatus={currentStatus as any} />
        </motion.div>

        {/* ── Receipt card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
          className="bg-card rounded-3xl border border-border/60 shadow-lg overflow-hidden mb-8"
        >
          {/* Receipt header */}
          <div className="gradient-hero px-6 py-5 text-primary-foreground text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-90" />
            </motion.div>
            <p className="font-display font-extrabold text-lg tracking-wide">Official Receipt</p>
            <p className="text-primary-foreground/70 text-xs mt-0.5">Altaf Cash &amp; Carry · Lahore</p>
          </div>

          <div className="p-6">
            {/* Order meta */}
            {[
              { label: "Order ID",  value: <span className="font-mono font-bold text-xs">{order.id}</span> },
              { label: "Date",      value: order.date },
              { label: "Customer",  value: order.customerName },
              { label: "Phone",     value: order.phone },
              { label: "Address",   value: order.address, right: true },
              { label: "Payment",   value: order.paymentMethod || "COD" },
            ].map(row => (
              <div
                key={row.label}
                className="flex justify-between items-start mb-3 pb-3 border-b border-border/30 last:border-0 last:mb-0 last:pb-0 text-sm"
              >
                <span className="text-muted-foreground flex-shrink-0">{row.label}</span>
                <span className={`${row.right ? "text-right max-w-[55%]" : ""} font-medium`}>
                  {row.value}
                </span>
              </div>
            ))}

            {/* Items */}
            {order.items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-border">
                <h3 className="font-display font-bold mb-3 text-sm">Items Ordered</h3>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={item.product?.id ?? idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product?.name ?? "Product"}
                        <span className="text-foreground font-semibold ml-1">× {item.quantity}</span>
                      </span>
                      <span className="font-semibold">
                        PKR {(finalPrice(item) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals — FIX: use order.subtotal and order.deliveryCharge directly */}
            <div className="mt-4 pt-4 border-t border-dashed border-border space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>PKR {Math.round(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={isFreeDelivery ? "text-emerald-600 font-bold" : "font-medium"}>
                  {isFreeDelivery
                    ? "FREE ✨"
                    : order.deliveryCharge > 0
                      ? `PKR ${order.deliveryCharge.toLocaleString()}`
                      : "PKR 0"}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2 border-t border-border">
                <span>Grand Total</span>
                <span className="text-primary">PKR {Math.round(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/40 px-6 py-3 text-center text-xs text-muted-foreground border-t border-border/40">
            Thank you for your business! · altafcashncarry.pk
          </div>
        </motion.div>



        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-wrap gap-3 mt-6"
        >
          <Link to="/my-orders">
            <Button variant="outline" className="rounded-xl gap-2">
              <Download className="h-4 w-4" /> My Orders
            </Button>
          </Link>
          <Button variant="outline" onClick={handleShare} className="rounded-xl gap-2">
            <Share2 className="h-4 w-4" /> Share Order
          </Button>
          <Link to="/shop" className="flex-1">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full">
              <Button className="w-full rounded-xl gap-2 relative overflow-hidden">
                <motion.span
                  className="absolute inset-0 bg-white/15 skew-x-[-15deg]"
                  initial={{ x: "-130%" }}
                  whileHover={{ x: "230%" }}
                  transition={{ duration: 0.45 }}
                />
                Continue Shopping <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default OrderConfirmation;