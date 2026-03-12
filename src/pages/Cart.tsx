import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

// Default placeholder image
const PLACEHOLDER_IMAGE = "/placeholder.svg";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  if (items.length === 0) return (
    <div className="container py-20 text-center">
      <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-display font-bold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6">Start adding some delicious items!</p>
      <Link to="/shop"><Button>Start Shopping</Button></Link>
    </div>
  );

  return (
    <div className="container py-8 max-w-3xl">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-8">Shopping Cart</motion.h1>

      <div className="space-y-4 mb-8">
        {items.map(item => {
          const price = item.product.discount ? Math.round(item.product.price * (1 - item.product.discount / 100)) : item.product.price;
          return (
            <motion.div key={item.product.id} layout className="flex gap-4 bg-card rounded-lg border border-border p-4">
              <img 
                src={item.product.image || PLACEHOLDER_IMAGE} 
                alt={item.product.name} 
                className="w-20 h-20 rounded-md object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.product.name}</h3>
                <p className="text-sm text-muted-foreground">PKR {price} / {item.product.unit}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => item.quantity <= 1 ? removeFromCart(item.product.id) : updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <span className="font-bold text-sm">PKR {price * item.quantity}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex justify-between items-center text-lg font-bold mb-4">
          <span>Total</span>
          <span className="text-primary">PKR {Math.round(getTotal())}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
          <Link to="/checkout" className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
