import { Link } from "react-router-dom";
import { MapPin, Phone, Facebook, Instagram, ArrowUp, ShoppingBag, Heart } from "lucide-react";
import { motion } from "framer-motion";

const QUICK_LINKS = [
  { to: "/",          label: "Home"       },
  { to: "/shop",      label: "Shop"       },
  { to: "/categories",label: "Categories" },
  { to: "/about",     label: "About Us"   },
  { to: "/contact",   label: "Contact"    },
];

const ACCOUNT_LINKS = [
  { to: "/login",      label: "Sign In"       },
  { to: "/signup",     label: "Create Account" },
  { to: "/dashboard",  label: "My Profile"    },
  { to: "/my-orders",  label: "My Orders"     },
  { to: "/wishlist",   label: "Wishlist"      },
];

const SOCIALS = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/altafcashandcarrycentralpark/",
    label: "Facebook",
    color: "hover:bg-blue-600",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/altafcashandcarrycphs/",
    label: "Instagram",
    color: "hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-amber-400",
  },
];

/* ── Scroll to top on nav ── */
const ScrollToTopLink = ({ to, label, className = "" }: { to: string; label: string | React.ReactNode; className?: string }) => (
  <Link to={to} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={className}>
    {label}
  </Link>
);

/* ── Animated footer link ── */
const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
    <Link
      to={to}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors group"
    >
      <motion.span className="w-0 h-px bg-secondary group-hover:w-3 transition-all duration-200 inline-block" />
      {label}
    </Link>
  </motion.div>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-primary text-primary-foreground mt-16 overflow-hidden">

      {/* Decorative blobs */}
      {[
        { size: 350, left: "-8%",  top: "-20%", opacity: 0.12 },
        { size: 280, left: "75%",  top: "10%",  opacity: 0.10 },
        { size: 200, left: "40%",  top: "60%",  opacity: 0.08 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{ width: b.size, height: b.size, left: b.left, top: b.top, opacity: b.opacity, filter: "blur(60px)" }}
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 9 + i * 3, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Top wave */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden leading-[0] rotate-180">
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12 fill-background">
          <path d="M0,24 C360,48 1080,0 1440,24 L1440,48 L0,48 Z" />
        </svg>
      </div>

      <div className="container relative z-10 pt-20 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <ScrollToTopLink
              to="/"
              label={
                <img src="/logo.png" alt="Altaf Cash and Carry"
                  className="h-16 w-auto bg-white/10 p-2 rounded-2xl object-contain" />
              }
              className="inline-block mb-5"
            />
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-5 max-w-xs">
              Your one-stop shop for fresh quality groceries and household essentials in Lahore — serving families since 1995.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(s => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center transition-all duration-300 ${s.color}`}
                >
                  <s.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
          >
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-5 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-secondary" /> Quick Links
            </h4>
            <div className="flex flex-col gap-3">
              {QUICK_LINKS.map(l => <FooterLink key={l.to} {...l} />)}
            </div>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18, type: "spring", stiffness: 100 }}
          >
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-5 flex items-center gap-2">
              <Heart className="h-4 w-4 text-secondary" /> My Account
            </h4>
            <div className="flex flex-col gap-3">
              {ACCOUNT_LINKS.map(l => <FooterLink key={l.to} {...l} />)}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26, type: "spring", stiffness: 100 }}
          >
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-5 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-secondary" /> Contact Us
            </h4>
            <div className="flex flex-col gap-4 text-sm text-primary-foreground/70">
              <motion.div whileHover={{ x: 4 }} className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-secondary" />
                <span>66-67 A, Block A, Central Park Society, Lahore</span>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 flex-shrink-0 mt-0.5 text-secondary" />
                <div className="flex flex-col gap-0.5">
                  <a href="tel:03219410035" className="hover:text-primary-foreground transition-colors">0321-9410035</a>
                  <a href="tel:03212410035" className="hover:text-primary-foreground transition-colors">0321-2410035</a>
                </div>
              </motion.div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold self-start">
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-400 inline-block"
                />
                Open · 7 AM – 11 PM Daily
              </div>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <span>© {year} Altaf Cash &amp; Carry. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400 mx-0.5" /> in Lahore, Pakistan
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;