import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import {
  ArrowRight, Clock, Shield, ShoppingBag,
  ChevronLeft, ChevronRight, Sprout, Sun, Wheat, Leaf,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { useRef, useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

/* ─── Brand Design Tokens ─────────────────────────────────────────
   ALL navy values derived from footer: hsl(218 58% 20%)

   navyDeep   #0D1C36  hsl(218 62% 13%)  darkest overlays
   navyCore   #152B51  hsl(218 58% 20%)  footer / navbar exact
   navyMid    #1F3A6B  hsl(218 55% 27%)
   navyBright #2C4F8C  hsl(218 52% 36%)
   navyLight  #3D67AE  hsl(218 48% 46%)
   navyPale   #8DAEE2  hsl(218 60% 72%)  light text on dark bg

   Crimson untouched — only used for accents, CTAs, badges.
────────────────────────────────────────────────────────────────── */
const B = {
  navyDeep:    "#0D1C36",
  navyCore:    "#152B51",
  navyMid:     "#1F3A6B",
  navyBright:  "#2C4F8C",
  navyLight:   "#3D67AE",
  navyPale:    "#8DAEE2",
  crimsonDeep: "#991b1b",
  crimsonCore: "#b91c1c",
  crimsonVivid:"#dc2626",
  crimsonSoft: "#f87171",
  warmGray:    "#78716c",
};

const FONT = "'Plus Jakarta Sans', sans-serif";

function useReveal(amount = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  return { ref, inView };
}

// ─── Divider: navy wave ───────────────────────────────────────────
const OrganicDivider = () => {
  const { ref, inView } = useReveal(0.5);
  return (
    <div ref={ref} className="container py-1 overflow-hidden flex justify-center">
      <motion.svg
        width="100%" height="16" viewBox="0 0 800 16" fill="none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1.4 }}
      >
        <motion.path
          d="M0 8 C80 2,120 14,200 8 C280 2,320 14,400 8 C480 2,520 14,600 8 C680 2,720 14,800 8"
          stroke="url(#brandDiv)" strokeWidth="1.5" strokeLinecap="round" fill="none"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="brandDiv" x1="0" y1="0" x2="800" y2="0">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="20%"  stopColor={B.navyBright} stopOpacity="0.4" />
            <stop offset="50%"  stopColor={B.navyLight}  stopOpacity="0.55" />
            <stop offset="75%"  stopColor={B.crimsonCore} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
};

// ─── Section label ────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
    style={{ color: B.crimsonCore, fontFamily: FONT }}
  >
    <span className="h-px w-5 inline-block rounded-full" style={{ backgroundColor: B.crimsonCore }} />
    {children}
    <span className="h-px w-5 inline-block rounded-full" style={{ backgroundColor: B.crimsonCore }} />
  </span>
);

// ─── Section heading ──────────────────────────────────────────────
const SectionHeading = ({
  label, title, subtitle,
}: {
  label?: string;
  title: React.ReactNode;
  subtitle?: string;
}) => {
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
        className="leading-[1.1] tracking-tight"
        style={{
          fontFamily: FONT,
          fontSize: "clamp(1.7rem,3.5vw,2.8rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: B.navyCore,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed max-w-md font-normal text-muted-foreground" style={{ fontFamily: FONT }}>
          {subtitle}
        </p>
      )}
      {/* Navy → crimson animated underline */}
      <motion.div
        className="mt-4 flex items-center gap-1.5"
        initial={{ opacity: 0, x: -16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.25 }}
      >
        <motion.div
          className="h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${B.navyBright}, ${B.navyLight}, ${B.crimsonCore}, transparent)`,
            width: 52,
          }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: B.crimsonVivid }} />
      </motion.div>
    </motion.div>
  );
};

