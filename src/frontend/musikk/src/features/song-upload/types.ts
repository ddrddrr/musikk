import { UUID } from "@/api/types.ts";

export type SongUploadStatus = "unknown" | "queued" | "processing" | "ready" | "failed";

export interface SongUploadInfo {
    status: SongUploadStatus;
    songUUID?: UUID;
    detail?: string;
}
// operationID : songUploadInfo
export type SongUploadState = Record<UUID, SongUploadInfo>;
