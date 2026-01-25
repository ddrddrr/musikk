import { CollectionSong } from "@/features/collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export interface UserSong {
    user: BaseUser;
    song: CollectionSong;
}
