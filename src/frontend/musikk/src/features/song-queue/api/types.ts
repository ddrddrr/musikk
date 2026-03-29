import { CollectionSong } from "@/features/collections/types.ts";
import { BaseModel } from "@/features/common/types.ts";

export type QueueItemOrigin = "context" | "source" | "user";

export interface QueueItem extends BaseModel {
    collection_song: CollectionSong;
    origin: QueueItemOrigin;
    position: string;
}

export interface SongQueue extends BaseModel {
    current_song: CollectionSong | null;
    items: QueueItem[];
}
