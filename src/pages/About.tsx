import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, Truck, Heart, Leaf, Users, Award, Clock, MapPin } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

/* ── Inlined AnimatedCounter (no external import needed) ── */
const useAnimatedCounter = (target: number, duration = 1800) => {
  const ref      = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId     = useRef<number | null>(null);

  useEffect(() => {
    if (!isInView) return;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [isInView, target, duration]);

  return { ref, count };
};

const Counter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const { ref, count } = useAnimatedCounter(target);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ── Data ── */
const VALUES = [
  { icon: Leaf,        title: "Fresh Quality",  desc: "We source directly from farms to ensure the freshest produce every day.",     color: "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500" },
  { icon: ShieldCheck, title: "Best Prices",    desc: "Wholesale prices on all items — save more on every purchase.",                color: "bg-blue-500/10 text-blue-600 group-hover:bg-blue-500"         },
  { icon: Truck,       title: "Fast Delivery",  desc: "Quick delivery across Lahore, right to your doorstep.",                      color: "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500"      },
  { icon: Heart,       title: "Customer Love",  desc: "Thousands of happy families trust Cash & Carry for their daily needs.",      color: "bg-red-500/10 text-red-600 group-hover:bg-red-500"            },
];

const STATS = [
  { icon: Users,  value: 10000, suffix: "+", label: "Happy Customers" },
  { icon: Award,  value: 500,   suffix: "+", label: "Products"        },
  { icon: Clock,  value: 7,    suffix: "yr", label: "Years Serving"  },
  { icon: MapPin, value: 1,     suffix: "",   label: "Lahore Location"},
];

const STORY = [
  { year: "2019", title: "Founded",          desc: "Altaf Cash & Carry opens its doors in Central Park Society, Lahore with a vision to serve local families."       },
  { year: "2022", title: "Community Pillar", desc: "Grew to serve thousands of households, becoming the go-to grocery destination for the entire neighbourhood."      },
  { year: "2024", title: "Expansion",        desc: "Expanded our product range to 500+ items including fresh produce, dairy, bakery and household essentials."         },
  { year: "2026", title: "Going Digital",    desc: "Launched online ordering platform to serve customers across Lahore with same-day delivery."                        },
];

const About = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY   = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <div>
      {/* ── PARALLAX HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden h-[55vh] flex items-center justify-center text-center">
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 about-hero-bg scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        {[
          { size: 400, left: "-5%", top: "-10%", color: "hsl(var(--primary)/0.25)"  },
          { size: 300, left: "70%", top: "20%",  color: "hsl(var(--secondary)/0.2)" },
        ].map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl pointer-events-none"
            style={{ width: b.size, height: b.size, left: b.left, top: b.top, background: b.color }}
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 8 + i * 3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <motion.div style={{ y: textY }} className="container relative z-10 text-white px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 180 }}
            className="inline-flex items-center gap-2 text-secondary text-xs font-bold tracking-widest uppercase mb-4 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20"
          >
            <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
            Est. 2019 · Central Park Society, Lahore
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
            className="text-5xl md:text-7xl font-display font-extrabold mb-4 drop-shadow-xl leading-tight"
          >
            About <span className="text-secondary">Altaf</span><br />
            Cash &amp; Carry
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="text-lg md:text-xl max-w-2xl mx-auto opacity-85 font-light"
          >
            Your trusted neighbourhood grocer — bringing fresh quality and unbeatable prices to Lahore families since 1995.
          </motion.p>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none leading-[0]">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12 fill-background">
            <path d="M0,24 C360,48 1080,0 1440,24 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09, type: "spring", stiffness: 130 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className="bg-card border border-border/60 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-extrabold text-primary leading-none">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs text-muted-foreground font-semibold mt-1 tracking-wide uppercase">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="container pb-20">

        {/* ── OUR STORY ── */}
        <div className="grid md:grid-cols-2 gap-14 items-center mb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100 }}>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">Who We Are</p>
            <h2 className="text-4xl font-display font-extrabold mb-6 leading-tight">Our <span className="text-primary">Story</span></h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>Altaf Cash &amp; Carry was founded with a simple yet powerful mission: to provide the families of Central Park Society and surrounding areas with a reliable, high-quality, and affordable shopping experience.</p>
              <p>We understand the daily needs of Pakistani households. That's why we meticulously source our fresh produce, dairy, bakery items, and household essentials to ensure you never compromise on quality or price.</p>
              <p>Our dedicated team works tirelessly to maintain a clean, vibrant store environment, while our modern delivery network ensures the same exceptional quality arrives at your doorstep.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100 }} className="relative">
            <motion.img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
              alt="Inside Altaf Cash and Carry"
              className="rounded-3xl shadow-2xl border border-border w-full"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
              className="absolute -bottom-6 -left-6 bg-card p-5 rounded-2xl shadow-xl border border-border"
            >
              <div className="text-4xl font-display font-extrabold text-primary">10k+</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Happy Customers</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, type: "spring", stiffness: 180 }}
              className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground p-4 rounded-2xl shadow-xl"
            >
              <div className="text-2xl font-extrabold">7yr</div>
              <div className="text-[10px] font-bold uppercase tracking-wide opacity-80 mt-0.5">Trusted</div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── TIMELINE ── */}
        <div className="mb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Our Journey</p>
            <h2 className="text-4xl font-display font-extrabold">Milestones</h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60 hidden md:block" />
            <div className="space-y-10">
              {STORY.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 110 }}
                  className={`flex gap-6 md:gap-0 items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <span className="inline-block bg-primary/10 text-primary text-xs font-extrabold px-3 py-1 rounded-full mb-3">{item.year}</span>
                      <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-5 h-5 rounded-full bg-primary border-4 border-background shadow-md flex-shrink-0 z-10" />
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── VALUES ── */}
        <div className="mb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">What Drives Us</p>
            <h2 className="text-4xl font-display font-extrabold">Our Core Values</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">The principles that guide everything we do — from sourcing to your doorstep.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30, scale: 0.93 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, type: "spring", stiffness: 130 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="group bg-card rounded-2xl border border-border/60 p-7 text-center shadow-sm hover:shadow-lg transition-all"
              >
                <motion.div
                  className={`${v.color} group-hover:text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  <v.icon className="h-7 w-7" />
                </motion.div>
                <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── COMMITMENT CTA ── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[340px] flex items-center justify-center text-center text-white"
        >
          <div className="absolute inset-0 about-commitment-bg" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-secondary/60" />

          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/15 pointer-events-none"
              style={{ width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4, left: `${10 + i * 11}%`, bottom: "8%" }}
              animate={{ y: [0, -100, -200], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
            />
          ))}

          <div className="relative z-10 px-8 max-w-2xl">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Heart className="h-14 w-14 mx-auto mb-6 opacity-90" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-display font-extrabold mb-4 drop-shadow-md">
              Committed to Excellence
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="opacity-90 max-w-xl mx-auto text-lg font-light leading-relaxed">
              Every product on our shelves is a promise of quality to you and your family. We don't just sell groceries — we deliver peace of mind.
            </motion.p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;