import { ISong } from "@/components/song/types.ts";
import { UUID } from "@/config/types.ts";

export interface ISongQueueNode {
    uuid: UUID;
    song: ISong;
    prev: UUID | null;
    next: UUID | null;
}

export interface ISongQueue {
    uuid: UUID;
    nodes: ISongQueueNode[];
    head: UUID | null;
    tail: UUID | null;
}
