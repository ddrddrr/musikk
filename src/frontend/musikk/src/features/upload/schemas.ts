import z from "zod";

export const SongSchema = z.object({
    titleSize: z.string().min(1),
    audio: z.instanceof(File),
    description: z.string().optional(),
    image: z.instanceof(File).optional(),
    uuid: z.uuid().optional(),
});

export const CollectionUploadSchemaDraft = z.object({
    titleSize: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    image: z.instanceof(File).optional(),
    private: z.boolean(),
    songs: z.array(SongSchema).min(1),
});

export const CollectionUploadSchemaFinal = CollectionUploadSchemaDraft.superRefine((data, ctx) => {
    data.songs.forEach((song, i) => {
        if (!song.uuid) {
            ctx.addIssue({
                code: "custom",
                message: "Song is not uploaded yet.",
                path: ["songs", i, "uuid"],
            });
        }
    });
});

export type CollectionUploadFormValues = z.infer<typeof CollectionUploadSchemaDraft>;
