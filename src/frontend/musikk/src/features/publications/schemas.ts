import { z } from "zod";

export function publicationSchema(label: string, maxLength: number) {
    return z.object({
        content: z.string().min(1, `${label} cannot be empty`).max(maxLength),
    });
}

export type PublicationSchema = ReturnType<typeof publicationSchema>;

export const postSchema = publicationSchema("Post", 2000);
export const commentSchema = publicationSchema("Comment", 255);
export const chatMessageSchema = publicationSchema("Message", 2000);
