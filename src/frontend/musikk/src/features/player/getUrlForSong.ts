import { CollectionSong } from "@/features/collections/types.ts";

// maxTouchPoints distinguishes iPad (>=2) from desktop Mac (0)
// as it turned out the older "ontouchend in document" check is also true on desktop Safari and so
// detected Macs by a mistake
const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);

export function getUrlForSong(collectionSong: CollectionSong): string | undefined {
    return isIOS ? collectionSong.song.m3u8 : collectionSong.song.mpd;
}
