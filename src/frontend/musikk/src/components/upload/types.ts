import { z } from "zod";

export const FormSchema = z
    .object({
        isCollectionMode: z.boolean(),
        title: z.string().min(1),
        description: z.string().optional(),
        image: z.any().optional(),
        private: z.boolean(),
        songs: z
            .array(
                z.object({
                    title: z.string().min(1),
                    description: z.string().optional(),
                    audio: z.instanceof(File).optional(),
                    image: z.instanceof(File).optional(),
                    uuid: z.string().uuid().optional(),
                }),
            )
            .min(0),
    })
    .superRefine((data, ctx) => {
        if (!data.isCollectionMode && data.songs.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one song is required in single‐song mode",
                path: ["songs"],
            });
        }
    });

export type CollectionFormValues = z.infer<typeof FormSchema>;
