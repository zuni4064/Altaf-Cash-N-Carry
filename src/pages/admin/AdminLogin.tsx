import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();

    // Check if user is admin by fetching their role from the database
    const checkUserRole = async (userId: string): Promise<boolean> => {
        const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();
        return data?.role === "admin";
    };

    useEffect(() => {
        // If the context is still loading, wait
        if (authLoading) return;

        // If no user is logged in, do nothing (show login form)
        if (!user) return;

        // User is logged in - check if they are admin
        const verifyAndRedirect = async () => {
            const isUserAdmin = await checkUserRole(user.id);
            
            if (isUserAdmin) {
                // Set admin auth flag in localStorage
                localStorage.setItem("adminAuth", "true");
                navigate("/admin/dashboard");
            } else {
                // User is not admin - show error and sign them out
                toast.error("You do not have administrative privileges. Please use the user login.");
                await signOut();
                // Redirect to user login page
                navigate("/login");
            }
        };

        verifyAndRedirect();
    }, [user, authLoading, navigate, signOut]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // First, try to sign in
            const { error, data } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                toast.error(error.message || "Invalid credentials.");
                setLoading(false);
                return;
            }

            // Login succeeded - now check if user has admin role
            if (data.user) {
                const isUserAdmin = await checkUserRole(data.user.id);
                
                if (!isUserAdmin) {
                    // User exists but is not admin - sign them out immediately
                    await supabase.auth.signOut();
                    toast.error("Access denied. Only administrators can login via this portal.");
                    setLoading(false);
                    return;
                }

                // User is admin - set the admin auth flag and redirect
                localStorage.setItem("adminAuth", "true");
                toast.success("Welcome back, Admin!");
                navigate("/admin/dashboard");
            }
            
            setLoading(false);
        } catch (error: any) {
            toast.error(error.message || "An error occurred.");
            setLoading(false);
        } 
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border"
            >
                <div className="text-center mb-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-display font-bold">Admin Portal</h1>
                    <p className="text-muted-foreground mt-2">Sign in with your admin account.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Admin email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full text-lg h-12" disabled={loading}>
                        {loading ? "Authenticating..." : "Login"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-muted-foreground">
                        Need an admin account?{" "}
                        <Link to="/admin/signup" className="text-primary font-medium hover:underline">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
