import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Plus, Trash2, Package, LogOut, CheckCircle2, Clock, Truck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Address {
  id: string; label: string; address_line: string; city: string; phone: string | null; is_default: boolean | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  confirmed:         { label: "Confirmed",       color: "bg-blue-500/15 text-blue-600 border-blue-500/25",       icon: CheckCircle2 },
  preparing:         { label: "Preparing",        color: "bg-amber-500/15 text-amber-600 border-amber-500/25",    icon: Clock        },
  "out-for-delivery":{ label: "Out for Delivery", color: "bg-primary/15 text-primary border-primary/25",          icon: Truck        },
  delivered:         { label: "Delivered",        color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25", icon: CheckCircle2 },
};

const TABS = [
  { key: "profile"   as const, label: "Profile",   icon: User    },
  { key: "addresses" as const, label: "Addresses",  icon: MapPin  },
  { key: "orders"    as const, label: "Orders",     icon: Package },
];

const UserDashboard = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { orders: cartOrders } = useCart();
  const [tab, setTab]           = useState<"profile" | "addresses" | "orders">("profile");
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  const [addresses, setAddresses]     = useState<Address[]>([]);
  const [newAddr, setNewAddr]         = useState({ label: "Home", address_line: "", city: "Lahore", phone: "" });
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (profile) setProfileForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
  }, [profile]);
  useEffect(() => { if (user) fetchAddresses(); }, [user]);

  const fetchAddresses = async () => {
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("created_at");
    setAddresses(data || []);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user!.id, ...profileForm }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated! 🔒"); refreshProfile(); }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("addresses").insert({ ...newAddr, user_id: user!.id });
    if (error) toast.error(error.message);
    else { toast.success("Address added!"); setNewAddr({ label: "Home", address_line: "", city: "Lahore", phone: "" }); fetchAddresses(); }
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    fetchAddresses();
    toast.success("Address removed");
  };

  const initials = (profile?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10 max-w-5xl">

        {/* ── TOP HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display font-extrabold text-xl shadow-lg shadow-primary/25"
            >
              {initials}
            </motion.div>
            <div>
              <h1 className="text-2xl font-display font-extrabold">{profile?.full_name || "My Account"}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              onClick={signOut}
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/8 rounded-xl"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">

          {/* ── SIDEBAR NAV ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <div className="bg-card border border-border/60 rounded-2xl p-2 shadow-sm space-y-1">
              {TABS.map(t => (
                <motion.button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left
                    ${tab === t.key
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                >
                  <t.icon className="h-4 w-4 flex-shrink-0" />
                  {t.label}
                  {tab === t.key && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
                </motion.button>
              ))}
            </div>

            {/* Quick stats */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 mt-4 shadow-sm space-y-3">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Quick Stats</p>
              {[
                { label: "Total Orders",    value: cartOrders.length },
                { label: "Saved Addresses", value: addresses.length  },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-bold text-primary">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── MAIN CONTENT ── */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">

              {/* Profile tab */}
              {tab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                    <h2 className="font-display font-bold text-lg mb-5">Profile Information</h2>
                    <form onSubmit={updateProfile} className="space-y-4">
                      {[
                        { id: "full_name", label: "Full Name",    placeholder: "Your full name",    value: profileForm.full_name },
                        { id: "phone",     label: "Phone Number", placeholder: "03XX-XXXXXXX",      value: profileForm.phone     },
                      ].map(f => (
                        <div key={f.id}>
                          <Label htmlFor={f.id} className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">{f.label}</Label>
                          <Input
                            id={f.id} value={f.value} placeholder={f.placeholder}
                            onChange={e => setProfileForm(p => ({ ...p, [f.id]: e.target.value }))}
                            className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                          />
                        </div>
                      ))}
                      <div>
                        <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Email</Label>
                        <Input value={user?.email || ""} disabled className="h-11 rounded-xl bg-muted/50 cursor-not-allowed" />
                        <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed</p>
                      </div>
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <Button type="submit" disabled={saving} className="rounded-xl px-6 gap-2">
                          {saving ? "Saving…" : "Save Changes"}
                          {!saving && <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                      </motion.div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Addresses tab */}
              {tab === "addresses" && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">

                  {addresses.length === 0 && (
                    <div className="bg-card border border-border/60 rounded-2xl p-10 text-center shadow-sm">
                      <MapPin className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No saved addresses yet. Add one below.</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {addresses.map(a => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16, height: 0 }}
                        className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-start justify-between hover:border-primary/30 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">{a.label}</span>
                            <p className="text-sm mt-1.5">{a.address_line}, {a.city}</p>
                            {a.phone && <p className="text-xs text-muted-foreground mt-0.5">{a.phone}</p>}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                          aria-label="Delete address"
                          onClick={() => deleteAddress(a.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add address form */}
                  <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                      <Plus className="h-4 w-4 text-primary" /> Add New Address
                    </h3>
                    <form onSubmit={addAddress} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Label (Home, Office…)" value={newAddr.label}
                          onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))}
                          className="h-10 rounded-xl border-border/60 focus:border-primary text-sm"
                        />
                        <Input
                          placeholder="City" value={newAddr.city}
                          onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))}
                          className="h-10 rounded-xl border-border/60 focus:border-primary text-sm"
                        />
                      </div>
                      <Input
                        placeholder="Full address" required value={newAddr.address_line}
                        onChange={e => setNewAddr(p => ({ ...p, address_line: e.target.value }))}
                        className="h-10 rounded-xl border-border/60 focus:border-primary text-sm"
                      />
                      <Input
                        placeholder="Phone (optional)" value={newAddr.phone}
                        onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))}
                        className="h-10 rounded-xl border-border/60 focus:border-primary text-sm"
                      />
                      <Button type="submit" size="sm" className="rounded-xl gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Save Address
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Orders tab */}
              {tab === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3">
                  {cartOrders.length === 0 ? (
                    <div className="bg-card border border-border/60 rounded-2xl p-12 text-center shadow-sm">
                      <Package className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="font-bold mb-1">No orders yet</p>
                      <p className="text-muted-foreground text-sm mb-5">Start shopping and your orders will appear here.</p>
                      <Link to="/shop"><Button className="rounded-xl gap-2">Browse Products</Button></Link>
                    </div>
                  ) : (
                    cartOrders.slice(0, 8).map((o, i) => {
                      const cfg = STATUS_CONFIG[o.status] ?? { label: o.status, color: "bg-muted text-muted-foreground border-border", icon: Clock };
                      const StatusIcon = cfg.icon;
                      return (
                        <motion.div
                          key={o.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Link to={`/order-confirmation/${o.id}`}>
                            <motion.div
                              whileHover={{ x: 4 }}
                              className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                      #{o.id?.toString().slice(-8).toUpperCase()}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                      <StatusIcon className="h-2.5 w-2.5" />{cfg.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{o.date} · {o.items.length} items</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-primary text-sm">PKR {Math.round(o.total).toLocaleString()}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </motion.div>
                          </Link>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;