import { api_client } from "@/api/axiosConf.ts";
import { PublicationURLs } from "@/api/endpoints.ts";
import { PaginatedRes } from "@/api/types";
import { PostTree } from "@/features/publications/components/PostTree.tsx";
import { Publication } from "@/features/publications/types.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function PostFeed() {
    const [tab, setTab] = useState("friends");

    const { data: postsFriends } = useQuery<PaginatedRes<Publication>>({
        queryFn: async () => {
            const res = await api_client.get(PublicationURLs.publicationFeed, {
                params: { connection: "friends" },
            });
            return res.data;
        },
        queryKey: ["publications", "feed", "latest", "friends"],
    });
    const { data: postsFollowed } = useQuery<PaginatedRes<Publication>>({
        queryFn: async () => {
            const res = await api_client.get(PublicationURLs.publicationFeed, {
                params: { connection: "followed" },
            });
            return res.data;
        },
        queryKey: ["publications", "feed", "latest", "followed"],
    });
    const { data: postsAll } = useQuery<PaginatedRes<Publication>>({
        queryFn: async () => {
            const res = await api_client.get(PublicationURLs.publicationFeed);
            return res.data;
        },
        queryKey: ["publications", "feed", "latest", "all"],
    });

    // TODO: move to a sep component?
    function renderPostTree(label: string, posts: Publication[] | undefined) {
        return (
            <TabsContent value={label}>
                <div className="space-y-6">
                    {posts?.map((post) => (
                        <PostTree key={post.uuid} publication={post} />
                    ))}
                    {
                        <Card>
                            <CardContent className="py-6 text-center text-muted-foreground">
                                No posts yet.
                            </CardContent>
                        </Card>
                    }
                </div>
            </TabsContent>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="mb-6 rounded-sm">
                    <TabsTrigger value="random">Random</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="followed">Followed</TabsTrigger>
                </TabsList>

                {renderPostTree("random", postsAll?.results)}
                {renderPostTree("friends", postsFriends?.results)}
                {renderPostTree("followed", postsFollowed?.results)}
            </Tabs>
        </div>
    );
}
