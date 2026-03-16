import { useParams, Link } from "react-router-dom";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, ArrowLeft, Plus, Minus, Heart,
  Star, Share2, Truck, ShieldCheck, RefreshCcw, Loader2,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const GUARANTEES = [
  { icon: Truck,       label: "Fast Delivery",   sub: "Across Lahore"  },
  { icon: ShieldCheck, label: "Quality Assured", sub: "Fresh guarantee" },
  { icon: RefreshCcw,  label: "Easy Returns",    sub: "Within 24 hours" },
];

/* ── Types ── */
interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

/* ── Star row ────────────────────────────────────────────── */
const StarRow = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} style={{ width: size, height: size }}
        className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
    ))}
  </div>
);

/* ── Inline review form ─────────────────────────────────── */
const ReviewForm = ({ onSubmit, submitting }: {
  onSubmit: (rating: number, comment: string, name: string) => Promise<void>;
  submitting: boolean;
}) => {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [name,    setName]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    if (!name.trim()) { toast.error("Please enter your name.");        return; }
    await onSubmit(rating, comment, name.trim());
    setRating(0); setComment(""); setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star picker */}
      <div>
        <label className="text-sm font-semibold mb-1.5 block">Your Rating *</label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button"
              onMouseEnter={() => setHovered(i + 1)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(i + 1)}
              className="p-0.5 transition-transform hover:scale-125">
              <Star className={`h-7 w-7 transition-colors ${
                i < (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              }`} />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-semibold mb-1.5 block">Your Name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Ahmed R."
          maxLength={60}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-semibold mb-1.5 block">Review <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Share your experience with this product..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{comment.length}/500</p>
      </div>

      <Button type="submit" disabled={submitting} className="w-full rounded-full font-bold">
        {submitting
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
          : "Submit Review"}
      </Button>
    </form>
  );
};

/* ══════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
══════════════════════════════════════════════════════════ */
const ProductDetail = () => {
  const { id }   = useParams();
  const { user } = useAuth();
  const { items, addToCart, updateQuantity, removeFromCart, products } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const product    = products.find(p => p.id === id);
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const [activeTab,   setActiveTab]   = useState<"reviews" | "write">("reviews");
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [avgRating,   setAvgRating]   = useState<number | null>(null);

  /* ── Fetch reviews for this product ── */
  useEffect(() => {
    if (!product) return;
    setLoading(true);

    supabase
      .from("product_reviews")
      .select("id, customer_name, rating, comment, created_at")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); }
        const rows = (data ?? []) as Review[];
        setReviews(rows);
        if (rows.length > 0) {
          const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
          setAvgRating(Math.round(avg * 10) / 10);
        } else {
          setAvgRating(null);
        }
        setLoading(false);
      });
  }, [product?.id]);

  /* ── Submit a review ── */
  const handleReviewSubmit = async (rating: number, comment: string, name: string) => {
    if (!product) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .insert({
          product_id:    product.id,
          user_id:       user?.id ?? null,
          customer_name: name,
          rating,
          comment:       comment || null,
        })
        .select("id, customer_name, rating, comment, created_at")
        .single();

      if (error) throw error;

      const newReview = data as Review;
      const updated   = [newReview, ...reviews];
      setReviews(updated);

      /* Recalculate average */
      const avg = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
      setAvgRating(Math.round(avg * 10) / 10);

      toast.success("Review submitted — thank you!");
      setActiveTab("reviews");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Guard ── */
  if (!product) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Link to="/shop" className="text-primary underline mt-4 inline-block">Back to Shop</Link>
    </div>
  );

  const cartItem   = items.find(i => i.product.id === product.id);
  const related    = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const finalPrice = product.discount ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
  const inStock    = product.inStock && (product.stock === undefined || product.stock > 0);

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

            {/* Real live rating */}
            {avgRating !== null && reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRow rating={avgRating} size={18} />
                <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
              </div>
            )}

            <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {/* Price */}
            <div className="flex items-end gap-3 mb-4">
              <motion.span key={finalPrice} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-extrabold text-primary leading-none">
                PKR {finalPrice.toLocaleString()}
              </motion.span>
              {product.discount && (
                <span className="text-lg text-muted-foreground line-through mb-0.5">
                  PKR {product.price.toLocaleString()}
                </span>
              )}
              <span className="text-muted-foreground text-sm mb-0.5">/ {product.unit}</span>
            </div>

            {/* Stock */}
            <div className="mb-6">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border
                ${inStock
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                  : "bg-destructive/10 text-destructive border-destructive/25"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-destructive"}`} />
                {inStock ? `${product.stock ?? 50} in stock` : "Out of stock"}
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
                        onClick={() => cartItem.quantity <= 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)}>
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
                        disabled={product.stock !== undefined && cartItem.quantity >= product.stock}
                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="add"
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" onClick={() => addToCart(product)}
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

        {/* ── Reviews section ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-16">

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/50 mb-8">
            {(["reviews", "write"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2.5 text-sm font-semibold transition-colors
                  ${activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "reviews" ? `Reviews (${reviews.length})` : "Write a Review"}
                {activeTab === tab && (
                  <motion.div layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "reviews" ? (
              <motion.div key="reviews"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Summary bar */}
                {reviews.length > 0 && avgRating !== null && (
                  <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-muted/40 border border-border/40">
                    <div className="text-center">
                      <p className="text-4xl font-black text-primary leading-none">{avgRating.toFixed(1)}</p>
                      <StarRow rating={avgRating} size={14} />
                      <p className="text-[10px] text-muted-foreground mt-1">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
                    </div>
                    {/* Rating breakdown */}
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-3">{star}</span>
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-amber-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, idx) => (
                      <motion.div key={review.id}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-card rounded-2xl border border-border/50 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                              {review.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-sm">{review.customer_name}</span>
                              <div className="mt-0.5">
                                <StarRow rating={review.rating} size={12} />
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{review.comment}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm mt-1">Be the first to review this product!</p>
                    <button onClick={() => setActiveTab("write")}
                      className="text-primary text-sm font-semibold mt-3 hover:underline">
                      Write a review →
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="write"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="max-w-lg bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4">Share Your Experience</h3>
                  <ReviewForm onSubmit={handleReviewSubmit} submitting={submitting} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

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