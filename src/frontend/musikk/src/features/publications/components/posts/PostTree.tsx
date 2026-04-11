import { UUID } from "@/api/types.ts";
import { PostAttachment } from "@/features/publications/components/posts/PostAttachment.tsx";
import { PostHeader } from "@/features/publications/components/posts/PostHeader.tsx";
import { PostReplies } from "@/features/publications/components/posts/PostReplies.tsx";
import { PostReplySection } from "@/features/publications/components/posts/PostReplySection.tsx";
import { Publication } from "@/features/publications/types.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { useState } from "react";

interface PostTreeProps {
    publication: Publication;
    feedUserUUID: UUID;
    depth?: number;
}

export function PostTree({ publication, feedUserUUID, depth = 0 }: PostTreeProps) {
    const [repliesOpen, setRepliesOpen] = useState(false);

    const getBgColor = () => {
        if (!publication.parent_uuid) return "bg-white";

        const colors = ["bg-amber-50", "bg-amber-100", "bg-amber-200", "bg-amber-300"];
        return colors[depth % colors.length];
    };

    return (
        <div className="relative">
            <Card className={cn("mb-2 rounded-sm border border-black shadow-sm", getBgColor())}>
                <CardContent className="flex flex-col gap-2 px-3 py-0">
                    <PostAttachment attachment={publication.attachment} />
                    <PostHeader author={publication.author} dateAdded={publication.date_added} />

                    <div className="max-h-[8rem] overflow-auto rounded-sm border border-gray-100 bg-gray-50 p-2 text-sm whitespace-pre-wrap">
                        {publication.content}
                    </div>

                    <PostReplySection
                        publication={publication}
                        feedUserUUID={feedUserUUID}
                        onReplyCreated={() => setRepliesOpen(true)}
                    />
                    <PostReplies
                        publication={publication}
                        open={repliesOpen}
                        onOpenChange={setRepliesOpen}
                        renderChild={(reply) => (
                            <PostTree
                                publication={reply}
                                feedUserUUID={feedUserUUID}
                                depth={depth + 1}
                            />
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
