import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/modules/common/types.ts";
import { CollectionSong } from "@/modules/song-collections/types.ts";

export interface ISongQueueNode extends BaseModel {
    collection_song: CollectionSong;
    prev: UUID | null;
    next: UUID | null;
}

export interface ISongQueue extends BaseModel {
    nodes: ISongQueueNode[];
}
