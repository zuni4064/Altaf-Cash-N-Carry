import React, { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, TooltipProps,
} from "recharts";
import {
  TrendingUp, TrendingDown, ShoppingBag, Banknote,
  Star, CreditCard, Activity, Package, Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────────────── */
interface OrderItem  { product_id: string; quantity: number; price_at_time: number; }
interface Order      { id: string; total: number; items: OrderItem[]; status: string; created_at: string; payment_method: string; }

/* ── Palette ─────────────────────────────────────────── */
const P = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
];

const PRODUCT_NAMES: Record<string, string> = {
  fv1:"Fresh Apples",fv2:"Bananas",fv3:"Tomatoes",fv4:"Capsicum",fv5:"Spinach",
  fv6:"Carrots",fv7:"Mangoes",fv8:"Potatoes",fv9:"Onions",fv10:"Watermelon",
  d1:"Fresh Milk",d2:"Yogurt",d3:"Cheese",d4:"Butter",d5:"Cream",
  d6:"Eggs",d7:"Paneer",d9:"Lassi",d10:"Mozzarella",
  b1:"Green Tea",b2:"Orange Juice",b3:"Cola",b4:"Water",b5:"Mango Juice",
  bk1:"White Bread",bk2:"Brown Bread",bk3:"Croissants",bk4:"Donuts",bk6:"Naan",
  s1:"Chips",s2:"Nuts",s3:"Cookies",s4:"Popcorn",s7:"Nimko",
  h1:"Dish Soap",h2:"Detergent",pc1:"Shampoo",pc2:"Body Wash",pc3:"Toothpaste",
};

const PAYMENT_LABEL: Record<string, string> = {
  cod:"Cash on Delivery", card:"Card", jazzcash:"JazzCash", easypaisa:"Easypaisa",
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: P[1], preparing: P[3], "out-for-delivery": P[0],
  delivered: P[2], cancelled: P[4], pending: P[5],
};

/* ── Tooltip ─────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl px-4 py-3 text-xs">
      {label && <p className="font-bold text-foreground mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full chart-dot" style={{ '--chart-dot-color': p.color ?? P[i] } as React.CSSProperties} />
          <span className="text-muted-foreground">{p.name ?? "Value"}:</span>
          <span className="font-bold text-foreground">
            {typeof p.value === "number" && p.name?.toLowerCase().includes("revenue")
              ? `PKR ${p.value.toLocaleString()}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card ─────────────────────────────────────────── */
