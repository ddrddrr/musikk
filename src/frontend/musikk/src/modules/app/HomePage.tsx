import { Header } from "@/modules/layout/header/Header.tsx";
import { MainContent } from "@/modules/layout/MainContent.tsx";
import { PlaybackProvider } from "@/modules/playback/providers/PlaybackProvider.tsx";
import { PlayerBox } from "@/modules/player/PlayerBox.tsx";
import { Toaster } from "@/modules/ui/sonner";
import { UserCollectionsProvider } from "@/modules/user/providers/UserCollectionsProvider.tsx";
import { UserConnectionsProvider } from "@/modules/user/providers/UserConnectionsProvider.tsx";
import { memo } from "react";

export const HomePage = memo(function HomePage() {
    return (
        <PlaybackProvider>
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
        </PlaybackProvider>
    );
});
