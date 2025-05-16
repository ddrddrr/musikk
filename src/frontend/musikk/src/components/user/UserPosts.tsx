import { PostForm } from "@/components/publications/PostForm";
import { PostTree } from "@/components/publications/PostTree";
import { useUserPostsQuery } from "@/components/publications/queries";
import { Card, CardContent } from "@/components/ui/card";
import { UUID } from "@/config/types";
import { useUserUUID } from "@/hooks/useUserUUID.ts";

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
            {posts?.map((post) => <PostTree key={post.uuid} publication={post} />)}
        </div>
    );
}
