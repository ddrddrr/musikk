import { UUID } from "@/api/types.ts";

export const WebsocketURLs = {
    userChannel: "/ws/user",
};

export const BaseAPIURL = "/api/v1";

// TODO: move urls to relative feature dirs
export const AuthURLs = {
    csrf: "/csrf",
    register: "/auth/registration",
    verifyEmail: "/auth/verify-email",
    login: "/auth/login",
    logout: "/auth/logout",
};
export const SongURLs = {
    songList: `/songs`,
    songRetrieve: (songUUID: UUID) => `/songs/${songUUID}`,
    albumBySong: (songUUID: UUID) => `/songs/${songUUID}/album`,
    collectionMemberships: (collectionSongUUID: UUID) => `/songs/${collectionSongUUID}/collections`,
};
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
    appendRandom: `/song-queue/append-random`,
    reorder: `/song-queue/reorder`,
    moveToQueue: `/song-queue/move-to-queue`,
};
export const NotificationURLs = {
    notificationsSetRead: `/notifications`,
    notificationsList: `/notifications`,
    notificationsDelete: (notificationUUID: UUID) => `/notifications/${notificationUUID}`,
};
export const SearchURLs = {
    searchMain: (query: string) => `/search?q=${query}`,
};
export const FriendActivityURLs = {
    listeningToList: `/friend-activity/active-songs`,
    latestAddedList: `/friend-activity/latest-added`,
};
