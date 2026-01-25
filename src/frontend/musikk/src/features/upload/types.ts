import { UUID } from "@/api/types.ts";
import { UploadEventPayload } from "@/features/upload/useWsEvents.ts";

export type SongUploadStatus =
    | "unknown"
    | "creating"
    | "queued"
    | "processing"
    | "ready"
    | "failed";

export type SongCreationState = Record<string, { status: SongUploadStatus; detail?: string }>;
export type SongStatusByUUID = Record<UUID, UploadEventPayload>;
