import z from "zod";

export const CollectionCreationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    image: z.instanceof(File).optional(),
    private: z.boolean(),
});
