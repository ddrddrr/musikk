import { Header } from "@/features/layout/header/Header.tsx";
import { MainContent } from "@/features/layout/MainContent.tsx";
import { PlayerBox } from "@/features/player/PlayerBox.tsx";
import { Toaster } from "@/features/ui/sonner";
import { UserCollectionsProvider } from "@/features/user/providers/UserCollectionsProvider.tsx";
import { UserConnectionsProvider } from "@/features/user/providers/UserConnectionsProvider.tsx";
import { memo } from "react";

export const HomePage = memo(function HomePage() {
    return (
        <UserCollectionsProvider>
            <UserConnectionsProvider>
                <div className="h-screen flex flex-col bg-gray-200">
                    <Header />
                    <div className="flex flex-1 overflow-hidden">
                        <MainContent />
                    </div>
                    <Toaster />
                    <PlayerBox />
                </div>
            </UserConnectionsProvider>
        </UserCollectionsProvider>
    );
});
