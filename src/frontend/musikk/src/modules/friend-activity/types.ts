import { ISongCollectionSong } from "@/modules/song-collections/types.ts";
import { IUserBaseProfile } from "@/modules/user/types.ts";

export interface UserSong {
    user: IUserBaseProfile;
    song: ISongCollectionSong;
}
