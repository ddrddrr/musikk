import { PageErrorFallback } from "@/features/errors/PageErrorFallback.tsx";
import { Header } from "@/features/layout/header/Header.tsx";
import { PlayerBox } from "@/features/player/PlayerBox.tsx";
import { SongQueue } from "@/features/song-queue/components/SongQueue.tsx";
import { Toaster } from "@/features/ui/sonner.tsx";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router-dom";

export function AuthenticatedLayout() {
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const location = useLocation();
    const [prevLocation, setPrevLocation] = useState(location);

    // the queue covers the page, so any navigation closes it
    // otherwise a link clicked inside the queue would change the page out of sight
    if (location !== prevLocation) {
        setPrevLocation(location);
        setIsQueueOpen(false);
    }

    return (
        <div className="flex h-screen flex-col bg-muted">
            <Header />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* resetKeys clears the error */}
                <ErrorBoundary resetKeys={[location.key]} fallback={<PageErrorFallback />}>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <Outlet />
                    </div>
                    {isQueueOpen && (
                        <div className="absolute inset-0 z-20 border-t border-foreground bg-card">
                            <SongQueue />
                        </div>
                    )}
                </ErrorBoundary>
            </div>
            <Toaster position="top-center" />
            <PlayerBox onToggleQueue={() => setIsQueueOpen((open) => !open)} />
        </div>
    );
}
