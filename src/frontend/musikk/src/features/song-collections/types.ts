import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { ISong } from "@/features/songs/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export type CollectionType = "playlist" | "album" | "history" | "liked";
export interface Collection extends BaseModel {
    uuid: UUID;
    title: string;
    description: string;
    authors: BaseUser[];
    image?: string;
    is_liked: boolean;
    type: CollectionType;
}

export interface CollectionSong extends BaseModel {
    song: ISong;
    song_collection: UUID;
}

export interface CollectionDetailed extends Collection {
    songs: CollectionSong[];
    description: string;
}
