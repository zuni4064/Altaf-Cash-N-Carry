import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ReviewFormProps {
    onSubmit: (rating: number, text: string, name: string) => void;
}

export const ReviewForm = ({ onSubmit }: ReviewFormProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        onSubmit(rating, text, name.trim() || "Anonymous");

        // Reset form after submission
        setRating(0);
        setHoverRating(0);
        setText("");
        setName("");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={`h-6 w-6 ${(hoverRating || rating) >= star ? "fill-warning text-warning" : "text-muted fill-muted/20"}`}
                            />
                        </button>
                    ))}
                </div>
                {rating === 0 && <p className="text-xs text-muted-foreground mt-1">Please select a star rating.</p>}
            </div>

            <div>
                <label htmlFor="reviewerName" className="block text-sm font-medium mb-2">Your Name (Optional)</label>
                <Input
                    id="reviewerName"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="review" className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                    id="review"
                    placeholder="What did you like or dislike about this product?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    maxLength={500}
                />
            </div>

            <Button type="submit" disabled={rating === 0 || !text.trim()}>
                Submit Review
            </Button>
        </form>
    );
};
