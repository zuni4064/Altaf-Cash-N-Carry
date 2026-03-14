import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Users, ShoppingBag, LogOut, TrendingUp, Banknote,
  Clock, CheckCircle2, BoxIcon, Search, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, AlertTriangle, Zap, Menu, X,
  LayoutDashboard, ShoppingCart, Star, Mail, Phone, Calendar,
  ArrowUpRight, Filter, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import React, { Suspense } from "react";

const AnalyticsCharts   = React.lazy(() => import("@/components/admin/AnalyticsCharts"));
const ProductManagement = React.lazy(() => import("@/components/admin/ProductManagement"));

/* ── Types ─────────────────────────────────────────────── */
interface OrderItem   { product_id: string; quantity: number; price_at_time: number; }
interface Order       {
  id: string; order_number: string; customer_name: string;
  customer_email: string | null; phone: string; address: string;
  payment_method: string; status: string; total: number;
  items: OrderItem[]; created_at: string; user_id?: string;
}
interface CustomerInfo {
  user_id: string; full_name: string | null; phone: string | null;
  email: string; created_at: string;
}

/* ── Constants ──────────────────────────────────────────── */
const STATUS_OPTIONS = ["confirmed","preparing","out-for-delivery","delivered","cancelled"];
const ORDERS_PER_PAGE = 10;

const STATUS_META: Record<string, { style: string; dot: string }> = {
  confirmed:          { style: "bg-blue-500/12 text-blue-700 border-blue-400/35",     dot: "bg-blue-500"    },
  preparing:          { style: "bg-amber-500/12 text-amber-700 border-amber-400/35",  dot: "bg-amber-500"   },
  "out-for-delivery": { style: "bg-violet-500/12 text-violet-700 border-violet-400/35", dot: "bg-violet-500" },
  delivered:          { style: "bg-emerald-500/12 text-emerald-700 border-emerald-400/35", dot: "bg-emerald-500" },
  cancelled:          { style: "bg-red-500/12 text-red-700 border-red-400/35",        dot: "bg-red-500"     },
  pending:            { style: "bg-gray-400/12 text-gray-600 border-gray-400/35",     dot: "bg-gray-400"    },
};

const PAYMENT_LABEL: Record<string,string> = {
  cod: "Cash on Delivery", card: "Card", jazzcash: "JazzCash", easypaisa: "Easypaisa",
};

const PRODUCT_NAMES: Record<string,string> = {
  fv1:"Fresh Red Apples",fv2:"Organic Bananas",fv3:"Fresh Tomatoes",fv4:"Green Capsicum",
  fv5:"Fresh Spinach",fv6:"Carrots",fv7:"Fresh Mangoes",fv8:"Potatoes",fv9:"Onions",fv10:"Watermelon",
  d1:"Fresh Milk",d2:"Natural Yogurt",d3:"Cheddar Cheese",d4:"Butter",d5:"Cream",
  d6:"Eggs (Pack of 12)",d7:"Paneer",d8:"Raita",d9:"Lassi",d10:"Mozzarella",
  b1:"Green Tea",b2:"Orange Juice",b3:"Cola Pack",b4:"Mineral Water",b5:"Mango Juice",
  b6:"Coffee Beans",bk1:"White Bread",bk2:"Brown Bread",bk3:"Croissants",bk4:"Donuts",
  h1:"Dish Soap",h2:"Laundry Detergent",pc1:"Shampoo",pc2:"Body Wash",pc3:"Toothpaste",
};

const getProductName = (id: string) => PRODUCT_NAMES[id] || id || "Item";

/* ── Loaders ────────────────────────────────────────────── */
const TabLoader = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
  </div>
);

