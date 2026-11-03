import { CollectionSong } from "@/features/collections/types.ts";
import { isIOS } from "@/features/player/browserEngine.ts";

export function getUrlForSong(collectionSong: CollectionSong): string | undefined {
    return isIOS ? collectionSong.song.m3u8 : collectionSong.song.mpd;
}
