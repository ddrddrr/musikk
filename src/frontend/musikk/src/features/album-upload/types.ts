import { UUID } from "@/api/types.ts";

type ServerTrackStatus = "queued" | "processing" | "ready" | "failed";

// "uploading" exists only in the browser, while the POST of a form row is in flight
export type TrackStatus = ServerTrackStatus | "uploading";

export interface AlbumTrack {
    collection_song_uuid: UUID;
    song_uuid: UUID;
    title: string;
    position: number;
    status: ServerTrackStatus;
    status_detail: string;
    operation_id: UUID | null;
}
