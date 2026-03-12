import { useParams, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import OrderTrackingTimeline from "@/components/OrderTrackingTimeline";
import OrderReview from "@/components/OrderReview";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { orders } = useCart();
  const order = orders.find(o => o.id === orderId);

  // Normalize status format from database (admin uses lowercase with hyphens) to display format (capitalized)
  const normalizeStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'pending': 'Pending',
      'cancelled': 'Cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'Pending';
  };

  // Use the actual order status from the database (real-time updates via CartContext subscription)
  const currentStatus = normalizeStatus(order?.status || "Pending");

  if (!order) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Order not found.</p>
      <Link to="/" className="text-primary underline mt-4 inline-block">Go Home</Link>
    </div>
  );

  return (
    <div className="container py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
        <h1 className="text-3xl font-display font-bold mb-2">Order Placed!</h1>
        <p className="text-muted-foreground">Thank you for shopping with Cash & Carry</p>
      </motion.div>

      <div className="mb-12 mt-8">
        <OrderTrackingTimeline currentStatus={currentStatus} />
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mt-8 relative overflow-hidden">
        {/* Decorative receipt header/logo */}
        <div className="flex flex-col items-center justify-center border-b border-dashed border-border pb-6 mb-6">
          <img src="/logo.png" alt="Altaf Mart Cash & Carry" className="h-20 w-auto object-contain mb-2" />
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Official Receipt</p>
        </div>
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-muted-foreground">Order ID</span>
          <span className="font-mono font-bold">{order.id}</span>
        </div>
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-muted-foreground">Date</span>
          <span>{order.date}</span>
        </div>
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-muted-foreground">Customer</span>
          <span>{order.customerName}</span>
        </div>
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-muted-foreground">Phone</span>
          <span>{order.phone}</span>
        </div>
        <div className="flex justify-between mb-6 text-sm">
          <span className="text-muted-foreground">Address</span>
          <span className="text-right max-w-[200px]">{order.address}</span>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="space-y-2 text-sm">
            {order.items.map(item => (
              <div key={item.product.id} className="flex justify-between">
                <span>{item.product.name} × {item.quantity}</span>
                <span>PKR {(item.product.discount ? Math.round(item.product.price * (1 - item.product.discount / 100)) : item.product.price) * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">PKR {Math.round(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <OrderReview orderId={order.id} customerName={order.customerName} />

      <div className="flex gap-3 mt-6">
        <Link to="/my-orders"><Button variant="outline">View All Orders</Button></Link>
        <Link to="/shop"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Continue Shopping <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
