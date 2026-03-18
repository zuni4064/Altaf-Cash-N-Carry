import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PERKS = [
  "Track your orders in real-time",
  "Save your favourite products",
  "Faster checkout every time",
  "Exclusive deals & early access",
];

const Login = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();
  const isAdmin   = searchParams.get("role") === "admin";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && email.toLowerCase() === "altafcashncarry@gmail.com") { toast.error("Invalid credentials"); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Welcome back! 👋");
      navigate(location.state?.from?.pathname || (isAdmin ? "/admin" : "/"), { replace: true });
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { toast.error(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl border border-border/60">

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex gradient-hero relative overflow-hidden flex-col justify-between p-10 text-primary-foreground"
        >
          {/* Blobs */}
          {[
            { size: 300, top: "-15%", left: "-10%", color: "hsl(var(--primary)/0.3)"   },
            { size: 200, top: "55%",  left: "60%",  color: "hsl(var(--secondary)/0.25)" },
          ].map((b, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-3xl pointer-events-none"
              style={{ width: b.size, height: b.size, top: b.top, left: b.left, background: b.color }}
              animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
              transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/" className="font-display text-xl font-extrabold">
                Altaf Cash &amp; Carry
              </Link>
            </motion.div>
          </div>

          <div className="relative z-10 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-3xl font-display font-extrabold leading-tight mb-2">
                {isAdmin ? "Admin Portal" : "Welcome Back!"}
              </h2>
              <p className="text-primary-foreground/70 text-sm">
                {isAdmin ? "Secure admin access to manage your store." : "Sign in to access your account and start shopping."}
              </p>
            </motion.div>

            {!isAdmin && (
              <div className="space-y-3">
                {PERKS.map((perk, i) => (
                  <motion.div
                    key={perk}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.1 }}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-secondary/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-2.5 w-2.5 text-secondary" />
                    </div>
                    <span className="text-primary-foreground/80">{perk}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="relative z-10 text-primary-foreground/50 text-xs"
          >
            © 2024 Altaf Cash &amp; Carry · Lahore, Pakistan
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL — Form ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card p-8 md:p-10 flex flex-col justify-center"
        >
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-6">
            <Link to="/" className="font-display text-xl font-bold text-primary">Altaf Cash &amp; Carry</Link>
          </div>

          {/* Go Back button */}
          <button
            onClick={() => navigate(location.state?.from?.pathname || -1 as any)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Go Back
          </button>

          <div className="mb-7">
            <h1 className="text-2xl font-display font-extrabold mb-1">
              {isAdmin ? "Admin Sign In" : "Sign In"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAdmin ? "Enter your admin credentials below." : "New here?"}
              {!isAdmin && (
                <Link to="/signup" state={{ from: location.state?.from }} className="text-primary font-semibold ml-1 hover:underline">
                  Create a free account
                </Link>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                <Input
                  id="email" type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  placeholder={isAdmin ? "admin@altaf.pk" : "your@email.com"}
                  className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "password" ? "text-primary" : "text-muted-foreground"}`} />
                <Input
                  id="password" type={showPass ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  className="pl-10 pr-11 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AnimatePresence mode="wait">
                    <motion.div key={showPass ? "off" : "on"} initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.12 }}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
              <Button
                type="submit" disabled={loading}
                className="w-full h-11 rounded-xl font-bold gap-2 relative overflow-hidden shadow-md shadow-primary/20"
              >
                <motion.span className="absolute inset-0 bg-white/15 skew-x-[-15deg]" initial={{ x: "-130%" }} whileHover={{ x: "230%" }} transition={{ duration: 0.5 }} />
                {loading ? "Signing in…" : isAdmin ? "Sign In as Admin" : "Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </motion.div>
          </form>

          {/* Google + divider */}
          {!isAdmin && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or continue with</span></div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button" variant="outline" disabled={loading}
                  onClick={handleGoogle}
                  className="w-full h-11 rounded-xl gap-2.5 border-border/60 font-semibold hover:bg-muted/50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </motion.div>
            </>
          )}

          {/* Footer links */}
          <div className="mt-6 flex flex-col items-center gap-2 text-xs">
            {isAdmin ? (
              <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">← Back to customer login</Link>
            ) : (
              <Link to="/login?role=admin" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Shield className="h-3 w-3" /> Admin login
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;