import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { LoadNewerButton } from "@/features/publications/components/LoadNewerButton.tsx";
import { PostForm } from "@/features/publications/components/posts/PostForm.tsx";
import { PostTree } from "@/features/publications/components/posts/PostTree.tsx";
import { useFeedWsEvents } from "@/features/publications/hooks/useFeedWsEvents.ts";
import { useNewFeedPosts } from "@/features/publications/hooks/useNewFeedPosts.ts";
import { useFeedPostsFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";

export function UserFeed({ userUUID }: { userUUID: UUID }) {
    useFeedWsEvents(userUUID);
    const {
        error,
        isPending,
        publicationsFlat,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useFeedPostsFlat(userUUID, false);
    const currUserUUID = useUserUUID();
    const { hasNewPosts, refresh } = useNewFeedPosts(userUUID, publicationsFlat?.[0]?.uuid);

    if (error) {
        return <div className="text-center text-destructive">Failed to load posts.</div>;
    }

    if (isPending) return null;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            {currUserUUID === userUUID && (
                <Card className="border-2 border-foreground shadow-md">
                    <CardContent className="flex flex-col gap-3 p-4">
                        <h2 className="text-lg font-semibold">Add a Post :)</h2>
                        <PostForm feedUserUUID={userUUID} />
                    </CardContent>
                </Card>
            )}
            <div className="flex justify-center py-4">
                <LoadNewerButton hasNewerPosts={hasNewPosts} onLoadNewer={refresh} />
            </div>
            {publicationsFlat?.map((post) => (
                <PostTree key={post.uuid} publication={post} feedUserUUID={userUUID} />
            ))}
            <div className="flex justify-center py-4">
                <LoadOlderButton
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                />
            </div>
        </div>
    );
}
