import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProfileForm } from "@/components/user/ProfileForm";
import { fetchUser } from "@/components/user/queries";
import { UserAvatar } from "@/components/user/UserAvatar.tsx";
import { UserFeed } from "@/components/user/UserFeed.tsx";
import { UserContext } from "@/providers/userContext.ts";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { useParams } from "react-router-dom";

export function ProfilePage() {
    const { uuid } = useParams<{ uuid: string }>();
    const { user } = useContext(UserContext);
    const {
        isLoading,
        isError,
        data: currUser,
    } = useQuery({
        queryKey: ["user", uuid],
        queryFn: () => fetchUser(uuid!),
        enabled: Boolean(uuid),
    });

    if (isLoading) {
        return <div className="p-8 text-center">Loading profile…</div>;
    }

    if (isError) {
        return <div className="p-8 text-center text-red-600">Error loading profile.</div>;
    }

    if (!currUser) {
        return null;
    }

    return (
        <div className="flex flex-col items-center pt-8">
            <div className="flex items-start space-x-6">
                <UserAvatar src={currUser.avatar} alt={currUser.display_name} size="lg" />
                <div>
                    <h1 className="text-2xl font-semibold">{currUser.display_name}</h1>
                    <div className="text-sm text-muted-foreground mt-1 max-h-40 overflow-y-auto">{currUser.bio}</div>
                    <Dialog>
                        <DialogTrigger asChild>
                            {user?.uuid === currUser.uuid && (
                                <Button variant="outline" className="mt-4">
                                    Edit Profile
                                </Button>
                            )}
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogClose />
                            </DialogHeader>
                            <ProfileForm />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="mt-8 w-full">
                <UserFeed userUUID={uuid} />
            </div>
        </div>
    );
}
