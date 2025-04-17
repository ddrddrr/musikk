import type React from "react";

import { Header } from "./Header.tsx";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <Header />
            <div className="flex flex-1 overflow-hidden">{children}</div>
        </div>
    );
}
