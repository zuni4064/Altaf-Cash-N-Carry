import HeroSection from "@/components/HeroSection";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Link } from "react-router-dom";
import {
  motion, useScroll, useTransform, useSpring, useInView,
} from "framer-motion";
import {
  ArrowRight, Leaf, Zap, Clock, Shield,
  ShoppingBag, ShoppingCart, Star, Tag, Heart,
  ChevronLeft, ChevronRight, Sprout, Sun, Wheat,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { useRef, useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

/* ════════════════════════════════════════════════════════
   ORGANIC DESIGN TOKENS
   All warm/nature colours used consistently
════════════════════════════════════════════════════════ */
const C = {
  cream:       "#fef9f0",
  warmWhite:   "#fffbf5",
  amber:       "#d97706",
  amberLight:  "#fbbf24",
  amberDeep:   "#b45309",
  sage:        "#65a30d",
  sageLight:   "#84cc16",
  sageDark:    "#365314",
  terracotta:  "#c2410c",
  stone:       "#78716c",
  stoneDark:   "#44403c",
  bark:        "#292524",
  honey:       "#f59e0b",
  moss:        "#4d7c0f",
};

/* ════════════════════════════════════════════════════════
   HOOKS
════════════════════════════════════════════════════════ */
function useReveal(amount = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  return { ref, inView };
}

/* ════════════════════════════════════════════════════════
   ORGANIC DIVIDER — hand-drawn wavy line
════════════════════════════════════════════════════════ */
const OrganicDivider = () => {
  const { ref, inView } = useReveal(0.5);
  return (
    <div ref={ref} className="container py-1 overflow-hidden flex justify-center">
      <motion.svg
        width="100%" height="16" viewBox="0 0 800 16" fill="none" xmlns="http://www.w3.org/2000/svg"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.path
          d="M0 8 C80 2, 120 14, 200 8 C280 2, 320 14, 400 8 C480 2, 520 14, 600 8 C680 2, 720 14, 800 8"
          stroke="url(#div)" strokeWidth="1.5" strokeLinecap="round" fill="none"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="div" x1="0" y1="0" x2="800" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor={C.amber} stopOpacity="0.35" />
            <stop offset="50%" stopColor={C.honey} stopOpacity="0.5" />
            <stop offset="80%" stopColor={C.sage} stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   SECTION HEADING — warm serif style
════════════════════════════════════════════════════════ */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
    style={{ color: C.amber, fontFamily: "'DM Sans', sans-serif" }}
  >
    <span className="h-px w-5 inline-block rounded-full" style={{ backgroundColor: C.amber }} />
    {children}
    <span className="h-px w-5 inline-block rounded-full" style={{ backgroundColor: C.amber }} />
  </span>
);

const SectionHeading = ({
  label, title, subtitle,
}: { label?: string; title: React.ReactNode; subtitle?: string }) => {
  const { ref, inView } = useReveal(0.3);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {label && <SectionLabel>{label}</SectionLabel>}
      <h2
        className="leading-[1.05] tracking-tight text-foreground"
        style={{
          fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          fontSize: "clamp(1.9rem, 4vw, 3.2rem)",
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed max-w-md font-light"
          style={{ color: C.stone, fontFamily: "'DM Sans', sans-serif" }}>
          {subtitle}
        </p>
      )}
      {/* Organic seed-pod accent */}
      <motion.div
        className="mt-4 flex items-center gap-1.5"
        initial={{ opacity: 0, x: -16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.25 }}
      >
        <motion.div
          className="h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg,${C.amber},${C.honey},transparent)`, width: 48 }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.amberLight }} />
      </motion.div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════
   TRUST STRIP — warm dark earthy bar
════════════════════════════════════════════════════════ */
const TrustStrip = () => {
  const { ref, inView } = useReveal(0.3);
  const specs = [
    { value: "500+",   label: "Products",         icon: "🌿" },
    { value: "30 Min", label: "Express Delivery",  icon: "🚚" },
    { value: "4.5★",   label: "Rating",            icon: "⭐" },
    { value: "7 Yrs",  label: "Trusted Service",   icon: "🤝" },
    { value: "100%",   label: "Fresh Guarantee",   icon: "✅" },
  ];
  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(135deg,${C.bark},${C.stoneDark})` }}
    >
      {/* Diagonal texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(-45deg,rgba(255,255,255,1) 0,rgba(255,255,255,1) 1px,transparent 0,transparent 50%)", backgroundSize: "10px 10px" }} />
      {/* Warm top edge */}
      <div className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg,transparent,${C.amber},${C.honey},${C.sage},transparent)` }} />

      <div className="container py-7 relative z-10">
        <div className="grid grid-cols-3 md:grid-cols-5 divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {specs.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 py-3 text-center"
            >
              <div className="text-xl mb-0.5 select-none">{s.icon}</div>
              <p className="text-2xl md:text-3xl font-black leading-none mb-1"
                style={{ fontFamily: "'Cormorant Garamond','Playfair Display',serif", color: C.amberLight }}>
                {s.value}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase font-semibold"
                style={{ color: "rgba(254,243,199,0.4)" }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   PROMISE CARDS — warm organic cards
════════════════════════════════════════════════════════ */
const PromiseSection = () => {
  const { ref, inView } = useReveal(0.1);
  const cards = [
    { icon: Sprout, title: "Grown with Care",       body: "Sourced from local farms. Taste the freshness in every bite, every day.", color: C.sage       },
    { icon: Clock,  title: "Here in 30 Minutes",   body: "Order placed. Confirmed. At your door in under 30 minutes — always.",     color: "#2563eb"    },
    { icon: Sun,    title: "Best Prices in Lahore", body: "Direct from suppliers. No middleman. Every saving passed straight to you.", color: C.amber    },
    { icon: Shield, title: "7 Years of Trust",     body: "Since 2019, thousands of Lahore families trust us for their daily needs.",  color: C.terracotta },
  ];
  return (
    <section ref={ref} className="py-20 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-12">
          <SectionHeading label="Our Promise" title={<>Why Choose<br />Altaf?</>} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, rotateX: 14 }}
              animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.06 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              style={{ transformPerspective: 900 }}
              className="group relative rounded-2xl overflow-hidden cursor-default transition-all duration-400"
            >
              <div
                className="group relative rounded-2xl p-7 border overflow-hidden cursor-default transition-all duration-400 hover:shadow-xl bg-card dark:bg-card"
                style={{ borderColor: `${c.color}25`, borderRadius: "1rem" }}
              >
                {/* Hover wash */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse 90% 60% at 50% 110%, ${c.color}18, transparent)` }} />
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg,${c.color}80,${c.color},${c.color}80)` }} />

                <div className="relative z-10">
                  <div className="mb-5 h-13 w-13 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${c.color}15`, width: 52, height: 52 }}>
                    <c.icon className="h-6 w-6" style={{ color: c.color }} />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-foreground" style={{ fontFamily: "'Cormorant Garamond','Playfair Display',serif", fontSize: "1.05rem" }}>{c.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: "'DM Sans',sans-serif" }}>{c.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   CATEGORIES — warm scroll strip
════════════════════════════════════════════════════════ */
const CategoryStrip = ({ categories }: { categories: any[] }) => {
  const { ref, inView } = useReveal(0.1);
  return (
    <section className="py-20 overflow-hidden bg-muted/30 dark:bg-muted/10">
      <div className="container mb-10" ref={ref}>
        <div className="flex items-end justify-between">
          <SectionHeading label="Browse" title="Shop by Category" />
          <motion.div initial={{ opacity: 0, x: 16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 }}>
            <Link to="/categories" className="group flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: C.amber, fontFamily: "'DM Sans',sans-serif" }}>
              View All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-muted/30 dark:from-muted/10 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-muted/30 dark:from-muted/10 to-transparent" />

        <div className="flex gap-4 px-8 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat, i) => {
            const isTall = i % 3 === 0;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: 35 + i * 8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, scale: 1.04 }}
                style={{ transformPerspective: 600, flexShrink: 0 }}
                className={isTall ? "w-44 h-52" : "w-36 h-44"}
              >
                <Link to={`/shop?category=${cat.id}`}
                  className="group relative block w-full h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-400"
                  style={{ borderRadius: "1rem", border: `1.5px solid rgba(180,83,9,0.12)` }}
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cat.image})` }} />
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top,rgba(41,21,6,0.78) 0%,rgba(41,21,6,0.08) 60%,transparent 100%)" }} />
                  {/* Warm tint on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(to top,rgba(180,83,9,0.25),transparent)" }} />
                  <div className="absolute bottom-0 inset-x-0 p-3 z-10">
                    <p className="text-[11px] font-bold text-white leading-tight drop-shadow-md"
                      style={{ fontFamily: "'DM Sans',sans-serif" }}>{cat.name}</p>
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-medium opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                      style={{ color: C.amberLight }}>
                      Shop <ArrowRight className="h-2.5 w-2.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   SHARED PRODUCT CARD — warm organic style
   Used by both Best Sellers and Hot Deals
════════════════════════════════════════════════════════ */
const ProductScrollCard = ({
  product, index, variant = "green",
}: {
  product: any; index: number; inView?: boolean; variant?: "green" | "warm";
}) => {
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = wishlist.some((item: any) => item.id === product.id);

  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isBestSeller = product.badge === "bestseller";

  const accentColor  = variant === "warm" ? C.terracotta : C.moss;
  const badgeGrad    = variant === "warm"
    ? "linear-gradient(135deg,#c2410c,#ea580c)"
    : "linear-gradient(135deg,#4d7c0f,#65a30d)";
  const btnGrad      = variant === "warm"
    ? "linear-gradient(135deg,#fde68a,#fbbf24)"
    : "linear-gradient(135deg,#d9f99d,#84cc16)";
  const btnColor     = variant === "warm" ? "#78350f" : "#1a2e05";
  const priceColor   = variant === "warm" ? C.terracotta : C.moss;

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -10, scale: 1.025 }}
        style={{
          transformPerspective: 800,
          flexShrink: 0,
          width: "clamp(190px,21vw,240px)",
          borderRadius: "1.1rem",
          border: `1.5px solid rgba(180,83,9,0.12)`,
          overflow: "hidden",
        }}
        className="group bg-card transition-all duration-400 hover:shadow-xl"
      >
        {/* Image */}
        <div className="relative overflow-hidden bg-amber-50" style={{ height: 170 }}>
          {product.image ? (
            <img src={product.image} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: "linear-gradient(135deg,#fef9c3,#fef3c7)" }}>🛒</div>
          )}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top,rgba(41,21,6,0.4) 0%,transparent 60%)" }} />

          {/* Discount badge */}
          {discount > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
              className="absolute top-3 left-3 flex flex-col items-center justify-center rounded-full shadow-lg"
              style={{ width: 50, height: 50, background: badgeGrad, boxShadow: `0 6px 18px ${accentColor}50` }}
            >
              <span className="text-white font-black text-sm leading-none">-{discount}</span>
              <span className="text-white/85 font-bold text-[9px] leading-none">%</span>
            </motion.div>
          )}

          {/* Best seller badge */}
          {isBestSeller && !discount && (
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
              className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 4px 14px rgba(251,191,36,0.45)" }}
            >
              <Star className="h-2.5 w-2.5 text-amber-900 fill-amber-900" />
              <span className="text-amber-900 text-[9px] font-black tracking-wide">TOP</span>
            </motion.div>
          )}

          {/* Wishlist button */}
          <motion.button
            onClick={handleWishlist}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center transition-all duration-200"
            style={{ backgroundColor: isWishlisted ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.25)" }}
          >
            <Heart
              className="h-3.5 w-3.5"
              style={{ color: "white", fill: isWishlisted ? "white" : "transparent" }}
            />
          </motion.button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-[10px] mb-0.5 truncate font-medium uppercase tracking-wider text-muted-foreground"
            style={{ fontFamily: "'DM Sans',sans-serif" }}>{product.category}</p>
          <h4 className="text-sm font-bold leading-snug line-clamp-2 mb-3 text-foreground"
            style={{ fontFamily: "'DM Sans',sans-serif" }}>{product.name}</h4>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-lg font-black block leading-none" style={{ color: priceColor, fontFamily: "'Cormorant Garamond','Playfair Display',serif" }}>
                Rs.{product.price?.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-[11px] line-through leading-tight text-muted-foreground">
                  Rs.{product.originalPrice?.toLocaleString()}
                </span>
              )}
            </div>
            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.08, boxShadow: `0 8px 24px ${accentColor}35` }}
              whileTap={{ scale: 0.93 }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200"
              style={{
                background: addedFeedback ? "linear-gradient(135deg,#34d399,#10b981)" : btnGrad,
                color: addedFeedback ? "#fff" : btnColor,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <ShoppingCart className="h-3 w-3" />
              {addedFeedback ? "Added!" : "Add"}
            </motion.button>
          </div>
        </div>

        {/* Hover bottom accent */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: `linear-gradient(90deg,transparent,${accentColor},transparent)` }} />
      </motion.div>
    </Link>
  );
};

/* ════════════════════════════════════════════════════════
   BEST SELLERS — horizontal drag scroll
════════════════════════════════════════════════════════ */
const BestSellersSection = ({ products }: { products: any[] }) => {
  const { ref, inView } = useReveal(0.1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  if (!products.length) return null;

  return (
    <section ref={ref} className="py-20 overflow-hidden bg-background">
      <div className="container mb-10">
        <div className="flex items-end justify-between">
          <SectionHeading label="Most Loved" title="Best Sellers" subtitle="Our customers keep coming back for these." />
          <div className="hidden md:flex items-center gap-2">
            {[prev, next].map((fn, i) => (
              <motion.button key={i} onClick={fn}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground transition-all"
              >
                {i === 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.button>
            ))}
            <Link to="/shop" className="group flex items-center gap-1.5 text-sm font-semibold transition-colors ml-2"
              style={{ color: C.amber, fontFamily: "'DM Sans',sans-serif" }}>
              View All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 px-8 cursor-grab active:cursor-grabbing">
            {products.map((p, i) => (
              <ProductScrollCard key={p.id} product={p} index={i} variant="green" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   HOT DEALS — terracotta warm section
════════════════════════════════════════════════════════ */
const HotDealsSection = ({ products }: { products: any[] }) => {
  const { ref, inView } = useReveal(0.1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  if (!products.length) return null;

  return (
    <section ref={ref} className="relative py-20 overflow-hidden bg-muted/30 dark:bg-muted/10"
    >
      {/* Warm diagonal stripes */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(-45deg,rgba(194,65,12,1) 0,rgba(194,65,12,1) 1px,transparent 0,transparent 50%)", backgroundSize: "14px 14px" }} />
      <div className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg,transparent,${C.terracotta}55,${C.amber}55,transparent)` }} />
      <div className="absolute bottom-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg,transparent,${C.terracotta}55,${C.amber}55,transparent)` }} />

      {/* Wheat decoration */}
      <div className="absolute right-8 top-8 opacity-[0.06] pointer-events-none select-none">
        <Wheat className="h-40 w-40 text-amber-700" />
      </div>

      <div className="container relative z-10 mb-10">
        <div className="flex items-end justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0,-10,10,-6,0], scale: [1,1.1,1] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
              className="text-3xl mt-1 select-none"
            >🔥</motion.div>
            <SectionHeading label="Limited Time" title="Hot Deals" subtitle="Prices slashed on your favourite items." />
          </div>
          <div className="hidden md:flex items-center gap-2">
            {[prev, next].map((fn, i) => (
              <motion.button key={i} onClick={fn}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground transition-all"
              >
                {i === 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.button>
            ))}
            <Link to="/shop" className="group flex items-center gap-1.5 text-sm font-semibold transition-colors ml-2"
              style={{ color: C.terracotta, fontFamily: "'DM Sans',sans-serif" }}>
              All Deals <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-muted/30 dark:from-muted/10 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-muted/30 dark:from-muted/10 to-transparent" />
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 px-8 cursor-grab active:cursor-grabbing">
            {products.map((p, i) => (
              <ProductScrollCard key={p.id} product={p} index={i} variant="warm" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   PROMO CAROUSEL — warm farm banners
════════════════════════════════════════════════════════ */
const banners = [
  { id:1, tag:"Daily Harvest",  title:"Farm Fresh Organic",  sub:"Harvested Today",        accent:"#65a30d", img:"https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1920" },
  { id:2, tag:"Express",        title:"30-Min Delivery",     sub:"Straight to Your Door",  accent:"#d97706", img:"https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1920" },
  { id:3, tag:"Baked Fresh",    title:"Artisan Bakery",      sub:"Made Every Morning",     accent:"#b45309", img:"https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1920" },
  { id:4, tag:"Up to 50% Off",  title:"Weekly Specials",     sub:"Limited Time Deals",     accent:"#c2410c", img:"https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1920" },
  { id:5, tag:"Home Essentials",title:"Everything You Need", sub:"Stock Up & Save",        accent:"#92400e", img:"https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=1920" },
];
const allBanners = [...banners, ...banners.map(b => ({ ...b, id: b.id + 10 }))];

const PromoCarousel = () => {
  const { ref, inView } = useReveal(0.2);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelected(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section ref={ref} className="py-20 overflow-hidden bg-muted/30 dark:bg-muted/10">
      <div className="container mb-10">
        <div className="flex items-end justify-between">
          <SectionHeading label="This Week" title={<>Featured<br />Promotions</>} />
          <div className="hidden md:flex items-center gap-2">
            {[prev, next].map((fn, i) => (
              <motion.button key={i} onClick={fn} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground transition-all">
                {i === 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex cursor-grab active:cursor-grabbing">
            {allBanners.map((b) => (
              <div key={b.id} className="flex-[0_0_88%] sm:flex-[0_0_70%] md:flex-[0_0_52%] lg:flex-[0_0_40%] px-2.5">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="group relative h-[260px] md:h-[320px] overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500"
                  style={{ borderRadius: "1.5rem", border: `1.5px solid rgba(180,83,9,0.15)` }}
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${b.img})` }} />
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top,rgba(41,21,6,0.88) 0%,rgba(41,21,6,0.25) 60%,transparent 100%)" }} />
                  {/* Warm colour top line */}
                  <div className="absolute top-0 inset-x-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg,${b.accent},${b.accent}88,transparent)` }} />

                  <div className="absolute inset-0 flex flex-col justify-end p-7 z-10">
                    <span className="self-start mb-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.16em] uppercase backdrop-blur-sm"
                      style={{ color: "rgba(254,243,199,0.92)", borderColor: `${b.accent}50`, backgroundColor: `${b.accent}25`, border: "1px solid", fontFamily: "'DM Sans',sans-serif" }}>
                      {b.tag}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black mb-1"
                      style={{ fontFamily: "'Cormorant Garamond','Playfair Display',serif", color: "#fef3c7" }}>
                      {b.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: "rgba(254,243,199,0.5)", fontFamily: "'DM Sans',sans-serif" }}>
                      {b.sub}
                    </p>
                    <Link to="/shop">
                      <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-sm transition-all"
                        style={{ borderColor: `${b.accent}45`, backgroundColor: `${b.accent}20`, color: "#fef3c7", border: "1px solid", fontFamily: "'DM Sans',sans-serif" }}
                        whileHover={{ backgroundColor: `${b.accent}40`, x: 4 }}
                      >
                        Shop Now <ArrowRight className="h-3.5 w-3.5" />
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Warm dots */}
      <div className="flex justify-center gap-1.5 mt-7">
        {banners.map((_, i) => (
          <motion.button key={i} onClick={() => emblaApi?.scrollTo(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: C.stone }}
            animate={{ width: selected % banners.length === i ? 20 : 6, backgroundColor: selected % banners.length === i ? C.amber : C.stone }}
          />
        ))}
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   EDITORIAL CTA — warm forest scene
════════════════════════════════════════════════════════ */
const EditorialCTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useSpring(useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]), { stiffness: 60, damping: 20 });
  const { ref: inRef, inView } = useReveal(0.3);

  return (
    <section ref={ref} className="py-6 overflow-hidden bg-background">
      <div className="container pb-20">
        <div ref={inRef} className="relative overflow-hidden min-h-[400px] md:min-h-[460px] flex items-center"
          style={{ borderRadius: "2rem", border: `2px solid rgba(180,83,9,0.12)` }}>
          <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
            <div className="absolute inset-0 scale-110 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2000')" }} />
          </motion.div>
          <div className="absolute inset-0 z-[1]"
            style={{ background: "linear-gradient(to right,rgba(41,21,6,0.92) 0%,rgba(41,21,6,0.7) 50%,rgba(41,21,6,0.2) 100%)" }} />
          <div className="absolute inset-0 z-[2]"
            style={{ background: "radial-gradient(ellipse 55% 80% at 0% 50%,rgba(180,83,9,0.2),transparent)" }} />

          {/* Decorative leaf */}
          <div className="absolute right-12 top-10 opacity-[0.08] pointer-events-none">
            <Leaf className="h-48 w-48 text-lime-400" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -45 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 px-8 md:px-14 py-14 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase mb-7"
              style={{ backgroundColor: "rgba(180,83,9,0.2)", borderColor: "rgba(251,191,36,0.25)", color: C.amberLight, fontFamily: "'DM Sans',sans-serif" }}>
              <Sprout className="h-3 w-3" /> Start Shopping Today
            </div>
            <h2 className="font-black leading-[0.92] mb-5 tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond','Playfair Display',serif", fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fef3c7" }}>
              Your Table<br />Deserves Better.
            </h2>
            <p className="text-base leading-relaxed mb-8 font-light"
              style={{ color: "rgba(254,243,199,0.55)", fontFamily: "'DM Sans',sans-serif" }}>
              Farm-fresh. Affordable. Delivered to your door. Browse our full collection today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05, y: -3, boxShadow: "0 16px 44px rgba(180,83,9,0.45)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm"
                  style={{ background: "linear-gradient(135deg,#d97706,#b45309)", color: "#fef3c7", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 20px rgba(180,83,9,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" }}
                >
                  <ShoppingBag className="h-4 w-4" /> Shop Now <ArrowRight className="h-3.5 w-3.5" />
                </motion.button>
              </Link>
              <Link to="/categories">
                <motion.button
                  whileHover={{ scale: 1.05, y: -3, backgroundColor: "rgba(254,243,199,0.14)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all"
                  style={{ color: "#fef3c7", border: "1.5px solid rgba(254,243,199,0.22)", backgroundColor: "rgba(254,243,199,0.07)", backdropFilter: "blur(12px)", fontFamily: "'DM Sans',sans-serif" }}
                >
                  Browse Categories
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
const Index = () => {
  const { products, categories } = useCart();
  const featured   = products.filter(p => p.badge === "bestseller" && p.inStock).slice(0, 12);
  const discounted = products.filter(p => p.badge === "discount"   && p.inStock);

  return (
    <PageTransition>
      <Helmet>
        <title>Altaf Cash and Carry | Lahore's Finest Grocer</title>
        <meta name="description" content="Farm-fresh groceries delivered in 30 minutes. Shop Altaf Cash & Carry." />
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        body  { font-family: 'DM Sans', sans-serif; }
        h1,h2 { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; }
        ::-webkit-scrollbar { display: none; }
        *     { scrollbar-width: none; }
      `}</style>

      <div className="overflow-x-hidden">
        <HeroSection />
        <TrustStrip />
        <PromiseSection />
        <OrganicDivider />
        <PromoCarousel />
        <OrganicDivider />
        <CategoryStrip categories={categories} />
        <BestSellersSection products={featured} />
        <OrganicDivider />
        <HotDealsSection products={discounted} />
        <ReviewsCarousel />
        <EditorialCTA />
      </div>
    </PageTransition>
  );
};

export default Index;