import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, CreditCard, Wallet, Loader2, Lock, Mail, MapPin, Map as MapIcon, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Official Stripe demo test key
const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx");

interface CheckoutFormProps {
  deliveryCharge: number;
  setDeliveryCharge: (val: number) => void;
}

const CheckoutForm = ({ deliveryCharge, setDeliveryCharge }: CheckoutFormProps) => {
  const { items, getTotal, placeOrder } = useCart();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useTheme();

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Card">("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const { user, profile } = useAuth();

  // Auto-fill effects
  useState(() => {
    if (user) {
      setForm({
        name: profile?.full_name || "",
        email: user.email || "",
        phone: profile?.phone || "",
        address: "", // Can't auto-read address unless saved in DB profile
      });
    }
  });

  // Central Lahore coords as store location (example)
  const STORE_COORDS = { lat: 31.5204, lng: 74.3587 };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distanceKm = calculateDistance(STORE_COORDS.lat, STORE_COORDS.lng, latitude, longitude);
        
        // Rs 15 per km, max 350
        const computedCharge = Math.min(Math.round(distanceKm * 15), 350);
        setDeliveryCharge(computedCharge);
        setMapPosition([latitude, longitude]);
        setShowMap(false);
        setIsLocating(false);

        // Reverse Geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setForm(p => ({ ...p, address: data.display_name }));
            toast.success(`Location acquired! Delivery charge: PKR ${computedCharge}`);
          } else {
            toast.success(`Location acquired! Delivery charge: PKR ${computedCharge}`);
          }
        } catch (e) {
          toast.success(`Location acquired! Delivery charge: PKR ${computedCharge}`);
        }
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Failed to get location. Please ensure location permissions are granted.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapPinDrop = async (lat: number, lng: number) => {
    setMapPosition([lat, lng]);
    const distanceKm = calculateDistance(STORE_COORDS.lat, STORE_COORDS.lng, lat, lng);
    const computedCharge = Math.min(Math.round(distanceKm * 15), 350);
    setDeliveryCharge(computedCharge);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setForm(p => ({ ...p, address: data.display_name }));
        toast.success(`Location updated manually! Delivery charge: PKR ${computedCharge}`);
      }
    } catch (e) {
      toast.success(`Location updated manually! Delivery charge: PKR ${computedCharge}`);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        handleMapPinDrop(e.latlng.lat, e.latlng.lng);
      },
    });
    return mapPosition === null ? null : (
      <Marker position={mapPosition} />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalPaymentStatus = "Pending";

    if (paymentMethod === "Card") {
      if (!stripe || !elements) {
        toast.error("Payment system is still loading. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setIsSubmitting(false);
        return;
      }

      // 1. Create a PaymentMethod with the card details
      const { error, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: form.name,
          phone: form.phone,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to process card. Please check your details.");
        setIsSubmitting(false);
        return;
      }

      // If successful, we consider it paid for this frontend-only test implementation
      finalPaymentStatus = "Paid";
      
      try {
        // Process the actual order saving to Supabase
        const order = await placeOrder(form.name, form.email, form.phone, form.address, paymentMethod, finalPaymentStatus, deliveryCharge);
        
        if (order) {
          toast.success(`Card securely verified! (Token: ${stripePaymentMethod.id.slice(0, 8)}...)`);
          navigate(`/order-confirmation/${order.id}`);
        }
      } catch (e) {
        console.error(e);
        toast.error("An error occurred while placing the order.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        // Process the actual order saving to Supabase
        const order = await placeOrder(form.name, form.email, form.phone, form.address, paymentMethod, finalPaymentStatus, deliveryCharge);
        if (order) {
          navigate(`/order-confirmation/${order.id}`);
        }
      } catch (e) {
        console.error(e);
        toast.error("An error occurred while placing the order.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com (for receipt)" className="pl-10" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">We'll send your order receipt to this email</p>
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
        </div>
        <div>
          <Label htmlFor="address">Delivery Address</Label>
          <Input id="address" required value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="House #, Street, Area, Lahore" className="w-full mt-1 mb-3" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isLocating} className="flex-1">
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              {isLocating ? " Locating..." : "Auto Locate"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowMap(!showMap)} className="flex-1">
              {showMap ? <X className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
              {showMap ? "Close Map" : "Map"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Auto locate or select on map to calculate exact delivery charges (Rs 15/km, Max Rs 350)</p>

          {showMap && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 rounded-xl border overflow-hidden">
              <div className="bg-muted p-2 text-xs text-center border-b">
                Click anywhere on the map to drop a pin and calculate delivery charges.
              </div>
              <div className="h-[300px] w-full z-0 relative">
                <MapContainer center={mapPosition || [STORE_COORDS.lat, STORE_COORDS.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker />
                </MapContainer>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border/50">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Payment Method
        </h3>
        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "COD" | "Card")} className="space-y-4">
          <Label htmlFor="COD" className={`flex items-start space-x-3 border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === "COD" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-border/80 hover:bg-muted/30"}`}>
            <RadioGroupItem value="COD" id="COD" className="mt-1" />
            <div className="flex-1">
              <span className="font-semibold text-base block">Cash on Delivery (COD)</span>
              <span className="text-sm text-muted-foreground mt-1 block">Pay with cash when your order is delivered.</span>
            </div>
          </Label>
          
          <div className={`flex flex-col space-y-3 border-2 p-4 rounded-xl transition-all ${paymentMethod === "Card" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-border/80 hover:bg-muted/30"}`}>
            <Label htmlFor="Card" className="flex items-start space-x-3 cursor-pointer w-full">
              <RadioGroupItem value="Card" id="Card" className="mt-1" />
              <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <span className="font-semibold text-base block">Credit / Debit Card</span>
                  <span className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    Powered by Stripe <ShieldCheck className="w-4 h-4 text-green-600" />
                  </span>
                </div>
                <div className="flex gap-2 opacity-100">
                  <div className="w-12 h-8 bg-white rounded border border-border/80 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="visa.png" alt="Visa" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-12 h-8 bg-white rounded border border-border/80 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-12 h-8 bg-white rounded border border-border/80 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/UnionPay_logo.svg" alt="UnionPay" className="w-full h-full object-contain scale-110" />
                  </div>
                </div>
              </div>
            </Label>

            {paymentMethod === "Card" && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                className="pt-4 pl-8 pr-2"
              >
                <div className="bg-background p-4 rounded-lg border shadow-sm relative overflow-hidden group focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-focus-within:bg-primary transition-colors"></div>
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                        '::placeholder': { color: theme === 'dark' ? '#9ca3af' : '#6b7280' },
                      },
                      invalid: { color: '#ef4444' },
                    },
                    hidePostalCode: true
                  }} />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground ml-1">
                  <Lock className="w-3 h-3" />
                  Your card details are securely encrypted.
                </div>
              </motion.div>
            )}
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" disabled={isSubmitting || (paymentMethod === "Card" && !stripe)} className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md mt-6" size="lg">
        {isSubmitting ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Payment...</>
        ) : (
          <>
            {paymentMethod === "Card" ? "Pay Securely " : "Place Order "} 
            <span className="opacity-80 ml-2 border-l border-primary-foreground/30 pl-2">PKR {Math.round(getTotal() + deliveryCharge).toLocaleString()}</span>
          </>
        )}
      </Button>
    </motion.form>
  );
};

