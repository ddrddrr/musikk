import { getErrorDetail } from "@/api/errorUtils.ts";
import type { UUID } from "@/api/types.ts";
import { uploadCollectionSong } from "@/features/song-upload/mutations.ts";
import type { SongUploadState } from "@/features/song-upload/types.ts";
import type { UploadEventPayload } from "@/features/song-upload/useWsEvents.ts";
import { useSongUploadEvent } from "@/features/song-upload/useWsEvents.ts";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface SongUploadData {
    title: string;
    audio: File;
    image?: File;
    uuid?: UUID;
}

export interface SongUploadJob {
    operationID: UUID;
    data: SongUploadData;
}

export function useSongUpload() {
    const [uploadState, setUploadState] = useState<SongUploadState>({});

    const onWsEvent = useCallback((payload: UploadEventPayload) => {
        setUploadState((prev) => {
            const existing = prev[payload.operation_id];
            if (!existing) return prev;

            return {
                ...prev,
                [payload.operation_id]: {
                    ...existing,
                    songUUID: payload.uuid,
                    status: payload.status,
                    // todo detail is not always set so...
                    detail: payload.detail,
                },
            };
        });
    }, []);
    useSongUploadEvent(onWsEvent);

    const clearUploadState = useCallback((operationID: UUID) => {
        setUploadState((prev) => {
            if (!(operationID in prev)) return prev;
            const next = { ...prev };
            delete next[operationID];
            return next;
        });
    }, []);

    const uploadSongs = useCallback(
        async (collectionUUID: UUID, jobs: SongUploadJob[]) => {
            const initializeUploadState = (prev: SongUploadState) => {
                const next = { ...prev };
                jobs.forEach((job) => {
                    const existingState = prev[job.operationID];
                    const shouldRetry = existingState?.status === "failed";

                    if (job.data.uuid && !shouldRetry) {
                        next[job.operationID] = existingState ?? {
                            status: "unknown",
                            songUUID: job.data.uuid,
                        };
                    } else {
                        next[job.operationID] = { status: "queued" };
                    }
                });
                return next;
            };
            setUploadState(initializeUploadState);

            const processUpload = async (
                job: SongUploadJob,
            ): Promise<{ operationID: UUID; songUUID: UUID }> => {
                try {
                    const existingState = uploadState[job.operationID];
                    const shouldRetry = existingState?.status === "failed";

                    if (job.data.uuid && !shouldRetry) {
                        return { operationID: job.operationID, songUUID: job.data.uuid };
                    }

                    const res = await uploadCollectionSong({
                        operationID: job.operationID,
                        collectionUUID,
                        title: job.data.title,
                        audio: job.data.audio,
                        image: job.data.image,
                    });

                    return { operationID: job.operationID, songUUID: res.song_uuid };
                } catch (error) {
                    throw { operationID: job.operationID, error };
                }
            };
            const results = await Promise.allSettled(jobs.map(processUpload));

            const consturctUUIDToOpIDMap = (
                results: PromiseSettledResult<{ operationID: UUID; songUUID: UUID }>[],
            ) => {
                const songUUIDByOperationID = new Map<UUID, UUID>();
                results.forEach((r) => {
                    if (r.status === "fulfilled") {
                        const { operationID, songUUID } = r.value;
                        songUUIDByOperationID.set(operationID, songUUID);
                        return;
                    }
                    const { error } = r.reason as { operationID: UUID; error: unknown };
                    toast.error(getErrorDetail(error, "Failed to upload song"));
                });
                return songUUIDByOperationID;
            };

            return consturctUUIDToOpIDMap(results);
        },
        [uploadState],
    );

    const getStatus = useCallback(
        (operationID: UUID) => uploadState[operationID]?.status ?? "unknown",
        [uploadState],
    );

    return {
        uploadState,
        getStatus,
        clearUploadState,
        uploadSongs,
    };
}
