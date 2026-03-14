import { useState, useEffect, useCallback, useMemo } from "react";
import { products as defaultProducts, categories, type Product } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Search, Package, RefreshCw,
  AlertTriangle, CheckCircle2, TrendingDown, BarChart3,
  ShieldCheck, SlidersHorizontal, X, Zap, Star, Tag,
} from "lucide-react";
import { toast } from "sonner";

/* ── Helpers ─────────────────────────────────────────────── */
const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.default) return img.default;
  if (img.src) return img.src;
  return String(img);
};
const PLACEHOLDER = "/placeholder.svg";

const BADGE_META: Record<string, { label: string; style: string }> = {
  bestseller: { label: "⭐ Best Seller", style: "bg-amber-500/20 text-amber-700 border-amber-400/50"  },
  new:        { label: "✨ New",         style: "bg-emerald-500/20 text-emerald-700 border-emerald-400/50" },
  discount:   { label: "🏷️ Discount",   style: "bg-red-500/20 text-red-700 border-red-400/50"       },
};

const emptyProduct: Partial<Product> = {
  name: "", category: "", price: 0, unit: "kg",
  description: "", image: "", inStock: true, stock: 50,
  rating: 4.0, reviewCount: 0,
};

type DbProduct = {
  id: string; name?: string; category?: string; price?: number; unit?: string;
  description?: string; image?: string; badge?: string | null; discount?: number | null;
  in_stock: boolean; stock?: number; rating?: number; review_count?: number;
  created_at: string; updated_at: string;
};

