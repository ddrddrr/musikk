import { Header } from "@/components/layout/header/Header.tsx";
import { MainContent } from "@/components/layout/MainContent.tsx";
import { PlayerBox } from "@/components/player/PlayerBox.tsx";
import { Toaster } from "@/components/ui/sonner";
import { EventURLs } from "@/config/endpoints.ts";
import { useEvent } from "@/hooks/useEvent.ts";
import { PlaybackProvider } from "@/providers/PlaybackProvider.tsx";
import { UserCollectionsProvider } from "@/providers/UserCollectionsProvider.tsx";
import { UserConnectionsProvider } from "@/providers/UserConnectionsProvider.tsx";
import { UserContext } from "@/providers/userContext.ts";
import { memo, useContext, useMemo } from "react";

export const HomePage = memo(function HomePage() {
    const { user } = useContext(UserContext);

    const eventUrl = useMemo(() => {
        return user?.uuid ? EventURLs.userEvents : "";
    }, [user?.uuid]);

    useEvent({ eventUrl, deps: [user?.uuid], isEnabled: Boolean(user) });

    return (
        <PlaybackProvider>
            <UserCollectionsProvider>
                <UserConnectionsProvider>
                    <div className="flex flex-col h-screen bg-gray-200">
                        <Header />
                        <MainContent />
                        <Toaster />
                        <PlayerBox />
                    </div>
                </UserConnectionsProvider>
            </UserCollectionsProvider>
        </PlaybackProvider>
    );
});
