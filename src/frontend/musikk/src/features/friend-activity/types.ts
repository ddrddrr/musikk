import { CollectionSong } from "@/features/song-collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export interface UserSong {
    user: BaseUser;
    song: CollectionSong;
}
