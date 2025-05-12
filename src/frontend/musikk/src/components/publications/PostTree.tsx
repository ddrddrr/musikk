import { PostForm } from "@/components/publications/PostForm.tsx";
import { IPost } from "@/components/publications/types";
import { fetchCollectionBasic } from "@/components/song-collections/queries";
import { SongCollectionCard } from "@/components/song-collections/SongCollectionCard";
import { songRetrieve } from "@/components/songs/queries.ts";
import { SongContainer } from "@/components/songs/SongContainer.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fetchUser } from "@/components/user/queries.ts";
import { UserCard } from "@/components/user/UserCard.tsx";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PostProps {
    publication: IPost;
    depth?: number;
}

export function PostTree({ publication, depth = 0 }: PostProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const objType = publication.obj_type;
    const objUUID = publication.obj_uuid;
    const hasChildren = publication.children && publication.children.length > 0;

    // distinguish nesting levels
    const getBgColor = () => {
        if (!publication.parent) return "bg-white";

        const colors = ["bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300"];
        return colors[depth % colors.length];
    };

    const { data: obj } = useQuery({
        queryKey: [objType, objUUID],
        queryFn: async () => {
            if (!objType || !objUUID) return null;
            switch (objType) {
                case "collection":
                    return fetchCollectionBasic(objUUID);
                case "song":
                    return songRetrieve(objUUID);
                case "user":
                    return fetchUser(objUUID);
                default:
                    throw new Error("Unknown obj_type");
            }
        },
        enabled: !!(objType && objUUID),
    });

    return (
        <div className="relative">
            <Card className={cn("border border-black rounded-md shadow-sm mb-2", getBgColor())}>
                <CardContent className="py-0 px-3">
                    {obj &&
                        (() => {
                            switch (objType) {
                                case "collection":
                                    return (
                                        <div className="mb-4">
                                            <SongCollectionCard collection={obj} size="medium" />
                                        </div>
                                    );
                                case "song":
                                    return (
                                        <div className="mb-4 border border-gray-300 rounded-md p-3 bg-white">
                                            <SongContainer collectionSong={obj} />
                                        </div>
                                    );
                                case "user":
                                    return (
                                        <div className="mb-4">
                                            <UserCard user={obj} />
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })()}

                    <div className="flex items-center gap-2">
                        <div className="text-xs font-medium">{publication.display_name || "Anonymous"}</div>
                        <div className="text-[10px] text-muted-foreground">
                            {new Date(publication.date_added).toLocaleString("en-US", {
                                dateStyle: "short",
                                timeStyle: "short",
                            })}
                        </div>
                    </div>

                    <div className="text-sm whitespace-pre-wrap p-2 rounded-sm bg-gray-50 border border-gray-100 my-2">
                        {publication.content}
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsReplying((prev) => !prev)}
                            className="text-xs text-blue-600 hover:underline px-0 h-auto"
                        >
                            {isReplying ? "Cancel" : "Reply"}
                        </Button>

                        {hasChildren && (
                            <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[11px] hover:bg-gray-100"
                                    >
                                        <span className="flex items-center gap-1">
                                            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                            <span className="flex items-center gap-1">
                                                {publication.children.length}{" "}
                                                {publication.children.length === 1 ? "reply" : "replies"}
                                            </span>
                                        </span>
                                    </Button>
                                </CollapsibleTrigger>
                            </Collapsible>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-2 pl-2">
                            <div className="border border-black rounded-sm p-3 bg-gray-50">
                                <PostForm
                                    userUUID={publication.user_uuid}
                                    replyTo={publication}
                                    setReplyTo={() => setIsReplying(false)}
                                    onSuccess={() => setIsReplying(false)}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {hasChildren && (
                <Collapsible open={!isCollapsed}>
                    <CollapsibleContent>
                        <div className="relative pl-4 ml-2 space-y-0">
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-200"></div>

                            {publication.children.map((reply, index) => (
                                <div key={reply.uuid} className="relative">
                                    <div className="absolute left-0 top-3 w-2 h-[2px] bg-gray-200"></div>
                                    <PostTree publication={reply} depth={depth + 1} />
                                </div>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
}
