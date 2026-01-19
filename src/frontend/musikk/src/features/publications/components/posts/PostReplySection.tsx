import { UUID } from "@/api/types.ts";
import { PostForm } from "@/features/publications/components/posts/PostForm.tsx";
import { Publication } from "@/features/publications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { useState } from "react";

type PostReplySectionProps = {
    publication: Publication;
    feedUserUUID: UUID;
};

export function PostReplySection({ publication, feedUserUUID }: PostReplySectionProps) {
    const [isReplying, setIsReplying] = useState(false);

    return (
        <>
            <div className="flex items-center gap-2 text-[11px]">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying((prev) => !prev)}
                    className="h-auto px-0 text-xs text-blue-600 hover:underline"
                >
                    {isReplying ? "Cancel" : "Reply"}
                </Button>
            </div>

            {isReplying && (
                <div className="mt-2 pl-2">
                    <div className="rounded-sm border border-black bg-gray-50 p-3">
                        <PostForm
                            replyTo={publication}
                            setReplyTo={() => setIsReplying(false)}
                            onSuccess={() => setIsReplying(false)}
                            feedUserUUID={feedUserUUID}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
