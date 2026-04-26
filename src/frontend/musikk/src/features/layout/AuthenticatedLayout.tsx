import { Header } from "@/features/layout/header/Header.tsx";
import { Outlet } from "react-router-dom";

export function AuthenticatedLayout() {
    return (
        <div className="flex h-screen flex-col bg-muted">
            <Header />
            <Outlet />
        </div>
    );
}
