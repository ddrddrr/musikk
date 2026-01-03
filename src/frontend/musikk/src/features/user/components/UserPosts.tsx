import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { usePublicationListQuery } from "@/features/publications/api/queries.ts";
import { PostForm } from "@/features/publications/components/PostForm.tsx";
import { PostTree } from "@/features/publications/components/PostTree.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";

export function UserPosts({ userUUID }: { userUUID: UUID }) {
    const { data: posts, isPending, error } = usePublicationListQuery("feed", userUUID);
    const currUserUUID = useUserUUID();

    if (error) {
        return <div className="text-red-500 text-center">Failed to load posts.</div>;
    }

    if (isPending) return null;

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
            {currUserUUID == userUUID && (
                <Card className="border-2 border-black shadow-md">
                    <CardContent className="p-4 space-y-3">
                        <h2 className="text-lg font-semibold">Add a Post :)</h2>
                        <PostForm feedUserUuid={userUUID} />
                    </CardContent>
                </Card>
            )}
            {posts?.map((post) => (
                <PostTree key={post.uuid} publication={post} />
            ))}
        </div>
    );
}
