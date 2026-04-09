import { Spinner } from "@/features/ui/spinner";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { usePublicationChildren } from "@/features/publications/api/queries.ts";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/ui/collapsible.tsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReactNode } from "react";

type PostRepliesProps = {
    publication: Publication;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    renderChild: (child: Publication) => ReactNode;
};

export function PostReplies({ publication, open, onOpenChange, renderChild }: PostRepliesProps) {
    const {
        data: replies,
        isPending,
        error,
        refetch,
    } = usePublicationChildren(publication.uuid, publication.has_children);

    if (!publication.has_children || !replies) return null;
    return (
        <Collapsible open={open} onOpenChange={() => onOpenChange(!open)}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                    <span className="flex items-center gap-1">
                        {isPending && open ? (
                            <Spinner className="size-3" />
                        ) : open ? (
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
            {open && (
                <CollapsibleContent>
                    <div className="relative pl-2">
                        {error && (
                            <QueryErrorBox
                                message="Failed to load replies"
                                onRetry={() => void refetch()}
                            />
                        )}
                        {!error && isPending && (
                            <div className="flex items-center py-2">
                                <Spinner className="size-4" />
                            </div>
                        )}
                        {!error &&
                            !isPending &&
                            replies?.map((reply) => (
                                <div key={reply.uuid} className="relative">
                                    {renderChild(reply)}
                                </div>
                            ))}
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
}
