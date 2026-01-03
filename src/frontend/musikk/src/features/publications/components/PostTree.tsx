import { cn } from "@/lib/utils.ts";
import { PostForm } from "@/features/publications/components/PostForm.tsx";
import { IPublication } from "@/features/publications/types.ts";
import { CollectionCard } from "@/features/song-collections/components/CollectionCard.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/ui/collapsible.tsx";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PostTreeProps {
    publication: IPublication;
    depth?: number;
}

export function PostTree({ publication, depth = 0 }: PostTreeProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [areChildrenOpen, setAreChildrenOpen] = useState(false);
    const hasChildren = publication.children && publication.children.length > 0;

    // nesting levels
    const getBgColor = () => {
        if (!publication.parent_uuid) return "bg-white";

        const colors = ["bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300"];
        return colors[depth % colors.length];
    };

    function renderCardContent() {
        if (publication.attachment) {
            switch (publication.attachment_type) {
                // TODO: tighten types here
                case "collection":
                    return (
                        <div className="mb-4">
                            <CollectionCard collection={publication.attachment} size="medium" />
                        </div>
                    );
                case "song":
                    return (
                        <div className="mb-4">
                            <SongContainer
                                collectionSong={publication.attachment}
                                className="border border-gray-300 rounded-md p-3 bg-white"
                            />
                        </div>
                    );
                default:
                    return null;
            }
        }
    }

    return (
        <div className="relative">
            <Card className={cn("border border-black rounded-md shadow-sm mb-2", getBgColor())}>
                <CardContent className="py-0 px-3">
                    {publication.attachment && renderCardContent()}

                    <div className="flex items-center gap-2">
                        {/*<div className="text-xs font-medium">{publication.display_name || "Anonymous"}</div>*/}
                        <UserIdentifier user={publication.author} />
                        <div className="text-[10px] text-muted-foreground">
                            {new Date(publication.date_added).toLocaleString("en-US", {
                                dateStyle: "short",
                                timeStyle: "short",
                            })}
                        </div>
                    </div>

                    <div className="text-sm whitespace-pre-wrap p-2 rounded-sm bg-gray-50 border border-gray-100 my-2 max-h-[8rem] overflow-auto">
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
                    </div>

                    {isReplying && (
                        <div className="mt-2 pl-2">
                            <div className="border border-black rounded-sm p-3 bg-gray-50">
                                <PostForm
                                    replyTo={publication}
                                    setReplyTo={() => setIsReplying(false)}
                                    onSuccess={() => setIsReplying(false)}
                                    feedUserUuid={publication.obj_uuid}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {hasChildren && (
                <Collapsible open={areChildrenOpen} onOpenChange={setAreChildrenOpen}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] hover:bg-gray-100"
                        >
                            <span className="flex items-center gap-1">
                                {areChildrenOpen ? (
                                    <ChevronUp size={12} />
                                ) : (
                                    <ChevronDown size={12} />
                                )}
                                <span className="flex items-center gap-1">
                                    {publication.children.length}{" "}
                                    {publication.children.length === 1 ? "reply" : "replies"}
                                </span>
                            </span>
                        </Button>
                    </CollapsibleTrigger>
                    {areChildrenOpen && (
                        <CollapsibleContent>
                            <div className="relative pl-4 ml-2 space-y-0">
                                <div className="left-0 top-0 bottom-0 w-[2px] bg-gray-200"></div>
                                {publication.children.map((reply: IPublication) => (
                                    <div key={reply.uuid} className="relative">
                                        <div className="left-0 top-3 w-2 h-[2px] bg-gray-200"></div>
                                        <PostTree publication={reply} depth={depth + 1} />
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    )}
                </Collapsible>
            )}
        </div>
    );
}
