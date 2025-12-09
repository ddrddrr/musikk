import { UUID } from "@/api/types.ts";
import { IBaseModel } from "@/modules/common/types.ts";
import { ISong } from "@/modules/songs/types.ts";
import { IUser } from "@/modules/user/types.ts";

export interface ICollection extends IBaseModel {
    uuid: UUID;
    title: string;
    description: string;
    authors: IUser[];
    image?: string;
    is_liked: boolean;
}

export interface ICollectionSong extends IBaseModel {
    song: ISong;
    song_collection: UUID;
}

export interface ICollectionDetailed extends ICollection {
    songs: ICollectionSong[];
    description: string;
}
