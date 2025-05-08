import { IBaseModel } from "@/components/common/types.ts";
import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { UUID } from "@/config/types.ts";

export interface ISongQueueNode extends IBaseModel {
    collection_song: ISongCollectionSong;
    prev: UUID | null;
    next: UUID | null;
}

export interface ISongQueue extends IBaseModel {
    nodes: ISongQueueNode[];
}
