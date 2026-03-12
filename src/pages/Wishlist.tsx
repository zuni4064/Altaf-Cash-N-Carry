import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
    const { wishlist, loading } = useWishlist();

    if (loading) {
        return (
            <div className="container py-8 mx-auto mt-20">
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl font-display font-bold mb-2"
                >
                    My Wishlist
                </motion.h1>
                <p className="text-muted-foreground mb-8">Loading wishlist...</p>
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 mx-auto mt-20">
            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl font-display font-bold mb-2"
            >
                My Wishlist
            </motion.h1>
            <p className="text-muted-foreground mb-8">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
            </p>

            {wishlist.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
                    <p className="text-muted-foreground mb-6">
                        Save products you love by tapping the heart icon
                    </p>
                    <Link to="/shop">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Browse Products
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wishlist.map(p => (
                        <ProductCard key={p.id} product={p as any} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
