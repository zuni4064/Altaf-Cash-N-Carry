import React, { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { Star, Quote, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Define the shape of our fetched review
interface Review {
    id: string;
    customer_name: string;
    rating: number;
    feedback: string;
    created_at: string;
}

const FALLBACK_REVIEWS = [
    {
        id: "1",
        customer_name: "Ahmed Raza",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        rating: 5,
        feedback: "Altaf Cash and Carry has the best fresh produce in Central Park! Delivery was super fast and everything was perfectly packed."
    },
    {
        id: "2",
        customer_name: "Fatima Ali",
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        rating: 5,
        feedback: "I love their organic section. The prices are very reasonable compared to other marts in Lahore. Highly recommended!"
    }
];

const ReviewsCarousel = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, align: 'start', slidesToScroll: 1 },
        [Autoplay({ delay: 4000, stopOnInteraction: true })]
    );

    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                // If the table is empty, use the fallback reviews so the UI doesn't look broken
                if (!data || data.length === 0) {
                    setReviews(FALLBACK_REVIEWS);
                } else {
                    setReviews(data);
                }
            } catch (error) {
                console.error("Error fetching reviews from Supabase:", error);
                setReviews(FALLBACK_REVIEWS);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.reInit(); // Re-initialize carousel when dynamic reviews load
    }, [emblaApi, reviews]);

    return (
        <section className="py-20 relative overflow-hidden bg-muted/30">
            {/* Background Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>

            <div className="container relative z-10">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-display font-bold mb-4"
                    >
                        What Our Customers Say
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground max-w-2xl mx-auto"
                    >
                        Don't just take our word for it. Here is what families around Central Park Society think about our service.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="overflow-hidden"
                    ref={emblaRef}
                >
                    <div className="flex -ml-4">
                        {isLoading ? (
                            <div className="w-full flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4"
                                >
                                    <div className="bg-card border border-border rounded-2xl p-8 h-full shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                                        <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />

                                        <div className="flex gap-1 mb-4 text-amber-500">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-muted'}`} />
                                            ))}
                                        </div>

                                        <p className="text-foreground/90 leading-relaxed mb-6 line-clamp-4 flex-grow">
                                            "{review.feedback}"
                                        </p>

                                        <div className="flex items-center gap-4 mt-auto">
                                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {review.customer_name ? review.customer_name.charAt(0).toUpperCase() : "A"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{review.customer_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ReviewsCarousel;
