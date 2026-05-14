import { CollectionSong } from "@/features/collections/types.ts";

const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);

export function getUrlForSong(collectionSong: CollectionSong): string | undefined {
    return isIOS ? collectionSong.song.m3u8 : collectionSong.song.mpd;
}
