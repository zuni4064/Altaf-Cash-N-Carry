import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const storageKey = `wishlist_${user?.id || "guest"}`;

    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Load wishlist from localStorage immediately
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                setWishlist(JSON.parse(stored));
            }
        } catch {
            console.warn("Invalid wishlist JSON");
        } finally {
            setLoading(false);
        }
    }, [storageKey]);

    const persistToLocalStorage = useCallback(
        (items: Product[]) => {
            localStorage.setItem(storageKey, JSON.stringify(items));
        },
        [storageKey]
    );

    // Fetch wishlist from Supabase in the background
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user) return;

            // Don't set loading to true here - keep it false to avoid flicker
            try {
                const { data: wishlistData, error } = await supabase
                    .from("wishlists")
                    .select("product_id")
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Wishlist fetch error:", error);
                    return;
                }

                if (!wishlistData || wishlistData.length === 0) {
                    setWishlist([]);
                    persistToLocalStorage([]);
                    return;
                }

                const { data: productsData } = await supabase
                    .from("products")
                    .select("*");

                const wishlistProducts: Product[] = [];

                wishlistData.forEach((item) => {
                    const dbProduct = productsData?.find(
                        (p) => p.id === item.product_id
                    );

                    if (dbProduct) {
                        wishlistProducts.push({
                            id: dbProduct.id,
                            name: dbProduct.name,
                            price: dbProduct.price,
                            image: dbProduct.image,
                            category: dbProduct.category,
                            description: dbProduct.description,
                            inStock: dbProduct.in_stock,
                        });
                    }
                });

                // fallback to static product list
                const module = await import("@/data/products");
                const staticProducts = module.products;

                const getImageUrl = (img: any): string => {
                    if (!img) return "";
                    if (typeof img === "string") return img;
                    if (img.default) return img.default;
                    if (img.src) return img.src;
                    return String(img);
                };

                wishlistData.forEach((item) => {
                    const exists = wishlistProducts.find(
                        (p) => p.id === item.product_id
                    );

                    if (!exists) {
                        const staticProduct = staticProducts.find(
                            (p) => p.id === item.product_id
                        );

                        if (staticProduct) {
                            wishlistProducts.push({
                                ...staticProduct,
                                image: getImageUrl(staticProduct.image),
                            });
                        }
                    }
                });

                setWishlist(wishlistProducts);
                persistToLocalStorage(wishlistProducts);
            } catch (error) {
                console.error("Wishlist fetch error:", error);
            }
            // Don't set loading to false here - it's already false
        };

        fetchWishlist();

        // Real-time listener
        if (user) {
            const channel = supabase
                .channel(`wishlist:${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "wishlists",
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        fetchWishlist();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, persistToLocalStorage]);

    const addToWishlist = useCallback(
        async (product: Product) => {
            setWishlist((prev) => {
                if (prev.find((p) => p.id === product.id)) return prev;

                const next = [...prev, product];
                persistToLocalStorage(next);
                return next;
            });

            if (user) {
                try {
                    await supabase.from("wishlists").insert({
                        user_id: user.id,
                        product_id: product.id,
                    });
                } catch (error) {
                    console.error("Add wishlist error:", error);
                }
            }
        },
        [user, persistToLocalStorage]
    );

    const removeFromWishlist = useCallback(
        async (productId: string) => {
            setWishlist((prev) => {
                const next = prev.filter((p) => p.id !== productId);
                persistToLocalStorage(next);
                return next;
            });

            if (user) {
                try {
                    await supabase
                        .from("wishlists")
                        .delete()
                        .eq("user_id", user.id)
                        .eq("product_id", productId);
                } catch (error) {
                    console.error("Remove wishlist error:", error);
                }
            }
        },
        [user, persistToLocalStorage]
    );

    const isInWishlist = useCallback(
        (productId: string) => {
            return wishlist.some((p) => p.id === productId);
        },
        [wishlist]
    );

    const toggleWishlist = useCallback(
        (product: Product) => {
            const exists = wishlist.find((p) => p.id === product.id);

            if (exists) {
                removeFromWishlist(product.id);
            } else {
                addToWishlist(product);
            }
        },
        [wishlist, addToWishlist, removeFromWishlist]
    );

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                toggleWishlist,
                loading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
    return ctx;
};