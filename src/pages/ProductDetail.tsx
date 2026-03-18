import { useParams, Link } from "react-router-dom";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, ArrowLeft, Plus, Minus, Heart,
  Share2, Truck, ShieldCheck, RefreshCcw, Loader2, Package,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ProductVariant } from "@/data/products";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const GUARANTEES = [
  { icon: Truck,       label: "Fast Delivery",   sub: "Across Lahore"  },
  { icon: ShieldCheck, label: "Quality Assured", sub: "Fresh guarantee" },
  { icon: RefreshCcw,  label: "Easy Returns",    sub: "Within 24 hours" },
];

/* ══════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
══════════════════════════════════════════════════════════ */
const ProductDetail = () => {
  const { id }   = useParams();
  const { user } = useAuth();
  const { items, addToCart, updateQuantity, removeFromCart, products } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const product      = products.find(p => p.id === id);
  const isWishlisted = product ? isInWishlist(product.id) : false;

  /* ── Variant state ── */
  const [variants,         setVariants]         = useState<ProductVariant[]>([]);
  const [selectedVariant,  setSelectedVariant]  = useState<ProductVariant | undefined>(undefined);
  const [variantsLoading,  setVariantsLoading]  = useState(false);



  /* ── Fetch variants for this product ── */
  useEffect(() => {
    if (!product) return;
    // If variants already loaded into product object from CartContext, use those
    if (product.variants && product.variants.length > 0) {
      const sorted = [...product.variants].sort((a, b) => a.sort_order - b.sort_order);
      setVariants(sorted);
      const defaultV = sorted.find(v => v.is_default) ?? sorted[0];
      setSelectedVariant(defaultV);
      return;
    }
    // Otherwise fetch from DB directly
    setVariantsLoading(true);
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []) as ProductVariant[];
        setVariants(rows);
        if (rows.length > 0) {
          const defaultV = rows.find(v => v.is_default) ?? rows[0];
          setSelectedVariant(defaultV);
        }
        setVariantsLoading(false);
      });
  }, [product?.id, product?.variants]);



  /* ── Guard ── */
  if (!product) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Link to="/shop" className="text-primary underline mt-4 inline-block">Back to Shop</Link>
    </div>
  );

  /* Cart item matching: variant products matched by product+variant key */
  const cartItem = items.find(i =>
    i.product.id === product.id &&
    (variants.length === 0 ? true : i.selectedVariant?.id === selectedVariant?.id)
  );
  const related    = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  /* Shown price: selected variant price, or discounted product price */
  const finalPrice = selectedVariant
    ? selectedVariant.price
    : product.discount
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

  /* Stock: if variant selected use variant stock, else product stock */
  const availableStock = selectedVariant ? selectedVariant.stock : (product.stock ?? 0);
  const inStock = selectedVariant
    ? selectedVariant.stock > 0
    : product.inStock && (product.stock === undefined || product.stock > 0);

  return (
    <PageTransition>
      <Helmet>
        <title>{product.name} | Altaf Cash and Carry</title>
        <meta name="description" content={`Buy ${product.name} online. ${product.description}`} />
      </Helmet>

      <div className="container py-8 max-w-5xl">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-primary transition-colors capitalize">
            {product.category.replace(/-/g, " ")}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </motion.nav>

        {/* ── Main grid ── */}
        <div className="grid md:grid-cols-2 gap-10 mb-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden aspect-square bg-muted shadow-lg group">
            <motion.img
              src={product.image || PLACEHOLDER_IMAGE}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
            />
            {product.badge && (
              <Badge className="absolute top-4 left-4 font-bold shadow">
                {product.badge === "discount" ? `-${product.discount}%` : product.badge}
              </Badge>
            )}
            <button
              aria-label="Share product"
              onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col justify-center">
            <p className="text-xs text-primary font-bold tracking-widest uppercase mb-2">
              {product.category.replace(/-/g, " & ")}
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold leading-tight mb-3">
              {product.name}
            </h1>

            <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {/* Price */}
            <div className="flex items-end gap-3 mb-4">
              <motion.span key={finalPrice} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-extrabold text-primary leading-none">
                PKR {finalPrice.toLocaleString()}
              </motion.span>
              {!selectedVariant && product.discount && (
                <span className="text-lg text-muted-foreground line-through mb-0.5">
                  PKR {product.price.toLocaleString()}
                </span>
              )}
              <span className="text-muted-foreground text-sm mb-0.5">
                {selectedVariant ? `/ ${selectedVariant.label}` : `/ ${product.unit}`}
              </span>
            </div>

            {/* ── Variant selector ── */}
            {variantsLoading && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading sizes…
              </div>
            )}
            {!variantsLoading && variants.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Select Size / Weight
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => {
                    const isSelected = selectedVariant?.id === v.id;
                    const outOfStock = v.stock <= 0;
                    return (
                      <motion.button
                        key={v.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        disabled={outOfStock}
                        onClick={() => setSelectedVariant(v)}
                        className={`relative px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200
                          ${
                            outOfStock
                              ? "opacity-40 cursor-not-allowed border-border bg-muted text-muted-foreground"
                              : isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                : "border-border bg-card hover:border-primary/60 hover:text-primary"
                          }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="variant-pill"
                            className="absolute inset-0 rounded-xl bg-primary"
                            style={{ zIndex: -1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                          />
                        )}
                        <span className="flex flex-col items-center leading-tight">
                          <span>{v.label}</span>
                          <span className={`text-[10px] font-semibold mt-0.5 ${
                            isSelected ? "text-primary-foreground/80" : "text-primary"
                          }`}>
                            PKR {v.price.toLocaleString()}
                          </span>
                        </span>
                        {outOfStock && (
                          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-destructive text-white px-1 rounded-full font-bold">
                            Out
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mb-6">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border
                ${inStock
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                  : "bg-destructive/10 text-destructive border-destructive/25"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-destructive"}`} />
                {inStock ? `${availableStock} in stock` : "Out of stock"}
              </span>
            </div>

            {/* Cart controls */}
            {inStock ? (
              <div className="flex items-center gap-3 flex-wrap mb-6">
                <AnimatePresence mode="wait">
                  {cartItem ? (
                    <motion.div key="stepper"
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 bg-muted rounded-full p-1">
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full"
                        onClick={() => cartItem.quantity <= 1
                          ? removeFromCart(product.id, selectedVariant?.id)
                          : updateQuantity(product.id, cartItem.quantity - 1, selectedVariant?.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <AnimatePresence mode="wait">
                        <motion.span key={cartItem.quantity}
                          initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}
                          transition={{ duration: 0.14 }}
                          className="w-8 text-center font-extrabold text-primary">
                          {cartItem.quantity}
                        </motion.span>
                      </AnimatePresence>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full"
                        disabled={availableStock > 0 && cartItem.quantity >= availableStock}
                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1, selectedVariant?.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="add"
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" onClick={() => addToCart(product, selectedVariant)}
                        className="rounded-full px-8 gap-2 relative overflow-hidden shadow-lg shadow-primary/25">
                        <motion.span className="absolute inset-0 bg-white/15 skew-x-[-15deg]"
                          initial={{ x: "-130%" }} whileHover={{ x: "230%" }} transition={{ duration: 0.45 }} />
                        <ShoppingCart className="h-5 w-5" /> Add to Cart
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                  onClick={() => toggleWishlist(product)}
                  className="w-12 h-12 rounded-full border-2 border-border/60 flex items-center justify-center hover:border-red-400 transition-colors">
                  <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </motion.button>

                {cartItem && (
                  <Link to="/cart">
                    <Button size="lg" variant="outline" className="rounded-full px-6">View Cart</Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-destructive font-semibold mb-6">Currently out of stock</p>
            )}

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-2">
              {GUARANTEES.map((g, i) => (
                <motion.div key={g.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex flex-col items-center text-center p-2.5 rounded-xl bg-muted/50 border border-border/40">
                  <g.icon className="h-4 w-4 text-primary mb-1" />
                  <span className="text-[10px] font-bold leading-tight">{g.label}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">{g.sub}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>



        {/* ── Related products ── */}
        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="relative inline-block">
                <h2 className="text-2xl font-display font-bold">Related Products</h2>
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.2 }}
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-primary via-secondary to-transparent"
                />
              </div>
              <Link to={`/shop?category=${product.category}`}
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                View all <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08, type: "spring" }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
};

export default ProductDetail;