import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
    children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
    const location = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <CenteredSpinner className="min-h-screen" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
