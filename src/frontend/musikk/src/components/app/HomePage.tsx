import { Layout } from "@/components/layout/Layout.tsx";
import { MainContent } from "@/components/layout/MainContent.tsx";
import { Toaster } from "@/components/ui/sonner";
import { EventURLs } from "@/config/endpoints.ts";
import { useEvent } from "@/hooks/useEvent.ts";
import { PlaybackProvider } from "@/providers/PlaybackProvider.tsx";
import { UserCollectionsProvider } from "@/providers/UserCollectionsProvider.tsx";
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
                <Layout>
                    <MainContent />
                    <Toaster />
                </Layout>
            </UserCollectionsProvider>
        </PlaybackProvider>
    );
});
