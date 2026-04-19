import { UUID } from "@/api/types.ts";
import { PostForm } from "@/features/publications/components/posts/PostForm.tsx";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
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

    return (
        <>
            <div className="flex items-center gap-2 text-xs">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying((prev) => !prev)}
                    className="h-auto px-0 text-xs text-info hover:underline"
                >
                    {isReplying ? "Cancel" : "Reply"}
                </Button>
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