const Checkout = () => {
  const { items, getTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  if (!user) {
    return (
      <div className="container py-20 max-w-lg text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <ShieldCheck className="w-16 h-16 mx-auto text-primary mb-6" />
          <h1 className="text-3xl font-display font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            You must be signed in to place an order and track its status.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => navigate("/login", { state: { from: location } })}>
              Sign In
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/signup", { state: { from: location } })}>
              Create Account
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-8">Checkout</motion.h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Elements stripe={stripePromise}>
          <CheckoutForm deliveryCharge={deliveryCharge} setDeliveryCharge={setDeliveryCharge} />
        </Elements>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card rounded-lg border border-border p-4 h-fit sticky top-24"
        >
          <h3 className="font-semibold mb-4 text-lg">Order Summary</h3>
          <div className="space-y-3 text-sm">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between items-start">
                <span className="pr-4">{item.product.name} <span className="text-muted-foreground ml-1">× {item.quantity}</span></span>
                <span className="font-medium whitespace-nowrap">PKR {((item.product.discount ? Math.round(item.product.price * (1 - item.product.discount / 100)) : item.product.price) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-border/50 pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>PKR {Math.round(getTotal()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge</span>
                <span>PKR {Math.round(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
                <span>Total</span>
                <span className="text-primary">PKR {Math.round(getTotal() + deliveryCharge).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
