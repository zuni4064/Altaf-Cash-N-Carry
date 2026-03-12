import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { User, MapPin, Plus, Trash2, Package, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Address {
    id: string;
    label: string;
    address_line: string;
    city: string;
    phone: string | null;
    is_default: boolean | null;
}

const UserDashboard = () => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const { orders: cartOrders } = useCart();
    const [tab, setTab] = useState<"profile" | "addresses" | "orders">("profile");
    const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [newAddr, setNewAddr] = useState({ label: "Home", address_line: "", city: "Lahore", phone: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setProfileForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
        }
    }, [profile]);

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const fetchAddresses = async () => {
        const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("created_at");
        setAddresses(data || []);
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        // Use upsert to handle new Google users or missing profile rows
        const { error } = await supabase.from("profiles").upsert({ 
            user_id: user!.id,
            full_name: profileForm.full_name,
            phone: profileForm.phone
        }, { onConflict: 'user_id' });
        
        setSaving(false);
        if (error) {
            toast.error(error.message);
        } else { 
            toast.success("Profile updated securely! 🔒"); 
            refreshProfile(); 
        }
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
    };

    const statusColor: Record<string, string> = {
        confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        preparing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        "out-for-delivery": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };

    const tabs = [
        { key: "profile" as const, label: "Profile", icon: User },
        { key: "addresses" as const, label: "Addresses", icon: MapPin },
        { key: "orders" as const, label: "Orders", icon: Package },
    ];

    return (
        <div className="container py-8 max-w-4xl mx-auto mt-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">My Account</h1>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                </div>
                <Button variant="outline" onClick={signOut} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border pb-2">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-card border border-b-0 border-border text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {tab === "profile" && (
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={updateProfile} className="bg-card rounded-lg border border-border p-6 space-y-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
                    </div>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Update Profile"}</Button>
                </motion.form>
            )}

            {/* Addresses Tab */}
            {tab === "addresses" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {addresses.map(a => (
                        <div key={a.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">{a.label}</span>
                                <p className="mt-1 text-sm">{a.address_line}, {a.city}</p>
                                {a.phone && <p className="text-xs text-muted-foreground">{a.phone}</p>}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteAddress(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <form onSubmit={addAddress} className="bg-card rounded-lg border border-border p-4 space-y-3">
                        <h3 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Address</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Label (Home, Office)" value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} />
                            <Input placeholder="City" value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} />
                        </div>
                        <Input placeholder="Full address" required value={newAddr.address_line} onChange={e => setNewAddr(p => ({ ...p, address_line: e.target.value }))} />
                        <Input placeholder="Phone (optional)" value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} />
                        <Button type="submit" size="sm">Add Address</Button>
                    </form>
                </motion.div>
            )}

            {/* Orders Tab */}
            {tab === "orders" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {cartOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">No orders yet</p>
                            <Link to="/shop"><Button className="mt-4">Start Shopping</Button></Link>
                        </div>
                    ) : cartOrders.slice(0, 5).map(o => (
                        <div key={o.id} className="bg-card rounded-lg border border-border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm font-bold">{o.id}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[o.status] || "bg-muted text-muted-foreground"}`}>
                                    {o.status}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{o.date}</p>
                            <p className="font-semibold text-primary mt-1">PKR {Math.round(o.total)}</p>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default UserDashboard;
