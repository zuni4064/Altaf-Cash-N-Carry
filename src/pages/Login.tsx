import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isAdmin = searchParams.get("role") === "admin";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAdmin && email.toLowerCase() === "altafcashncarry@gmail.com") {
            toast.error("Invalid");
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Welcome back!");
            const from = location.state?.from?.pathname || (isAdmin ? "/admin" : "/");
            navigate(from, { replace: true });
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <span className="font-display text-2xl font-bold text-primary">Altaf Cash N Carry</span>
                    </Link>
                    {isAdmin ? (
                        <>
                            <h1 className="text-2xl font-display font-bold mb-2">Admin Login</h1>
                            <p className="text-muted-foreground text-sm">Sign in with your admin credentials</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-display font-bold mb-2">Welcome Back</h1>
                            <p className="text-muted-foreground">Sign in to your account</p>
                        </>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={isAdmin ? "admin@centralpark.pk" : "your@email.com"}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className={`w-full ${isAdmin ? "bg-primary" : "bg-primary"} text-primary-foreground`}>
                            {loading ? "Signing in..." : isAdmin ? "Sign In as Admin" : "Sign In"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    {!isAdmin && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                disabled={loading} 
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google
                            </Button>
                        </>
                    )}
                </div>

                <div className="mt-6 space-y-3 text-center text-sm">
                    {!isAdmin && (
                        <p className="text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/signup" state={{ from: location.state?.from }} className="text-primary font-medium hover:underline">
                                Create one
                            </Link>
                        </p>
                    )}
                    <p>
                        {isAdmin ? (
                            <Link to="/login" className="text-muted-foreground hover:text-foreground text-xs">
                                ← Back to customer login
                            </Link>
                        ) : (
                            <Link to="/login?role=admin" className="text-muted-foreground hover:text-foreground text-xs flex items-center justify-center gap-1">
                                <Shield className="h-3 w-3" /> Admin login
                            </Link>
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
