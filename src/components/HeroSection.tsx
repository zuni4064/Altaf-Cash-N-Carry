import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useRef, useEffect } from "react";

const FONT = "'Plus Jakarta Sans', sans-serif";

// ─── Brand tokens ────────────────────────────────────────────────
// Navy Purple  : #1e1b6e  (deep) / #2d2a8e (mid) / #3730a3 (bright)
// Crimson Red  : #991b1b  (deep) / #b91c1c (core) / #dc2626 (vivid)
// ─────────────────────────────────────────────────────────────────

const GrainOverlay = () => (
  <div
    className="pointer-events-none absolute inset-0 z-10 opacity-[0.035] mix-blend-overlay"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "128px",
    }}
  />
);

// Scroll-progress line: navy → crimson (brand sweep left to right)
const ScrollLine = ({ progress }: { progress: any }) => {
  const scaleX = useSpring(progress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #3730a3, #6d28d9 40%, #b91c1c)",
      }}
    />
  );
};

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const bgScale   = useSpring(useTransform(heroProgress, [0, 1], [1, 1.1]),      { stiffness: 55, damping: 18 });
  const bgY       = useSpring(useTransform(heroProgress, [0, 1], ["0%", "18%"]), { stiffness: 55, damping: 18 });
  const fgOpacity = useSpring(useTransform(heroProgress, [0, 0.65], [1, 0]),     { stiffness: 80, damping: 25 });
  const fgY       = useSpring(useTransform(heroProgress, [0, 1], ["0%", "12%"]), { stiffness: 80, damping: 25 });

  // Subtle 3-D tilt on mouse move
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });
  const tiltY = useTransform(smx, [-600, 600], [-5, 5]);
  const tiltX = useTransform(smy, [-400, 400], [4, -4]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      mx.set(e.clientX - r.left - r.width / 2);
      my.set(e.clientY - r.top - r.height / 2);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  return (
    <>
      <ScrollLine progress={scrollYProgress} />

      <section
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(520px, 76vh, 780px)" }}
      >
        {/* ── Background image with parallax ── */}
        <motion.div className="absolute inset-0 z-0" style={{ scale: bgScale, y: bgY }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=2000&q=90')",
            }}
          />
        </motion.div>

        {/* ── Layered overlays — deep navy atmosphere ── */}
        {/* Base dark veil */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0f0d3a]/75 via-[#0f0d3a]/40 to-[#0f0d3a]/85" />
        {/* Left-edge navy radial — gives editorial depth */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#1e1b6e]/65 via-transparent to-transparent" />
        {/* Bottom crimson warmth — ties to brand accent */}
        <div
          className="absolute inset-0 z-[3]"
          style={{
            background:
              "radial-gradient(ellipse 65% 40% at 50% 120%, rgba(185,28,28,0.28), transparent)",
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 z-[4] opacity-[0.022] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <GrainOverlay />

        {/* ── Content ── */}
        <motion.div
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: fgOpacity, y: fgY }}
        >
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/6 backdrop-blur-xl"
          >
            {/* Crimson pulse dot — brand red */}
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#dc2626" }}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/65"
              style={{ fontFamily: FONT }}
            >
              Altaf Cash & Carry · Est. 2019
            </span>
          </motion.div>

          {/* Headline with 3-D tilt */}
          <motion.div
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              transformPerspective: 1100,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 50, filter: "blur(16px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="font-black leading-[0.95] text-white"
              style={{
                fontFamily: FONT,
                fontSize: "clamp(2.8rem, 9vw, 7.5rem)",
                textShadow: "0 24px 60px rgba(10,8,50,0.55)",
                letterSpacing: "-0.03em",
              }}
            >
              Shop Smart.
              <br />
              {/* Headline accent: navy → crimson — pure brand sweep */}
              <motion.span
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  WebkitTextFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  backgroundImage:
                    "linear-gradient(135deg, #a5b4fc 0%, #818cf8 35%, #f87171 80%, #fca5a5 100%)",
                }}
              >
                Live Better.
              </motion.span>
            </motion.h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-lg text-base md:text-lg leading-relaxed text-white/55"
            style={{ fontFamily: FONT, fontWeight: 400 }}
          >
            Fresh groceries, household essentials, personal care, bakery items and
            more — delivered across Lahore.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.78, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex items-center gap-3 flex-wrap justify-center"
          >
            {/* Primary CTA — deep navy pill */}
            <Link to="/shop">
              <motion.button
                whileHover={{
                  scale: 1.06,
                  y: -3,
                  boxShadow: "0 18px 44px rgba(55,48,163,0.5)",
                }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white"
                style={{
                  background: "linear-gradient(135deg, #3730a3, #1e1b6e)",
                  fontFamily: FONT,
                  boxShadow:
                    "0 4px 20px rgba(30,27,110,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <ShoppingBag className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                Shop Now
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            {/* Secondary CTA — crimson-tinted ghost pill */}
            <Link to="/categories">
              <motion.button
                whileHover={{
                  scale: 1.06,
                  y: -3,
                  backgroundColor: "rgba(185,28,28,0.18)",
                  borderColor: "rgba(220,38,38,0.5)",
                }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white transition-all"
                style={{
                  border: "1.5px solid rgba(220,38,38,0.28)",
                  backgroundColor: "rgba(185,28,28,0.10)",
                  backdropFilter: "blur(12px)",
                  fontFamily: FONT,
                }}
              >
                Browse Categories
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
};

export default HeroSection;