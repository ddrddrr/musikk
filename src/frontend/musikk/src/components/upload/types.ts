import { z } from "zod";

export const SongSchema = z.object({
    title: z.string().min(1),
    audio: z.instanceof(File),
    description: z.string().optional(),
    image: z.instanceof(File).optional(),
    // uuid is set after processing
    uuid: z.string().uuid().optional(),
});

export const CollectionUploadSchema = z
    .object({
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.instanceof(File).optional(),
        private: z.boolean(),
        songs: z.array(SongSchema).min(0),
    })
    // .superRefine((data, ctx) => {
    //     data.songs.forEach((song, i) => {
    //         if (!song.uuid) {
    //             ctx.addIssue({
    //                 code: z.ZodIssueCode.custom,
    //                 message: "Song is not uploaded yet.",
    //                 path: ["songs", i, "uuid"],
    //             });
    //         }
    //     });
    // });

export type CollectionUploadFormValues = z.infer<typeof CollectionUploadSchema>;

export type SongUploadStatus = "idle" | "processing" | "success" | "failed"
export interface SongUploadState {
    status: SongUploadStatus
    uploadId?: string;
}
