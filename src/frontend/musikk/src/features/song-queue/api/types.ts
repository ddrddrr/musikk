import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { CollectionSong } from "@/features/song-collections/types.ts";

export interface SongQueueNode extends BaseModel {
    collection_song: CollectionSong;
    prev: UUID | null;
    next: UUID | null;
}

export interface SongQueue extends BaseModel {
    nodes: SongQueueNode[];
}
