import type { UUID } from "@/api/types";
import type {
    SongCreationState,
    SongStatusByUUID,
    SongUploadStatus,
} from "@/features/upload/types";

interface GetSongUploadStatusArgs {
    uuid?: UUID;
    fieldId: string;
    statusByUUID: SongStatusByUUID;
    songsStateByFieldId: SongCreationState;
}
interface SongUploadStatusResult {
    status: SongUploadStatus;
    detail?: string;
}

export function getSongUploadStatus({
    uuid,
    fieldId,
    statusByUUID,
    songsStateByFieldId,
}: GetSongUploadStatusArgs): SongUploadStatusResult {
    if (uuid) {
        return {
            status: statusByUUID[uuid]?.status ?? "unknown",
            detail: statusByUUID[uuid]?.detail,
        };
    }

    return {
        status: songsStateByFieldId[fieldId]?.status ?? "unknown",
        detail: songsStateByFieldId[fieldId]?.detail,
    };
}
