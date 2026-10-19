import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useGlobalFeedPosts } from "@/features/publications/api/queries.ts";
import { PostCreateButton } from "@/features/publications/components/posts/PostCreateButton.tsx";
import { PostTabContent } from "@/features/publications/components/posts/PostTabContent.tsx";
import { useNewGlobalFeedPosts } from "@/features/publications/hooks/useNewFeedPosts.ts";
import { FeedConnection } from "@/features/publications/types.ts";
import { Tabs, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { useState } from "react";

type FeedTab = "random" | FeedConnection;

const CONNECTION_BY_TAB: Record<FeedTab, FeedConnection | undefined> = {
    random: undefined,
    friends: "friends",
    followed: "followed",
    mine: "mine",
};

export function GlobalFeed() {
    const [tab, setTab] = useState<FeedTab>("mine");
    const userUUID = useUserUUID();

    const connection = CONNECTION_BY_TAB[tab];
    const query = useGlobalFeedPosts(connection);
    const { hasNewPosts, refresh } = useNewGlobalFeedPosts(connection, query.data?.[0]?.uuid);

    return (
        <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as FeedTab)}
            className="flex flex-col"
        >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <TabsList className="rounded-sm">
                    <TabsTrigger value="random">Random</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="followed">Followed</TabsTrigger>
                    <TabsTrigger value="mine">Yours</TabsTrigger>
                </TabsList>
                <PostCreateButton feedUserUUID={userUUID} onCreated={() => setTab("mine")} />
            </div>
            <div className="mx-auto w-full max-w-2xl p-6">
                <PostTabContent
                    label={tab}
                    query={query}
                    hasNewPosts={hasNewPosts}
                    onLoadNewer={refresh}
                    feedUserUUID={userUUID}
                />
            </div>
        </Tabs>
    );
}
