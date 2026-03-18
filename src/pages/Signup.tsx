import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

const PERKS = [
  "Order from 500+ quality products",
  "Real-time order tracking",
  "Exclusive member-only deals",
  "Save multiple delivery addresses",
];

/* ── Password strength ── */
const getStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 6)              score++;
  if (pw.length >= 10)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  return score;
};
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

const Signup = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading] = useState(false);
  const [focused,  setFocused] = useState<string | null>(null);

  const strength = useMemo(() => getStrength(form.password), [form.password]);
  const pwMatch  = form.confirm.length > 0 && form.password === form.confirm;
  const pwMiss   = form.confirm.length > 0 && form.password !== form.confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6)       { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name);
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Account created! 🎉"); navigate(location.state?.from?.pathname || "/login", { replace: true }); }
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
            <Link to="/" className="font-display text-xl font-extrabold">Altaf Cash &amp; Carry</Link>
          </div>

          <div className="relative z-10 space-y-6">
            <div>
              <h2 className="text-3xl font-display font-extrabold leading-tight mb-2">Join Our Community</h2>
              <p className="text-primary-foreground/70 text-sm">Create your free account and get access to the best grocery deals in Lahore.</p>
            </div>
            <div className="space-y-3">
              {PERKS.map((perk, i) => (
                <motion.div
                  key={perk}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="text-primary-foreground/80">{perk}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-primary-foreground/50 text-xs">© 2024 Altaf Cash &amp; Carry · Lahore, Pakistan</p>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card p-8 md:p-10 flex flex-col justify-center"
        >
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

          <div className="mb-6">
            <h1 className="text-2xl font-display font-extrabold mb-1">Create Account</h1>
            <p className="text-muted-foreground text-sm">
              Already have one?{" "}
              <Link to="/login" state={{ from: location.state?.from }} className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            {[
              { id: "name",  label: "Full Name",    type: "text",     Icon: User, placeholder: "Your full name",    value: form.name    },
              { id: "email", label: "Email Address", type: "email",    Icon: Mail, placeholder: "your@email.com",   value: form.email   },
            ].map(f => (
              <div key={f.id}>
                <Label htmlFor={f.id} className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">{f.label}</Label>
                <div className="relative">
                  <f.Icon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === f.id ? "text-primary" : "text-muted-foreground"}`} />
                  <Input
                    id={f.id} type={f.type} required value={f.value}
                    onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                    onFocus={() => setFocused(f.id)} onBlur={() => setFocused(null)}
                    placeholder={f.placeholder}
                    className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "password" ? "text-primary" : "text-muted-foreground"}`} />
                <Input
                  id="password" type={showPass ? "text" : "password"} required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  placeholder="Min. 6 characters"
                  className="pl-10 pr-11 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                />
                <button type="button" aria-label="Toggle password" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength meter */}
              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? STRENGTH_COLORS[strength] : "bg-border"}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-semibold ${strength >= 4 ? "text-emerald-600" : strength >= 2 ? "text-amber-600" : "text-red-500"}`}>
                      {STRENGTH_LABELS[strength]} password
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm password */}
            <div>
              <Label htmlFor="confirm" className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Confirm Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "confirm" ? "text-primary" : "text-muted-foreground"}`} />
                <Input
                  id="confirm" type={showPass ? "text" : "password"} required value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                  placeholder="Repeat your password"
                  className={`pl-10 pr-11 h-11 rounded-xl transition-colors
                    ${pwMiss ? "border-red-500 focus:border-red-500" : pwMatch ? "border-emerald-500 focus:border-emerald-500" : "border-border/60 focus:border-primary"}`}
                />
                <AnimatePresence>
                  {(pwMatch || pwMiss) && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {pwMatch
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Circle className="h-4 w-4 text-red-500" />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {pwMiss && <p className="text-[10px] text-red-500 mt-1 font-medium">Passwords don't match</p>}
            </div>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold gap-2 relative overflow-hidden shadow-md shadow-primary/20">
                <motion.span className="absolute inset-0 bg-white/15 skew-x-[-15deg]" initial={{ x: "-130%" }} whileHover={{ x: "230%" }} transition={{ duration: 0.5 }} />
                {loading ? "Creating account…" : "Create Account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </motion.div>
          </form>

          {/* Google */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or continue with</span></div>
          </div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button type="button" variant="outline" disabled={loading} onClick={handleGoogle} className="w-full h-11 rounded-xl gap-2.5 border-border/60 font-semibold hover:bg-muted/50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </motion.div>

          <div className="mt-4 text-center">
            <Link to="/login?role=admin" className="text-muted-foreground hover:text-foreground text-xs transition-colors flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" /> Admin login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;