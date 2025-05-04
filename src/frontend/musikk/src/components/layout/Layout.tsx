import React, { memo } from "react";

import { Header } from "./header/Header.tsx";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = memo(function Layout({ children }: LayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <Header />
            <div className="flex flex-1 overflow-hidden">{children}</div>
        </div>
    );
});
