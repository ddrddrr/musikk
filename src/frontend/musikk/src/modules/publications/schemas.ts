import { z } from "zod";

export const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(255),
});

export const postSchema = z.object({
    content: z.string().min(1, "Post cannot be empty").max(2000),
});
