import { CollectionSong } from "@/features/collections/types.ts";
import { BaseModel } from "@/features/common/types.ts";

export interface QueueItem extends BaseModel {
    collection_song: CollectionSong;
    position: string;
}

export interface SongQueue extends BaseModel {
    current_song: CollectionSong | null;
    items: QueueItem[];
    context_items: CollectionSong[];
}
