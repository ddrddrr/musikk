import { UUID } from "@/api/types.ts";
import { IBaseModel } from "@/modules/common/types.ts";
import { ISongCollectionSong } from "@/modules/song-collections/types.ts";

export interface ISongQueueNode extends IBaseModel {
    collection_song: ISongCollectionSong;
    prev: UUID | null;
    next: UUID | null;
}

export interface ISongQueue extends IBaseModel {
    nodes: ISongQueueNode[];
}
