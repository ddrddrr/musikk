import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { Spinner } from "@/features/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { UserCard } from "@/features/user/components/UserCard.tsx";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { useContext, useState } from "react";

export function Connections() {
    const { friends, followed, followers, error, isLoading } = useContext(UserConnectionsContext);
    const [tab, setTab] = useState("friends");

    if (error) {
        return <QueryErrorBox message="Failed to load connections" />;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner className="size-8" />
            </div>
        );
    }

    return (
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
            <div className="border-b border-border px-6 py-4">
                <TabsList className="rounded-sm">
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="followed">Followed</TabsTrigger>
                    <TabsTrigger value="followers">Followers</TabsTrigger>
                </TabsList>
            </div>
            <div className="mx-auto w-full max-w-4xl p-6">
                <TabsContent value="friends">
                    {friends.length === 0 && (
                        <EmptyState variant="inline" message="No friends yet" className="py-12" />
                    )}
                    {friends.length > 0 && (
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
                            {friends.map((friend) => (
                                <UserCard key={friend.uuid} user={friend} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="followed">
                    {followed.length === 0 && (
                        <EmptyState
                            variant="inline"
                            message="Not following anyone yet"
                            className="py-12"
                        />
                    )}
                    {followed.length > 0 && (
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
                            {followed.map((user) => (
                                <UserCard key={user.uuid} user={user} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="followers">
                    {followers.length === 0 && (
                        <EmptyState variant="inline" message="No followers yet" className="py-12" />
                    )}
                    {followers.length > 0 && (
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
                            {followers.map((user) => (
                                <UserCard key={user.uuid} user={user} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </div>
        </Tabs>
    );
}
