import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export type SearchItem = Collection | CollectionSong | BaseUser;
