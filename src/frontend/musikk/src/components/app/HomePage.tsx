import { Layout } from "@/components/layout/Layout.tsx";
import { MainContent } from "@/components/layout/MainContent.tsx";
import { EventURLs } from "@/config/endpoints.ts";
import { useEvent } from "@/hooks/useEvent.ts";
import { UserContext } from "@/providers/userContext.ts";
import { memo, useContext, useMemo } from "react";

export const HomePage = memo(function HomePage() {
    const { user } = useContext(UserContext);

    const eventUrl = useMemo(() => {
        return user?.uuid ? EventURLs.userEvents : "";
    }, [user]);

    useEvent({ eventUrl, deps: [user], isEnabled: true });

    return (
        <Layout>
            <MainContent />
        </Layout>
    );
});
