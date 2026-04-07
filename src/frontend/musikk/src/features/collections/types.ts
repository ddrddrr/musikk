import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { Song } from "@/features/songs/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export type CollectionType = "playlist" | "album" | "history" | "liked";
export interface Collection extends BaseModel {
    kind?: "collection";
    uuid: UUID;
    title: string;
    description: string;
    authors: BaseUser[];
    image?: string;
    is_liked: boolean;
    type: CollectionType;
    private: boolean;
}

export interface CollectionSong extends BaseModel {
    kind?: "collectionSong";
    song: Song;
    collection: UUID;
}

export interface CollectionDetailed extends Collection {
    songs: CollectionSong[];
    description: string;
}
