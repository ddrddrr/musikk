import { UUID } from "@/api/types.ts";
import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useGlobalFeedPosts } from "@/features/publications/api/queries.ts";
import { LoadNewerButton } from "@/features/publications/components/LoadNewerButton.tsx";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { PostTree } from "@/features/publications/components/posts/PostTree.tsx";
import { TabsContent } from "@/features/ui/tabs.tsx";

type PostTabContentProps = {
    label: string;
    query: ReturnType<typeof useGlobalFeedPosts>;
    hasNewPosts: boolean;
    onLoadNewer: () => void;
    feedUserUUID: UUID;
};

export function PostTabContent({
    label,
    query,
    hasNewPosts,
    onLoadNewer,
    feedUserUUID,
}: PostTabContentProps) {
    const {
        data: posts,
        error,
        refetch,
        isPending,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = query;

    return (
        <TabsContent value={label}>
            <div className="flex flex-col gap-6">
                {error && (
                    <QueryErrorBox message="Failed to load posts" onRetry={() => void refetch()} />
                )}
                <div className="flex justify-center py-4">
                    <LoadNewerButton hasNewerPosts={hasNewPosts} onLoadNewer={onLoadNewer} />
                </div>
                {!error &&
                    posts?.map((post) => (
                        <PostTree key={post.uuid} publication={post} feedUserUUID={feedUserUUID} />
                    ))}
                {isPending && <CenteredSpinner />}
                {!isPending && !error && !posts?.length && <EmptyState message="No posts yet" />}
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
