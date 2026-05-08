import { CollectionSong } from "@/features/collections/types.ts";

// TODO: split by OS not browser (ios -> m3u8, otherwise mpd)
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export function getUrlForSong(collectionSong: CollectionSong): string | undefined {
    return isSafari ? collectionSong.song.m3u8 : collectionSong.song.mpd;
}
