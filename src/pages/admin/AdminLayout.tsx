import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    return (
        <div className="min-h-screen bg-muted/20">
            {/* Minimal Header Navigation */}
            <header className="bg-card border-b border-border sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/admin/dashboard" className="text-xl font-display font-bold text-primary flex items-center gap-2">
                        🛒 Admin Portal
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Exit to Store</span>
                    </Link>
                </div>
            </header>

            {/* Main Content Area - Full width for the monolithic dashboard */}
            <main>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
