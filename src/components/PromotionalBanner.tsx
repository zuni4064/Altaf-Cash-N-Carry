import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const banners = [
    {
        id: 1,
        title: 'Farm Fresh Organic',
        description: 'Harvested Today',
        bgImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1920&auto=format&fit=crop', // Fresh vibrant vegetables
    },
    {
        id: 2,
        title: 'Express Delivery',
        description: 'Straight to Your Door',
        bgImage: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1920&auto=format&fit=crop', // Delivery package/doorstep
    },
    {
        id: 4,
        title: 'Fresh Bakery',
        description: 'Baked Daily',
        bgImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1920&auto=format&fit=crop', // Beautiful pastry/bakery assortment
    },
    {
        id: 5,
        title: 'Weekly Specials',
        description: 'Up to 50% Off',
        bgImage: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1920&auto=format&fit=crop', // Supermarket fresh produce aisle
    },
    {
        id: 6,
        title: 'Household Essentials',
        description: 'Stock Up Now',
        bgImage: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=1920&auto=format&fit=crop', // Liquid soaps/handwashes on a shelf
    }
];

// Duplicate the banners so Embla has enough slides to loop infinitely 
// when the viewport displays 4 at once.
const allBanners = [...banners, ...banners.map(b => ({ ...b, id: b.id + 6 }))];

const PromotionalBanner = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, align: 'center', slidesToScroll: 1 },
        [Autoplay({ delay: 3500, stopOnInteraction: true })]
    );

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <section className="py-12 relative overflow-hidden">
            <div className="container px-4 md:px-6 max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight text-foreground"
                    >
                        Featured Promotions
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Discover what's fresh and exciting this week.
                    </motion.p>
                </div>

                <div className="relative group">
                    <div
                        className="overflow-hidden bg-transparent rounded-2xl"
                        ref={emblaRef}
                    >
                        <div className="flex cursor-grab active:cursor-grabbing">
                            {allBanners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className="flex-[0_0_100%] sm:flex-[0_0_80%] md:flex-[0_0_70%] px-4"
                                >
                                    <div className="relative overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all h-[250px] md:h-[300px] group border border-border/50">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                            style={{ backgroundImage: `url(${banner.bgImage})` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                                        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10 text-white text-left">
                                            <h3 className="text-xl md:text-2xl font-bold font-display leading-tight mb-2 drop-shadow-sm">
                                                {banner.title}
                                            </h3>
                                            <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                                                {banner.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-[-16px] md:left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={scrollPrev}
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-[-16px] md:right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={scrollNext}
                        aria-label="Next banner"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default PromotionalBanner;
