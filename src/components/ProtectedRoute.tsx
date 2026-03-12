import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
    const { user, loading, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (adminOnly && !isAdmin) return <Navigate to="/" replace />; // Ensure admin access

    return <>{children}</>;
};

export default ProtectedRoute;
