import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/modules/ui/tabs.tsx";
import { UserCard } from "@/modules/user/components/UserCard.tsx";
import { UserConnectionsContext } from "@/modules/user/providers/userConnectionsContext.tsx";
import { useContext, useState } from "react";

export function Connections() {
    const { friends, followed } = useContext(UserConnectionsContext);
    const [tab, setTab] = useState("friends");

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="followed">Followed</TabsTrigger>
                </TabsList>

                <TabsContent value="friends">
                    {friends.length === 0 ? (
                        <p className="text-muted-foreground">No friends yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                            {friends.map((friend) => (
                                <UserCard key={friend.uuid} user={friend} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="followed">
                    {followed.length === 0 ? (
                        <p className="text-muted-foreground">Not following anyone yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {followed.map((user) => (
                                <UserCard key={user.uuid} user={user} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
