import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { PostForm } from "@/features/publications/components/PostForm.tsx";
import { PostTree } from "@/features/publications/components/PostTree.tsx";
import { usePublicationsInfiniteFlat } from "@/features/publications/hooks/usePublicationsInfiniteFlat";
import { Card, CardContent } from "@/features/ui/card.tsx";

export function UserPosts({ userUUID }: { userUUID: UUID }) {
    const { error, isPending, publicationsFlat } = usePublicationsInfiniteFlat("feed", userUUID);
    const currUserUUID = useUserUUID();

    if (error) {
        return <div className="text-center text-red-500">Failed to load posts.</div>;
    }

    if (isPending) return null;

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            {currUserUUID == userUUID && (
                <Card className="border-2 border-black shadow-md">
                    <CardContent className="space-y-3 p-4">
                        <h2 className="text-lg font-semibold">Add a Post :)</h2>
                        <PostForm feedUserUUID={userUUID} />
                    </CardContent>
                </Card>
            )}
            {publicationsFlat?.map((post) => (
                <PostTree key={post.uuid} publication={post} />
            ))}
        </div>
    );
}
