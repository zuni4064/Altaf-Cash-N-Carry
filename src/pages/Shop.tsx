import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, SlidersHorizontal, LayoutGrid, List,
  X, ChevronDown, ShoppingBag, Sparkles, TrendingUp, Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";

/* ── Sort options ───────────────────────────────────────── */
type SortKey = "default" | "low" | "high" | "name";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Featured"       },
  { value: "low",     label: "Price: Low → High" },
  { value: "high",    label: "Price: High → Low" },
  { value: "name",    label: "Name A → Z"      },
];

/* ── Stagger container ──────────────────────────────────── */
const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
};

/* ── Empty state ────────────────────────────────────────── */
const EmptyState = ({ query }: { query: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    className="col-span-full flex flex-col items-center justify-center py-28 gap-5 text-center"
  >
    <motion.div
      animate={{ rotate: [0, -10, 10, -10, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
      className="text-6xl"
    >
      🛒
    </motion.div>
    <div>
      <p className="text-xl font-display font-bold mb-1">No products found</p>
      <p className="text-muted-foreground text-sm max-w-xs">
        {query
          ? `No results for "${query}". Try a different search term.`
          : "Nothing matches your current filters. Try clearing some."}
      </p>
    </div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState<SortKey>("default");
  const [viewMode,    setViewMode]    = useState<"grid" | "list">("grid");
  const [showSort,    setShowSort]    = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const { products, categories } = useCart();
  const activeCategory = searchParams.get("category") || "all";
  const activeSubCategory = searchParams.get("subCategory") || "all";

  const filtered = useMemo(() => {
    let list = activeCategory === "all"
      ? products
      : products.filter(p => p.category === activeCategory);
    
    // Filter by subcategory if one is selected (case-insensitive)
    if (activeSubCategory !== "all") {
      list = list.filter(p => p.subCategory?.trim().toLowerCase() === activeSubCategory.trim().toLowerCase());
    }

    if (search)
      list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "low")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeCategory, activeSubCategory, search, sortBy, products]);

  // Derived subcategories for the currently selected main category
  const availableSubCategories = useMemo(() => {
    if (activeCategory === "all") return [];
    const prodsInCategory = products.filter(p => p.category === activeCategory);
    // Normalize to title case to avoid duplicate pills for same sub-category with different capitalization
    const subsMap = new Map<string, string>(); // key = lowercase, value = display string
    prodsInCategory.forEach(p => {
      if (p.subCategory && p.subCategory.trim() !== "") {
        const key = p.subCategory.trim().toLowerCase();
        if (!subsMap.has(key)) subsMap.set(key, p.subCategory.trim());
      }
    });
    return Array.from(subsMap.values()).sort();
  }, [activeCategory, products]);

  const setCategory = (id: string) => {
    if (id === "all") searchParams.delete("category");
    else searchParams.set("category", id);
    // When changing main category, reset the subcategory
    searchParams.delete("subCategory");
    setSearchParams(searchParams);
  };

  const setSubCategory = (sub: string) => {
    if (sub === "all") searchParams.delete("subCategory");
    else searchParams.set("subCategory", sub);
    setSearchParams(searchParams);
  };

  const clearAll = () => {
    setSearch("");
    setSortBy("default");
    searchParams.delete("category");
    searchParams.delete("subCategory");
    setSearchParams(searchParams);
  };

  const hasFilters = search || sortBy !== "default" || activeCategory !== "all" || activeSubCategory !== "all";

  /* Quick-stat counts */
  const inStockCount  = filtered.filter(p => p.inStock).length;
  const discountCount = filtered.filter(p => p.badge === "discount").length;

  return (
    <PageTransition>
      <Helmet>
        <title>Shop | Altaf Cash and Carry</title>
        <meta name="description" content="Browse our extensive collection of groceries, fresh produce, and household items." />
      </Helmet>

      {/* ── HERO BANNER ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary/5 border-b border-border/40">
        {/* Decorative blobs */}
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/8 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-10 left-10 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        />

        <div className="container py-10 md:py-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 180 }}
                className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase mb-3"
              >
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary inline-block"
                />
                Altaf Cash &amp; Carry
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
                className="text-4xl md:text-5xl font-display font-extrabold tracking-tight"
              >
                Our <span className="text-primary">Store</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground mt-2 text-sm max-w-md"
              >
                {products.length}+ products · fresh arrivals weekly · best prices guaranteed
              </motion.p>
            </div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="flex gap-3"
            >
              {[
                { icon: ShoppingBag,  value: products.length, label: "Products",    color: "bg-primary/10 text-primary"    },
                { icon: Sparkles,     value: inStockCount,    label: "In Stock",    color: "bg-success/10 text-success"    },
                { icon: Tag,          value: discountCount,   label: "On Sale",     color: "bg-destructive/10 text-destructive" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.08, type: "spring" }}
                  className={`${s.color} rounded-xl px-3 py-2 text-center min-w-[70px]`}
                >
                  <div className="text-lg font-extrabold leading-none">{s.value}</div>
                  <div className="text-[10px] font-semibold mt-0.5 opacity-80">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* ── SEARCH + CONTROLS BAR ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-border/60 focus:border-primary transition-colors h-10"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowSort(v => !v)}
              className="rounded-xl gap-2 h-10 min-w-[150px] justify-between border-border/60"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              </span>
              <motion.div animate={{ rotate: showSort ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </motion.div>
            </Button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-30 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[175px]"
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 transition-colors flex items-center justify-between
                        ${sortBy === opt.value ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}
                    >
                      {opt.label}
                      {sortBy === opt.value && (
                        <motion.span layoutId="sort-check" className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid / List toggle */}
          <div className="flex border border-border/60 rounded-xl overflow-hidden h-10">
            {(["grid", "list"] as const).map(mode => (
              <motion.button
                key={mode}
                onClick={() => setViewMode(mode)}
                whileTap={{ scale: 0.9 }}
                aria-label={mode === "grid" ? "Grid view" : "List view"}
                className={`flex-1 px-3 flex items-center justify-center transition-colors
                  ${viewMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {mode === "grid"
                  ? <LayoutGrid className="h-4 w-4" />
                  : <List       className="h-4 w-4" />}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── CATEGORY PILLS ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {[{ id: "all", name: "All Products" }, ...categories].map((c, i) => {
            const active = activeCategory === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 * i, type: "spring", stiffness: 200 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
              >
                <button
                  onClick={() => setCategory(c.id)}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200
                    ${active
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                      : "bg-card text-foreground border-border/60 hover:border-primary/50 hover:text-primary"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    />
                  )}
                  {c.name}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── SUBCATEGORY PILLS ────────────────────────────────── */}
        <AnimatePresence>
          {availableSubCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap gap-2 mb-6 pl-2 border-l-2 border-primary/20"
            >
              {["all", ...availableSubCategories].map((sub, i) => {
                const active = activeSubCategory === sub;
                const label = sub === "all" ? "All " + (categories.find(c => c.id === activeCategory)?.name || "") : sub;
                return (
                  <motion.div
                    key={sub}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i, type: "spring", stiffness: 250 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => setSubCategory(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200
                        ${active
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {label}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RESULTS BAR ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <motion.p
            key={filtered.length}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-muted-foreground"
          >
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> products
            {activeCategory !== "all" && (
              <> in <span className="font-semibold text-primary">
                {categories.find(c => c.id === activeCategory)?.name}
              </span></>
            )}
          </motion.p>

          <AnimatePresence>
            {hasFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
              >
                <X className="h-3 w-3" /> Clear all filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── ACTIVE FILTER CHIPS ─────────────────────────────── */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-5 overflow-hidden"
            >
              {search && (
                <Badge variant="secondary" className="gap-1.5 pr-1.5 pl-3 py-1 rounded-full">
                  Search: "{search}"
                  <button aria-label="Clear search filter" onClick={() => setSearch("")} className="hover:text-destructive ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {sortBy !== "default" && (
                <Badge variant="secondary" className="gap-1.5 pr-1.5 pl-3 py-1 rounded-full">
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  <button aria-label="Clear sort filter" onClick={() => setSortBy("default")} className="hover:text-destructive ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeCategory !== "all" && (
                <Badge variant="secondary" className="gap-1.5 pr-1.5 pl-3 py-1 rounded-full">
                  {categories.find(c => c.id === activeCategory)?.name}
                  {activeSubCategory !== "all" ? ` : ${activeSubCategory}` : ""}
                  <button aria-label="Clear category filter" onClick={() => setCategory("all")} className="hover:text-destructive ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PRODUCT GRID ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <EmptyState key="empty" query={search} />
          ) : (
            <motion.div
              key={`${activeCategory}-${sortBy}-${viewMode}`}
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "flex flex-col gap-3"
              }
            >
              {filtered.map(p => (
                <motion.div key={p.id} variants={cardVariants}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BOTTOM PROMO STRIP ──────────────────────────────── */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 rounded-2xl bg-primary/5 border border-primary/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 3 }}
                className="text-2xl"
              >
                🎯
              </motion.span>
              <div>
                <p className="font-bold text-sm">Can't find what you need?</p>
                <p className="text-muted-foreground text-xs">Contact us — we'll source it for you.</p>
              </div>
            </div>
            <a
              href="/contact"
              className="text-primary font-semibold text-sm border border-primary/30 rounded-full px-5 py-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-1.5 flex-shrink-0"
            >
              <TrendingUp className="h-4 w-4" /> Contact Us
            </a>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default Shop;