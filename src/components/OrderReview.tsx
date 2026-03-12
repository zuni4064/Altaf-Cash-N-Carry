import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface OrderReviewProps {
    orderId: string;
    customerName: string;
}

const OrderReview = ({ orderId, customerName }: OrderReviewProps) => {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [feedback, setFeedback] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('reviews')
                .insert([
                    {
                        order_id: orderId,
                        customer_name: customerName,
                        rating,
                        feedback
                    }
                ]);

            if (error) throw error;
            setIsSubmitted(true);
        } catch (error: any) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/10 border border-primary/20 rounded-xl p-8 text-center mt-8"
            >
                <span className="text-4xl mb-4 block">🎉</span>
                <h3 className="text-xl font-display font-bold mb-2">Thank you for your review!</h3>
                <p className="text-muted-foreground">
                    Your feedback helps us improve and serve you better next time.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 mt-8 shadow-sm">
            <h3 className="text-xl font-display font-bold mb-2">How was your experience?</h3>
            <p className="text-muted-foreground text-sm mb-6">
                Let us know what you think about your recently placed order.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating System */}
                <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                        >
                            <Star
                                className={`h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                    }`}
                            />
                        </button>
                    ))}
                </div>

                <Textarea
                    placeholder="Tell us what you loved (or what we could improve)..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="resize-none h-24"
                />

                <Button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="w-full sm:w-auto mt-4 transition-all"
                >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
            </form>
        </div>
    );
};

export default OrderReview;
