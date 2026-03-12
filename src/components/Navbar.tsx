import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, Heart, User, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/my-orders", label: "My Orders" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const { getItemCount, cartBounce } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const count = getItemCount();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileOpen && 
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    
    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // Animation variants for mobile menu items - FIXED TYPES
  const itemVariants: Variants = {
    closed: { 
      x: -20, 
      opacity: 0 
    },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    })
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="container flex items-center justify-between h-16 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 lg:flex-none flex z-10"
        >
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <img src="/logo.png" alt="Central Park Grocer" className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
        </motion.div>

        {/* Desktop nav - UNCHANGED */}
        <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-6 z-10 whitespace-nowrap">
          {navLinks.map((l, i) => (
            <motion.div
              key={l.to}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            >
              <Link
                to={l.to}
                className="relative text-sm font-medium transition-all hover:text-primary text-muted-foreground group py-1 px-2"
              >
                <span className={location.pathname === l.to ? "text-primary font-semibold" : ""}>
                  {l.label}
                </span>
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out ${location.pathname === l.to ? "scale-x-100" : ""}`} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right side - UNCHANGED except mobile toggle */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-1.5 lg:gap-2 z-10"
        >
          <ModeToggle />
          
          {/* Search */}
          <Link to="/shop" title="Search & Shop">
            <Button variant="ghost" size="icon" className="hover:scale-110 transition-all lg:flex hidden" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {/* Wishlist */}
          <Link to="/wishlist" className="relative" title="Wishlist">
            <Button variant="ghost" size="icon" className="hover:scale-110 transition-all">
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Button>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative" title="Cart">
            <Button variant="ghost" size="icon" className={`hover:scale-110 transition-all ${cartBounce ? 'animate-bounce' : ''}`}>
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Button>
          </Link>

          {/* Auth */}
          {user ? (
            isAdmin ? (
              <Link to="/admin" title="Admin Panel">
                <Button size="icon" variant="default" className="h-9 w-9 hover:scale-110 transition-all">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard" title="My Account">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-all">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )
          ) : (
            <>
              <Link to="/login" className="hidden lg:inline-flex">
                <Button variant="outline" size="sm" className="hover:scale-105 transition-all h-9">
                  Sign In
                </Button>
              </Link>
              <Link to="/login" className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-all">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle - ENHANCED */}
          <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            className={`lg:hidden h-9 w-9 hover:scale-110 transition-all relative ${
              mobileOpen 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg ring-2 ring-primary/20' 
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <Menu className={`h-5 w-5 absolute transition-all duration-300 ${
              mobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
            }`} />
            <X className={`h-5 w-5 absolute transition-all duration-300 ${
              mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
            }`} />
          </Button>
        </motion.div>
      </div>

      {/* Mobile menu - ENHANCED */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={toggleMobileMenu}
              style={{ zIndex: 40 }}
            />
            
            {/* Menu panel with animations */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden border-t bg-background/95 backdrop-blur-xl relative shadow-2xl"
              style={{ zIndex: 45 }}
            >
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
              
              <div className="container">
                <div className="flex flex-col py-4 space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.to}
                      custom={index}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <Link
                        to={link.to}
                        className={`py-3 px-4 -mx-4 rounded-lg text-base font-medium transition-all duration-200 block ${
                          location.pathname === link.to
                            ? 'text-primary bg-primary/10 font-semibold'
                            : 'text-muted-foreground hover:text-primary hover:bg-accent'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                  
                  <div className="pt-2 border-t border-border/50">
                    <motion.div
                      custom={navLinks.length}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-3 py-3 px-4 -mx-4 rounded-lg text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200"
                      >
                        <Heart className="h-5 w-5 flex-shrink-0" />
                        <span>Wishlist</span>
                        {wishlist.length > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                            {wishlist.length}
                          </span>
                        )}
                      </Link>
                    </motion.div>

                    {user ? (
                      isAdmin ? (
                        <motion.div
                          custom={navLinks.length + 1}
                          variants={itemVariants}
                          initial="closed"
                          animate="open"
                          exit="closed"
                        >
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 py-3 px-4 -mx-4 rounded-lg text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200"
                          >
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </motion.div>
                      ) : (
                        <motion.div
                          custom={navLinks.length + 1}
                          variants={itemVariants}
                          initial="closed"
                          animate="open"
                          exit="closed"
                        >
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 py-3 px-4 -mx-4 rounded-lg text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200"
                          >
                            <User className="h-5 w-5 flex-shrink-0" />
                            <span>My Account</span>
                          </Link>
                        </motion.div>
                      )
                    ) : (
                      <motion.div
                        custom={navLinks.length + 1}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                      >
                        <Link
                          to="/login"
                          className="flex items-center gap-3 py-3 px-4 -mx-4 rounded-lg text-base font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                        >
                          <User className="h-5 w-5 flex-shrink-0" />
                          <span>Sign In</span>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;