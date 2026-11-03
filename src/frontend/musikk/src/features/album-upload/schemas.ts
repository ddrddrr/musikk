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

// some systems give an empty or their own MIME type (e.g. for AIFF or M4A), so the extension
// counts too. The server checks the real format with FFprobe anyway
const ALLOWED_EXTENSIONS = new Set([
    "wav",
    "flac",
    "aiff",
    "aif",
    "m4a",
    "mp3",
    "ogg",
    "opus",
    "aac",
]);

function fileExtension(name: string): string {
    const dot = name.lastIndexOf(".");
    return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function isAllowedAudio(f: File): boolean {
    return ALLOWED_FILE_TYPES.has(f.type) || ALLOWED_EXTENSIONS.has(fileExtension(f.name));
}

export const SongSchema = z.object({
    operationID: z.uuid(),
    position: z.number().int().min(0),
    title: z.string().min(1),
    audio: z
        .instanceof(File)
        .refine((f) => f.size <= MAX_FILE_SIZE, "File is too large (max 2GB)")
        .refine(
            isAllowedAudio,
            "Unsupported format. Accepted: WAV, FLAC, AIFF, ALAC, MP3, OGG, Opus, AAC",
        ),
    image: z.instanceof(File).optional(),
});
