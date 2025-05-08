import { IBaseModel } from "@/components/common/types.ts";
import { ISong } from "@/components/songs/types.ts";
import { IUser } from "@/components/user/types.ts";
import { UUID } from "@/config/types.ts";

export interface ISongCollection extends IBaseModel {
    uuid: UUID;
    title: string;
    description: string;
    authors: IUser[];
    image?: string;
    is_liked: boolean;
}

export interface ISongCollectionSong extends IBaseModel {
    song: ISong;
    song_collection: UUID;
}

export interface ISongCollectionDetailed extends ISongCollection {
    songs: ISongCollectionSong[];
    description: string;
}
