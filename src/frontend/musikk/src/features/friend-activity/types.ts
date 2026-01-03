import { CollectionSong } from "@/features/song-collections/types.ts";
import { IUser } from "@/features/user/types.ts";

export interface UserSong {
    user: IUser;
    song: CollectionSong;
}
