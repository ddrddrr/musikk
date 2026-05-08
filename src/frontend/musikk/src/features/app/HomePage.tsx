import { MainContent } from "@/features/layout/MainContent.tsx";
import { UserConnectionsProvider } from "@/features/user/providers/UserConnectionsProvider.tsx";
import { memo } from "react";
import { UserChatsProvider } from "../publications/providers/UserChatsProvider";

export const HomePage = memo(function HomePage() {
    // TODO: we most probably need to remove those providers
    // and just create hooks instead that use useQuery inside
    // (since it is already a global store)
    // same as the collections provider refactor
    return (
        <UserConnectionsProvider>
            <UserChatsProvider>
                <MainContent />
            </UserChatsProvider>
        </UserConnectionsProvider>
    );
});
