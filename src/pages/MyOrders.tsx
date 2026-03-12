import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { motion } from "framer-motion";

const MyOrders = () => {
  const { orders } = useCart();

  // Show empty state for non-logged in users or users with no orders
  if (orders.length === 0) return (
    <div className="container py-20 text-center">
      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-display font-bold mb-2">No orders yet</h2>
      <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
      <Link to="/shop"><Button>Shop Now</Button></Link>
    </div>
  );

  // Show last 5 orders for logged-in users
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="container py-8 max-w-3xl">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-8">My Orders</motion.h1>
      <div className="space-y-4">
        {recentOrders.map(order => (
          <Link key={order.id} to={`/order-confirmation/${order.id}`} className="block bg-card rounded-lg border border-border p-4 hover-lift">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono font-bold text-sm">{order.id}</span>
              <span className="text-sm text-muted-foreground">{order.date}</span>
            </div>
            <p className="text-sm text-muted-foreground">{order.items.length} items</p>
            <p className="font-bold text-primary mt-1">PKR {Math.round(order.total)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
