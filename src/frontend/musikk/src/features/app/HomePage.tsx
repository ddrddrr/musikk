import { Header } from "@/features/layout/header/Header.tsx";
import { MainContent } from "@/features/layout/MainContent.tsx";
import { PlayerBox } from "@/features/player/PlayerBox.tsx";
import { SongQueue } from "@/features/song-queue/components/SongQueue.tsx";
import { Toaster } from "@/features/ui/sonner";
import { UserCollectionsProvider } from "@/features/user/providers/UserCollectionsProvider.tsx";
import { UserConnectionsProvider } from "@/features/user/providers/UserConnectionsProvider.tsx";
import { cn } from "@/lib/utils.ts";
import { memo, useState } from "react";
import { UserChatsProvider } from "../publications/providers/UserChatsProvider";

export const HomePage = memo(function HomePage() {
    const [isQueueOpen, setIsQueueOpen] = useState(false);

    return (
        <UserCollectionsProvider>
            <UserConnectionsProvider>
                <UserChatsProvider>
                    <div className="flex h-screen flex-col bg-gray-200">
                        <Header />
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <div className={cn("min-h-0 overflow-hidden", isQueueOpen && "h-1/4", !isQueueOpen && "flex-1")}>
                                <MainContent />
                            </div>
                            {isQueueOpen && (
                                <div className="min-h-0 h-3/4 border-t border-black">
                                    <SongQueue />
                                </div>
                            )}
                        </div>
                        <Toaster />
                        <PlayerBox setIsQueueOpen={setIsQueueOpen} />
                    </div>
                </UserChatsProvider>
            </UserConnectionsProvider>
        </UserCollectionsProvider>
    );
});
