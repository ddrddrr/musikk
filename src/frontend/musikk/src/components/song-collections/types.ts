import { ISong } from "@/components/songs/types.ts";
import { IUser } from "@/components/user/types.ts";

export interface ISongCollection {
    uuid: string;
    title: string;
    description: string;
    authors: IUser[];
    image?: string;
    is_liked?: boolean;
}

export interface ISongCollectionDetailed extends ISongCollection {
    songs: ISong[];
    description: string;
}
