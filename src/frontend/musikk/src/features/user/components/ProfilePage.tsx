import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Button } from "@/features/ui/button.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/features/ui/dialog.tsx";
import { ProfileForm } from "@/features/user/components/ProfileForm.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { UserPosts } from "@/features/user/components/UserPosts.tsx";
import { useFollowUser } from "@/features/user/hooks/useFollowUser.ts";
import { fetchUser } from "@/features/user/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export function ProfilePage() {
    const { uuid } = useParams<{ uuid: string }>();
    const currUserUUID = useUserUUID();
    const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useFollowUser(uuid);

    // TODO add handling if curr user uuid is undefined
    const {
        isLoading,
        isError,
        data: user,
    } = useQuery({
        queryKey: ["user", uuid],
        queryFn: () => fetchUser(uuid!),
        enabled: !!uuid,
    });

    const isOwnProfile = currUserUUID === uuid;

    if (isLoading) {
        return <div className="p-8 text-center">Loading profile…</div>;
    }

    if (isError) {
        return <div className="p-8 text-center text-red-600">Error loading profile.</div>;
    }

    if (!user || !uuid) {
        return null;
    }

    return (
        <div className="flex flex-col items-center pt-8">
            <div className="flex items-start space-x-6">
                <UserAvatar src={user.avatar} alt={user.display_name} size="lg" />
                <div>
                    <h1 className="text-2xl font-semibold">{user.display_name}</h1>
                    <div className="mt-1 max-h-40 overflow-y-auto text-sm text-muted-foreground">
                        {user.bio}
                    </div>
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
                                {isFollowLoading
                                    ? "Loading..."
                                    : isFollowing
                                      ? "Following"
                                      : "Follow"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-8 w-full">
                <UserPosts userUUID={uuid} />
            </div>
        </div>
    );
}
