import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { PostTree } from "@/features/publications/components/posts/PostTree.tsx";
import { useFeedPostsFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { Publication } from "@/features/publications/types.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { useState } from "react";

export function GlobalFeed() {
    const [tab, setTab] = useState("friends");
    const userUUID = useUserUUID();

    const queryFriends = useFeedPostsFlat(userUUID!, false, "friends");
    const queryFollowed = useFeedPostsFlat(userUUID!, false, "followed");
    const queryAll = useFeedPostsFlat(userUUID!, false);

    function renderPostTree(
        label: string,
        posts: Publication[] | undefined,
        hasNextPage: boolean,
        isFetchingNextPage: boolean,
        fetchNextPage: () => Promise<unknown> | void,
    ) {
        return (
            <TabsContent value={label}>
                <div className="space-y-6">
                    {posts?.map((post) => (
                        <PostTree key={post.uuid} publication={post} />
                    ))}
                    {!posts?.length && (
                        <Card className={"border border-black"}>
                            <CardContent className="py-6 text-center text-muted-foreground">
                                No posts yet.
                            </CardContent>
                        </Card>
                    )}
                    <div className="flex justify-center py-4">
                        <LoadOlderButton
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            fetchNextPage={fetchNextPage}
                        />
                    </div>
                </div>
            </TabsContent>
        );
    }

    if (!userUUID) return null;

    return (
        <div className="mx-auto max-w-2xl p-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="mb-6 rounded-sm">
                    <TabsTrigger value="random">Random</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="followed">Followed</TabsTrigger>
                </TabsList>

                {renderPostTree(
                    "random",
                    queryAll.publicationsFlat,
                    queryAll.hasNextPage,
                    queryAll.isFetchingNextPage,
                    queryAll.fetchNextPage,
                )}
                {renderPostTree(
                    "friends",
                    queryFriends.publicationsFlat,
                    queryFriends.hasNextPage,
                    queryFriends.isFetchingNextPage,
                    queryFriends.fetchNextPage,
                )}
                {renderPostTree(
                    "followed",
                    queryFollowed.publicationsFlat,
                    queryFollowed.hasNextPage,
                    queryFollowed.isFetchingNextPage,
                    queryFollowed.fetchNextPage,
                )}
            </Tabs>
        </div>
    );
}
