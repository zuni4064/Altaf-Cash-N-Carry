import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { products as defaultProducts, categories as staticCategories, type Product, type ProductVariant } from "@/data/products";
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
  AlertTriangle, CheckCircle2, TrendingDown,
  SlidersHorizontal, X, Zap, FolderPlus, Loader2, ImageIcon, GripVertical
} from "lucide-react";
import { toast } from "sonner";

/* ── Constants ───────────────────────────────────────────── */
const PRESET_UNITS = ["kg", "g", "liter", "ml", "piece", "pack", "bottle", "dozen", "box", "bundle", "roll", "tube", "can"];

/* ── Helpers ─────────────────────────────────────────────── */
const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.default) return img.default;
  if (img.src) return img.src;
  return String(img);
};
const PLACEHOLDER = "/placeholder.svg";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const BADGE_META: Record<string, { label: string; style: string }> = {
  bestseller: { label: "⭐ Best Seller", style: "bg-amber-500/20 text-amber-700 border-amber-400/50" },
  new:        { label: "✨ New",         style: "bg-emerald-500/20 text-emerald-700 border-emerald-400/50" },
  discount:   { label: "🏷️ Discount",   style: "bg-red-500/20 text-red-700 border-red-400/50" },
};

const emptyProduct: Partial<Product> = {
  name: "", category: "", subCategory: "", price: 0, unit: "kg",
  description: "", image: "", inStock: true, stock: 50,
  rating: 4.0, reviewCount: 0,
};

type DbProduct = {
  id: string; name?: string; category?: string; sub_category?: string; price?: number; unit?: string;
  description?: string; image?: string; badge?: string | null; discount?: number | null;
  in_stock: boolean; stock?: number; rating?: number; review_count?: number;
  created_at: string; updated_at: string;
};

type Category = { id: string; name: string; image?: string };

/* ── Fetch & merge products ── */
const fetchAndMergeProducts = async (): Promise<Product[]> => {
  const staticMap = new Map(defaultProducts.map(p => [p.id, p]));
  const { data: rows, error } = await supabase
    .from("products").select("*").order("created_at", { ascending: true }) as { data: DbProduct[] | null; error: any };

  const { data: variantRows } = await supabase
    .from("product_variants").select("*").order("sort_order", { ascending: true });

  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const v of (variantRows ?? [])) {
    if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
    variantsByProduct.get(v.product_id)!.push({
      id: v.id, product_id: v.product_id, label: v.label, price: v.price,
      stock: v.stock, is_default: v.is_default, sort_order: v.sort_order
    });
  }

  if (!error && rows && rows.length > 0) {
    const dbIds  = new Set(rows.map(r => r.id));
    const fromDb = rows.map(r => {
      const s = staticMap.get(r.id);
      return {
        id: r.id, name: r.name ?? s?.name ?? "Unknown",
        category: r.category ?? s?.category ?? "other",
        subCategory: r.sub_category ?? s?.subCategory ?? "",
        price: r.price ?? s?.price ?? 0, unit: r.unit ?? s?.unit ?? "piece",
        description: r.description ?? s?.description ?? "",
        image: s ? getImageUrl(s.image) : (r.image ?? ""),
        badge: (r.badge ?? s?.badge) as any, discount: r.discount ?? s?.discount,
        inStock: r.in_stock, stock: r.stock ?? 0,
        rating: r.rating ?? s?.rating ?? 4.0,
        reviewCount: r.review_count ?? s?.reviewCount ?? 0,
        variants: variantsByProduct.get(r.id) ?? undefined,
      } as Product;
    });
    const extra = defaultProducts.filter(p => !dbIds.has(p.id))
      .map(p => ({ ...p, image: getImageUrl(p.image), stock: p.stock ?? 0 }));
    return [...fromDb, ...extra];
  }

  const seed = defaultProducts.map(p => ({
    id: p.id, name: p.name, category: p.category, sub_category: p.subCategory, price: p.price,
    unit: p.unit, description: p.description, image: getImageUrl(p.image),
    badge: p.badge || null, discount: p.discount || null,
    in_stock: p.inStock, stock: p.stock || 50,
    rating: p.rating || 4.0, review_count: p.reviewCount || 0,
  }));
  await supabase.from("products").insert(seed);
  return defaultProducts.map(p => ({ ...p, image: getImageUrl(p.image), stock: p.stock ?? 0 }));
};

