import { ISong } from "@/components/song/types.ts";

export interface ISongCollection {
    uuid: string;
    title: string;
    description: string;
    // creators: string[];
    image?: string;
}

export interface ISongCollectionDetailed extends ISongCollection {
    songs: ISong[];
    description: string;
}
