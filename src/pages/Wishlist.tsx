import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.93 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { type: "spring" as const, stiffness: 130, damping: 18 } },
};

const Wishlist = () => {
  const { wishlist, loading } = useWishlist();

  if (loading) return (
    <div className="container py-20 flex flex-col items-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-10 w-10 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium">Loading your wishlist…</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* ── Banner header ── */}
      <section className="relative overflow-hidden bg-primary/5 border-b border-border/40 py-12">
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/8 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -12, 0], y: [0, 16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-16 left-10 w-52 h-52 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        />

        <div className="container relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
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
              Your Collection
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-extrabold tracking-tight"
            >
              My <span className="text-primary">Wishlist</span>
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center gap-3"
          >
            <div className="bg-primary/10 text-primary rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-extrabold leading-none">{wishlist.length}</div>
              <div className="text-[10px] font-semibold mt-0.5 opacity-80">
                {wishlist.length === 1 ? "Item Saved" : "Items Saved"}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-10">
        <AnimatePresence mode="wait">
          {wishlist.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-24 gap-5"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-28 h-28 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center shadow-lg"
              >
                <Heart className="h-14 w-14 text-red-400" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Your wishlist is empty</h2>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Tap the ❤️ heart on any product to save it here for later. Build your dream shopping list!
                </p>
                <Link to="/shop">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="rounded-full px-8 gap-2">
                      <Sparkles className="h-4 w-4" /> Browse Products
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ── Product grid ── */
            <motion.div
              key="grid"
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {wishlist.map(p => (
                <motion.div key={p.id} variants={cardVariants}>
                  <ProductCard product={p as any} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;