/* ── Animated stat card ─────────────────────────────────── */
const StatCard = ({
  label, value, icon: Icon, color, bg, onClick, active,
}: {
  label: string; value: number; icon: any;
  color: string; bg: string; onClick?: () => void; active?: boolean;
}) => (
  <motion.button
    whileHover={{ y: -3, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`flex-1 flex items-center gap-3 rounded-2xl border p-4 text-left transition-all
      ${active ? `${bg} border-current shadow-lg` : "bg-card border-border/60 hover:border-border shadow-sm hover:shadow-md"}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? "bg-white/25" : bg}`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <motion.p
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-2xl font-extrabold leading-none ${active ? color : "text-foreground"}`}
      >
        {value}
      </motion.p>
      <p className={`text-xs font-semibold mt-0.5 ${active ? color : "text-muted-foreground"}`}>{label}</p>
    </div>
  </motion.button>
);

/* ── Product card ────────────────────────────────────────── */
const ProductCard = ({
  product, onEdit, onDelete, onToggleStock, isSaving,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStock: () => void;
  isSaving: boolean;
}) => {
  const isOut = !product.inStock || (product.stock ?? 0) === 0;
  const isLow = product.inStock && (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
  const stockPct = Math.min(((product.stock ?? 0) / 50) * 100, 100);
  const badge = product.badge ? BADGE_META[product.badge] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-200
        ${isOut
          ? "border-destructive/50 shadow-md shadow-destructive/10"
          : isLow
          ? "border-amber-400/50 shadow-md shadow-amber-500/10"
          : "border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8"}`}
    >
      {/* ── Image area ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <motion.img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full h-full object-cover ${isOut ? "grayscale-[40%] brightness-90" : ""}`}
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />

        {/* Dark hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

        {/* Floating action buttons — appear on hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="w-10 h-10 rounded-full bg-white text-foreground shadow-xl flex items-center justify-center"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="w-10 h-10 rounded-full bg-destructive text-white shadow-xl flex items-center justify-center"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOut && (
            <span className="bg-destructive text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wide">
              Out of Stock
            </span>
          )}
          {isLow && !isOut && (
            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
              Low: {product.stock}
            </span>
          )}
          {badge && !isOut && (
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.style}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Top-right: quick stock toggle */}
        <div className="absolute top-2 right-2">
          <div
            className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-md"
            title={product.inStock ? "Click to mark out of stock" : "Click to mark in stock"}
          >
            <Switch
              checked={product.inStock && (product.stock ?? 0) > 0}
              disabled={isSaving}
              onCheckedChange={onToggleStock}
              aria-label="Toggle stock"
            />
          </div>
        </div>

        {/* Discount ribbon */}
        {product.discount && !isOut && (
          <div className="absolute bottom-0 right-0 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-tl-xl">
            −{product.discount}%
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div className={`p-3.5 ${isOut ? "bg-destructive/5" : isLow ? "bg-amber-500/5" : "bg-card"}`}>
        {/* Category */}
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">
          {categories.find(c => c.id === product.category)?.name || product.category}
        </p>

        {/* Name */}
        <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-2">{product.name}</h3>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="font-extrabold text-primary text-base">
            PKR {product.price.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-[10px]">/{product.unit}</span>
          {product.discount && (
            <span className="text-muted-foreground text-[10px] line-through ml-auto">
              {Math.round(product.price / (1 - product.discount / 100)).toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock health bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className={isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-muted-foreground"}>
              {isOut ? "No stock" : `${product.stock} units`}
            </span>
            <span className="text-muted-foreground">{Math.round(stockPct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stockPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isOut ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
const ProductManagement = () => {
  const [productList,   setProductList]   = useState<Product[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState("all");
  const [stockFilter,   setStockFilter]   = useState<"all"|"in"|"out"|"low">("all");
  const [sortBy,        setSortBy]        = useState<"name"|"price-asc"|"price-desc"|"stock">("name");
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editing,       setEditing]       = useState<Product | null>(null);
  const [form,          setForm]          = useState<Partial<Product>>(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savingId,      setSavingId]      = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const staticMap = new Map(defaultProducts.map(p => [p.id, p]));
      const { data: rows, error } = await supabase
        .from("products").select("*").order("created_at", { ascending: true }) as { data: DbProduct[] | null; error: any };

      if (!error && rows && rows.length > 0) {
        const dbIds  = new Set(rows.map(r => r.id));
        const fromDb = rows.map(r => {
          const s = staticMap.get(r.id);
          return {
            id: r.id, name: r.name ?? s?.name ?? "Unknown",
            category: r.category ?? s?.category ?? "other",
            price: r.price ?? s?.price ?? 0, unit: r.unit ?? s?.unit ?? "piece",
            description: r.description ?? s?.description ?? "",
            image: s ? getImageUrl(s.image) : (r.image ?? ""),
            badge: (r.badge ?? s?.badge) as any, discount: r.discount ?? s?.discount,
            inStock: r.in_stock, stock: r.stock ?? 0,
            rating: r.rating ?? s?.rating ?? 4.0,
            reviewCount: r.review_count ?? s?.reviewCount ?? 0,
          } as Product;
        });
        const extra = defaultProducts.filter(p => !dbIds.has(p.id))
          .map(p => ({ ...p, image: getImageUrl(p.image), stock: p.stock ?? 0 }));
        setProductList([...fromDb, ...extra]);
      } else {
        const seed = defaultProducts.map(p => ({
          id: p.id, name: p.name, category: p.category, price: p.price,
          unit: p.unit, description: p.description, image: getImageUrl(p.image),
          badge: p.badge || null, discount: p.discount || null,
          in_stock: p.inStock, stock: p.stock || 50, rating: p.rating || 4.0, review_count: p.reviewCount || 0,
        }));
        await supabase.from("products").insert(seed);
        setProductList(defaultProducts.map(p => ({ ...p, image: getImageUrl(p.image), stock: p.stock ?? 0 })));
      }
    } catch {
      setProductList(defaultProducts.map(p => ({ ...p, image: getImageUrl(p.image), stock: p.stock ?? 0 })));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchProducts();
    const ch = supabase.channel("pm2:products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, payload => {
        const u = payload.new as DbProduct;
        setProductList(prev => prev.map(p =>
          p.id === u.id ? { ...p, inStock: u.in_stock, stock: u.in_stock ? (u.stock ?? 0) : 0 } : p
        ));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchProducts]);

  /* ── Derived stats ── */
  const stats = useMemo(() => ({
    total:  productList.length,
    inStock: productList.filter(p => p.inStock && (p.stock ?? 0) > 0).length,
    outOfStock: productList.filter(p => !p.inStock || (p.stock ?? 0) === 0).length,
    lowStock: productList.filter(p => p.inStock && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length,
  }), [productList]);

  /* ── Filtered + sorted ── */
  const filtered = useMemo(() => {
    return productList
      .filter(p => {
        const isOut = !p.inStock || (p.stock ?? 0) === 0;
        const isLow = p.inStock && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;
        return (
          p.name.toLowerCase().includes(search.toLowerCase()) &&
          (catFilter === "all" || p.category === catFilter) &&
          (stockFilter === "all"
            || (stockFilter === "out" && isOut)
            || (stockFilter === "in"  && !isOut)
            || (stockFilter === "low" && isLow))
        );
      })
      .sort((a, b) => {
        /* Out-of-stock always first */
        const aOut = !a.inStock || (a.stock ?? 0) === 0;
        const bOut = !b.inStock || (b.stock ?? 0) === 0;
        if (aOut && !bOut) return -1;
        if (!aOut && bOut) return  1;
        /* Then apply sort */
        if (sortBy === "price-asc")  return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "stock")      return (a.stock ?? 0) - (b.stock ?? 0);
        return a.name.localeCompare(b.name);
      });
  }, [productList, search, catFilter, stockFilter, sortBy]);

  /* ── Quick stock toggle ── */
  const quickToggle = async (product: Product) => {
    const newIn    = !product.inStock;
    const newStock = newIn ? Math.max(product.stock ?? 1, 1) : 0;
    setSavingId(product.id);
    setProductList(prev => prev.map(p => p.id === product.id ? { ...p, inStock: newIn, stock: newStock } : p));
    const { error } = await supabase.from("products")
      .update({ in_stock: newIn, stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", product.id);
    setSavingId(null);
    if (error) { toast.error("Failed"); fetchProducts(); }
    else toast.success(newIn ? `✅ "${product.name}" back in stock` : `📦 "${product.name}" marked out of stock`);
  };

  /* ── Dialog ── */
  const openAdd  = () => { setEditing(null); setForm({ ...emptyProduct, id: `prod-${Date.now()}` }); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ ...p }); setDialogOpen(true); };
  const updateField = (k: keyof Partial<Product>, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    if (!form.category)     { toast.error("Category required"); return; }
    if (!form.price || form.price <= 0) { toast.error("Price must be > 0"); return; }
    if (!form.inStock) form.stock = 0;
    try {
      if (editing) {
        const { error } = await supabase.from("products").update({
          name: form.name, category: form.category, price: form.price!, unit: form.unit || "kg",
          description: form.description || "", image: form.image || "",
          badge: form.badge || null, discount: form.discount || null,
          stock: form.stock || 0, in_stock: form.inStock ?? true,
          rating: form.rating || 4.0, review_count: form.reviewCount || 0,
          updated_at: new Date().toISOString(),
        }).eq("id", editing.id);
        if (error) throw error;
        setProductList(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } as Product : p));
        toast.success(`"${form.name}" updated ✓`);
      } else {
        const id = form.id as string;
        const { error } = await supabase.from("products").insert({
          id, name: form.name!, category: form.category!, price: form.price!,
          unit: form.unit || "kg", description: form.description || "",
          image: form.image || "", badge: form.badge || null, discount: form.discount || null,
          in_stock: form.inStock ?? true, stock: form.stock || 50,
          rating: form.rating || 4.0, review_count: form.reviewCount || 0,
        });
        if (error) throw error;
        setProductList(prev => [{ ...form, id } as Product, ...prev]);
        toast.success(`"${form.name}" added ✓`);
      }
      setDialogOpen(false); setForm(emptyProduct);
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const handleDelete = async (id: string) => {
    const name = productList.find(p => p.id === id)?.name;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setProductList(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
    toast.success(`"${name}" deleted`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Package className="h-10 w-10 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium">Loading products…</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* ══ STAT CARDS ══════════════════════════════════════ */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label="Total Products"  value={stats.total}      icon={Package}      color="text-primary"      bg="bg-primary/10"      onClick={() => setStockFilter("all")} active={stockFilter === "all"} />
        <StatCard label="In Stock"        value={stats.inStock}    icon={CheckCircle2} color="text-emerald-600"  bg="bg-emerald-500/10"  onClick={() => setStockFilter("in")}  active={stockFilter === "in"} />
        <StatCard label="Out of Stock"    value={stats.outOfStock} icon={TrendingDown}  color="text-destructive"  bg="bg-destructive/10"  onClick={() => setStockFilter("out")} active={stockFilter === "out"} />
        <StatCard label="Low Stock"       value={stats.lowStock}   icon={AlertTriangle} color="text-amber-600"   bg="bg-amber-500/10"    onClick={() => setStockFilter("low")} active={stockFilter === "low"} />
      </div>

      {/* ══ CATEGORY PILLS ══════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{ id: "all", name: "All" }, ...categories].map(c => {
          const count = c.id === "all" ? productList.length : productList.filter(p => p.category === c.id).length;
          const active = catFilter === c.id;
          return (
            <motion.button
              key={c.id}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => setCatFilter(c.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0
                ${active
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                  : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary"}`}
            >
              {c.name}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${active ? "bg-white/25" : "bg-muted"}`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ══ CONTROLS BAR ════════════════════════════════════ */}
      <div className="flex gap-3 items-center flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border/60"
          />
          <AnimatePresence>
            {search && (
              <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-40 h-10 rounded-xl border-border/60 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A→Z</SelectItem>
            <SelectItem value="price-asc">Price Low→High</SelectItem>
            <SelectItem value="price-desc">Price High→Low</SelectItem>
            <SelectItem value="stock">Stock Level</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground font-medium hidden sm:block">
          <span className="font-extrabold text-foreground">{filtered.length}</span> of {productList.length}
        </p>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={fetchProducts} className="rounded-xl h-10 gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={openAdd} className="rounded-xl h-10 gap-1.5 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Active filter chip */}
      <AnimatePresence>
        {stockFilter !== "all" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <button
              onClick={() => setStockFilter("all")}
              className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border
                ${stockFilter === "out" ? "bg-destructive/10 text-destructive border-destructive/30"
                  : stockFilter === "low" ? "bg-amber-500/10 text-amber-700 border-amber-400/30"
                  : "bg-emerald-500/10 text-emerald-700 border-emerald-400/30"}`}
            >
              {stockFilter === "out" ? "🔴 Showing: Out of stock" : stockFilter === "low" ? "🟡 Showing: Low stock" : "🟢 Showing: In stock"}
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ PRODUCT GRID ════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
            <Package className="h-16 w-16 text-muted-foreground/20 mx-auto" />
          </motion.div>
          <p className="font-display font-bold text-xl">No products found</p>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filter.</p>
          {(search || catFilter !== "all" || stockFilter !== "all") && (
            <Button variant="outline" onClick={() => { setSearch(""); setCatFilter("all"); setStockFilter("all"); }} className="rounded-full gap-2">
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
        >
          <AnimatePresence initial={false}>
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => openEdit(product)}
                onDelete={() => setDeleteConfirm(product.id)}
                onToggleStock={() => quickToggle(product)}
                isSaving={savingId === product.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ══ ADD / EDIT DIALOG ══════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-extrabold text-xl flex items-center gap-2">
              {editing ? <><Pencil className="h-5 w-5 text-primary" /> Edit Product</> : <><Plus className="h-5 w-5 text-primary" /> Add Product</>}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editing ? `Editing "${editing.name}"` : "Fill in the details to add a new product to your catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image preview */}
            {form.image && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/40">
                <img src={form.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-md"
                  onError={e => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <p className="text-xs font-bold text-muted-foreground">Image Preview</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 break-all line-clamp-2">{form.image}</p>
                </div>
              </motion.div>
            )}

            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Product Name *</Label>
              <Input value={form.name || ""} onChange={e => updateField("name", e.target.value)}
                placeholder="e.g. Fresh Red Apples" className="h-10 rounded-xl border-border/60" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Category *</Label>
                <Select value={form.category || ""} onValueChange={v => updateField("category", v)}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Unit</Label>
                <Select value={form.unit || "kg"} onValueChange={v => updateField("unit", v)}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kg","g","liter","ml","piece","pack","bottle","dozen","box","bundle","roll","tube","can"].map(u =>
                      <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Price (PKR) *</Label>
                <Input type="number" min="0.01" step="0.01" value={form.price || ""}
                  onChange={e => updateField("price", parseFloat(e.target.value) || 0)}
                  className="h-10 rounded-xl border-border/60" />
              </div>
              <div>
                <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Discount %</Label>
                <Input type="number" min="0" max="100" value={form.discount || ""}
                  onChange={e => updateField("discount", parseFloat(e.target.value) || undefined)}
                  placeholder="0" className="h-10 rounded-xl border-border/60" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Stock Qty</Label>
                <Input type="number" min="0" value={form.stock ?? ""}
                  onChange={e => updateField("stock", parseInt(e.target.value) || 0)}
                  className="h-10 rounded-xl border-border/60" />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between bg-muted/40 rounded-xl border border-border/50 px-3 h-10">
                  <Label htmlFor="dlgInStock" className="text-sm font-semibold cursor-pointer">In Stock</Label>
                  <Switch id="dlgInStock" checked={form.inStock ?? true} onCheckedChange={v => updateField("inStock", v)} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Image URL</Label>
              <Input value={form.image || ""} onChange={e => updateField("image", e.target.value)}
                placeholder="https://images.unsplash.com/…" className="h-10 rounded-xl border-border/60" />
            </div>

            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Description</Label>
              <Input value={form.description || ""} onChange={e => updateField("description", e.target.value)}
                placeholder="Short product description" className="h-10 rounded-xl border-border/60" />
            </div>

            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Badge</Label>
              <Select value={form.badge || "none"} onValueChange={v => updateField("badge", v === "none" ? undefined : v as any)}>
                <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bestseller">⭐ Bestseller</SelectItem>
                  <SelectItem value="new">✨ New Arrival</SelectItem>
                  <SelectItem value="discount">🏷️ On Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyProduct); }} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl gap-1.5 shadow-md shadow-primary/20">
              <Zap className="h-4 w-4" />
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DELETE CONFIRM ══════════════════════════════════ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-extrabold flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" /> Delete Product?
            </DialogTitle>
            <DialogDescription>
              <span className="font-bold text-foreground">"{productList.find(p => p.id === deleteConfirm)?.name}"</span>{" "}
              will be permanently removed from your catalog. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">Keep it</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-xl gap-1.5">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProductManagement;