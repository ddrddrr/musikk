import { ISongCollectionSong } from "@/modules/song-collections/types.ts";
import { IUser } from "@/modules/user/types.ts";

export interface UserSong {
    user: IUser;
    song: ISongCollectionSong;
}
