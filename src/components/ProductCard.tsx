import { useState } from "react";
import { useParams } from "react-router-dom";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { motion, AnimatePresence } from "framer-motion";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = products.find(p => p.id === id);
  
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    );
  }

  const cartItem = items.find(i => i.product.id === product.id);
  const isWishlisted = isInWishlist(product.id);
  
  // Use single image since 'images' doesn't exist on Product type
  const productImages = [product.image];
  
  const finalPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  const handleAddToCart = () => {
    // Add the product with the selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery - Optimized size */}
        <div className="space-y-4">
          {/* Main Image - Reduced size with max-width */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted max-w-[500px] mx-auto lg:mx-0">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={productImages[selectedImage] || PLACEHOLDER_IMAGE}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />
            </AnimatePresence>

            {/* Only show navigation if there are multiple images */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background/90 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background/90 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category */}
          <p className="text-sm text-muted-foreground capitalize">
            {product.category.replace("-", " & ")}
          </p>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>

          {/* Rating */}
          {product.rating !== undefined && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} />
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">PKR {finalPrice}</span>
            {product.discount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  PKR {product.price}
                </span>
                <Badge variant="destructive">-{product.discount}%</Badge>
              </>
            )}
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={(product.stock ?? 0) > 0 ? "outline" : "destructive"}
              className={(product.stock ?? 0) > 0 ? "text-success border-success bg-success/10" : ""}
            >
              {(product.stock ?? 0) > 0
                ? `${product.stock} in stock`
                : "Out of stock"}
            </Badge>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(prev => 
                  product.stock ? Math.min(product.stock, prev + 1) : prev + 1
                )}
                disabled={product.stock ? quantity >= product.stock : false}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                /{product.unit}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={!product.inStock || (product.stock ?? 0) <= 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {cartItem ? "Add More" : "Add to Cart"}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => toggleWishlist(product)}
              className="flex-1"
            >
              <Heart
                className={`h-5 w-5 mr-2 ${
                  isWishlisted ? "fill-primary text-primary" : ""
                }`}
              />
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="border-t pt-6 space-y-2">
            <p className="text-sm">
              <span className="font-medium">SKU:</span> {product.id}
            </p>
            <p className="text-sm">
              <span className="font-medium">Category:</span> {product.category}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;