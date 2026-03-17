import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLACEHOLDER_IMAGE = "/placeholder.svg";
const FREE_DELIVERY_THRESHOLD = 2000;

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const total      = getTotal();
  const progress   = Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining  = Math.max(FREE_DELIVERY_THRESHOLD - total, 0);

  /* ── Empty state ── */
  if (items.length === 0) return (
    <div className="container py-20 flex flex-col items-center text-center gap-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180 }}
        className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <ShoppingBag className="h-14 w-14 text-primary" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-3xl font-display font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Looks like you haven't added anything yet. Start shopping to fill it up!</p>
        <Link to="/shop">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" className="rounded-full px-8 gap-2">
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="container py-10 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={clearCart}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Clear all
        </motion.button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Items list ── */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const price = item.selectedVariant
                ? item.selectedVariant.price
                : item.product.discount
                  ? Math.round(item.product.price * (1 - item.product.discount / 100))
                  : item.product.price;

              return (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: i * 0.04 }}
                  className="flex gap-4 bg-card rounded-2xl border border-border/60 p-3 hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
                      <motion.img
                        src={item.product.image || PLACEHOLDER_IMAGE}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">
                      {item.product.category.replace(/-/g, " ")}
                    </p>
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="font-bold text-sm leading-snug hover:text-primary transition-colors line-clamp-1">
                        {item.product.name}
                      </h3>
                    </Link>
                    {/* Variant label */}
                    {item.selectedVariant && (
                      <p className="text-[11px] text-primary/70 font-semibold mt-0.5">
                        Size: {item.selectedVariant.label}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold text-sm">PKR {price.toLocaleString()}</span>
                      {!item.selectedVariant && item.product.discount && (
                        <span className="text-[10px] text-muted-foreground line-through">PKR {item.product.price}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">/ {item.selectedVariant?.label ?? item.product.unit}</span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => item.quantity <= 1
                          ? removeFromCart(item.product.id, item.selectedVariant?.id)
                          : updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                        className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </motion.button>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={item.quantity}
                          initial={{ y: -8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 8, opacity: 0 }}
                          transition={{ duration: 0.13 }}
                          className="w-6 text-center font-bold text-sm text-primary"
                        >
                          {item.quantity}
                        </motion.span>
                      </AnimatePresence>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                        className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                      onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                      className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                    <span className="font-extrabold text-sm">
                      PKR {(price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── Order summary ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:sticky lg:top-24 h-fit"
        >
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
            <h2 className="font-display font-bold text-lg mb-4">Order Summary</h2>

            {/* Free delivery progress */}
            <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {remaining > 0
                    ? `Add PKR ${remaining.toLocaleString()} more for free delivery!`
                    : "🎉 You've unlocked free delivery!"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-primary/15 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {items.map(item => {
                const p = item.selectedVariant
                  ? item.selectedVariant.price
                  : item.product.discount
                    ? Math.round(item.product.price * (1 - item.product.discount / 100))
                    : item.product.price;
                const displayName = item.selectedVariant
                  ? `${item.product.name} – ${item.selectedVariant.label}`
                  : item.product.name;
                return (
                  <div key={`${item.product.id}-${item.selectedVariant?.id ?? 'base'}`} className="flex justify-between text-muted-foreground">
                    <span className="truncate pr-2">{displayName} ×{item.quantity}</span>
                    <span className="flex-shrink-0">PKR {(p * item.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>PKR {Math.round(total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span className={remaining === 0 ? "text-emerald-600 font-semibold" : ""}>
                  {remaining === 0 ? "FREE" : "Calculated at checkout"}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2 border-t border-border/40">
                <span>Total</span>
                <span className="text-primary">PKR {Math.round(total).toLocaleString()}</span>
              </div>
            </div>

            <Link to="/checkout" className="block mt-5">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button className="w-full h-11 rounded-xl font-bold gap-2 relative overflow-hidden">
                  <motion.span
                    className="absolute inset-0 bg-white/15 skew-x-[-15deg]"
                    initial={{ x: "-130%" }}
                    whileHover={{ x: "230%" }}
                    transition={{ duration: 0.5 }}
                  />
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>

            <Link to="/shop" className="block mt-3 text-center text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;