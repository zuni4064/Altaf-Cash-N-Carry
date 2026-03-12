import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    reviewCount?: number;
    className?: string;
    size?: number;
}

export const StarRating = ({
    rating,
    reviewCount,
    className,
    size = 14,
}: StarRatingProps) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <div className="flex">
                {[...Array(fullStars)].map((_, i) => (
                    <Star
                        key={`full-${i}`}
                        size={size}
                        className="fill-warning text-warning"
                    />
                ))}
                {hasHalfStar && (
                    <div className="relative">
                        <StarHalf
                            size={size}
                            className="fill-warning text-warning absolute top-0 left-0"
                        />
                        <Star size={size} className="text-muted" />
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} size={size} className="text-muted fill-muted/20" />
                ))}
            </div>
            {reviewCount !== undefined && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ({reviewCount} reviews)
                </span>
            )}
        </div>
    );
};
