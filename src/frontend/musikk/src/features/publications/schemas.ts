import { z } from "zod";

// todo rewrite this is common now and e.g. need obj type
export const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(255),
});

export const postSchema = z.object({
    content: z.string().min(1, "Post cannot be empty").max(2000),
});

export const chatMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(2000),
});
