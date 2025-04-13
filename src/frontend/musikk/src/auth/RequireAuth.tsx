import Cookies from "js-cookie";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: JSX.Element }) {
    const location = useLocation();

    if (!Cookies.get("refresh")) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
