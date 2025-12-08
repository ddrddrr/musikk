import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { PostForm } from "@/modules/publications/PostForm.tsx";
import { PostTree } from "@/modules/publications/PostTree.tsx";
import { useUserPostsQuery } from "@/modules/publications/queries.ts";
import { Card, CardContent } from "@/modules/ui/card.tsx";

export function UserPosts({ userUUID }: { userUUID: UUID }) {
    const { data: posts, isPending, error } = useUserPostsQuery(userUUID);
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
                        <PostForm />
                    </CardContent>
                </Card>
            )}
            {posts?.map((post) => (
                <PostTree key={post.uuid} publication={post} />
            ))}
        </div>
    );
}
