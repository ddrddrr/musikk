import { UUID } from "@/api/types.ts";
import { PostForm } from "@/features/publications/components/posts/PostForm.tsx";
import { ReplyButton } from "@/features/publications/components/ReplyButton.tsx";
import { Publication } from "@/features/publications/types.ts";
import { useState } from "react";

type PostReplySectionProps = {
    publication: Publication;
    feedUserUUID: UUID;
    onReplyCreated?: () => void;
};

export function PostReplySection({
    publication,
    feedUserUUID,
    onReplyCreated,
}: PostReplySectionProps) {
    const [isReplying, setIsReplying] = useState(false);
    const replyButtonLabel = isReplying ? "Cancel" : "Reply";

    return (
        <>
            <div className="flex items-center gap-2 text-xs">
                <ReplyButton onClick={() => setIsReplying((prev) => !prev)}>
                    {replyButtonLabel}
                </ReplyButton>
            </div>

            {isReplying && (
                <div className="mt-2 border-l-2 border-foreground pl-3">
                    <PostForm
                        replyTo={publication}
                        setReplyTo={() => setIsReplying(false)}
                        onSuccess={() => {
                            setIsReplying(false);
                            onReplyCreated?.();
                        }}
                        feedUserUUID={feedUserUUID}
                    />
                </div>
            )}
        </>
    );
}
