import { CommentableObjectType } from "@/features/publications/types.ts";

// the open song row uses the same color, so the user sees which song the thread belongs to
export const COMMENTS_BORDER_BY_TYPE: Record<CommentableObjectType, string> = {
    collection: "border-foreground",
    song: "border-info",
};
