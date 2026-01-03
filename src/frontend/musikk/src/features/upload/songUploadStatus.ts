import type { UUID } from "@/api/types";
import type { SongUploadStatus } from "@/features/upload/types";
import type { CreateState, StatusByUUId } from "@/features/upload/ws/eventHooks";

export function getSongUploadStatus(args: {
    uuid?: UUID;
    fieldId: string;
    statusByUUID: StatusByUUId;
    songsStateByFieldId: CreateState;
}): { status: SongUploadStatus; detail?: string } {
    const { uuid, fieldId, statusByUUID, songsStateByFieldId } = args;

    if (uuid) {
        return {
            status: (statusByUUID[uuid]?.status ?? "unknown") as SongUploadStatus,
            detail: statusByUUID[uuid]?.detail,
        };
    }

    return {
        status: (songsStateByFieldId[fieldId]?.status ?? "unknown") as SongUploadStatus,
        detail: songsStateByFieldId[fieldId]?.detail,
    };
}
