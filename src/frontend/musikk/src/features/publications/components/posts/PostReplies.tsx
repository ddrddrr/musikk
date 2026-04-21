import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { usePublicationChildren } from "@/features/publications/api/queries.ts";
import { Publication } from "@/features/publications/types.ts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/ui/collapsible.tsx";
import { Spinner } from "@/features/ui/spinner";
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
    } = usePublicationChildren(publication.uuid, open);

    if (!publication.has_children && !open) return null;
    return (
        <Collapsible open={open} onOpenChange={() => onOpenChange(!open)}>
            <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                    {isPending && open ? (
                        <Spinner className="size-3" />
                    ) : open ? (
                        <ChevronUp size={12} />
                    ) : (
                        <ChevronDown size={12} />
                    )}
                    <span>
                        {replies && replies.length > 0
                            ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
                            : "Load replies"}
                    </span>
                </button>
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
