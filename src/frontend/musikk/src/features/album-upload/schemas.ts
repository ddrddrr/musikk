import z from "zod";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
    "audio/wav",
    "audio/x-wav",
    "audio/vnd.wav",
    "audio/flac",
    "audio/x-flac",
    "audio/aiff",
    "audio/x-aiff",
    "audio/mp4",
    "audio/x-m4a",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/opus",
    "audio/aac",
]);

function isAllowedAudio(f: File): boolean {
    return !!f.type && ALLOWED_FILE_TYPES.has(f.type);
}

export const SongSchema = z.object({
    operationID: z.uuid().optional(),
    title: z.string().min(1),
    audio: z
        .instanceof(File)
        .refine((f) => f.size <= MAX_FILE_SIZE, "File is too large (max 2GB)")
        .refine(
            isAllowedAudio,
            "Unsupported format. Accepted: WAV, FLAC, AIFF, ALAC, MP3, OGG, Opus, AAC",
        ),
    image: z.instanceof(File).optional(),
    uuid: z.uuid().optional(),
});
