import { UUID } from "@/api/types.ts";

// unkown is an internal FE fall-back state
export type SongUploadStatus =
    | "unknown"
    | "pending"
    | "uploading"
    | "queued"
    | "processing"
    | "ready"
    | "failed";

export interface SongUploadInfo {
    status: SongUploadStatus;
    songUUID?: UUID;
    detail?: string;
}
// operationID : songUploadInfo
export type SongUploadState = Record<UUID, SongUploadInfo>;
