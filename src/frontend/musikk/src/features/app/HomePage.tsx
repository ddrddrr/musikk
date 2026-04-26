import { MainContent } from "@/features/layout/MainContent.tsx";
import { PlayerBox } from "@/features/player/PlayerBox.tsx";
import { SongQueue } from "@/features/song-queue/components/SongQueue.tsx";
import { Toaster } from "@/features/ui/sonner";
import { UserCollectionsProvider } from "@/features/user/providers/UserCollectionsProvider.tsx";
import { UserConnectionsProvider } from "@/features/user/providers/UserConnectionsProvider.tsx";
import { memo, useState } from "react";
import { UserChatsProvider } from "../publications/providers/UserChatsProvider";

export const HomePage = memo(function HomePage() {
    // TODO: this and other queue-related stuff should probably be moved from the Player* components
    // but kinda hard to deduplicate now, left for later
    const [isQueueOpen, setIsQueueOpen] = useState(false);

    return (
        <UserCollectionsProvider>
            <UserConnectionsProvider>
                <UserChatsProvider>
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <MainContent />
                        </div>
                        {isQueueOpen && (
                            <div className="absolute inset-0 border-t border-foreground bg-card">
                                <SongQueue />
                            </div>
                        )}
                    </div>
                    <Toaster />
                    <PlayerBox setIsQueueOpen={setIsQueueOpen} />
                </UserChatsProvider>
            </UserConnectionsProvider>
        </UserCollectionsProvider>
    );
});
