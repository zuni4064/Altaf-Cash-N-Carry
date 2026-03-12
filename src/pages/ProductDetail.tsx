import { useParams, Link } from "react-router-dom";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Plus, Minus, Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

// Default placeholder image
const PLACEHOLDER_IMAGE = "/placeholder.svg";

const ProductDetail = () => {
  const { id } = useParams();
  const { items, addToCart, updateQuantity, removeFromCart, products } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const product = products.find(p => p.id === id);
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const [reviews, setReviews] = useState<{ rating: number; text: string; date: Date; name: string }[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    if (!product) return;

    const loadReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setReviews(data.map(r => ({
            rating: r.rating,
            text: r.text || "",
            name: r.name || "Anonymous",
            date: new Date(r.created_at)
          })));
        } else {
          // No reviews found in DB, seed the mock ones
          const mockReviews = [
            { product_id: product.id, rating: 5, text: "Excellent quality and very fresh! Will definitely buy again.", name: "Sarah M.", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            { product_id: product.id, rating: 4, text: "Good product for the price. Fast delivery.", name: "Ahmed R.", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
            { product_id: product.id, rating: 5, text: "Exactly what I was looking for. Highly recommended.", name: "Fatima K.", created_at: new Date(Date.now() - 86400000 * 12).toISOString() },
            { product_id: product.id, rating: 4.5, text: "Very satisfied with this purchase. The packaging was good.", name: "Ali S.", created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
          ];

          await supabase.from('reviews').insert(mockReviews);

          setReviews(mockReviews.map(r => ({
            rating: r.rating,
            text: r.text,
            name: r.name,
            date: new Date(r.created_at)
          })));
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
        // Fallback to local storage if DB fails
        const localData = localStorage.getItem(`reviews_${product.id}`);
        if (localData) {
          setReviews(JSON.parse(localData).map((r: any) => ({ ...r, date: new Date(r.date) })));
        } else {
          const mockReviewsLocal = [
            { rating: 5, text: "Excellent quality and very fresh! Will definitely buy again.", name: "Sarah M.", date: new Date(Date.now() - 86400000 * 2) },
            { rating: 4, text: "Good product for the price. Fast delivery.", name: "Ahmed R.", date: new Date(Date.now() - 86400000 * 5) },
            { rating: 5, text: "Exactly what I was looking for. Highly recommended.", name: "Fatima K.", date: new Date(Date.now() - 86400000 * 12) },
            { rating: 4.5, text: "Very satisfied with this purchase. The packaging was good.", name: "Ali S.", date: new Date(Date.now() - 86400000 * 20) },
          ];
          setReviews(mockReviewsLocal);
          localStorage.setItem(`reviews_${product.id}`, JSON.stringify(mockReviewsLocal));
        }
      } finally {
        setReviewsLoaded(true);
      }
    };

    loadReviews();
  }, [product]);

  const displayStats = useMemo(() => {
    if (!product) return { rating: undefined, count: undefined };

    if (reviews.length === 0) {
      return { rating: product.rating, count: product.reviewCount };
    }

    const baseTotal = (product.rating || 0) * (product.reviewCount || 0);
    const newTotal = reviews.reduce((acc, r) => acc + r.rating, 0);
    const newCount = (product.reviewCount || 0) + reviews.length;

    return {
      rating: Number(((baseTotal + newTotal) / newCount).toFixed(1)),
      count: newCount
    };
  }, [product, reviews]);

  const handleReviewSubmit = async (rating: number, text: string, name: string) => {
    if (!product) return;

    const newReview = { rating, text, date: new Date(), name };

    // Optimistic update
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    toast.success("Review submitted successfully!");

    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        rating,
        text,
        name,
        created_at: newReview.date.toISOString()
      });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save review to database, trying local storage:", err);
      localStorage.setItem(`reviews_${product.id}`, JSON.stringify(updatedReviews));
    }
  };

  if (!product) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Link to="/shop" className="text-primary underline mt-4 inline-block">Back to Shop</Link>
    </div>
  );

  const cartItem = items.find(i => i.product.id === product.id);
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const finalPrice = product.discount ? Math.round(product.price * (1 - product.discount / 100)) : product.price;

  return (
    <PageTransition className="container py-8">
      <Helmet>
        <title>{product.name} | Altaf Cash and Carry</title>
        <meta name="description" content={`Buy ${product.name} online. ${product.description}`} />
      </Helmet>

      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-xl overflow-hidden aspect-square bg-muted"
        >
          <img 
            src={product.image || PLACEHOLDER_IMAGE} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
          {product.badge && <Badge className="absolute top-4 left-4">{product.badge}</Badge>}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col justify-center"
        >
          <p className="text-sm text-muted-foreground capitalize mb-2">{product.category.replace("-", " & ")}</p>
          <h1 className="text-3xl font-display font-bold mb-2">{product.name}</h1>
          {displayStats.rating !== undefined && (
            <div className="mb-4">
              <StarRating rating={displayStats.rating} reviewCount={displayStats.count} size={18} />
            </div>
          )}
          <p className="text-muted-foreground mb-6">{product.description}</p>
          <div className="mb-6 flex items-center">
            <span className="text-3xl font-bold text-primary">PKR {finalPrice}</span>
            {product.discount && <span className="text-lg text-muted-foreground line-through ml-2">PKR {product.price}</span>}
            <span className="text-muted-foreground ml-1">/ {product.unit}</span>
            <Badge variant={(product.stock ?? 50) > 0 ? "outline" : "destructive"} className={`ml-4 ${(product.stock ?? 50) > 0 ? "text-success border-success bg-success/10" : ""}`}>
              {(product.stock ?? 50) > 0 ? `${product.stock ?? 50} in stock` : "Out of stock"}
            </Badge>
          </div>
          {product.inStock && (product.stock === undefined || product.stock > 0) ? (
            <div className="flex items-center gap-4">
              {cartItem ? (
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => cartItem.quantity <= 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold text-lg">{cartItem.quantity}</span>
                  <Button size="icon" variant="outline" disabled={product.stock !== undefined && cartItem.quantity >= product.stock} onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={() => addToCart(product)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
              )}
              <div className="flex gap-2">
                <Link to="/cart"><Button size="lg" variant="outline">View Cart</Button></Link>
                <Button size="lg" variant="outline" onClick={() => toggleWishlist(product)}>
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-destructive font-medium">Currently out of stock</p>
          )}
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <section>
          <h2 className="text-2xl font-display font-bold mb-6">Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review, idx) => (
                <div key={idx} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{review.name}</span>
                    <StarRating rating={review.rating} size={14} />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(review.date, "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm">{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </section>

        <section>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-display font-semibold mb-4">Write a Review</h3>
            <ReviewForm onSubmit={handleReviewSubmit} />
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-display font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </PageTransition>
  );
};

export default ProductDetail;
