import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { PostCreateButton } from "@/features/publications/components/posts/PostCreateButton.tsx";
import { PostTabContent } from "@/features/publications/components/posts/PostTabContent.tsx";
import { useNewGlobalFeedPosts } from "@/features/publications/hooks/useNewFeedPosts.ts";
import { useGlobalFeedPostsFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { Tabs, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { useState } from "react";

export function GlobalFeed() {
    const [tab, setTab] = useState("mine");
    const userUUID = useUserUUID();

    const queryFriends = useGlobalFeedPostsFlat(false, "friends");
    const queryFollowed = useGlobalFeedPostsFlat(false, "followed");
    const queryMine = useGlobalFeedPostsFlat(false, "mine");
    const queryAll = useGlobalFeedPostsFlat(false);

    const { hasNewPosts, refresh } = useNewGlobalFeedPosts(queryAll.publicationsFlat?.[0]?.uuid);

    const sharedProps = { hasNewPosts, onLoadNewer: refresh, feedUserUUID: userUUID };

    return (
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
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
                    label="random"
                    posts={queryAll.publicationsFlat}
                    error={queryAll.error}
                    refetch={queryAll.refetch}
                    hasNextPage={queryAll.hasNextPage}
                    isFetchingNextPage={queryAll.isFetchingNextPage}
                    fetchNextPage={queryAll.fetchNextPage}
                    {...sharedProps}
                />
                <PostTabContent
                    label="friends"
                    posts={queryFriends.publicationsFlat}
                    error={queryFriends.error}
                    refetch={queryFriends.refetch}
                    hasNextPage={queryFriends.hasNextPage}
                    isFetchingNextPage={queryFriends.isFetchingNextPage}
                    fetchNextPage={queryFriends.fetchNextPage}
                    {...sharedProps}
                />
                <PostTabContent
                    label="followed"
                    posts={queryFollowed.publicationsFlat}
                    error={queryFollowed.error}
                    refetch={queryFollowed.refetch}
                    hasNextPage={queryFollowed.hasNextPage}
                    isFetchingNextPage={queryFollowed.isFetchingNextPage}
                    fetchNextPage={queryFollowed.fetchNextPage}
                    {...sharedProps}
                />
                <PostTabContent
                    label="mine"
                    posts={queryMine.publicationsFlat}
                    error={queryMine.error}
                    refetch={queryMine.refetch}
                    hasNextPage={queryMine.hasNextPage}
                    isFetchingNextPage={queryMine.isFetchingNextPage}
                    fetchNextPage={queryMine.fetchNextPage}
                    {...sharedProps}
                />
            </div>
        </Tabs>
    );
}
