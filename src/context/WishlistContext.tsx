import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Import from Central Park Grocer's data format or defining locally
export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
    inStock?: boolean;
}

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (product: Product) => void;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const storageKey = `wishlist_${user?.id || 'guest'}`;
    const [loading, setLoading] = useState(false);
    const [wishlist, setWishlist] = useState<Product[]>([]);

    // Load from user-specific localStorage on init/user change
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                setWishlist(JSON.parse(stored));
            }
        } catch {
            // Invalid JSON, ignore
        }
    }, [storageKey]);

    // Persist to user-specific localStorage
    const persistToLocalStorage = useCallback((items: Product[]) => {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }, [storageKey]);

    // Fetch wishlist from Supabase when user logs in
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user) {
                // User logged out, keep local wishlist (guest wishlist)
                return;
            }

            setLoading(true);
            try {
                console.log("Fetching wishlist for user:", user.id);
                const { data: wishlistData, error } = await supabase
                    .from('wishlists')
                    .select('product_id')
                    .eq('user_id', user.id);

                if (error) {
                    console.error("Error fetching wishlist:", error);
                    setLoading(false);
                    return;
                }

                if (wishlistData && wishlistData.length > 0) {
                    // We need to get the product details
                    // For now, we'll just store the product IDs and fetch product details
                    // from the products data
                    const { data: productsData } = await supabase
                        .from('products')
                        .select('*');

                    const wishlistProducts: Product[] = [];
                    
                    for (const item of wishlistData) {
                        // Try to find product in products table first
                        const dbProduct = productsData?.find(p => p.id === item.product_id);
                        if (dbProduct) {
                            wishlistProducts.push({
                                id: dbProduct.id,
                                name: dbProduct.name,
                                price: dbProduct.price,
                                image: dbProduct.image,
                                category: dbProduct.category,
                                description: dbProduct.description,
                                inStock: dbProduct.in_stock
                            });
                        }
                    }

                    // Also check local products data for any missing products
                    const module = await import("@/data/products");
                    const staticProducts = module.products;
                    
                    // Helper function to get image URL from imported image module
                    const getImageUrl = (img: any): string => {
                        if (!img) return '';
                        if (typeof img === 'string') return img;
                        if (img.default) return img.default;
                        if (img.src) return img.src;
                        return String(img);
                    };

                    // Add any products that might only be in static data
                    for (const item of wishlistData) {
                        const exists = wishlistProducts.find(p => p.id === item.product_id);
                        if (!exists) {
                            const staticProduct = staticProducts.find(p => p.id === item.product_id);
                            if (staticProduct) {
                                // Convert image to URL string
                                wishlistProducts.push({
                                    ...staticProduct,
                                    image: getImageUrl(staticProduct.image)
                                });
                            }
                        }
                    }

                    setWishlist(wishlistProducts);
                    persistToLocalStorage(wishlistProducts);
                } else {
                    // Empty wishlist for new user
                    setWishlist([]);
                    persistToLocalStorage([]);
                }
            } catch (error) {
                console.error("Error fetching wishlist:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();

        // Subscribe to wishlist changes in real-time
        if (user) {
            const channel = supabase.channel(`public:wishlists:${user.id}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'wishlists', 
                    filter: `user_id=eq.${user.id}` 
                }, async (payload) => {
                    console.log("Wishlist change detected:", payload);
                    // Refetch the entire wishlist on any change
                    fetchWishlist();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const addToWishlist = useCallback(async (product: Product) => {
        setWishlist(prev => {
            if (prev.find(p => p.id === product.id)) return prev;
            const next = [...prev, product];
            persistToLocalStorage(next);
            return next;
        });

        // Also save to Supabase if user is logged in
        if (user) {
            try {
                await supabase.from('wishlists').insert({
                    user_id: user.id,
                    product_id: product.id
                });
                console.log("Added to wishlist in DB:", product.id);
            } catch (error) {
                console.error("Error adding to wishlist:", error);
            }
        }
    }, [user]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        setWishlist(prev => {
            const next = prev.filter(p => p.id !== productId);
            persistToLocalStorage(next);
            return next;
        });

        // Also remove from Supabase if user is logged in
        if (user) {
            try {
                await supabase
                    .from('wishlists')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                console.log("Removed from wishlist in DB:", productId);
            } catch (error) {
                console.error("Error removing from wishlist:", error);
            }
        }
    }, [user]);

    const isInWishlist = useCallback((productId: string) => {
        return wishlist.some(p => p.id === productId);
    }, [wishlist]);

    const toggleWishlist = useCallback((product: Product) => {
        const exists = wishlist.find(p => p.id === product.id);
        if (exists) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    }, [wishlist, addToWishlist, removeFromWishlist]);

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, loading }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
    return ctx;
};