/* ── Stat card — no entrance animation replay ───────────── */
let statsMounted = false;
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
    className={`flex-1 flex items-center gap-2.5 md:gap-3 rounded-2xl border p-3 md:p-4 text-left transition-all min-w-0
      ${active ? `${bg} border-current shadow-lg` : "bg-card border-border/60 hover:border-border shadow-sm hover:shadow-md"}`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? "bg-white/25" : bg}`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="min-w-0">
      <p className={`text-xl md:text-2xl font-extrabold leading-none ${active ? color : "text-foreground"}`}>
        {value}
      </p>
      <p className={`text-[10px] font-semibold mt-0.5 leading-tight ${active ? color : "text-muted-foreground"}`}>{label}</p>
    </div>
  </motion.button>
);

/* ── Product card ────────────────────────────────────────── */
const ProductCard = ({
  product, allCategories, onEdit, onDelete, onToggleStock, isSaving,
}: {
  product: Product; allCategories: Category[];
  onEdit: () => void; onDelete: () => void;
  onToggleStock: () => void; isSaving: boolean;
}) => {
  const hasVariants = (product.variants?.length ?? 0) > 0;
  
  // A product is entirely out of stock if:
  // - The master inStock flag is false (admin manually disabled), OR
  // - For variant products: all variants have 0 stock.
  // The master inStock flag acts as a global on/off override for ALL products.
  const isOut = !product.inStock || (hasVariants && !product.variants!.some(v => v.stock > 0));
  
  // A product has a PARTIAL stockout if it IS NOT completely out, but AT LEAST ONE variant is out
  const isPartialOut = hasVariants && !isOut && product.variants!.some(v => v.stock === 0);
  
  const totalStock = hasVariants
    ? product.variants!.reduce((sum, v) => sum + v.stock, 0)
    : (product.stock ?? 0);

  // A product is entirely low stock if total stock <= 5 (and not 0)
  const isLow = (!isOut && totalStock > 0 && totalStock <= 5);
  
  // A product has a PARTIAL low stock if it's not entirely low, but AT LEAST ONE variant is low (and not 0)
  const isPartialLow = hasVariants && !isLow && !isOut && !isPartialOut && product.variants!.some(v => v.stock > 0 && v.stock <= 5);

  const stockPct = Math.min((totalStock / 50) * 100, 100);
  const badge = product.badge ? BADGE_META[product.badge] : null;

  const displayPrice = hasVariants
    ? Math.min(...product.variants!.map(v => v.price))
    : product.price;

  return (
    <div
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-200
        ${isOut
          ? "border-destructive/50 shadow-md shadow-destructive/10"
          : isLow
          ? "border-amber-400/50 shadow-md shadow-amber-500/10"
          : "border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8"}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <motion.img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full h-full object-cover ${isOut ? "grayscale-[40%] brightness-90" : ""}`}
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

        {/* Hover action buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onEdit}
            className="w-10 h-10 rounded-full bg-white text-foreground shadow-xl flex items-center justify-center" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onDelete}
            className="w-10 h-10 rounded-full bg-destructive text-white shadow-xl flex items-center justify-center" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOut && (
            <span className="bg-destructive text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wide">
              Out of Stock
            </span>
          )}
          {isPartialOut && (
            <span className="bg-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wide">
              Partial Stockout
            </span>
          )}
          {isLow && !isOut && (
            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
              Low: {totalStock}
            </span>
          )}
          {isPartialLow && !isPartialOut && (
            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wide">
              Partial Low Stock
            </span>
          )}
          {badge && !isOut && (
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.style}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Stock toggle */}
        <div className="absolute top-2 right-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-md">
            <Switch
              checked={product.inStock}
              disabled={isSaving}
              onCheckedChange={onToggleStock}
              aria-label="Toggle stock"
            />
          </div>
        </div>

        {/* Discount ribbon */}
        {product.discount && !isOut && !hasVariants && (
          <div className="absolute bottom-0 right-0 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-tl-xl">
            −{product.discount}%
          </div>
        )}
      </div>

      <div className={`p-3 md:p-3.5 ${isOut ? "bg-destructive/5" : isLow ? "bg-amber-500/5" : "bg-card"}`}>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5 truncate">
          {allCategories.find(c => c.id === product.category)?.name || product.category}
        </p>
        <h3 className="font-bold text-xs md:text-sm leading-snug line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-baseline gap-1 mb-2.5">
          <span className="font-extrabold text-primary text-sm md:text-base">
            {hasVariants && "from "}PKR {displayPrice.toLocaleString()}
          </span>
          {!hasVariants && <span className="text-muted-foreground text-[10px]">/{product.unit}</span>}
          {product.discount && !hasVariants && (
            <span className="text-muted-foreground text-[10px] line-through ml-auto">
              {Math.round(product.price / (1 - product.discount / 100)).toLocaleString()}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className={isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-muted-foreground"}>
              {hasVariants ? `${product.variants!.length} sizes - ` : ""}
              {isOut ? "No stock" : `${totalStock} units`}
            </span>
            <span className="text-muted-foreground">{Math.round(stockPct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stockPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${isOut ? "bg-destructive" : isPartialOut ? "bg-orange-500" : isLow || isPartialLow ? "bg-amber-500" : "bg-emerald-500"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
const ProductManagement = () => {
  const queryClient = useQueryClient();

  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState("all");
  const [stockFilter,   setStockFilter]   = useState<"all"|"in"|"out"|"low">("all");
  const [sortBy,        setSortBy]        = useState<"name"|"price-asc"|"price-desc"|"stock">("name");
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editing,       setEditing]       = useState<Product | null>(null);
  const [form,          setForm]          = useState<Partial<Product>>(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [showNewCat,  setShowNewCat]  = useState(false);
  const [newCatName,  setNewCatName]  = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const [showCustomUnit, setShowCustomUnit] = useState(false);
  
  /* Variant Form State */
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  /* ── Mark mounted so stat cards skip entrance on re-show ── */
  useEffect(() => { statsMounted = true; }, []);

  /* ══ QUERIES ════════════════════════════════════════════ */
  const { data: productList = [], isLoading: loading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchAndMergeProducts,
    staleTime: 2 * 60 * 1000,
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories").select("id, name, image")
        .order("created_at", { ascending: true });
      if (error) return [];
      return (data || []) as Category[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const allCategories = useMemo((): Category[] => {
    const staticIds = new Set(staticCategories.map(c => c.id));
    const dbOnly = dbCategories.filter(c => !staticIds.has(c.id));
    return [...(staticCategories as Category[]), ...dbOnly];
  }, [dbCategories]);

  /* ── Realtime patch ── */
  useEffect(() => {
    const ch = supabase.channel("pm:products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, payload => {
        const u = payload.new as DbProduct;
        queryClient.setQueryData<Product[]>(["products"], old =>
          (old || []).map(p =>
            p.id === u.id ? { ...p, inStock: u.in_stock, stock: u.in_stock ? (u.stock ?? 0) : 0 } : p
          )
        );
        queryClient.setQueryData<any[]>(["admin-products-raw"], old =>
          (old || []).map(p =>
            p.id === u.id ? { ...p, in_stock: u.in_stock, stock: u.in_stock ? (u.stock ?? 0) : 0 } : p
          )
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  /* ══ MUTATIONS ══════════════════════════════════════════ */
  const toggleMutation = useMutation({
    mutationFn: async ({ id, newIn, newStock }: { id: string; newIn: boolean; newStock: number }) => {
      const { error } = await supabase.from("products")
        .update({ in_stock: newIn, stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return { id, newIn, newStock };
    },
    onMutate: async ({ id, newIn, newStock }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const prev = queryClient.getQueryData<Product[]>(["products"]);
      queryClient.setQueryData<Product[]>(["products"], old =>
        (old || []).map(p => p.id === id ? { ...p, inStock: newIn, stock: newStock } : p)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["products"], ctx.prev);
      toast.error("Failed to update stock");
    },
    onSuccess: ({ newIn, id }) => {
      const name = queryClient.getQueryData<Product[]>(["products"])?.find(p => p.id === id)?.name ?? "";
      toast.success(newIn ? `✅ "${name}" back in stock` : `📦 "${name}" marked out of stock`);
    },
  });

  const quickToggle = (product: Product) => {
    const newIn = !product.inStock;
    const hasProductVariants = (product.variants?.length ?? 0) > 0;
    // For variant products: only flip the master in_stock flag; leave variant stocks intact.
    // For regular products: also zero-out / restore the stock number.
    const newStock = hasProductVariants
      ? (product.stock ?? 0)          // variant products – don't change stock value
      : newIn ? Math.max(product.stock ?? 1, 1) : 0;
    toggleMutation.mutate({ id: product.id, newIn, newStock });
  };

  const addMutation = useMutation({
    mutationFn: async (data: Partial<Product> & { id: string }) => {
      const { error } = await supabase.from("products").insert({
        id: data.id, name: data.name!, category: data.category!, sub_category: data.subCategory || null,
        price: hasVariants ? 0 : data.price!,
        unit: data.unit || "kg", description: data.description || "",
        image: data.image || "", badge: data.badge || null, 
        discount: hasVariants ? null : (data.discount || null),
        in_stock: data.inStock ?? true, 
        stock: hasVariants ? 0 : (data.stock || 50),
        rating: data.rating || 4.0, review_count: data.reviewCount || 0,
      });
      if (error) throw error;
      
      if (hasVariants && formVariants.length > 0) {
        const variantsToInsert = formVariants.map(v => ({
          product_id: data.id,
          label: v.label,
          price: v.price,
          stock: v.stock,
          is_default: v.is_default,
          sort_order: v.sort_order
        }));
        const { error: variantError } = await supabase.from("product_variants").insert(variantsToInsert);
        if (variantError) throw variantError;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products-raw"] });
      toast.success(`"${data.name}" added ✓`);
      setDialogOpen(false); resetDialogExtras(); setForm(emptyProduct);
    },
    onError: (err: any) => toast.error(err.message || "Failed to add product"),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const { error } = await supabase.from("products").update({
        name: data.name, category: data.category, sub_category: data.subCategory || null,
        price: hasVariants ? 0 : data.price!,
        unit: data.unit || "kg", description: data.description || "",
        image: data.image || "", badge: data.badge || null, 
        discount: hasVariants ? null : (data.discount || null),
        stock: hasVariants ? 0 : (data.stock || 0), 
        in_stock: data.inStock ?? true,
        rating: data.rating || 4.0, review_count: data.reviewCount || 0,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
      
      if (hasVariants) {
        // Delete existing variants
        await supabase.from("product_variants").delete().eq("product_id", id);
        // Insert new variants
        if (formVariants.length > 0) {
          const variantsToInsert = formVariants.map(v => ({
            product_id: id,
            label: v.label,
            price: v.price,
            stock: v.stock,
            is_default: v.is_default,
            sort_order: v.sort_order
          }));
          const { error: variantError } = await supabase.from("product_variants").insert(variantsToInsert);
          if (variantError) throw variantError;
        }
      } else {
        // If switched to no variants, delete any existing ones
        await supabase.from("product_variants").delete().eq("product_id", id);
      }
      
      return { id, data };
    },
    onSuccess: ({ id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products-raw"] });
      toast.success(`"${data.name}" updated ✓`);
      setDialogOpen(false); resetDialogExtras(); setForm(emptyProduct);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      const name = queryClient.getQueryData<Product[]>(["products"])?.find(p => p.id === id)?.name;
      queryClient.setQueryData<Product[]>(["products"], old => (old || []).filter(p => p.id !== id));
      queryClient.invalidateQueries({ queryKey: ["admin-products-raw"] });
      setDeleteConfirm(null);
      toast.success(`"${name}" deleted`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addCategoryMutation = useMutation({
    mutationFn: async ({ id, name, image }: { id: string; name: string; image: string }) => {
      const { error } = await supabase.from("categories").insert({ id, name, image: image || null });
      if (error) throw error;
      return { id, name, image } as Category;
    },
    onSuccess: (newCat) => {
      queryClient.setQueryData<Category[]>(["categories"], old => [...(old || []), newCat]);
      updateField("category", newCat.id);
      setNewCatName(""); setNewCatImage(""); setShowNewCat(false);
      toast.success(`Category "${newCat.name}" created ✓`);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save category"),
  });

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) { toast.error("Category name is required"); return; }
    const id = slugify(trimmed);
    if (!id) { toast.error("Invalid category name"); return; }
    if (allCategories.find(c => c.id === id)) { toast.error(`"${trimmed}" already exists`); return; }
    addCategoryMutation.mutate({ id, name: trimmed, image: newCatImage.trim() });
  };

  /* ── Derived stats ── */
  const stats = useMemo(() => {
    let inStock = 0, outOfStock = 0, lowStock = 0;
    productList.forEach(p => {
      const pHasVariants = (p.variants?.length ?? 0) > 0;
      const isOut = !p.inStock || (pHasVariants && !p.variants!.some(v => v.stock > 0));
      const isPartialOut = pHasVariants && !isOut && p.variants!.some(v => v.stock === 0);
      const totalStock = pHasVariants ? p.variants!.reduce((acc, v) => acc + v.stock, 0) : (p.stock ?? 0);
      const isLow = !isOut && totalStock > 0 && totalStock <= 5;
      const isPartialLow = pHasVariants && !isLow && !isOut && !isPartialOut && p.variants!.some(v => v.stock > 0 && v.stock <= 5);

      // If a product is completely out or partially out, we count it in "Out Of Stock" stats
      if (isOut || isPartialOut) outOfStock++;
      // If it's low (and not fully/partially out) OR partially low, we count it in low stock
      else if (isLow || isPartialLow) lowStock++;
      // Otherwise, it's fully in stock
      else inStock++;
    });

    return { total: productList.length, inStock, outOfStock, lowStock };
  }, [productList]);

  const filtered = useMemo(() => {
    return productList
      .filter(p => {
        const pHasVariants = (p.variants?.length ?? 0) > 0;
        const totalStock = pHasVariants ? p.variants!.reduce((acc, v) => acc + v.stock, 0) : (p.stock ?? 0);
        const isOut = !p.inStock || (pHasVariants && !p.variants!.some(v => v.stock > 0));
        const isPartialOut = pHasVariants && !isOut && p.variants!.some(v => v.stock === 0);
        const isLow = !isOut && totalStock > 0 && totalStock <= 5;
        const isPartialLow = pHasVariants && !isLow && !isOut && !isPartialOut && p.variants!.some(v => v.stock > 0 && v.stock <= 5);

        // If filtering by 'out', include fully out OR partially out.
        // If filtering by 'in', include fully in stock OR partially out (since they hold some stock).
        // If filtering by 'low', include fully low OR partially low.
        return (
          p.name.toLowerCase().includes(search.toLowerCase()) &&
          (catFilter === "all" || p.category === catFilter) &&
          (stockFilter === "all"
            || (stockFilter === "out" && (isOut || isPartialOut))
            || (stockFilter === "in"  && (!isOut && !isPartialOut && !isPartialLow))
            || (stockFilter === "low" && (isLow || isPartialLow)))
        );
      })
      .sort((a, b) => {
        const aHasV = (a.variants?.length ?? 0) > 0;
        const bHasV = (b.variants?.length ?? 0) > 0;
        const aStock = aHasV ? a.variants!.reduce((acc, v) => acc + v.stock, 0) : (a.stock ?? 0);
        const bStock = bHasV ? b.variants!.reduce((acc, v) => acc + v.stock, 0) : (b.stock ?? 0);
        const aOut = !a.inStock || (aHasV && !a.variants!.some(v => v.stock > 0));
        const bOut = !b.inStock || (bHasV && !b.variants!.some(v => v.stock > 0));

        if (aOut && !bOut) return -1;
        if (!aOut && bOut) return  1;
        
        const aPrice = aHasV ? Math.min(...a.variants!.map(v => v.price)) : a.price;
        const bPrice = bHasV ? Math.min(...b.variants!.map(v => v.price)) : b.price;

        if (sortBy === "price-asc")  return aPrice - bPrice;
        if (sortBy === "price-desc") return bPrice - aPrice;
        if (sortBy === "stock")      return aStock - bStock;
        return a.name.localeCompare(b.name);
      });
  }, [productList, search, catFilter, stockFilter, sortBy]);

  /* ── Dialog helpers ── */
  const resetDialogExtras = () => {
    setShowNewCat(false); setNewCatName(""); setNewCatImage(""); setShowCustomUnit(false);
    setHasVariants(false);
    setFormVariants([]);
  };

  const openAdd = () => {
    resetDialogExtras();
    setEditing(null);
    setForm({ ...emptyProduct, id: `prod-${Date.now()}` });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    resetDialogExtras();
    setEditing(p);
    setForm({ ...p });
    if (p.unit && !PRESET_UNITS.includes(p.unit)) setShowCustomUnit(true);
    if (p.variants && p.variants.length > 0) {
      setHasVariants(true);
      setFormVariants([...p.variants]);
    } else {
      setHasVariants(false);
      setFormVariants([]);
    }
    setDialogOpen(true);
  };

  const updateField = (k: keyof Partial<Product>, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const updateVariant = (index: number, k: keyof ProductVariant, v: any) => {
    setFormVariants(prev => {
      const next = [...prev];
      if (k === "is_default" && v === true) {
        next.forEach(variant => variant.is_default = false);
      }
      next[index] = { ...next[index], [k]: v };
      return next;
    });
  };

  const removeVariant = (index: number) => {
    setFormVariants(prev => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    const isFirst = formVariants.length === 0;
    setFormVariants(prev => [
      ...prev, 
      { 
        id: `var-${Date.now()}`, 
        product_id: form.id || "", 
        label: "", 
        price: form.price || 0, 
        stock: 50, 
        is_default: isFirst, 
        sort_order: prev.length 
      }
    ]);
  };

  const handleSave = () => {
    if (!form.name?.trim())             { toast.error("Name required"); return; }
    if (!form.category)                 { toast.error("Category required"); return; }
    
    if (hasVariants) {
      if (formVariants.length === 0) { toast.error("Please add at least one variant"); return; }
      const invalidVariant = formVariants.find(v => !v.label.trim() || v.price <= 0);
      if (invalidVariant) { toast.error("Variant labels and valid prices are required"); return; }
    } else {
      if (!form.price || form.price <= 0) { toast.error("Price must be > 0"); return; }
    }
    
    if (showCustomUnit && !form.unit?.trim()) { toast.error("Please enter a unit"); return; }
    if (!form.inStock) form.stock = 0;

    if (editing) {
      editMutation.mutate({ id: editing.id, data: form });
    } else {
      addMutation.mutate({ ...form, id: form.id as string } as Partial<Product> & { id: string });
    }
  };

  const isSaving = addMutation.isPending || editMutation.isPending;

  /* ─────────────────────────────────────────────────────── */

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Package className="h-10 w-10 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium">Loading products…</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ══ STAT CARDS ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:flex gap-2.5 md:gap-3">
        <StatCard label="Total"      value={stats.total}      icon={Package}       color="text-primary"     bg="bg-primary/10"     onClick={() => setStockFilter("all")} active={stockFilter === "all"} />
        <StatCard label="In Stock"   value={stats.inStock}    icon={CheckCircle2}  color="text-emerald-600" bg="bg-emerald-500/10" onClick={() => setStockFilter("in")}  active={stockFilter === "in"} />
        <StatCard label="Out"        value={stats.outOfStock} icon={TrendingDown}  color="text-destructive" bg="bg-destructive/10" onClick={() => setStockFilter("out")} active={stockFilter === "out"} />
        <StatCard label="Low Stock"  value={stats.lowStock}   icon={AlertTriangle} color="text-amber-600"   bg="bg-amber-500/10"   onClick={() => setStockFilter("low")} active={stockFilter === "low"} />
      </div>

      {/* ══ CATEGORY PILLS ══════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{ id: "all", name: "All" } as Category, ...allCategories].map(c => {
          const count = c.id === "all" ? productList.length : productList.filter(p => p.category === c.id).length;
          const active = catFilter === c.id;
          return (
            <motion.button
              key={c.id}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => setCatFilter(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0
                ${active
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                  : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary"}`}
            >
              {c.image && (
                <img src={c.image} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              {c.name}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${active ? "bg-white/25" : "bg-muted"}`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ══ CONTROLS BAR ════════════════════════════════════ */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
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

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-36 md:w-40 h-10 rounded-xl border-border/60 gap-1.5 flex-shrink-0">
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

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ["categories"] });
            }}
            className="rounded-xl h-10 gap-1.5">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={openAdd} className="rounded-xl h-10 gap-1.5 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Count + active filter chip */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground font-medium">
          <span className="font-extrabold text-foreground">{filtered.length}</span> of {productList.length} products
        </p>
        <AnimatePresence>
          {stockFilter !== "all" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <button
                onClick={() => setStockFilter("all")}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border
                  ${stockFilter === "out" ? "bg-destructive/10 text-destructive border-destructive/30"
                    : stockFilter === "low" ? "bg-amber-500/10 text-amber-700 border-amber-400/30"
                    : "bg-emerald-500/10 text-emerald-700 border-emerald-400/30"}`}
              >
                {stockFilter === "out" ? "🔴 Out of stock" : stockFilter === "low" ? "🟡 Low stock" : "🟢 In stock"}
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ PRODUCT GRID ════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Package className="h-14 w-14 text-muted-foreground/20 mx-auto" />
          <p className="font-display font-bold text-xl">No products found</p>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filter.</p>
          {(search || catFilter !== "all" || stockFilter !== "all") && (
            <Button variant="outline" onClick={() => { setSearch(""); setCatFilter("all"); setStockFilter("all"); }} className="rounded-full gap-2">
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              allCategories={allCategories}
              onEdit={() => openEdit(product)}
              onDelete={() => setDeleteConfirm(product.id)}
              onToggleStock={() => quickToggle(product)}
              isSaving={toggleMutation.isPending && toggleMutation.variables?.id === product.id}
            />
          ))}
        </div>
      )}

      {/* ══ ADD / EDIT DIALOG ══════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={open => {
        setDialogOpen(open);
        if (!open) { resetDialogExtras(); setForm(emptyProduct); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-extrabold text-xl flex items-center gap-2">
              {editing
                ? <><Pencil className="h-5 w-5 text-primary" /> Edit Product</>
                : <><Plus className="h-5 w-5 text-primary" /> Add Product</>}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editing ? `Editing "${editing.name}"` : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* Product image preview */}
            {form.image && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/40">
                <img src={form.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-md"
                  onError={e => { e.currentTarget.style.display = "none"; }} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-muted-foreground">Image Preview</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 break-all line-clamp-2">{form.image}</p>
                </div>
              </motion.div>
            )}

            {/* Name */}
            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Product Name *</Label>
              <Input value={form.name || ""} onChange={e => updateField("name", e.target.value)}
                placeholder="e.g. Fresh Red Apples" className="h-10 rounded-xl border-border/60" />
            </div>

            {/* Category + Unit */}
            <div className="grid grid-cols-2 gap-3">

              {/* CATEGORY & SUBCATEGORY */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Category *</Label>
                  <Select
                    value={form.category || ""}
                    onValueChange={v => {
                      if (v === "__new__") {
                        setShowNewCat(true);
                        setTimeout(() => newCatInputRef.current?.focus(), 50);
                      } else {
                        updateField("category", v);
                        setShowNewCat(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border/60">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {c.image
                              ? <img src={c.image} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" />
                              : <span className="w-4 h-4 rounded bg-muted flex-shrink-0" />}
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                      <div className="mx-2 my-1 h-px bg-border" />
                      <SelectItem value="__new__" className="text-primary font-semibold">
                        <span className="flex items-center gap-1.5">
                          <FolderPlus className="h-3.5 w-3.5" />
                          Add new category…
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Sub Category</Label>
                  <Input value={form.subCategory || ""} onChange={e => updateField("subCategory", e.target.value)}
                    placeholder="e.g. Juices, Sodas (Optional)" className="h-10 rounded-xl border-border/60" />
                </div>

                {/* Inline new-category form */}
                <AnimatePresence>
                  {showNewCat && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">New Category</p>

                        <Input
                          ref={newCatInputRef}
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); }
                            if (e.key === "Escape") setShowNewCat(false);
                          }}
                          placeholder="e.g. Organic Produce"
                          className="h-8 rounded-lg text-sm border-primary/30 focus-visible:ring-primary/40"
                        />

                        {newCatName.trim() && (
                          <p className="text-[10px] text-muted-foreground">
                            ID: <span className="font-mono font-bold text-foreground">{slugify(newCatName.trim())}</span>
                          </p>
                        )}

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                            Cover Image URL
                          </Label>
                          <Input
                            value={newCatImage}
                            onChange={e => setNewCatImage(e.target.value)}
                            placeholder="https://images.unsplash.com/…"
                            className="h-8 rounded-lg text-sm border-primary/30 focus-visible:ring-primary/40"
                          />
                        </div>

                        <AnimatePresence>
                          {newCatImage.trim() && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center gap-2.5 p-2 bg-background/60 rounded-lg border border-border/40"
                            >
                              <img
                                src={newCatImage}
                                alt="Category cover preview"
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm"
                                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground">Cover preview</p>
                                {newCatName.trim() && (
                                  <p className="text-[10px] text-foreground font-semibold mt-0.5 truncate">{newCatName}</p>
                                )}
                              </div>
                              <button type="button" onClick={() => setNewCatImage("")}
                                className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!newCatImage.trim() && (
                          <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <ImageIcon className="h-3 w-3 flex-shrink-0" />
                            Optional — category will appear without a cover if left blank
                          </p>
                        )}

                        <div className="flex gap-2 pt-0.5">
                          <Button size="sm" className="h-7 text-xs rounded-lg flex-1 gap-1"
                            onClick={handleAddCategory}
                            disabled={addCategoryMutation.isPending || !newCatName.trim()}>
                            {addCategoryMutation.isPending
                              ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                              : <><Plus className="h-3 w-3" /> Create</>}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg px-2"
                            onClick={() => { setShowNewCat(false); setNewCatName(""); setNewCatImage(""); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* UNIT */}
              <div>
                <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Unit</Label>
                {!showCustomUnit ? (
                  <Select
                    value={form.unit || "kg"}
                    onValueChange={v => {
                      if (v === "__custom__") { setShowCustomUnit(true); updateField("unit", ""); }
                      else updateField("unit", v);
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRESET_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      <div className="mx-2 my-1 h-px bg-border" />
                      <SelectItem value="__custom__" className="text-primary font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Pencil className="h-3.5 w-3.5" /> Custom…
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-1.5">
                    <Input autoFocus value={form.unit || ""} onChange={e => updateField("unit", e.target.value)}
                      placeholder="e.g. tray, sachet…"
                      className="h-10 rounded-xl border-primary/40 focus-visible:ring-primary/40 flex-1" />
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0"
                      title="Back to presets" onClick={() => { setShowCustomUnit(false); updateField("unit", "kg"); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
                {showCustomUnit && (
                  <p className="text-[10px] text-muted-foreground mt-1">Type any unit. Click ✕ for presets.</p>
                )}
              </div>
            </div>

            {/* Variants Toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div>
                <Label className="text-sm font-bold block">Has Sizes / Weights</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Toggle this if the product comes in different variants with different prices</p>
              </div>
              <Switch checked={hasVariants} onCheckedChange={(v) => {
                setHasVariants(v);
                if (v && formVariants.length === 0) {
                  addVariant();
                }
              }} />
            </div>

            {hasVariants ? (
              <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Variants</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addVariant} className="h-7 text-xs rounded-lg gap-1">
                    <Plus className="h-3 w-3" /> Add Size
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formVariants.map((variant, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-[1fr_100px_80px_auto_auto] gap-2 items-center bg-card p-2 rounded-lg border border-border/60"
                    >
                      <div>
                        <Input 
                          placeholder="e.g. 500g, Large, Pack of 6" 
                          value={variant.label} 
                          onChange={e => updateVariant(idx, "label", e.target.value)}
                          className="h-8 text-xs rounded-md border-border/60" 
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">PKR</span>
                        <Input 
                          type="number" min="0" step="0.01" 
                          value={variant.price || ""} 
                          onChange={e => updateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs pl-8 rounded-md border-border/60" 
                        />
                      </div>
                      <div>
                        <Input 
                          type="number" min="0" 
                          value={variant.stock ?? ""} 
                          onChange={e => updateVariant(idx, "stock", parseInt(e.target.value) || 0)}
                          className="h-8 text-xs rounded-md border-border/60" 
                          placeholder="Stock"
                        />
                      </div>
                      <div className="flex items-center justify-center pt-1" title="Mark as Default">
                        <Switch 
                          checked={variant.is_default} 
                          onCheckedChange={v => updateVariant(idx, "is_default", v)} 
                          className="data-[state=checked]:bg-primary h-5 w-9" 
                        />
                      </div>
                      <Button 
                        type="button" variant="ghost" size="icon" 
                        onClick={() => removeVariant(idx)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                  {formVariants.length === 0 && (
                    <p className="text-xs text-center text-destructive py-2">Please add at least one variant.</p>
                  )}
                </div>
              </div>
            ) : (
              /* Single Price + Discount + Stock */
              <>
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
              </>
            )}

            {/* Image URL */}
            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Image URL</Label>
              <Input value={form.image || ""} onChange={e => updateField("image", e.target.value)}
                placeholder="https://images.unsplash.com/…" className="h-10 rounded-xl border-border/60" />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Description</Label>
              <Input value={form.description || ""} onChange={e => updateField("description", e.target.value)}
                placeholder="Short product description" className="h-10 rounded-xl border-border/60" />
            </div>

            {/* Badge */}
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
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetDialogExtras(); setForm(emptyProduct); }}
              className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl gap-1.5 shadow-md shadow-primary/20">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
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
              <span className="font-bold text-foreground">
                "{productList.find(p => p.id === deleteConfirm)?.name}"
              </span>{" "}
              will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">Keep it</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              className="rounded-xl gap-1.5">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProductManagement;