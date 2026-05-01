import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { UserCollectionsGrid } from "@/features/collections/components/UserCollectionsGrid.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { UserFeed } from "@/features/publications/components/posts/UserFeed.tsx";
import { Button } from "@/features/ui/button.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/features/ui/dialog.tsx";
import { Spinner } from "@/features/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { fetchUser } from "@/features/user/api/queries.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { ProfileForm } from "@/features/user/components/ProfileForm.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { useFollowUser } from "@/features/user/hooks/useFollowUser.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

export function ProfilePage() {
    const { uuid } = useParams<{ uuid: string }>();
    const currUserUUID = useUserUUID();
    const [tab, setTab] = useState("posts");
    const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useFollowUser(uuid);

    // TODO: dont fetch if current?
    const {
        isLoading,
        isError,
        data: user,
        refetch,
    } = useQuery({
        queryKey: userKeys.detail(uuid!),
        queryFn: () => fetchUser(uuid!),
        enabled: !!uuid,
    });

    const isOwnProfile = currUserUUID === uuid;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (isError) {
        return <QueryErrorBox message="Failed to load profile" onRetry={() => void refetch()} />;
    }

    if (!user || !uuid) {
        return null;
    }

    return (
        <div className="flex flex-col items-center pt-8">
            <UserAvatar src={user.avatar} alt={user.display_name} size="lg" />
            <h1 className="mt-2 text-2xl font-semibold">{user.display_name}</h1>
            {user.bio && (
                <div className="mt-2 max-h-40 w-120 overflow-y-auto text-sm text-muted-foreground">
                    <p className="whitespace-pre-wrap">{user.bio}</p>
                </div>
            )}
            <div className="mt-4 flex gap-2">
                {isOwnProfile && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">Edit Profile</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogClose />
                            </DialogHeader>

                            <ProfileForm />
                        </DialogContent>
                    </Dialog>
                )}
                {!isOwnProfile && (
                    <Button
                        variant={isFollowing ? "outline" : "brand"}
                        onClick={toggleFollow}
                        disabled={isFollowLoading}
                    >
                        {isFollowLoading ? <Spinner /> : isFollowing ? "Following" : "Follow"}
                    </Button>
                )}
            </div>
            <Tabs value={tab} onValueChange={setTab} className="mt-8 flex w-full flex-col">
                <div className="border-b border-border px-6 py-4">
                    <TabsList className="rounded-sm">
                        <TabsTrigger value="posts">Posts</TabsTrigger>
                        <TabsTrigger value="playlists">Playlists</TabsTrigger>
                        {user.is_artist && <TabsTrigger value="albums">Albums</TabsTrigger>}
                    </TabsList>
                </div>
                <div className="mx-auto w-full max-w-4xl p-6">
                    <TabsContent value="posts">
                        <UserFeed userUUID={uuid} />
                    </TabsContent>

                    <TabsContent value="playlists">
                        <UserCollectionsGrid userUUID={uuid} type="playlist" />
                    </TabsContent>

                    {user.is_artist && (
                        <TabsContent value="albums">
                            <UserCollectionsGrid userUUID={uuid} type="album" />
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
