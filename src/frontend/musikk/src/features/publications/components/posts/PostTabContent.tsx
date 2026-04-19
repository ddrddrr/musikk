import { UUID } from "@/api/types.ts";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { LoadOlderButton } from "@/features/publications/components/LoadOlderButton.tsx";
import { LoadNewerButton } from "@/features/publications/components/LoadNewerButton.tsx";
import { PostTree } from "@/features/publications/components/posts/PostTree.tsx";
import { Publication } from "@/features/publications/types.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { TabsContent } from "@/features/ui/tabs.tsx";

export type PostTabContentProps = {
    label: string;
    posts: Publication[] | undefined;
    error: Error | null;
    refetch: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown> | void;
    hasNewPosts: boolean;
    onLoadNewer: () => void;
    feedUserUUID: UUID;
};

export function PostTabContent({
    label,
    posts,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasNewPosts,
    onLoadNewer,
    feedUserUUID,
}: PostTabContentProps) {
    return (
        <TabsContent value={label}>
            <div className="flex flex-col gap-6">
                {error && (
                    <QueryErrorBox
                        message="Failed to load posts"
                        onRetry={() => void refetch()}
                    />
                )}
                <div className="flex justify-center py-4">
                    <LoadNewerButton hasNewerPosts={hasNewPosts} onLoadNewer={onLoadNewer} />
                </div>
                {!error &&
                    posts?.map((post) => (
                        <PostTree key={post.uuid} publication={post} feedUserUUID={feedUserUUID} />
                    ))}
                {!error && !posts?.length && (
                    <Card className="border border-foreground">
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
