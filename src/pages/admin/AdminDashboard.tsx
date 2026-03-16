import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
interface OrderItem { product_id: string; quantity: number; price_at_time: number; }
interface Order {
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
const STATUS_OPTIONS = ["confirmed", "preparing", "out-for-delivery", "delivered", "cancelled"];
const ORDERS_PER_PAGE = 10;
const SIDEBAR_WIDTH = 256;

const STATUS_META: Record<string, { style: string; dot: string }> = {
  confirmed:          { style: "bg-blue-500/12 text-blue-700 border-blue-400/35",          dot: "bg-blue-500"    },
  preparing:          { style: "bg-amber-500/12 text-amber-700 border-amber-400/35",       dot: "bg-amber-500"   },
  "out-for-delivery": { style: "bg-violet-500/12 text-violet-700 border-violet-400/35",    dot: "bg-violet-500"  },
  delivered:          { style: "bg-emerald-500/12 text-emerald-700 border-emerald-400/35", dot: "bg-emerald-500" },
  cancelled:          { style: "bg-red-500/12 text-red-700 border-red-400/35",             dot: "bg-red-500"     },
  pending:            { style: "bg-gray-400/12 text-gray-600 border-gray-400/35",          dot: "bg-gray-400"    },
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on Delivery", card: "Card", jazzcash: "JazzCash", easypaisa: "Easypaisa",
};

const PRODUCT_NAMES: Record<string, string> = {
  fv1: "Fresh Red Apples", fv2: "Organic Bananas", fv3: "Fresh Tomatoes", fv4: "Green Capsicum",
  fv5: "Fresh Spinach", fv6: "Carrots", fv7: "Fresh Mangoes", fv8: "Potatoes", fv9: "Onions", fv10: "Watermelon",
  d1: "Fresh Milk", d2: "Natural Yogurt", d3: "Cheddar Cheese", d4: "Butter", d5: "Cream",
  d6: "Eggs (Pack of 12)", d7: "Paneer", d8: "Raita", d9: "Lassi", d10: "Mozzarella",
  b1: "Green Tea", b2: "Orange Juice", b3: "Cola Pack", b4: "Mineral Water", b5: "Mango Juice",
  b6: "Coffee Beans", bk1: "White Bread", bk2: "Brown Bread", bk3: "Croissants", bk4: "Donuts",
  h1: "Dish Soap", h2: "Laundry Detergent", pc1: "Shampoo", pc2: "Body Wash", pc3: "Toothpaste",
};

const getProductName = (id: string) => PRODUCT_NAMES[id] || id || "Item";

/* ── Helpers ────────────────────────────────────────────── */
const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 1024;

/* ── Loaders ────────────────────────────────────────────── */
const TabLoader = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
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

/* ── KPI Card ───────────────────────────────────────────── */
let kpiMounted = false;
const KpiCard = ({
  label, value, icon: Icon, colorClass, bgClass, sub, delay = 0, onClick,
}: {
  label: string; value: string | number; icon: any; colorClass: string;
  bgClass: string; sub?: string; delay?: number; onClick?: () => void;
}) => (
  <motion.div
    initial={kpiMounted ? false : { opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 130 }}
    whileHover={{ y: -3, scale: 1.02 }}
    onClick={onClick}
    className={`bg-card rounded-2xl border border-border/60 p-4 md:p-5 shadow-sm hover:shadow-lg transition-all ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-tight">{label}</span>
      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${colorClass}`} />
      </div>
    </div>
    <p className="text-xl md:text-2xl font-extrabold leading-none mb-1">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </motion.div>
);

/* ── Order card ─────────────────────────────────────────── */
const OrderCard = ({
  order, expanded, onToggle, onStatusChange,
}: {
  order: Order; expanded: boolean; onToggle: () => void; onStatusChange: (s: string) => void;
}) => (
  <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all">
    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
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
              {order.customer_email && <span className="hidden sm:inline"> · {order.customer_email}</span>}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 pl-9">{order.address}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-lg md:text-xl font-extrabold text-primary">
          PKR {Number(order.total).toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
          {PAYMENT_LABEL[order.payment_method] || order.payment_method}
        </span>
        <Select value={order.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-40 md:w-44 h-8 text-xs rounded-xl border-border/60">
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
  </div>
);

/* ── Customer card ──────────────────────────────────────── */
const CustomerCard = ({
  customer, orderCount, totalSpent, lastOrder,
}: {
  customer: CustomerInfo; orderCount: number; totalSpent: number; lastOrder?: string;
}) => (
  <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-extrabold text-primary text-sm flex-shrink-0">
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
        <p className="text-[10px] text-muted-foreground font-medium mt-1">
          {customer.created_at
            ? new Date(customer.created_at).toLocaleDateString("en-PK", { month: "short", year: "2-digit" })
            : "—"}
        </p>
        <p className="text-[10px] text-muted-foreground font-medium">Joined</p>
      </div>
    </div>

    {lastOrder && (
      <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Last order</span>
        <span className="text-[10px] font-semibold text-foreground">{lastOrder}</span>
      </div>
    )}
  </div>
);

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════ */
type Tab = "overview" | "orders" | "customers" | "analytics" | "products";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  /* ── Tab stored in URL ── */
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "overview";
  const setTab = useCallback(
    (t: Tab) => setSearchParams({ tab: t }, { replace: true }),
    [setSearchParams],
  );

  /* ── Sidebar: open by default on desktop only ── */
  const [sidebar, setSidebar] = useState<boolean>(() => isDesktop());

  useEffect(() => {
    const onResize = () => {
      if (isDesktop()) setSidebar(true);
      else setSidebar(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleTabClick = useCallback((key: Tab) => {
    setTab(key);
    if (!isDesktop()) setSidebar(false);
  }, [setTab]);

  const [customerSearch,    setCustomerSearch]    = useState("");
  const [orderSearch,       setOrderSearch]       = useState("");
  const [debouncedSearch,   setDebouncedSearch]   = useState("");
  const [orderPage,         setOrderPage]         = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [expandedOrders,    setExpandedOrders]    = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* ══ QUERIES ════════════════════════════════════════════ */
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: od, error } = await supabase
        .from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const { data: items } = await supabase.from("order_items").select("*");
      return (od || []).map(o => ({
        ...o,
        items: (items || []).filter((i: any) => i.order_id === o.id),
      })) as Order[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles").select("user_id,full_name,phone,email,created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const { data: roles } = await supabase
        .from("user_roles").select("user_id").eq("role", "admin");
      const adminIds = new Set(roles?.map((r: any) => r.user_id) || []);
      return (profiles || []).filter((p: any) => !adminIds.has(p.user_id)) as CustomerInfo[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-raw"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*");
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => { kpiMounted = true; }, []);

  const loading = ordersLoading;

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products-raw"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Refreshed!");
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-orders"] });
      const prev = queryClient.getQueryData<Order[]>(["admin-orders"]);
      queryClient.setQueryData<Order[]>(["admin-orders"], old =>
        (old || []).map(o => o.id === id ? { ...o, status } : o),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin-orders"], ctx.prev);
      toast.error("Failed to update status");
    },
    onSuccess: ({ status }) => toast.success(`Order marked as ${status.replace(/-/g, " ")}`),
  });

  const updateStatus = useCallback(
    (id: string, status: string) => updateStatusMutation.mutate({ id, status }),
    [updateStatusMutation],
  );

  /* ── Stats — revenue excludes cancelled orders ── */
  const stats = useMemo(() => ({
    revenue:   orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0),
    total:     orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending:   orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length,
  }), [orders]);

  const outOfStock = products.filter((p: any) => !p.in_stock || p.stock === 0).length;
  const lowStock   = products.filter((p: any) => p.in_stock && p.stock > 0 && p.stock <= 5).length;

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
        return {
          ...c,
          orderCount: cOrders.length,
          totalSpent: cOrders.reduce((s, o) => s + Number(o.total), 0),
          lastOrderDate: cOrders[0]?.created_at
            ? new Date(cOrders[0].created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
            : undefined,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, orders, customerSearch]);

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

  const toggleExpand = (id: string) =>
    setExpandedOrders(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const TABS: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: "overview",  label: "Overview",  icon: LayoutDashboard },
    { key: "analytics", label: "Analytics", icon: TrendingUp      },
    { key: "orders",    label: "Orders",    icon: ShoppingBag,    badge: stats.pending > 0 ? stats.pending : undefined },
    { key: "products",  label: "Products",  icon: BoxIcon,        badge: outOfStock > 0 ? outOfStock : undefined       },
    { key: "customers", label: "Customers", icon: Users,          badge: customers.length > 0 ? customers.length : undefined },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">

      {/* ═══ MOBILE BACKDROP ═══════════════════════════════ */}
      <AnimatePresence>
        {sidebar && !isDesktop() && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebar(false)}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ═══ SIDEBAR ═══════════════════════════════════════ */}
      <AnimatePresence>
        {sidebar && (
          <motion.aside
            key="sidebar"
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full z-30 flex flex-col w-64"
            style={{
              background: "hsl(var(--card))",
              borderRight: "1px solid hsl(var(--border)/0.6)",
              boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
            }}
          >
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-extrabold text-sm truncate">Altaf Cash</p>
                  <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">&amp; Carry · Admin</p>
                </div>
                <button
                  onClick={() => setSidebar(false)}
                  className="ml-auto w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground lg:hidden flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-3 mb-2 mt-1">Menu</p>
              {TABS.map(t => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleTabClick(t.key)}
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
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-border/50 space-y-1">
              <button
                onClick={() => { refreshAll(); if (!isDesktop()) setSidebar(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Refresh Data
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ MAIN ═══════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebar && isDesktop() ? SIDEBAR_WIDTH : 0 }}
      >
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-border/50"
          style={{ background: "hsl(var(--background)/0.95)", backdropFilter: "blur(12px)" }}
        >
          <button
            onClick={() => setSidebar(v => !v)}
            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-display font-extrabold text-sm md:text-base leading-none capitalize">{tab}</h1>
            <p className="text-[10px] md:text-[11px] text-muted-foreground hidden sm:block">Altaf Cash &amp; Carry · Admin Panel</p>
          </div>

          <AnimatePresence>
            {(outOfStock > 0 || lowStock > 0) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => handleTabClick("products")}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-full border
                  bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 transition-colors flex-shrink-0"
              >
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </motion.span>
                <span className="hidden sm:inline">
                  {outOfStock > 0 ? `${outOfStock} out of stock` : `${lowStock} low stock`}
                </span>
                <span className="sm:hidden">
                  {outOfStock > 0 ? outOfStock : lowStock}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* ═══ TAB CONTENT ════════════════════════════════ */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">

          {/* ── OVERVIEW ────────────────────────────────── */}
          <div className={tab === "overview" ? "block space-y-5" : "hidden"}>
            {(outOfStock > 0 || lowStock > 0) && (
              <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3
                ${outOfStock > 0 ? "bg-destructive/6 border-destructive/25" : "bg-amber-500/6 border-amber-500/25"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                    ${outOfStock > 0 ? "bg-destructive/15" : "bg-amber-500/15"}`}>
                    <AlertTriangle className={`h-4 w-4 ${outOfStock > 0 ? "text-destructive" : "text-amber-600"}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${outOfStock > 0 ? "text-destructive" : "text-amber-700"}`}>
                      {outOfStock > 0 ? `${outOfStock} products out of stock!` : `${lowStock} products running low`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(outOfStock > 0
                        ? products.filter((p: any) => !p.in_stock || p.stock === 0)
                        : products.filter((p: any) => p.in_stock && p.stock > 0 && p.stock <= 5)
                      ).slice(0, 4).map((p: any) => (
                        <span key={p.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                          ${outOfStock > 0 ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-700"}`}>
                          {p.name}{p.stock !== undefined ? ` (${p.stock})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant={outOfStock > 0 ? "destructive" : "outline"}
                  onClick={() => handleTabClick("products")} className="rounded-xl gap-1.5 flex-shrink-0 self-end sm:self-auto">
                  Restock <Zap className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total Revenue" value={`PKR ${Math.round(stats.revenue).toLocaleString()}`}
                  icon={Banknote}     colorClass="text-primary"     bgClass="bg-primary/12"     sub="Excl. cancelled" delay={0}    />
                <KpiCard label="Total Orders"  value={stats.total}
                  icon={ShoppingBag}  colorClass="text-violet-600"  bgClass="bg-violet-500/12"  sub="All time"  delay={0.06} onClick={() => handleTabClick("orders")} />
                <KpiCard label="Delivered"     value={stats.delivered}
                  icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-500/12" sub="Completed" delay={0.12} />
                <KpiCard label="In Progress"   value={stats.pending}
                  icon={Clock}        colorClass="text-amber-600"   bgClass="bg-amber-500/12"   sub="Active"    delay={0.18} onClick={() => handleTabClick("orders")} />
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-sm">Recent Orders</h3>
                  </div>
                  <button onClick={() => handleTabClick("orders")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    View all <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-border/30">
                  {loading
                    ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 mx-4 my-3 rounded-xl" />)
                    : orders.length === 0
                    ? <p className="text-center text-muted-foreground py-10 text-sm">No orders yet</p>
                    : orders.slice(0, 6).map(o => (
                      <div key={o.id} className="flex items-center justify-between px-4 md:px-5 py-3 hover:bg-muted/25 transition-colors">
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

              <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <h3 className="font-display font-bold text-sm">Top Customers</h3>
                  </div>
                  <button onClick={() => handleTabClick("customers")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    All <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  {enrichedCustomers.filter(c => c.orderCount > 0).slice(0, 5).map((c, i) => (
                    <div key={c.user_id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {(c.full_name || c.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{c.full_name || c.email}</p>
                        <p className="text-[10px] text-muted-foreground">{c.orderCount} orders · PKR {c.totalSpent.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
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
          </div>

          {/* ── ORDERS ──────────────────────────────────── */}
          <div className={tab === "orders" ? "block space-y-4" : "hidden"}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders…" value={orderSearch}
                  onChange={e => handleSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-border/60" />
              </div>
              <Select value={orderStatusFilter} onValueChange={v => { setOrderStatusFilter(v); setOrderPage(1); }}>
                <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-border/60 gap-1.5">
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
          </div>

          {/* ── CUSTOMERS ───────────────────────────────── */}
          <div className={tab === "customers" ? "block space-y-4" : "hidden"}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total",       value: customers.length, icon: Users,        color: "text-primary",      bg: "bg-primary/10" },
                { label: "With Orders", value: enrichedCustomers.filter(c => c.orderCount > 0).length, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                { label: "Avg. Spent",  value: `PKR ${customers.length > 0 ? Math.round(enrichedCustomers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toLocaleString() : 0}`, icon: Banknote, color: "text-amber-600", bg: "bg-amber-500/10" },
              ].map((s, i) => (
                <KpiCard key={s.label} label={s.label} value={s.value} icon={s.icon}
                  colorClass={s.color} bgClass={s.bg} delay={i * 0.07} />
              ))}
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers…" value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border/60" />
            </div>

            {enrichedCustomers.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                <Users className="h-12 w-12 opacity-20" />
                <p className="font-medium">No customers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {enrichedCustomers.map((c) => (
                  <CustomerCard
                    key={c.user_id}
                    customer={c}
                    orderCount={c.orderCount}
                    totalSpent={c.totalSpent}
                    lastOrder={c.lastOrderDate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── ANALYTICS — passes live products for correct names ── */}
          <div className={tab === "analytics" ? "block" : "hidden"}>
            <Suspense fallback={<TabLoader />}>
              <AnalyticsCharts orders={orders} products={products} />
            </Suspense>
          </div>

          {/* ── PRODUCTS ────────────────────────────────── */}
          <div className={tab === "products" ? "block" : "hidden"}>
            <Suspense fallback={<TabLoader />}>
              <ProductManagement />
            </Suspense>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;