const KpiCard = ({
  label, value, sub, icon: Icon, color, bg, trend, delay = 0,
}: {
  label: string; value: string; sub?: string; icon: any;
  color: string; bg: string; trend?: "up" | "down"; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 130 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-lg transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      {trend && (
        <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full
          ${trend === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
          {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        </span>
      )}
    </div>
    <p className="text-2xl font-extrabold leading-none mb-1">{value}</p>
    <p className="text-xs font-bold text-muted-foreground">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
  </motion.div>
);

/* ── Section wrapper ─────────────────────────────────── */
const ChartCard = ({ title, subtitle, icon: Icon, color, children, className = "" }: {
  title: string; subtitle?: string; icon?: any; color?: string;
  children: React.ReactNode; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 110 }}
    className={`bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden ${className}`}
  >
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
      {Icon && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color || "bg-primary/10"}`}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      )}
      <div>
        <h3 className="font-display font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </motion.div>
);

/* ── Donut center label ─────────────────────────────── */
const DonutLabel = ({ viewBox, total }: any) => {
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" fontSize={22} fill="hsl(var(--foreground))" fontWeight={800}>{total}</tspan>
      <tspan x={cx} dy="18" fontSize={10} fill="hsl(var(--muted-foreground))">orders</tspan>
    </text>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
const AnalyticsCharts = ({ orders }: { orders: Order[] }) => {
  const [revenueRange, setRevenueRange] = useState<7 | 14 | 30>(14);

  /* ── Derived data ── */
  const active = useMemo(() => orders.filter(o => o.status !== "cancelled"), [orders]);

  const revenue    = useMemo(() => active.reduce((s, o) => s + Number(o.total), 0), [active]);
  const avgOrder   = useMemo(() => active.length ? revenue / active.length : 0, [active, revenue]);
  const delivered  = useMemo(() => orders.filter(o => o.status === "delivered").length, [orders]);

  /* Daily sales */
  const dailySales = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; orders: number }>();
    [...active]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
        const cur  = map.get(date) || { date, revenue: 0, orders: 0 };
        cur.revenue += Number(o.total);
        cur.orders  += 1;
        map.set(date, cur);
      });
    return Array.from(map.values()).slice(-revenueRange);
  }, [active, revenueRange]);

  const peakDay = useMemo(() =>
    dailySales.reduce((best, d) => d.revenue > best.revenue ? d : best, { date: "—", revenue: 0, orders: 0 }),
  [dailySales]);

  /* Top products */
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; rev: number }>();
    active.forEach(o => {
      if (!Array.isArray(o.items)) return;
      o.items.forEach(item => {
        const name = PRODUCT_NAMES[item.product_id] || item.product_id || "Unknown";
        const cur  = map.get(name) || { name, qty: 0, rev: 0 };
        cur.qty += item.quantity || 1;
        cur.rev += (item.price_at_time || 0) * (item.quantity || 1);
        map.set(name, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [active]);

  /* Payment breakdown */
  const paymentData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const m = PAYMENT_LABEL[o.payment_method] || o.payment_method || "Other";
      map.set(m, (map.get(m) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  /* Status breakdown */
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => { map.set(o.status, (map.get(o.status) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const statusTotal = statusData.reduce((s, i) => s + i.value, 0);

  /* ── Empty ── */
  if (!active.length) return (
    <div className="flex flex-col items-center py-24 gap-4 text-center">
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
        <BarChart3 className="h-16 w-16 text-muted-foreground/20 mx-auto" />
      </motion.div>
      <p className="font-display font-bold text-xl">No analytics yet</p>
      <p className="text-muted-foreground text-sm max-w-xs">Analytics will appear once you have completed orders.</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ══ KPI ROW ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue"  value={`PKR ${Math.round(revenue).toLocaleString()}`}       icon={Banknote}     color="text-primary"      bg="bg-primary/10"      trend="up"   delay={0}    sub={`${active.length} orders`} />
        <KpiCard label="Avg Order Value" value={`PKR ${Math.round(avgOrder).toLocaleString()}`}     icon={ShoppingBag}  color="text-secondary"    bg="bg-secondary/10"    trend="up"   delay={0.07} sub="Per transaction" />
        <KpiCard label="Delivered"       value={`${delivered}`}                                     icon={Package}      color="text-emerald-600"  bg="bg-emerald-500/10"  trend="up"   delay={0.14} sub={`of ${orders.length} total`} />
        <KpiCard label="Peak Day"        value={`PKR ${Math.round(peakDay.revenue).toLocaleString()}`} icon={TrendingUp} color="text-amber-600"    bg="bg-amber-500/10"    trend="up"   delay={0.21} sub={peakDay.date} />
      </div>

      {/* ══ REVENUE CHART — full width ═══════════════════ */}
      <ChartCard
        title="Revenue Over Time"
        subtitle={`Last ${revenueRange} days · ${active.length} active orders`}
        icon={Activity}
        color="bg-primary/10"
      >
        {/* Range toggle */}
        <div className="flex justify-end gap-1.5 mb-4">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRevenueRange(r)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all
                ${revenueRange === r
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
            >
              {r}d
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailySales} margin={{ top: 8, right: 4, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="hsl(var(--secondary))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"
              tickFormatter={v => `PKR ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={70} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2.5}
              fill="url(#gRev)" dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ══ BENTO BOTTOM ROW ═════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* Top products — wide */}
        <div className="md:col-span-5">
          <ChartCard title="Top Products" subtitle="By units sold" icon={Star} color="bg-amber-500/10">
            {topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No product data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                  <Bar dataKey="qty" name="Units sold" radius={[0, 7, 7, 0]} barSize={20}>
                    {topProducts.map((_, i) => <Cell key={i} fill={P[i % P.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Donut — payment */}
        <div className="md:col-span-3">
          <ChartCard title="Payment Methods" subtitle={`${orders.length} orders`} icon={CreditCard} color="bg-primary/10">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={paymentData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={52} outerRadius={74} paddingAngle={4} strokeWidth={0}
                    label={false}
                  >
                    {paymentData.map((_, i) => <Cell key={i} fill={P[i % P.length]} />)}
                    <DonutLabel total={orders.length} />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="w-full space-y-2 mt-2">
                {paymentData.map((item, i) => {
                  const pct = Math.round((item.value / orders.length) * 100);
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 chart-dot" style={{ '--chart-dot-color': P[i % P.length] } as React.CSSProperties} />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{item.name}</span>
                      <span className="text-xs font-bold">{item.value}</span>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Order status — radial progress bars */}
        <div className="md:col-span-4">
          <ChartCard title="Order Status" subtitle={`${statusTotal} total orders`} icon={Users} color="bg-secondary/10">
            <div className="space-y-4">
              {statusData.map((s, i) => {
                const pct = statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0;
                const color = STATUS_COLOR[s.name] || P[i % P.length];
                const label = s.name.charAt(0).toUpperCase() + s.name.slice(1).replace(/-/g, " ");
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 chart-dot" style={{ '--chart-dot-color': color } as React.CSSProperties} />
                        <span className="font-semibold">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold">{s.value}</span>
                        <span className="text-muted-foreground text-[10px] w-6 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                        className="h-full rounded-full chart-bar"
                        style={{ '--chart-bar-color': color } as React.CSSProperties}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini summary */}
            <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-2">
              {[
                { label: "Completion", value: `${statusTotal > 0 ? Math.round(((statusData.find(s => s.name === "delivered")?.value ?? 0) / statusTotal) * 100) : 0}%`, color: "text-emerald-600" },
                { label: "Cancelled",  value: `${statusData.find(s => s.name === "cancelled")?.value ?? 0}`, color: "text-red-500" },
              ].map(m => (
                <div key={m.label} className="bg-muted/40 rounded-xl p-2.5 text-center">
                  <p className={`text-lg font-extrabold leading-none ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{m.label}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  );
};

/* eslint-disable-next-line */
const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export default AnalyticsCharts;