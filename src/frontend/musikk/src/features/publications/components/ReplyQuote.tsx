import { OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { cn } from "@/lib/utils.ts";

interface ReplyQuoteProps {
    author: BaseUser;
    text: string;
    className?: string;
}

export function ReplyQuote({ author, text, className }: ReplyQuoteProps) {
    const authorName = author.display_name || "Anonymous";

    return (
        <div
            className={cn(
                "min-w-0 border-l-2 border-foreground pl-2 text-xs text-muted-foreground",
                className,
            )}
        >
            <OverflowTooltip label={authorName}>
                <div className="truncate font-medium">{authorName}</div>
            </OverflowTooltip>
            <OverflowTooltip label={text}>
                <div className="truncate italic">{text}</div>
            </OverflowTooltip>
        </div>
    );
}