/* ── StatusBadge ────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status.replace(/-/g, " ")}
    </span>
  );
};

/* ── KPI Card ────────────────────────────────────────────── */
const KpiCard = ({
  label, value, icon: Icon, colorClass, bgClass, sub, delay = 0, onClick,
}: {
  label: string; value: string | number; icon: any; colorClass: string;
  bgClass: string; sub?: string; delay?: number; onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 130 }}
    whileHover={{ y: -4, scale: 1.02 }}
    onClick={onClick}
    className={`bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-lg transition-all ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
    </div>
    <p className="text-2xl font-extrabold leading-none mb-1">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </motion.div>
);

/* ── Order card ─────────────────────────────────────────── */
const OrderCard = ({
  order, expanded, onToggle, onStatusChange,
}: {
  order: Order; expanded: boolean; onToggle: () => void; onStatusChange: (s: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all"
  >
    <div className="flex flex-wrap items-start justify-between gap-4 p-4">
      {/* Left info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-md tracking-wider">
            {order.order_number}
          </span>
          <StatusBadge status={order.status} />
          <span className="text-[10px] text-muted-foreground ml-auto">
            {new Date(order.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
            {order.customer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{order.customer_name}</p>
            <p className="text-xs text-muted-foreground">
              {order.phone}
              {order.customer_email && <span> · {order.customer_email}</span>}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 pl-9">{order.address}</p>
      </div>

      {/* Right controls */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-xl font-extrabold text-primary">
          PKR {Number(order.total).toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
          {PAYMENT_LABEL[order.payment_method] || order.payment_method}
        </span>
        <Select value={order.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-44 h-8 text-xs rounded-xl border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/-/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Items toggle */}
    <div className="border-t border-border/40 px-4 py-2 bg-muted/20 flex items-center justify-between">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide" : "Show"} {order.items?.length || 0} items
      </button>
      <span className="text-[10px] text-muted-foreground">{order.items?.length || 0} products</span>
    </div>

    <AnimatePresence>
      {expanded && order.items?.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 grid gap-1.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-muted/40 rounded-xl px-3 py-2">
                <span className="font-medium">{getProductName(item.product_id)}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>×{item.quantity}</span>
                  <span className="font-bold text-foreground">PKR {(item.price_at_time * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

/* ── Customer card ──────────────────────────────────────── */
const CustomerCard = ({
  customer, orderCount, totalSpent, lastOrder, delay,
}: {
  customer: CustomerInfo; orderCount: number; totalSpent: number;
  lastOrder?: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 130 }}
    whileHover={{ y: -3, scale: 1.01 }}
    className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-extrabold text-primary text-sm flex-shrink-0">
        {(customer.full_name || customer.email || "?").charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight truncate">{customer.full_name || "—"}</p>

        <div className="flex items-center gap-1.5 mt-1">
          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{customer.email || "—"}</span>
        </div>

        {customer.phone && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground">{customer.phone}</span>
          </div>
        )}
      </div>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
          <ShoppingCart className="h-3 w-3" />
          <span className="font-extrabold text-sm">{orderCount}</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium">Orders</p>
      </div>
      <div className="text-center border-x border-border/40">
        <p className="font-extrabold text-sm text-emerald-600">
          {totalSpent >= 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground font-medium">PKR Spent</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <Calendar className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="text-[10px] text-muted-foreground font-medium">
          {customer.created_at
            ? new Date(customer.created_at).toLocaleDateString("en-PK", { month: "short", year: "2-digit" })
            : "—"}
        </p>
      </div>
    </div>

    {lastOrder && (
      <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Last order</span>
        <span className="text-[10px] font-semibold text-foreground">{lastOrder}</span>
      </div>
    )}
  </motion.div>
);

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════ */
type Tab = "overview" | "orders" | "customers" | "analytics" | "products";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [tab,        setTab]        = useState<Tab>("overview");
  const [sidebar,    setSidebar]    = useState(true);
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [customers,  setCustomers]  = useState<CustomerInfo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [products,   setProducts]   = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");

  const [orderSearch,         setOrderSearch]         = useState("");
  const [debouncedSearch,     setDebouncedSearch]      = useState("");
  const [orderPage,           setOrderPage]            = useState(1);
  const [orderStatusFilter,   setOrderStatusFilter]    = useState("all");
  const [expandedOrders,      setExpandedOrders]       = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* ── Fetchers ── */
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*");
    if (data) setProducts(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data: od, error } = await supabase
      .from("orders").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load orders"); setLoading(false); return; }
    const { data: id } = await supabase.from("order_items").select("*");
    setOrders((od || []).map(o => ({ ...o, items: (id || []).filter(i => i.order_id === o.id) })));
    setLoading(false);
  }, []);

  const fetchCustomers = useCallback(async () => {
    const { data: profiles, error } = await supabase
      .from("profiles").select("user_id,full_name,phone,email,created_at")
      .order("created_at", { ascending: false });
    if (error) return;
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = new Set(roles?.map(r => r.user_id) || []);
    setCustomers((profiles || []).filter(p => !adminIds.has(p.user_id)));
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [fetchOrders, fetchCustomers, fetchProducts]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    revenue:   orders.reduce((s, o) => s + Number(o.total), 0),
    total:     orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending:   orders.filter(o => !["delivered","cancelled"].includes(o.status)).length,
  }), [orders]);

  const outOfStock = products.filter(p => !p.in_stock || p.stock === 0).length;
  const lowStock   = products.filter(p => p.in_stock && p.stock > 0 && p.stock <= 5).length;

  /* ── Customer order enrichment ── */
  const enrichedCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const q = customerSearch.toLowerCase();
        return !q || (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
      })
      .map(c => {
        const cOrders = orders.filter(o =>
          o.user_id === c.user_id ||
          (o.customer_email && o.customer_email.toLowerCase() === c.email?.toLowerCase())
        );
        const totalSpent   = cOrders.reduce((s, o) => s + Number(o.total), 0);
        const lastOrderDate = cOrders[0]?.created_at
          ? new Date(cOrders[0].created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
          : undefined;
        return { ...c, orderCount: cOrders.length, totalSpent, lastOrderDate };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent); // top spenders first
  }, [customers, orders, customerSearch]);

  /* ── Filtered orders ── */
  const { filteredOrders, orderTotalPages, pageOrders } = useMemo(() => {
    let list = orders;
    if (orderStatusFilter !== "all") list = list.filter(o => o.status === orderStatusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        (o.customer_email || "").toLowerCase().includes(q) ||
        o.phone?.includes(q)
      );
    }
    const total = Math.ceil(list.length / ORDERS_PER_PAGE);
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return { filteredOrders: list, orderTotalPages: total, pageOrders: list.slice(start, start + ORDERS_PER_PAGE) };
  }, [orders, orderStatusFilter, debouncedSearch, orderPage]);

  const handleSearch = useCallback((v: string) => {
    setOrderSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setOrderPage(1); }, 250);
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); fetchOrders(); }
    else toast.success(`Order marked as ${status.replace(/-/g, " ")}`);
  }, [fetchOrders]);

  const toggleExpand = (id: string) =>
    setExpandedOrders(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  /* ── Nav tabs ── */
  const TABS: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: "overview",   label: "Overview",   icon: LayoutDashboard },
    { key: "analytics",  label: "Analytics",  icon: TrendingUp      },
    { key: "orders",     label: "Orders",     icon: ShoppingBag,    badge: stats.pending > 0 ? stats.pending : undefined },
    { key: "products",   label: "Products",   icon: BoxIcon,        badge: outOfStock > 0 ? outOfStock : undefined       },
    { key: "customers",  label: "Customers",  icon: Users,          badge: customers.length > 0 ? customers.length : undefined },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">

      {/* ═══ SIDEBAR ═══════════════════════════════════════ */}
      <AnimatePresence>
        {sidebar && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed left-0 top-0 h-full w-60 z-30 flex flex-col"
            style={{ background: "hsl(var(--card))", borderRight: "1px solid hsl(var(--border)/0.6)" }}
          >
            {/* Brand */}
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </motion.div>
                <div>
                  <p className="font-display font-extrabold text-sm">Altaf Cash</p>
                  <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">&amp; Carry · Admin</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-3 mb-2 mt-1">Menu</p>
              {TABS.map((t, i) => {
                const active = tab === t.key;
                return (
                  <motion.button
                    key={t.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: active ? 0 : 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTab(t.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                      ${active
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"}`}
                  >
                    <t.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{t.label}</span>
                    {t.badge !== undefined && (
                      <span className={`text-[10px] font-extrabold min-w-[20px] text-center px-1.5 py-0.5 rounded-full
                        ${active ? "bg-white/25 text-white" : "bg-destructive text-white"}`}>
                        {t.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 space-y-1">
              <motion.button
                whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                onClick={() => { fetchOrders(); fetchCustomers(); fetchProducts(); toast.success("Refreshed!"); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Refresh Data
              </motion.button>
              <motion.button
                whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ MAIN ═══════════════════════════════════════════ */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebar ? "ml-60" : "ml-0"}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3.5 border-b border-border/50"
          style={{ background: "hsl(var(--background)/0.95)", backdropFilter: "blur(12px)" }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setSidebar(v => !v)}
            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </motion.button>

          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-base leading-none capitalize">{tab}</h1>
            <p className="text-[11px] text-muted-foreground">Altaf Cash &amp; Carry · Admin Panel</p>
          </div>

          {/* Stock alert pill */}
          <AnimatePresence>
            {(outOfStock > 0 || lowStock > 0) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setTab("products")}
                className="ml-auto flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border
                  bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 transition-colors"
              >
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </motion.span>
                {outOfStock > 0 ? `${outOfStock} out of stock` : `${lowStock} low stock`}
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">

            {/* ═══ OVERVIEW ═══════════════════════════════ */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">

                {/* Stock alert */}
                {(outOfStock > 0 || lowStock > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-4
                      ${outOfStock > 0 ? "bg-destructive/6 border-destructive/25" : "bg-amber-500/6 border-amber-500/25"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${outOfStock > 0 ? "bg-destructive/15" : "bg-amber-500/15"}`}>
                        <AlertTriangle className={`h-5 w-5 ${outOfStock > 0 ? "text-destructive" : "text-amber-600"}`} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${outOfStock > 0 ? "text-destructive" : "text-amber-700"}`}>
                          {outOfStock > 0 ? `${outOfStock} products out of stock!` : `${lowStock} products running low`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(outOfStock > 0
                            ? products.filter(p => !p.in_stock || p.stock === 0)
                            : products.filter(p => p.in_stock && p.stock > 0 && p.stock <= 5)
                          ).slice(0, 5).map(p => (
                            <span key={p.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                              ${outOfStock > 0 ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-700"}`}>
                              {p.name}{p.stock !== undefined ? ` (${p.stock})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant={outOfStock > 0 ? "destructive" : "outline"}
                      onClick={() => setTab("products")} className="rounded-xl gap-1.5 flex-shrink-0">
                      Restock <Zap className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}

                {/* KPI cards */}
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Total Revenue"  value={`PKR ${Math.round(stats.revenue).toLocaleString()}`}
                      icon={Banknote}     colorClass="text-primary"      bgClass="bg-primary/12"      sub={`from ${stats.total} orders`} delay={0}    />
                    <KpiCard label="Total Orders"   value={stats.total}
                      icon={ShoppingBag}  colorClass="text-secondary"    bgClass="bg-secondary/12"    sub="All time"    delay={0.08} onClick={() => setTab("orders")} />
                    <KpiCard label="Delivered"       value={stats.delivered}
                      icon={CheckCircle2} colorClass="text-emerald-600"  bgClass="bg-emerald-500/12"  sub="Completed"   delay={0.16} />
                    <KpiCard label="In Progress"     value={stats.pending}
                      icon={Clock}        colorClass="text-amber-600"    bgClass="bg-amber-500/12"    sub="Active"      delay={0.24} onClick={() => setTab("orders")} />
                  </div>
                )}

                {/* Recent orders + Customer snapshot */}
                <div className="grid md:grid-cols-3 gap-5">
                  {/* Recent orders — 2/3 */}
                  <div className="md:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <h3 className="font-display font-bold text-sm">Recent Orders</h3>
                      </div>
                      <button onClick={() => setTab("orders")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        View all <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="divide-y divide-border/30">
                      {loading
                        ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 mx-4 my-3 rounded-xl" />)
                        : orders.length === 0
                        ? <p className="text-center text-muted-foreground py-12 text-sm">No orders yet</p>
                        : orders.slice(0, 6).map(o => (
                          <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/25 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {o.customer_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold truncate">{o.order_number}</span>
                                  <StatusBadge status={o.status} />
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{o.customer_name}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <p className="font-bold text-primary text-sm">PKR {Number(o.total).toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Customer snapshot — 1/3 */}
                  <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-secondary" />
                        </div>
                        <h3 className="font-display font-bold text-sm">Top Customers</h3>
                      </div>
                      <button onClick={() => setTab("customers")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        All <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-3 space-y-2">
                      {enrichedCustomers.filter(c => c.orderCount > 0).slice(0, 5).map((c, i) => (
                        <div key={c.user_id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {(c.full_name || c.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{c.full_name || c.email}</p>
                            <p className="text-[10px] text-muted-foreground">{c.orderCount} orders · PKR {c.totalSpent.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                          </div>
                        </div>
                      ))}
                      {enrichedCustomers.filter(c => c.orderCount > 0).length === 0 && (
                        <p className="text-center text-muted-foreground text-xs py-6">No orders yet</p>
                      )}
                    </div>
                    <div className="px-4 pb-4 pt-1">
                      <div className="bg-primary/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-extrabold text-primary leading-none">{customers.length}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total Customers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ ORDERS ════════════════════════════════ */}
            {tab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search orders…" value={orderSearch}
                      onChange={e => handleSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-border/60" />
                  </div>
                  <Select value={orderStatusFilter} onValueChange={v => { setOrderStatusFilter(v); setOrderPage(1); }}>
                    <SelectTrigger className="w-44 h-10 rounded-xl border-border/60 gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace(/-/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground self-center">
                    <span className="font-bold text-foreground">{filteredOrders.length}</span> orders
                  </span>
                </div>

                {loading ? <TabLoader /> : pageOrders.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                    <Package className="h-12 w-12 opacity-20" />
                    <p className="font-medium">No orders found</p>
                  </div>
                ) : pageOrders.map(o => (
                  <OrderCard
                    key={o.id} order={o}
                    expanded={expandedOrders.has(o.id)}
                    onToggle={() => toggleExpand(o.id)}
                    onStatusChange={s => updateStatus(o.id, s)}
                  />
                ))}

                {orderTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button variant="outline" size="sm" disabled={orderPage <= 1}
                      onClick={() => setOrderPage(p => p - 1)} className="rounded-xl">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground font-medium">
                      {orderPage} / {orderTotalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={orderPage >= orderTotalPages}
                      onClick={() => setOrderPage(p => p + 1)} className="rounded-xl">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ CUSTOMERS ════════════════════════════ */}
            {tab === "customers" && (
              <motion.div key="customers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                {/* Header stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total", value: customers.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                    { label: "With Orders", value: enrichedCustomers.filter(c => c.orderCount > 0).length, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                    { label: "Avg. Spent", value: `PKR ${customers.length > 0 ? Math.round(enrichedCustomers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toLocaleString() : 0}`, icon: Banknote, color: "text-amber-600", bg: "bg-amber-500/10" },
                  ].map((s, i) => (
                    <KpiCard key={s.label} label={s.label} value={s.value} icon={s.icon}
                      colorClass={s.color} bgClass={s.bg} delay={i * 0.07} />
                  ))}
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search customers…" value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-border/60" />
                </div>

                {/* Customer cards grid */}
                {enrichedCustomers.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                    <Users className="h-12 w-12 opacity-20" />
                    <p className="font-medium">No customers found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {enrichedCustomers.map((c, i) => (
                      <CustomerCard
                        key={c.user_id}
                        customer={c}
                        orderCount={c.orderCount}
                        totalSpent={c.totalSpent}
                        lastOrder={c.lastOrderDate}
                        delay={Math.min(i * 0.04, 0.3)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ ANALYTICS ════════════════════════════ */}
            {tab === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Suspense fallback={<TabLoader />}>
                  <AnalyticsCharts orders={orders} />
                </Suspense>
              </motion.div>
            )}

            {/* ═══ PRODUCTS ═════════════════════════════ */}
            {tab === "products" && (
              <motion.div key="products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Suspense fallback={<TabLoader />}>
                  <ProductManagement />
                </Suspense>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;