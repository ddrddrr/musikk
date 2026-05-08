import { getErrorDetail } from "@/api/errorUtils.ts";
import type { UUID } from "@/api/types.ts";
import { useCallback, useReducer } from "react";
import { toast } from "sonner";
import { uploadCollectionSong } from "./mutations.ts";
import type { SongUploadState } from "./types.ts";
import type { UploadEventPayload } from "./useWsEvents.ts";
import { useSongUploadEvent } from "./useWsEvents.ts";

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

const MAX_CONCURRENT_UPLOADS = 3;

type UploadAction =
    | { type: "initializeJobs"; pending: SongUploadJob[]; skipped: SongUploadJob[] }
    | { type: "markUploading"; operationID: UUID }
    | { type: "markServerQueued"; operationID: UUID }
    | { type: "markFailed"; operationID: UUID; detail?: string }
    | { type: "wsEvent"; payload: UploadEventPayload }
    | { type: "clear"; operationID: UUID };

function uploadReducer(state: SongUploadState, action: UploadAction): SongUploadState {
    switch (action.type) {
        case "initializeJobs": {
            const next = { ...state };
            for (const job of action.pending) {
                next[job.operationID] = { status: "pending" };
            }
            for (const job of action.skipped) {
                next[job.operationID] = state[job.operationID] ?? {
                    status: "unknown",
                    songUUID: job.data.uuid,
                };
            }
            return next;
        }
        case "markUploading": {
            const existing = state[action.operationID];
            if (!existing) return state;
            return {
                ...state,
                [action.operationID]: { ...existing, status: "uploading" },
            };
        }
        case "markServerQueued": {
            const existing = state[action.operationID];
            // a ws event may have already changed this, so don't change
            if (!existing || existing.status !== "uploading") return state;
            return {
                ...state,
                [action.operationID]: { ...existing, status: "queued" },
            };
        }
        case "markFailed": {
            const existing = state[action.operationID];
            if (!existing) return state;
            return {
                ...state,
                [action.operationID]: {
                    ...existing,
                    status: "failed",
                    detail: action.detail,
                },
            };
        }
        case "wsEvent": {
            const existing = state[action.payload.operation_id];
            if (!existing) return state;
            return {
                ...state,
                [action.payload.operation_id]: {
                    ...existing,
                    songUUID: action.payload.uuid,
                    status: action.payload.status,
                    detail: action.payload.detail,
                },
            };
        }
        case "clear": {
            if (!(action.operationID in state)) return state;
            const next = { ...state };
            delete next[action.operationID];
            return next;
        }
    }
}

// no uuid (i.e., hasn't been uploaded) or failed
function needsUpload(job: SongUploadJob, state: SongUploadState): boolean {
    return !job.data.uuid || state[job.operationID]?.status === "failed";
}

export function useSongUpload() {
    const [uploadState, dispatch] = useReducer(uploadReducer, {} as SongUploadState);

    const onWsEvent = useCallback(
        (payload: UploadEventPayload) => dispatch({ type: "wsEvent", payload }),
        [],
    );
    useSongUploadEvent(onWsEvent);

    const clearUploadState = useCallback(
        (operationID: UUID) => dispatch({ type: "clear", operationID }),
        [],
    );

    const uploadSongs = useCallback(
        async (collectionUUID: UUID, jobs: SongUploadJob[]) => {
            const pending = jobs.filter((j) => needsUpload(j, uploadState));
            const skipped = jobs.filter((j) => !needsUpload(j, uploadState));
            dispatch({ type: "initializeJobs", pending, skipped });

            // so we dont run out of resources on uploads with many songs/songs of big size/etc.
            const results: PromiseSettledResult<{ operationID: UUID; songUUID: UUID }>[] = [];
            for (let i = 0; i < pending.length; i += MAX_CONCURRENT_UPLOADS) {
                const batch = pending.slice(i, i + MAX_CONCURRENT_UPLOADS).map(async (job) => {
                    dispatch({ type: "markUploading", operationID: job.operationID });
                    try {
                        const res = await uploadCollectionSong({
                            operationID: job.operationID,
                            collectionUUID,
                            title: job.data.title,
                            audio: job.data.audio,
                            image: job.data.image,
                        });
                        dispatch({ type: "markServerQueued", operationID: job.operationID });
                        return { operationID: job.operationID, songUUID: res.song_uuid };
                    } catch (err) {
                        dispatch({
                            type: "markFailed",
                            operationID: job.operationID,
                            detail: getErrorDetail(err, "Failed to upload song"),
                        });
                        throw err;
                    }
                });
                results.push(...(await Promise.allSettled(batch)));
            }

            const songUUIDByOperationID = new Map<UUID, UUID>();
            for (const job of skipped) {
                songUUIDByOperationID.set(job.operationID, job.data.uuid!);
            }
            for (const r of results) {
                if (r.status === "fulfilled") {
                    songUUIDByOperationID.set(r.value.operationID, r.value.songUUID);
                } else {
                    toast.error(getErrorDetail(r.reason, "Failed to upload song"));
                }
            }
            return songUUIDByOperationID;
        },
        [uploadState],
    );

    return {
        uploadState,
        clearUploadState,
        uploadSongs,
    };
}
