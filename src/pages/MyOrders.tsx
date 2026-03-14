import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, ShoppingBag, Clock, CheckCircle2, Truck, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
  items: { name: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:           { label: "Pending",         color: "bg-amber-500/15 text-amber-600 border-amber-500/25",       icon: Clock        },
  confirmed:         { label: "Confirmed",        color: "bg-blue-500/15 text-blue-600 border-blue-500/25",         icon: CheckCircle2 },
  preparing:         { label: "Preparing",        color: "bg-orange-500/15 text-orange-600 border-orange-500/25",   icon: Clock        },
  "out-for-delivery":{ label: "Out for Delivery", color: "bg-primary/15 text-primary border-primary/25",            icon: Truck        },
  delivered:         { label: "Delivered",        color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",icon: CheckCircle2 },
};

const MyOrders = () => {
  const { user } = useAuth();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        setOrders((data || []).map((o: any) => {
          const rawItems = typeof o.items === "string"
            ? JSON.parse(o.items)
            : o.items || [];

          const itemNames: string[] = rawItems
            .slice(0, 2)
            .map((i: any) => i.product?.name ?? i.name ?? "Item");

          return {
            id:        o.id,
            date:      o.created_at
              ? new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
              : "",
            status:    o.status || "pending",
            total:     o.total  ?? 0,
            itemCount: rawItems.length,
            items:     itemNames.map((n: string) => ({ name: n })),
          };
        }));
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    /* Real-time subscription — updates when admin changes status */
    const channel = supabase
      .channel("my-orders")
      .on("postgres_changes", {
        event:  "*",
        schema: "public",
        table:  "orders",
        filter: `user_id=eq.${user.id}`,
      }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  /* ── Loading ── */
  if (loading) return (
    <div className="container py-20 flex flex-col items-center gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Package className="h-10 w-10 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium">Loading your orders…</p>
    </div>
  );

  /* ── Empty state ── */
  if (orders.length === 0) return (
    <div className="container py-20 flex flex-col items-center text-center gap-5">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180 }}
        className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Package className="h-14 w-14 text-primary" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-3xl font-display font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          You haven't placed any orders. Start shopping and your orders will appear here.
        </p>
        <Link to="/shop">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" className="rounded-full px-8 gap-2">
              <ShoppingBag className="h-4 w-4" /> Shop Now
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="container py-10 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1">Account</p>
        <h1 className="text-3xl font-display font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} total orders</p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60 hidden sm:block" />
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status?.toLowerCase()] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 180 }}
                  className="sm:pl-14 relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-3 top-5 w-4 h-4 rounded-full bg-primary border-2 border-background shadow hidden sm:block z-10" />

                  <Link to={`/order-confirmation/${order.id}`}>
                    <motion.div
                      whileHover={{ x: 4, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                      transition={{ duration: 0.2 }}
                      className="bg-card rounded-2xl border border-border/60 p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              #{order.id?.toString().slice(-8).toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                              <StatusIcon className="h-2.5 w-2.5" />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">{order.date}</p>
                          
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-extrabold text-primary text-sm">
                            PKR {Math.round(order.total).toLocaleString()}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;