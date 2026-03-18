import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Heart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
} from "framer-motion";
import { useRef } from "react";


const PLACEHOLDER_IMAGE = "/placeholder.svg";

const BADGE_CONFIG: Record<string, { style: string; label: string }> = {
  bestseller:     { style: "bg-amber-500 text-white",        label: "⭐ Best Seller" },
  discount:       { style: "bg-red-500 text-white",          label: ""               },
  new:            { style: "bg-emerald-500 text-white",      label: "✨ New"          },
  "out-of-stock": { style: "bg-muted text-muted-foreground", label: "Sold Out"       },
};



const ProductCard = ({ product }: { product: Product }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const cartItem     = items.find(i => i.product.id === product.id);
  const isWishlisted = isInWishlist(product.id);
  const cardRef      = useRef<HTMLDivElement>(null);



  /* ── 3-D tilt ── */
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]),  { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7,  7]), { stiffness: 300, damping: 30 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width  - 0.5);
    mouseY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const imageSrc    = product.image || PLACEHOLDER_IMAGE;
  const hasVariants = (product.variants?.length ?? 0) > 0;

  /* Price display: lowest variant price, or regular/discounted price */
  const displayPrice = hasVariants
    ? Math.min(...product.variants!.map(v => v.price))
    : product.discount
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;
  const finalPrice = displayPrice;

  const badgeCfg = product.badge ? BADGE_CONFIG[product.badge] : null;
  // For variant products, check if any variant has stock > 0 instead of product-level stock
  const inStock  = hasVariants
    ? product.variants!.some(v => v.stock > 0)
    : (product.inStock && (product.stock === undefined || product.stock > 0));

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 900 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50
                 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300"
    >
      {/* Glow border on hover */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 -z-10"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)/0.4), hsl(var(--secondary)/0.3))",
          filter: "blur(6px)",
        }}
      />

      {/* ── IMAGE ── */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <Link to={`/product/${product.id}`}>
          <motion.img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
          {/* Quick view pill */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileHover={{ y: 0, opacity: 1 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none group-hover:pointer-events-auto"
          >
            <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              <Eye className="h-3 w-3" /> Quick View
            </span>
          </motion.div>
        </Link>

        {/* Badge */}
        {badgeCfg && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="absolute top-2.5 left-2.5 z-10"
          >
            <span className={`${badgeCfg.style} text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm`}>
              {product.badge === "discount" ? `−${product.discount}%` : badgeCfg.label}
            </span>
          </motion.div>
        )}

        {/* Wishlist */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <motion.button
            whileTap={{ scale: 0.7 }}
            whileHover={{ scale: 1.15 }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            className="w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm shadow-md flex items-center justify-center border border-white/40"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isWishlisted ? "on" : "off"}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0  }}
                exit={{   scale: 0, rotate:  20 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mb-0.5">
          {product.category.replace(/-/g, " & ")}
        </p>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-sm leading-snug line-clamp-1 hover:text-primary transition-colors mb-1">
            {product.name}
          </h3>
        </Link>



        {/* Price + cart */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <motion.span
                key={finalPrice}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base font-extrabold text-primary leading-none"
              >
                {hasVariants ? "from " : ""}PKR {finalPrice.toLocaleString()}
              </motion.span>
              {!hasVariants && product.discount && (
                <span className="text-[10px] text-muted-foreground line-through">
                  {product.price.toLocaleString()}
                </span>
              )}
            </div>
            {hasVariants ? (
              <span className="text-[10px] text-primary/70 font-semibold mt-0.5">Sizes available</span>
            ) : (
              <span className="text-[10px] text-muted-foreground mt-0.5">per {product.unit}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!inStock ? (
              <motion.span key="oos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground italic">
                Out of stock
              </motion.span>
            ) : hasVariants ? (
              /* Variant product: go to detail page to pick a size */
              <motion.div key="pick"
                initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }}
                transition={{ type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.9 }}>
                <Link to={`/product/${product.id}`}>
                  <Button size="sm"
                    className="h-8 px-3 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 relative overflow-hidden">
                    <motion.span className="absolute inset-0 bg-white/20 skew-x-[-15deg]"
                      initial={{ x: "-130%" }} whileHover={{ x: "230%" }} transition={{ duration: 0.30 }} />
                    <ShoppingCart className="h-3 w-3 mr-1" /> Pick Size
                  </Button>
                </Link>
              </motion.div>
            ) : cartItem ? (
              <motion.div key="stepper"
                initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-1">
                <motion.div whileTap={{ scale: 0.8 }}>
                  <Button size="icon" variant="outline" className="h-6 w-6 rounded-full border-border/60"
                    onClick={() => cartItem.quantity <= 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)}>
                    <Minus className="h-2.5 w-2.5" />
                  </Button>
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.span key={cartItem.quantity}
                    initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.14 }}
                    className="w-5 text-center text-sm font-bold text-primary">
                    {cartItem.quantity}
                  </motion.span>
                </AnimatePresence>
                <motion.div whileTap={{ scale: 0.8 }}>
                  <Button size="icon" variant="outline" className="h-6 w-6 rounded-full border-border/60"
                    disabled={product.stock !== undefined && cartItem.quantity >= product.stock}
                    onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                    <Plus className="h-2.5 w-2.5" />
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="add"
                initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }}
                transition={{ type: "keyframes", stiffness: 300 }}
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.9 }}>
                <Button size="sm" onClick={() => addToCart(product)}
                  className="h-8 px-3 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 relative overflow-hidden">
                  <motion.span className="absolute inset-0 bg-white/20 skew-x-[-15deg]"
                    initial={{ x: "-130%" }} whileHover={{ x: "230%" }} transition={{ duration: 0.30 }} />
                  <ShoppingCart className="h-3 w-3 mr-1" /> Add
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stock pill */}
        <div className="mt-2">
          {hasVariants ? (
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${inStock
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {inStock ? `${product.variants!.reduce((s, v) => s + v.stock, 0)} in stock` : "Out of stock"}
            </span>
          ) : (
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${(product.stock ?? 0) > 0
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;