import Cookies from "js-cookie";
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
    children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
    const location = useLocation();

    if (!Cookies.get("refresh")) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
