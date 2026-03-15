import React, { useCallback, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const banners = [
  {
    id: 1,
    tag: "Daily Harvest",
    title: 'Farm Fresh Organic',
    description: 'Harvested Today — Delivered Tomorrow',
    cta: "Shop Produce",
    bgImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1920&auto=format&fit=crop',
    accent: '#34d399',
  },
  {
    id: 2,
    tag: "Fast & Free",
    title: 'Express Delivery',
    description: 'Straight to Your Door in 2 Hours',
    cta: "Order Now",
    bgImage: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1920&auto=format&fit=crop',
    accent: '#60a5fa',
  },
  {
    id: 4,
    tag: "Baked Fresh",
    title: 'Fresh Bakery',
    description: 'Artisan Breads & Pastries, Daily',
    cta: "Browse Bakery",
    bgImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1920&auto=format&fit=crop',
    accent: '#fbbf24',
  },
  {
    id: 5,
    tag: "Limited Time",
    title: 'Weekly Specials',
    description: 'Up to 50% Off — Every Week',
    cta: "View Deals",
    bgImage: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1920&auto=format&fit=crop',
    accent: '#f87171',
  },
  {
    id: 6,
    tag: "Home Essentials",
    title: 'Household Essentials',
    description: 'Everything Your Home Needs',
    cta: "Stock Up",
    bgImage: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=1920&auto=format&fit=crop',
    accent: '#a78bfa',
  },
];

const allBanners = [...banners, ...banners.map(b => ({ ...b, id: b.id + 100 }))];

const PromotionalBanner = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', slidesToScroll: 1 },
    [Autoplay({ delay: 3500, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Background treatment */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-[0.15em] uppercase mb-4">
            This Week's Highlights
          </span>
          <h2
            className="text-3xl md:text-5xl font-black mb-3 text-foreground"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Featured Promotions
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover what's fresh and exciting this week across all our categories.
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 12 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1200 }}
          className="relative group"
        >
          <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
            <div className="flex cursor-grab active:cursor-grabbing">
              {allBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_75%] md:flex-[0_0_60%] px-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, rotateY: 2, rotateX: -1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{ transformPerspective: 800, transformStyle: "preserve-3d" }}
                    className="relative overflow-hidden rounded-3xl h-[280px] md:h-[340px] shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-border/30"
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-[&:hover]:scale-110"
                      style={{ backgroundImage: `url(${banner.bgImage})` }}
                    />

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                    {/* Accent line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
                      style={{ background: `linear-gradient(90deg, ${banner.accent}, transparent)` }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
                      {/* Tag pill */}
                      <div
                        className="inline-flex self-start mb-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase text-white/90 border border-white/20 bg-white/10 backdrop-blur-sm"
                        style={{ borderColor: `${banner.accent}40`, backgroundColor: `${banner.accent}20` }}
                      >
                        {banner.tag}
                      </div>

                      <h3
                        className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-md"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {banner.title}
                      </h3>
                      <p className="text-white/70 text-sm font-medium mb-4">
                        {banner.description}
                      </p>

                      {/* CTA */}
                      <motion.div
                        className="inline-flex items-center gap-2 text-sm font-bold self-start py-2 px-5 rounded-xl text-white"
                        style={{ background: `${banner.accent}30`, borderColor: `${banner.accent}50`, border: "1px solid" }}
                        whileHover={{ x: 4, backgroundColor: `${banner.accent}50` }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {banner.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          {[
            { side: "left", action: scrollPrev, icon: ChevronLeft, label: "Previous" },
            { side: "right", action: scrollNext, icon: ChevronRight, label: "Next" },
          ].map(({ side, action, icon: Icon, label }) => (
            <motion.button
              key={side}
              onClick={action}
              aria-label={`${label} banner`}
              initial={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`absolute ${side === "left" ? "left-0 -translate-x-4" : "right-0 translate-x-4"} top-1/2 -translate-y-1/2 
                z-20 w-11 h-11 rounded-full bg-background/90 border border-border shadow-lg backdrop-blur-md
                flex items-center justify-center text-foreground hover:bg-background hover:border-primary/50
                transition-colors duration-200 opacity-0 group-hover:opacity-100`}
            >
              <Icon className="h-5 w-5" />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PromotionalBanner;