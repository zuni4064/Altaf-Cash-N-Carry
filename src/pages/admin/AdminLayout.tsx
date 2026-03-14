import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * AdminLayout
 *
 * Intentionally minimal — the AdminDashboard component owns its own
 * sidebar + top-bar navigation. This wrapper just provides:
 *   • A consistent full-screen dark-ish background
 *   • A small "Exit to Store" escape hatch in the very top-right corner
 *   • A page-entrance animation
 */
const AdminLayout = ({ children }: AdminLayoutProps) => (
  <div className="min-h-screen bg-muted/20 relative">

    {/* ── Subtle decorative blobs ────────────────────────────── */}
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
    </div>

    {/* ── "Exit to Store" pill — always visible top-right ────── */}
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="fixed top-3 right-4 z-50"
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold
                   bg-card/80 backdrop-blur-sm border border-border/60
                   text-muted-foreground hover:text-foreground
                   px-3 py-1.5 rounded-full shadow-sm
                   hover:shadow-md hover:border-primary/30
                   transition-all duration-200"
      >
        <ExternalLink className="h-3 w-3" />
        Exit to Store
      </Link>
    </motion.div>

    {/* ── Main content (Dashboard owns its own sidebar) ──────── */}
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-screen"
    >
      {children}
    </motion.main>
  </div>
);

export default AdminLayout;