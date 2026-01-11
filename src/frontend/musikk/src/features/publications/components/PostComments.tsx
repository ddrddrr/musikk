import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/ui/collapsible.tsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReactNode, useState } from "react";

type PostCommentsProps = {
    replies: Publication[];
    renderChild: (child: Publication) => ReactNode;
};

export function PostComments({ replies, renderChild }: PostCommentsProps) {
    const [areChildrenOpen, setAreChildrenOpen] = useState(false);

    if (replies.length === 0) return null;
    return (
        <Collapsible open={areChildrenOpen} onOpenChange={setAreChildrenOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] hover:bg-gray-100"
                >
                    <span className="flex items-center gap-1">
                        {areChildrenOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        <span className="flex items-center gap-1">
                            {replies.length} {replies.length === 1 ? "reply" : "replies"}
                        </span>
                    </span>
                </Button>
            </CollapsibleTrigger>
            {areChildrenOpen && (
                <CollapsibleContent>
                    <div className="relative ml-2 space-y-0 pl-4">
                        <div className="top-0 bottom-0 left-0 w-[2px] bg-gray-200"></div>
                        {replies.map((reply) => (
                            <div key={reply.uuid} className="relative">
                                <div className="top-3 left-0 h-[2px] w-2 bg-gray-200"></div>
                                {renderChild(reply)}
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
}
