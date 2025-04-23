import { z } from "zod";

export const SongSchema = z.object({
    title: z.string().min(1),
    audio: z.instanceof(File).optional(),
    description: z.string().min(0),
    image: z.instanceof(File).optional(),
});

export const FormSchema = z.object({
    songs: z.array(SongSchema),
});

export type SongFormValues = z.infer<typeof FormSchema>;
