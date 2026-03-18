import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShieldCheck, Loader2, Lock, Mail, MapPin,
  Map as MapIcon, X, CreditCard, Banknote, ChevronRight,
  Package, Truck, Gift, Sparkles, CheckCircle2, Navigation,
  AlertCircle,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx");

const FREE_DELIVERY_THRESHOLD = 2000;
const RATE_PER_KM             = 15;
const MAX_DELIVERY_CHARGE     = 350;
const MINIMUM_ORDER_AMOUNT    = 500;

/* ── Place Order button ───────────────────────────────────── */
const PlaceOrderButton = ({
  isSubmitting, paymentMethod, total, stripe,
}: {
  isSubmitting: boolean;
  paymentMethod: "COD" | "Card";
  total: number;
  stripe: ReturnType<typeof useStripe>;
}) => {
  const [hovered, setHovered] = useState(false);
  const isFreeDelivery = total >= FREE_DELIVERY_THRESHOLD;

  const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
    angle: (i / 6) * 360,
    color: i % 2 === 0 ? "hsl(var(--secondary))" : "hsl(var(--primary))",
  }));

  return (
    <div className="relative mt-2">
      <AnimatePresence>
        {hovered && !isSubmitting && (
          <>
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale:   [0, 1, 0],
                  x: Math.cos((p.angle * Math.PI) / 180) * 48,
                  y: Math.sin((p.angle * Math.PI) / 180) * 28,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                style={{ background: p.color }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        <button
          type="submit"
          disabled={isSubmitting || (paymentMethod === "Card" && !stripe)}
          className="relative w-full h-14 rounded-2xl font-bold text-base overflow-hidden
                     bg-primary text-primary-foreground shadow-xl shadow-primary/30
                     disabled:opacity-60 disabled:cursor-not-allowed
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <motion.div
            className="absolute inset-0 opacity-0"
            animate={{ opacity: hovered && !isSubmitting ? 1 : 0 }}
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 50%, hsl(var(--primary)) 100%)",
              backgroundSize: "200% 100%",
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className="absolute inset-0 bg-white/20 skew-x-[-20deg] pointer-events-none"
            initial={{ x: "-150%" }}
            animate={hovered && !isSubmitting ? { x: "250%" } : { x: "-150%" }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-2xl border-2 border-white/30"
            initial={{ scale: 1, opacity: 0 }}
            whileTap={{ scale: 1.06, opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.35 }}
          />
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.span key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="relative z-10 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Processing…
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="relative z-10 flex items-center justify-center gap-3">
                <motion.span
                  animate={hovered ? { rotate: [0, -15, 15, 0], scale: 1.2 } : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}>
                  {paymentMethod === "Card" ? <CreditCard className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                </motion.span>
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-base font-extrabold">
                    {paymentMethod === "Card" ? "Pay Securely" : "Place Order"}
                  </span>
                  <span className="text-xs font-semibold opacity-80">
                    PKR {total.toLocaleString()}
                    {isFreeDelivery && <span className="ml-1 text-secondary font-bold">· Free Delivery 🎉</span>}
                  </span>
                </span>
                <motion.span
                  animate={hovered ? { x: [0, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.4, repeat: hovered ? Infinity : 0, repeatDelay: 0.3 }}>
                  <ChevronRight className="h-5 w-5" />
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" /> 256-bit SSL encrypted · Your data is safe
      </motion.div>
    </div>
  );
};

/* ── Delivery badge ──────────────────────────────────────── */
const DeliveryBadge = ({ charge, subtotal }: { charge: number; subtotal: number }) => {
  const isFree    = subtotal >= FREE_DELIVERY_THRESHOLD;
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  return (
    <motion.div
      key={isFree ? "free" : "paid"}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-3 border text-xs font-semibold flex items-center gap-2
        ${isFree
          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
          : "bg-primary/5 border-primary/15 text-muted-foreground"}`}
    >
      {isFree ? (
        <><Gift className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span>🎉 <strong>Free delivery</strong> applied on orders ≥ PKR 2,000!</span></>
      ) : charge > 0 ? (
        <><Truck className="h-4 w-4 text-primary flex-shrink-0" />
          <span>Delivery: <strong>PKR {charge}</strong> · Add <strong>PKR {remaining.toLocaleString()}</strong> more for free delivery!</span></>
      ) : (
        <><Truck className="h-4 w-4 text-primary flex-shrink-0" />
          <span>PKR {RATE_PER_KM}/km · Max PKR {MAX_DELIVERY_CHARGE} · Free above <strong>PKR 2,000</strong></span></>
      )}
    </motion.div>
  );
};

/* ══ CheckoutForm ════════════════════════════════════════════ */
interface CheckoutFormProps {
  deliveryCharge: number;
  setDeliveryCharge: (v: number) => void;
}

const CheckoutForm = ({ deliveryCharge, setDeliveryCharge }: CheckoutFormProps) => {
  const { getTotal, placeOrder } = useCart();
  const navigate  = useNavigate();
  const stripe    = useStripe();
  const elements  = useElements();
  const { theme } = useTheme();

  const [form, setForm]             = useState({ name: "", email: "", phone: "" });
  const [pm, setPm]                 = useState<"COD" | "Card">("COD");
  const [submitting, setSubmitting] = useState(false);
  const [locating,   setLocating]   = useState(false);
  const [showMap,    setShowMap]    = useState(false);

  /* ── Location state — address comes ONLY from GPS or map pin ── */
  const [resolvedAddress,  setResolvedAddress]  = useState("");
  const [locationNotes,    setLocationNotes]    = useState("");
  const [locationSelected, setLocationSelected] = useState(false);
  const [mapPos,           setMapPos]           = useState<[number, number] | null>(null);

  const { user, profile } = useAuth();
  const subtotal    = getTotal();
  const isFree      = subtotal >= FREE_DELIVERY_THRESHOLD;
  const finalCharge = isFree ? 0 : deliveryCharge;
  const grandTotal  = Math.round(subtotal + finalCharge);

  useEffect(() => {
    if (isFree) setDeliveryCharge(0);
  }, [isFree, setDeliveryCharge]);

  useEffect(() => {
    if (user) setForm({
      name:  profile?.full_name || "",
      email: user.email        || "",
      phone: profile?.phone    || "",
    });
  }, [user, profile]);

  const STORE = { lat: 31.5204, lng: 74.3587 };

  const calcDist = (la1: number, lo1: number, la2: number, lo2: number) => {
    const R    = 6371;
    const dLat = (la2 - la1) * Math.PI / 180;
    const dLon = (lo2 - lo1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2
      + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const computeCharge = (lat: number, lng: number) =>
    isFree ? 0 : Math.min(Math.round(calcDist(STORE.lat, STORE.lng, lat, lng) * RATE_PER_KM), MAX_DELIVERY_CHARGE);

  /* ── Reverse geocode helper ── */
  // FIX 1: Added User-Agent header (required by Nominatim ToS), zoom=18 for
  //         street-level precision, and addressdetails=1 for richer results.
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "YourAppName/1.0 (contact@yourdomain.com)", // ← replace with your real app info
            "Accept-Language": "en",
          },
        }
      );
      const d = await r.json();
      return d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  /* ── Auto-locate via GPS ── */
  // FIX 2: maximumAge: 0  → never return a stale cached position.
  // FIX 3: timeout: 12000 → fail gracefully if device takes too long.
  // FIX 4: Better error messages distinguish permission-denied vs other failures.
  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        const charge  = computeCharge(lat, lng);
        const address = await reverseGeocode(lat, lng);
        setDeliveryCharge(charge);
        setMapPos([lat, lng]);
        setResolvedAddress(address);
        setLocationSelected(true);
        setShowMap(false);
        setLocating(false);
        toast.success(isFree ? "📍 Location set — FREE delivery!" : `📍 Location set! Delivery: PKR ${charge}`);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location access denied. Please allow it in your browser settings, then try again.");
        } else if (err.code === err.TIMEOUT) {
          toast.error("Location timed out. Try again or use the map pin instead.");
        } else {
          toast.error("Could not get your location. Try pinning your address on the map.");
        }
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,   // wait up to 12 s before failing
        maximumAge: 0,    // never use a cached position — always get a fresh fix
      }
    );
  };

  /* ── Map pin handler ── */
  const handlePin = async (lat: number, lng: number) => {
    setMapPos([lat, lng]);
    const charge  = computeCharge(lat, lng);
    const address = await reverseGeocode(lat, lng);
    setDeliveryCharge(charge);
    setResolvedAddress(address);
    setLocationSelected(true);
    toast.success(isFree ? "📍 FREE delivery on your order!" : `📍 Delivery: PKR ${charge}`);
  };

  const LocationMarker = () => {
    useMapEvents({ click(e) { handlePin(e.latlng.lat, e.latlng.lng); } });
    return mapPos ? <Marker position={mapPos} /> : null;
  };

  /* ── Final address = resolved address + optional notes ── */
  const buildFinalAddress = () =>
    locationNotes.trim()
      ? `${resolvedAddress} — Notes: ${locationNotes.trim()}`
      : resolvedAddress;

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (subtotal < MINIMUM_ORDER_AMOUNT) {
      toast.error(`Minimum order is PKR ${MINIMUM_ORDER_AMOUNT.toLocaleString()}. Add PKR ${(MINIMUM_ORDER_AMOUNT - subtotal).toLocaleString()} more to continue.`);
      return;
    }

    if (!locationSelected || !resolvedAddress) {
      toast.error("Please set your delivery location using Auto-Locate or Pin on Map.");
      return;
    }

    setSubmitting(true);
    const finalAddress = buildFinalAddress();

    if (pm === "Card") {
      if (!stripe || !elements) { toast.error("Payment loading, retry."); setSubmitting(false); return; }
      const { error, paymentMethod: stripepm } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement)!,
        billing_details: { name: form.name },
      });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      try {
        const order = await placeOrder(form.name, form.email, form.phone, finalAddress, pm, "Paid", finalCharge);
        if (order) { toast.success(`✅ Payment verified! (${stripepm.id.slice(0, 8)}…)`); navigate(`/order-confirmation/${order.id}`); }
      } catch { toast.error("Order failed."); } finally { setSubmitting(false); }
    } else {
      try {
        const order = await placeOrder(form.name, form.email, form.phone, finalAddress, pm, "Pending", finalCharge);
        if (order) navigate(`/order-confirmation/${order.id}`);
      } catch { toast.error("Order failed."); } finally { setSubmitting(false); }
    }
  };

  const field = (id: keyof typeof form, label: string, type = "text", icon?: React.ReactNode) => (
    <div>
      <Label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <Input
          id={id} type={type} required
          value={form[id]}
          onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
          className={`rounded-xl border-border/60 h-11 focus:border-primary transition-colors ${icon ? "pl-10" : ""}`}
        />
      </div>
    </div>
  );

  return (
    <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6">

      {/* 1 — Contact */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4 shadow-sm">
        <h3 className="font-bold text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
          Contact Information
        </h3>
        {field("name",  "Full Name")}
        {field("email", "Email",  "email", <Mail className="h-4 w-4" />)}
        {field("phone", "Phone",  "tel")}
      </div>

      {/* 2 — Delivery Location */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4 shadow-sm">
        <h3 className="font-bold text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
          Delivery Location
        </h3>

        {/* Instruction */}
        {!locationSelected && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-400"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Location required.</strong> Use Auto-Locate for GPS (best on mobile) or
              Pin on Map for precise placement. This ensures accurate delivery charges.
            </span>
          </motion.div>
        )}

        {/* GPS + Map buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              variant={locationSelected && mapPos ? "default" : "outline"}
              onClick={handleGPS}
              disabled={locating}
              className="w-full rounded-xl h-12 gap-2 text-sm font-semibold"
            >
              {locating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Locating…</>
                : <><Navigation className="h-4 w-4" /> Auto-Locate</>}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              variant={showMap ? "default" : "outline"}
              onClick={() => setShowMap(v => !v)}
              className="w-full rounded-xl h-12 gap-2 text-sm font-semibold"
            >
              {showMap
                ? <><X className="h-4 w-4" /> Close Map</>
                : <><MapIcon className="h-4 w-4" /> Pin on Map</>}
            </Button>
          </motion.div>
        </div>

        {/* Desktop hint */}
        <p className="text-[11px] text-muted-foreground/70 text-center -mt-1">
          On desktop, <strong>Pin on Map</strong> gives more accurate results than Auto-Locate
        </p>

        {/* Map */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border overflow-hidden"
            >
              <div className="bg-muted px-3 py-2 text-xs text-center border-b text-muted-foreground">
                Click anywhere on the map to drop your delivery pin
              </div>
              <div className="h-[280px] w-full">
                <MapContainer center={mapPos || [STORE.lat, STORE.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker />
                </MapContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resolved address — read-only display */}
        <AnimatePresence>
          {locationSelected && resolvedAddress && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">Location set</p>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">{resolvedAddress}</p>
                <button
                  type="button"
                  onClick={() => { setLocationSelected(false); setResolvedAddress(""); setMapPos(null); setDeliveryCharge(0); }}
                  className="text-[11px] text-primary underline mt-1.5 font-semibold hover:no-underline"
                >
                  Change location
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery charge badge */}
        <DeliveryBadge charge={finalCharge} subtotal={subtotal} />

        {/* Optional notes — only shown after location is selected */}
        <AnimatePresence>
          {locationSelected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1.5"
            >
              <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground block">
                Delivery Notes <span className="font-normal normal-case tracking-normal text-muted-foreground/70">(optional)</span>
              </Label>
              <textarea
                value={locationNotes}
                onChange={e => setLocationNotes(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="e.g. 2nd floor, ring the bell · Near the mosque · Green gate"
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
              <p className="text-[10px] text-muted-foreground text-right">{locationNotes.length}/200</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3 — Payment */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4 shadow-sm">
        <h3 className="font-bold text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
          Payment Method
        </h3>
        <RadioGroup value={pm} onValueChange={v => setPm(v as "COD" | "Card")} className="space-y-3">
          <label htmlFor="COD" className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
            ${pm === "COD" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
            <RadioGroupItem value="COD" id="COD" />
            <Banknote className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
            </div>
          </label>
          <div className={`rounded-xl border-2 transition-all ${pm === "Card" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
            <label htmlFor="Card" className="flex items-center gap-3 p-4 cursor-pointer">
              <RadioGroupItem value="Card" id="Card" />
              <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">Credit / Debit Card</p>
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                    <ShieldCheck className="h-3 w-3" /> Stripe
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, UnionPay</p>
              </div>
            </label>
            <AnimatePresence>
              {pm === "Card" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-4">
                  <div className="bg-background rounded-xl border border-border/60 p-4 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <CardElement options={{
                      style: {
                        base: { fontSize: "15px", color: theme === "dark" ? "#fff" : "#000", "::placeholder": { color: theme === "dark" ? "#9ca3af" : "#6b7280" } },
                        invalid: { color: "#ef4444" },
                      },
                      hidePostalCode: true,
                    }} />
                  </div>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                    <Lock className="h-3 w-3" /> Your card details are encrypted and secure
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </RadioGroup>
      </div>

      <PlaceOrderButton isSubmitting={submitting} paymentMethod={pm} total={grandTotal} stripe={stripe} />
    </motion.form>
  );
};

/* ══ Main Checkout ════════════════════════════════════════ */
const Checkout = () => {
  const { items, getTotal } = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const subtotal    = getTotal();
  const isFree      = subtotal >= FREE_DELIVERY_THRESHOLD;
  const finalCharge = isFree ? 0 : deliveryCharge;
  const grandTotal  = Math.round(subtotal + finalCharge);

  if (items.length === 0) { navigate("/cart"); return null; }

  if (!user) return (
    <div className="container py-20 max-w-md text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-muted-foreground text-sm">You must be signed in to place and track orders.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button size="lg" className="rounded-full px-6" onClick={() => navigate("/login", { state: { from: location } })}>Sign In</Button>
          <Button size="lg" variant="outline" className="rounded-full px-6" onClick={() => navigate("/signup", { state: { from: location } })}>Create Account</Button>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto group"
        >
          <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          Go Back
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1">Secure Checkout</p>
        <h1 className="text-3xl font-bold">Complete Your Order</h1>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3">
          <Elements stripe={stripePromise}>
            <CheckoutForm deliveryCharge={deliveryCharge} setDeliveryCharge={setDeliveryCharge} />
          </Elements>
        </div>

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
          className="lg:col-span-2 lg:sticky lg:top-24"
        >
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="bg-primary/5 border-b border-border/50 px-5 py-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Order Summary</h3>
              <span className="ml-auto text-xs text-muted-foreground">{items.length} items</span>
            </div>
            <div className="p-5">
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 mb-4">
                {items.map(item => {
                  const p = item.product.discount
                    ? Math.round(item.product.price * (1 - item.product.discount / 100))
                    : item.product.price;
                  return (
                    <div key={item.product.id} className="flex justify-between gap-2 text-sm">
                      <span className="text-muted-foreground truncate">
                        {item.product.name}{" "}
                        <span className="font-semibold text-foreground">×{item.quantity}</span>
                      </span>
                      <span className="font-semibold flex-shrink-0">PKR {(p * item.quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Minimum order warning */}
              {subtotal < MINIMUM_ORDER_AMOUNT && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/25"
                >
                  <p className="text-xs font-bold text-destructive mb-1.5">
                    Minimum order: PKR {MINIMUM_ORDER_AMOUNT.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Add <strong className="text-destructive">PKR {(MINIMUM_ORDER_AMOUNT - subtotal).toLocaleString()}</strong> more to place your order
                  </p>
                  <div className="h-1.5 rounded-full bg-destructive/15 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-destructive"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((subtotal / MINIMUM_ORDER_AMOUNT) * 100, 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Free delivery progress (only shown once minimum is met) */}
              {subtotal >= MINIMUM_ORDER_AMOUNT && !isFree && (
                <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/15">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Add <strong className="text-primary">PKR {(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()}</strong> more for free delivery
                  </p>
                  <div className="h-1.5 rounded-full bg-primary/15 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-border/50 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>PKR {Math.round(subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <AnimatePresence mode="wait">
                    {isFree ? (
                      <motion.span key="free" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-emerald-600 font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> FREE
                      </motion.span>
                    ) : (
                      <motion.span key="charge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold">
                        {finalCharge > 0 ? `PKR ${finalCharge}` : "Set location below"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-between font-extrabold text-base pt-3 border-t border-border/40">
                  <span>Total</span>
                  <motion.span key={grandTotal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-primary">
                    PKR {grandTotal.toLocaleString()}
                  </motion.span>
                </div>
              </div>

              {isFree && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Free delivery unlocked on this order!
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;