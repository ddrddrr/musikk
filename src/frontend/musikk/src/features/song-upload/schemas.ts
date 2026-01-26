import z from "zod";

export const SongSchema = z.object({
    operationID: z.uuid().optional(),
    title: z.string().min(1),
    audio: z.instanceof(File),
    image: z.instanceof(File).optional(),
    uuid: z.uuid().optional(),
});
