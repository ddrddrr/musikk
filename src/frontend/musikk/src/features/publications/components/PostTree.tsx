import { PostForm } from "@/features/publications/components/PostForm.tsx";
import { Publication, PublicationWChildren } from "@/features/publications/types.ts";
import { CollectionCard } from "@/features/song-collections/components/CollectionCard.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/ui/collapsible.tsx";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";
import { cn } from "@/lib/utils.ts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PostTreeProps {
    publication: Publication | PublicationWChildren;
    depth?: number;
}

export function PostTree({ publication, depth = 0 }: PostTreeProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [areChildrenOpen, setAreChildrenOpen] = useState(false);
    const children = (publication as PublicationWChildren).children;

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
                            <SongContainer collectionSong={publication.attachment} />
                        </div>
                    );
                default:
                    return null;
            }
        }
    }

    return (
        <div className="relative">
            <Card className={cn("mb-2 rounded-md border border-black shadow-sm", getBgColor())}>
                <CardContent className="px-3 py-0">
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

                    <div className="my-2 max-h-[8rem] overflow-auto rounded-sm border border-gray-100 bg-gray-50 p-2 text-sm whitespace-pre-wrap">
                        {publication.content}
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                        {/*TODO: add reply button variant*/}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsReplying((prev) => !prev)}
                            className="h-auto px-0 text-xs text-blue-600 hover:underline"
                        >
                            {isReplying ? "Cancel" : "Reply"}
                        </Button>
                    </div>

                    {isReplying && (
                        <div className="mt-2 pl-2">
                            <div className="rounded-sm border border-black bg-gray-50 p-3">
                                <PostForm
                                    replyTo={publication}
                                    setReplyTo={() => setIsReplying(false)}
                                    onSuccess={() => setIsReplying(false)}
                                    feedUserUuid={publication.created_for.uuid}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {children && (
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
                                    {children.length} {children.length === 1 ? "reply" : "replies"}
                                </span>
                            </span>
                        </Button>
                    </CollapsibleTrigger>
                    {areChildrenOpen && (
                        <CollapsibleContent>
                            <div className="relative ml-2 space-y-0 pl-4">
                                <div className="top-0 bottom-0 left-0 w-[2px] bg-gray-200"></div>
                                {children.map((reply: Publication) => (
                                    <div key={reply.uuid} className="relative">
                                        <div className="top-3 left-0 h-[2px] w-2 bg-gray-200"></div>
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
