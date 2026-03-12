import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Store, ShoppingBag, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Store },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin, user, loading: authLoading } = useAuth();

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // Check both localStorage AND AuthContext for admin status
        const isAuthenticated = localStorage.getItem("adminAuth") === "true";
        
        // If no admin auth flag OR user is not admin in context, redirect to login
        if (!isAuthenticated || !isAdmin || !user) {
            if (!isAuthenticated) {
                toast.error("Please login to access the admin portal.");
            } else if (!isAdmin) {
                toast.error("You do not have administrative privileges.");
            }
            localStorage.removeItem("adminAuth");
            navigate("/admin/login");
        }
    }, [navigate, isAdmin, user, authLoading]);

    const handleLogout = () => {
        localStorage.removeItem("adminAuth");
        toast.success("Logged out successfully");
        navigate("/admin/login");
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-card border-r border-border">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <Link to="/" className="font-display font-bold text-xl text-primary flex items-center gap-2">
                    <span>🛡️</span> Admin Portal
                </Link>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
                {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <Button
                    variant="destructive"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" /> Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-muted/20 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 w-64 z-50 md:hidden shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col min-w-0">
                <header className="h-16 glass border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="font-semibold text-lg hidden sm:block">
                            {NAV_LINKS.find(l => location.pathname.startsWith(l.href))?.label || "Admin"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden sm:inline-block">Welcome back, Admin</span>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            A
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
