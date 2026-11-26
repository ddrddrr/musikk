import { ReplyQuote } from "@/features/publications/components/ReplyQuote.tsx";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";

interface ReplyPreviewProps {
    replyTo: Publication;
    onCancel: () => void;
}

export function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
    return (
        <div className="mb-2 flex items-start justify-between gap-2">
            <ReplyQuote author={replyTo.author} text={replyTo.content} className="max-w-xs" />
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
                Cancel
            </Button>
        </div>
    );
}
