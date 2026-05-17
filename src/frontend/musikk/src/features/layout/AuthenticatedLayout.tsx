import { Header } from "@/features/layout/header/Header.tsx";
import { PlayerBox } from "@/features/player/PlayerBox.tsx";
import { SongQueue } from "@/features/song-queue/components/SongQueue.tsx";
import { Toaster } from "@/features/ui/sonner";
import { useState } from "react";
import { Outlet } from "react-router-dom";

export function AuthenticatedLayout() {
    const [isQueueOpen, setIsQueueOpen] = useState(false);

    return (
        <div className="flex h-screen flex-col bg-muted">
            <Header />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <Outlet />
                </div>
                {isQueueOpen && (
                    <div className="absolute inset-0 border-t border-foreground bg-card">
                        <SongQueue />
                    </div>
                )}
            </div>
            <Toaster position="top-center" />
            <PlayerBox setIsQueueOpen={setIsQueueOpen} />
        </div>
    );
}
