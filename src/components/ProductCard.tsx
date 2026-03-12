import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const badgeStyles: Record<string, string> = {
  bestseller: "bg-secondary text-secondary-foreground",
  discount: "bg-destructive text-destructive-foreground",
  new: "bg-success text-success-foreground",
  "out-of-stock": "bg-muted text-muted-foreground",
};

const ProductCard = ({ product }: { product: Product }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const cartItem = items.find(i => i.product.id === product.id);
  const isWishlisted = isInWishlist(product.id);
  const imageSrc = product.image || PLACEHOLDER_IMAGE;

  const finalPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-card rounded-lg border border-border overflow-hidden hover-lift relative"
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
        />

        {product.badge && (
          <Badge className={`absolute top-3 left-3 ${badgeStyles[product.badge]}`}>
            {product.badge === "discount"
              ? `-${product.discount}%`
              : product.badge === "out-of-stock"
              ? "Out of Stock"
              : product.badge === "bestseller"
              ? "Best Seller"
              : "New"}
          </Badge>
        )}
      </Link>

      {/* Wishlist Button - Using Button component with aria-label */}
      <Button
        variant="ghost"
        size="icon"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product);
        }}
      >
        <Heart
          className={`h-4 w-4 transition-all ${
            isWishlisted
              ? "fill-primary text-primary scale-110"
              : "text-foreground"
          }`}
        />
      </Button>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground capitalize mb-1">
          {product.category.replace("-", " & ").replace("fruits & vegetables", "Fruits & Vegetables")}
        </p>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm mb-1 hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {product.rating !== undefined && (
          <div className="mb-2">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          </div>
        )}

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          {/* Price */}
          <div>
            <span className="font-bold text-primary">PKR {finalPrice}</span>

            {product.discount && (
              <span className="text-xs text-muted-foreground line-through ml-1">
                PKR {product.price}
              </span>
            )}

            <span className="text-xs text-muted-foreground">/{product.unit}</span>

            <div className="mt-2">
              <Badge
                variant={(product.stock ?? 0) > 0 ? "outline" : "destructive"}
                className={(product.stock ?? 0) > 0 ? "text-success border-success bg-success/10" : ""}
              >
                {(product.stock ?? 0) > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </Badge>
            </div>
          </div>

          {/* Cart Controls */}
          {product.inStock && (product.stock === undefined || product.stock > 0) ? (
            cartItem ? (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() =>
                    cartItem.quantity <= 1
                      ? removeFromCart(product.id)
                      : updateQuantity(product.id, cartItem.quantity - 1)
                  }
                  aria-label="Decrease quantity"
                  title="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="w-6 text-center text-sm font-medium">
                  {cartItem.quantity}
                </span>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={product.stock !== undefined && cartItem.quantity >= product.stock}
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  aria-label="Increase quantity"
                  title="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => addToCart(product)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Add to cart"
                title="Add to cart"
              >
                <ShoppingCart className="h-4 w-4 mr-1" /> Add
              </Button>
            )
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;