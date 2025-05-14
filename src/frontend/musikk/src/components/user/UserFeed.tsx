import { PostTree } from "@/components/publications/PostTree";
import { IPublication } from "@/components/publications/types.ts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/config/axiosConf.ts";
import { PostURLs } from "@/config/endpoints.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function UserFeed() {
    const [tab, setTab] = useState("friends");

    const { data: postsFriends } = useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.postLatestList, { params: { connection: "friends" } });
            return res.data;
        },
        queryKey: ["posts", "latest", "friends"],
    });
    const { data: postsFollowed } = useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.postLatestList, { params: { connection: "followed" } });
            return res.data;
        },
        queryKey: ["posts", "latest", "followed"],
    });
    const { data: postsAll } = useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.postLatestList);
            return res.data;
        },
        queryKey: ["posts", "latest", "all"],
    });

    function renderPostTree(label: string, posts: IPublication[] | undefined) {
        return (
            <TabsContent value={label}>
                <div className="space-y-6">
                    {posts?.map((post) => <PostTree key={post.uuid} publication={post} />)}
                    {!posts?.length && (
                        <Card>
                            <CardContent className="text-center text-muted-foreground py-6">No posts yet.</CardContent>
                        </Card>
                    )}
                </div>
            </TabsContent>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="random">Random</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="followed">Followed</TabsTrigger>
                </TabsList>

                {renderPostTree("random", postsAll)}
                {renderPostTree("friends", postsFriends)}
                {renderPostTree("followed", postsFollowed)}
            </Tabs>
        </div>
    );
}
