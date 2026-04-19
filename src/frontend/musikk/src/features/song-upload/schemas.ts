import z from "zod";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".wav", ".flac", ".aiff", ".aif", ".m4a"];

export const SongSchema = z.object({
    operationID: z.uuid().optional(),
    title: z.string().min(1),
    audio: z
        .instanceof(File)
        .refine((f) => f.size <= MAX_FILE_SIZE, "File is too large (max 2GB)")
        .refine(
            (f) => ALLOWED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)),
            "Unsupported format. Accepted: WAV, FLAC, AIFF, ALAC",
        ),
    image: z.instanceof(File).optional(),
    uuid: z.uuid().optional(),
});
