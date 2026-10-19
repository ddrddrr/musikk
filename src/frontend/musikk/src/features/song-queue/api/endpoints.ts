import { UUID } from "@/api/types.ts";

export const QueueURLs = {
    queue: `/song-queue`,
    addSong: (songUUID: UUID) => `/song-queue/add-song/${songUUID}`,
    addCollection: (collectionUUID: UUID) => `/song-queue/add-collection/${collectionUUID}`,
    playSong: (songUUID: UUID) => `/song-queue/set-head-song/${songUUID}`,
    playCollection: (collectionUUID: UUID) => `/song-queue/set-head-collection/${collectionUUID}`,
    next: `/song-queue/shift-head`,
    skipTo: (itemUUID: UUID) => `/song-queue/shift-head/${itemUUID}`,
    prev: `/song-queue/shift-head-backwards`,
    removeItem: (itemUUID: UUID) => `/song-queue/remove-node/${itemUUID}`,
    clearQueue: `/song-queue/clear`,
};
