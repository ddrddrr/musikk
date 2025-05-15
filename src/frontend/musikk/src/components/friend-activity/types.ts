import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { IUser } from "@/components/user/types.ts";

export interface UserSong {
    user: IUser;
    song: ISongCollectionSong;
}
