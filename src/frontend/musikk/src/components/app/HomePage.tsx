// import { useHandleInvalidateEvent } from "@/components/app/useHandleInvalidateEvent.ts";
import { Header } from "@/components/layout/header/Header.tsx";
import { MainContent } from "@/components/layout/MainContent.tsx";
import { PlayerBox } from "@/components/player/PlayerBox.tsx";
import { Toaster } from "@/components/ui/sonner";
// import { useUserEvent } from "@/events/useUserEvent.ts";
import { PlaybackProvider } from "@/providers/PlaybackProvider.tsx";
import { UserCollectionsProvider } from "@/providers/UserCollectionsProvider.tsx";
import { UserConnectionsProvider } from "@/providers/UserConnectionsProvider.tsx";
import { memo } from "react";

export const HomePage = memo(function HomePage() {
    // useUserEvent({ handleEvent: useHandleInvalidateEvent(), eventKey: "invalidate" });

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
