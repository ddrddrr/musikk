import { usePublicationChildren } from "@/features/publications/api/queries.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/ui/collapsible.tsx";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";

type PostRepliesProps = {
    publication: Publication;
    renderChild: (child: Publication) => ReactNode;
};

export function PostReplies({ publication, renderChild }: PostRepliesProps) {
    // TODO: add proper ws invalidate event
    const [areChildrenOpen, setAreChildrenOpen] = useState(false);

    const { data: replies, isPending } = usePublicationChildren(
        publication.uuid,
        publication.has_children,
    );

    if (!publication.has_children || !replies) return null;
    return (
        <Collapsible open={areChildrenOpen} onOpenChange={() => setAreChildrenOpen((o) => !o)}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                    <span className="flex items-center gap-1">
                        {isPending && areChildrenOpen ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : areChildrenOpen ? (
                            <ChevronUp size={12} />
                        ) : (
                            <ChevronDown size={12} />
                        )}
                        <span>
                            {replies.length > 0
                                ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
                                : "Load replies"}
                        </span>
                    </span>
                </Button>
            </CollapsibleTrigger>
            {areChildrenOpen && (
                <CollapsibleContent>
                    <div className="relative pl-2">
                        {isPending ? (
                            <div className="py-2 text-sm text-muted-foreground">Loading...</div>
                        ) : (
                            replies.map((reply) => (
                                <div key={reply.uuid} className="relative">
                                    {renderChild(reply)}
                                </div>
                            ))
                        )}
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
}
