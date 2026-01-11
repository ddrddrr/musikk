import { PostAttachment } from "@/features/publications/components/PostAttachment.tsx";
import { PostComments } from "@/features/publications/components/PostComments.tsx";
import { PostHeader } from "@/features/publications/components/PostHeader.tsx";
import { PostReplySection } from "@/features/publications/components/PostReplySection.tsx";
import { Publication, PublicationWChildren } from "@/features/publications/types.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import { cn } from "@/lib/utils.ts";

interface PostTreeProps {
    publication: Publication | PublicationWChildren;
    depth?: number;
}

export function PostTree({ publication, depth = 0 }: PostTreeProps) {
    const children = (publication as PublicationWChildren).children;

    const getBgColor = () => {
        if (!publication.parent_uuid) return "bg-white";

        const colors = ["bg-amber-50", "bg-amber-100", "bg-amber-200", "bg-amber-300"];
        return colors[depth % colors.length];
    };

    return (
        <div className="relative">
            <Card className={cn("mb-2 rounded-sm border border-black shadow-sm", getBgColor())}>
                <CardContent className="px-3 py-0">
                    <PostAttachment attachment={publication.attachment} />
                    <PostHeader author={publication.author} dateAdded={publication.date_added} />

                    <div className="my-2 max-h-[8rem] overflow-auto rounded-sm border border-gray-100 bg-gray-50 p-2 text-sm whitespace-pre-wrap">
                        {publication.content}
                    </div>

                    <PostReplySection
                        publication={publication}
                        feedUserUUID={publication.created_for.uuid}
                    />
                </CardContent>
            </Card>
            {/*TODO: FIX RENDERING!*/}
            {children && (
                <PostComments
                    replies={children}
                    renderChild={(reply) => <PostTree publication={reply} depth={depth + 1} />}
                />
            )}
        </div>
    );
}