// ─── Promise cards ────────────────────────────────────────────────
const PromiseSection = () => {
  const { ref, inView } = useReveal(0.1);
  const cards = [
    { icon: Sprout, title: "Grown with Care",      body: "Sourced from local farms. Taste the freshness in every bite, every day.", color: B.navyBright  },
    { icon: Clock,  title: "Here in 30 Minutes",   body: "Order placed. Confirmed. At your door in under 30 minutes — always.",    color: B.crimsonCore },
    { icon: Sun,    title: "Best Prices in Lahore", body: "Direct from suppliers. No middleman. Every saving passed straight to you.", color: B.navyLight  },
    { icon: Shield, title: "7 Years of Trust",     body: "Since 2019, thousands of Lahore families trust us for their daily needs.", color: B.crimsonDeep },
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
              className="group relative rounded-2xl overflow-hidden cursor-default"
            >
              <div
                className="group relative rounded-2xl p-7 border overflow-hidden transition-all duration-400 hover:shadow-xl bg-card"
                style={{ borderColor: `${c.color}28`, borderRadius: "1rem" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse 90% 60% at 50% 110%, ${c.color}1a, transparent)` }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${c.color}70, ${c.color}, ${c.color}70)` }}
                />
                <div className="relative z-10">
                  <div
                    className="mb-5 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${c.color}12`, width: 52, height: 52 }}
                  >
                    <c.icon className="h-6 w-6" style={{ color: c.color }} />
                  </div>
                  <h3 className="text-sm font-bold mb-2 text-foreground" style={{ fontFamily: FONT }}>{c.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: FONT }}>{c.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Category Strip ───────────────────────────────────────────────
const CategoryStrip = ({ categories }: { categories: any[] }) => {
  const { ref, inView } = useReveal(0.1);
  return (
    <section className="py-20 overflow-hidden bg-muted/30 dark:bg-muted/10">
      <div className="container mb-10" ref={ref}>
        <div className="flex items-end justify-between">
          <SectionHeading label="Browse" title="Shop by Category" />
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/categories"
              className="group flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: B.crimsonCore, fontFamily: FONT }}
            >
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
                <Link
                  to={`/shop?category=${cat.id}`}
                  className="group relative block w-full h-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-400"
                  style={{ borderRadius: "1rem", border: `1.5px solid ${B.navyBright}20` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cat.image})` }}
                  />
                  {/* Footer navy overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${B.navyCore}cc 0%, ${B.navyCore}14 60%, transparent 100%)` }}
                  />
                  {/* Hover crimson warmth */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${B.crimsonDeep}40, transparent)` }}
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 z-10">
                    <p className="text-[11px] font-bold text-white leading-tight drop-shadow-md" style={{ fontFamily: FONT }}>
                      {cat.name}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-1 text-[9px] font-medium opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                      style={{ color: B.crimsonSoft }}
                    >
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

// ─── Generic Product Carousel ─────────────────────────────────────
const ProductCarousel = ({
  products, label, title, subtitle, viewAllLink,
  accentColor = B.navyBright,
  sectionClassName = "bg-background",
}: {
  products: any[];
  label: string;
  title: React.ReactNode;
  subtitle?: string;
  viewAllLink?: string;
  accentColor?: string;
  sectionClassName?: string;
}) => {
  const { ref, inView } = useReveal(0.1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  if (!products.length) return null;

  return (
    <section ref={ref} className={`py-20 overflow-hidden ${sectionClassName}`}>
      <div className="container mb-10">
        <div className="flex items-end justify-between">
          <SectionHeading label={label} title={title} subtitle={subtitle} />
          <div className="hidden md:flex items-center gap-2">
            {[prev, next].map((fn, i) => (
              <motion.button
                key={i} onClick={fn}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground transition-all"
              >
                {i === 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.button>
            ))}
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="group flex items-center gap-1.5 text-sm font-semibold transition-colors ml-2"
                style={{ color: accentColor, fontFamily: FONT }}
              >
                View All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 px-8 cursor-grab active:cursor-grabbing">
            {products.map((p) => (
              <div key={p.id} style={{ flexShrink: 0, width: "clamp(200px,22vw,260px)" }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Hot Deals ────────────────────────────────────────────────────
const HotDealsSection = ({ products }: { products: any[] }) => {
  const { ref, inView } = useReveal(0.1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  if (!products.length) return null;

  return (
    <section ref={ref} className="relative py-20 overflow-hidden bg-muted/30 dark:bg-muted/10">
      {/* Diagonal stripe texture — crimson tint */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, ${B.crimsonCore} 0, ${B.crimsonCore} 1px, transparent 0, transparent 50%)`,
          backgroundSize: "14px 14px",
        }}
      />
      {/* Top border — navy to crimson */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${B.navyBright}60, ${B.crimsonCore}60, transparent)` }}
      />
      {/* Bottom border */}
      <div
        className="absolute bottom-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${B.navyBright}60, ${B.crimsonCore}60, transparent)` }}
      />
      <div className="absolute right-8 top-8 opacity-[0.05] pointer-events-none select-none">
        <Wheat className="h-40 w-40" style={{ color: B.navyBright }} />
      </div>

      <div className="container relative z-10 mb-10">
        <div className="flex items-end justify-between">
          <SectionHeading label="Limited Time" title="Hot Deals" subtitle="Prices slashed on your favourite items." />
          <div className="hidden md:flex items-center gap-2">
            {[prev, next].map((fn, i) => (
              <motion.button
                key={i} onClick={fn}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground transition-all"
              >
                {i === 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.button>
            ))}
            <Link
              to="/shop"
              className="group flex items-center gap-1.5 text-sm font-semibold transition-colors ml-2"
              style={{ color: B.crimsonCore, fontFamily: FONT }}
            >
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
            {products.map((p) => (
              <div key={p.id} style={{ flexShrink: 0, width: "clamp(200px,22vw,260px)" }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Promo Carousel banners ───────────────────────────────────────
// Accents alternate between navy and crimson — both from brand palette
const banners = [
  { id: 1, tag: "Daily Harvest",   title: "Farm Fresh Organic",  sub: "Harvested Today",        accent: B.navyBright,   img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1920" },
  { id: 2, tag: "Express",         title: "30-Min Delivery",     sub: "Straight to Your Door",  accent: B.crimsonCore,  img: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1920" },
  { id: 3, tag: "Baked Fresh",     title: "Artisan Bakery",      sub: "Made Every Morning",     accent: B.navyLight,    img: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1920" },
  { id: 4, tag: "Up to 50% Off",   title: "Weekly Specials",     sub: "Limited Time Deals",     accent: B.crimsonVivid, img: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1920" },
  { id: 5, tag: "Home Essentials", title: "Everything You Need", sub: "Stock Up & Save",        accent: B.navyMid,      img: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=1920" },
];
const allBanners = [...banners, ...banners.map((b) => ({ ...b, id: b.id + 10 }))];

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
              <motion.button
                key={i} onClick={fn}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground transition-all"
              >
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
              <div
                key={b.id}
                className="flex-[0_0_88%] sm:flex-[0_0_70%] md:flex-[0_0_52%] lg:flex-[0_0_40%] px-2.5"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="group relative h-[260px] md:h-[320px] overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500"
                  style={{ borderRadius: "1.5rem", border: `1.5px solid ${B.navyBright}22` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${b.img})` }}
                  />
                  {/* Footer navy overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${B.navyDeep}e0 0%, ${B.navyDeep}40 60%, transparent 100%)` }}
                  />
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 inset-x-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${b.accent}, ${b.accent}80, transparent)` }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-7 z-10">
                    <span
                      className="self-start mb-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.16em] uppercase backdrop-blur-sm"
                      style={{
                        color: "rgba(255,255,255,0.90)",
                        backgroundColor: `${b.accent}30`,
                        border: `1px solid ${b.accent}45`,
                        fontFamily: FONT,
                      }}
                    >
                      {b.tag}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: FONT, color: "#ffffff" }}>
                      {b.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.50)", fontFamily: FONT }}>
                      {b.sub}
                    </p>
                    <Link to="/shop">
                      <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all"
                        style={{
                          backgroundColor: `${b.accent}25`,
                          border: "1px solid",
                          borderColor: `${b.accent}45`,
                          color: "#ffffff",
                          fontFamily: FONT,
                        }}
                        whileHover={{ backgroundColor: `${b.accent}45`, x: 4 }}
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

      {/* Dots: navy inactive, crimson active */}
      <div className="flex justify-center gap-1.5 mt-7">
        {banners.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            animate={{
              width: selected % banners.length === i ? 20 : 6,
              backgroundColor: selected % banners.length === i ? B.navyBright : B.warmGray,
            }}
          />
        ))}
      </div>
    </section>
  );
};

// ─── Editorial CTA ────────────────────────────────────────────────
const EditorialCTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useSpring(useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]), { stiffness: 60, damping: 20 });
  const { ref: inRef, inView } = useReveal(0.3);

  return (
    <section ref={ref} className="py-6 overflow-hidden bg-background">
      <div className="container pb-20">
        <div
          ref={inRef}
          className="relative overflow-hidden min-h-[400px] md:min-h-[460px] flex items-center"
          style={{ borderRadius: "2rem", border: `2px solid ${B.navyBright}20` }}
        >
          {/* Parallax background */}
          <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2000')" }}
            />
          </motion.div>

          {/* Footer navy overlay — left-to-right */}
          <div
            className="absolute inset-0 z-[1]"
            style={{ background: `linear-gradient(to right, ${B.navyDeep}f0 0%, ${B.navyCore}b0 50%, ${B.navyDeep}30 100%)` }}
          />
          {/* Crimson radial at left edge */}
          <div
            className="absolute inset-0 z-[2]"
            style={{ background: `radial-gradient(ellipse 55% 80% at 0% 50%, ${B.crimsonDeep}28, transparent)` }}
          />
          <div className="absolute right-12 top-10 opacity-[0.06] pointer-events-none">
            <Leaf className="h-48 w-48" style={{ color: B.navyLight }} />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -45 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 px-8 md:px-14 py-14 max-w-xl"
          >
            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase mb-7"
              style={{
                backgroundColor: `${B.crimsonDeep}25`,
                borderColor: `${B.crimsonSoft}30`,
                color: B.crimsonSoft,
                fontFamily: FONT,
              }}
            >
              <Sprout className="h-3 w-3" /> Start Shopping Today
            </div>

            <h2
              className="font-extrabold leading-tight mb-5"
              style={{ fontFamily: FONT, fontSize: "clamp(2rem,4.5vw,3.5rem)", color: "#ffffff", letterSpacing: "-0.02em" }}
            >
              Your Table
              <br />
              {/* Pale navy → crimson soft sweep */}
              <span
                style={{
                  WebkitTextFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  backgroundImage: `linear-gradient(135deg, ${B.navyPale} 0%, ${B.crimsonSoft} 100%)`,
                }}
              >
                Deserves Better.
              </span>
            </h2>

            <p className="text-base leading-relaxed mb-8 font-normal" style={{ color: "rgba(255,255,255,0.52)", fontFamily: FONT }}>
              Farm-fresh. Affordable. Delivered to your door. Browse our full collection today.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Primary — footer navy solid */}
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05, y: -3, boxShadow: `0 16px 44px ${B.navyBright}55` }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm text-white"
                  style={{
                    background: `linear-gradient(135deg, ${B.navyBright}, ${B.navyDeep})`,
                    fontFamily: FONT,
                    boxShadow: `0 4px 20px ${B.navyDeep}40, inset 0 1px 0 rgba(255,255,255,0.12)`,
                  }}
                >
                  <ShoppingBag className="h-4 w-4" /> Shop Now <ArrowRight className="h-3.5 w-3.5" />
                </motion.button>
              </Link>

              {/* Secondary — crimson ghost */}
              <Link to="/categories">
                <motion.button
                  whileHover={{ scale: 1.05, y: -3, backgroundColor: `${B.crimsonDeep}25`, borderColor: `${B.crimsonCore}55` }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all"
                  style={{
                    color: "#ffffff",
                    border: `1.5px solid ${B.crimsonCore}30`,
                    backgroundColor: `${B.crimsonDeep}12`,
                    backdropFilter: "blur(12px)",
                    fontFamily: FONT,
                  }}
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

// ─── Page root ────────────────────────────────────────────────────
const Index = () => {
  const { products, categories } = useCart();
  const featured   = products.filter((p) => p.badge === "bestseller" && p.inStock).slice(0, 12);
  const discounted = products.filter((p) => p.badge === "discount"   && p.inStock);

  return (
    <PageTransition>
      <Helmet>
        <title>Altaf Cash and Carry | Lahore's Finest Grocer</title>
        <meta name="description" content="Farm-fresh groceries delivered in 30 minutes. Shop Altaf Cash & Carry." />
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body, h1, h2, h3, h4, h5, h6, p, span, button, a { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      <div className="overflow-x-hidden">
        <HeroSection />
        <PromiseSection />
        <OrganicDivider />
        <PromoCarousel />
        <OrganicDivider />
        <CategoryStrip categories={categories} />
        <ProductCarousel
          products={featured}
          label="Most Loved"
          title="Best Sellers"
          subtitle="Our customers keep coming back for these."
          viewAllLink="/shop"
          accentColor={B.crimsonCore}
        />
        <OrganicDivider />
        <HotDealsSection products={discounted} />
        <EditorialCTA />
      </div>
    </PageTransition>
  );
};

export default Index;