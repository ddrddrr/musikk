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
    songsCreate: `/songs`,
    songRetrieve: (songUUID: UUID) => `/songs/${songUUID}`,
    albumBySong: (songUUID: UUID) => `/songs/${songUUID}/album`,
};
export const QueueURLs = {
    queue: `/song-queue`,
    addSong: (songUUID: UUID) => `/song-queue/add-song/${songUUID}`,
    addCollection: (collectionUUID: UUID) => `/song-queue/add-collection/${collectionUUID}`,
    setHeadSong: (songUUID: UUID) => `/song-queue/set-head-song/${songUUID}`,
    setHeadCollection: (songUUID: UUID) => `/song-queue/set-head-collection/${songUUID}`,
    shiftHead: `/song-queue/shift-head`,
    shiftHeadTo: (nodeUUID: UUID) => `/song-queue/shift-head/${nodeUUID}`,
    shiftHeadBackwards: `/song-queue/shift-head-backwards`,
    removeNode: (nodeUUID: UUID) => `/song-queue/remove-node/${nodeUUID}`,
    clearQueue: `/song-queue/clear`,
    appendRandom: `/song-queue/append-random`,
};
export const CollectionURLs = {
    collectionCreate: `/collections`,
    collectionList: `/collections`,
    collectionPersonal: (userUUID: UUID) => `/collections/personal/${userUUID}`,
    collectionRetrieve: (collectionUUID: UUID) => `/collections/${collectionUUID}`,
    collectionDetail: (collectionUUID: UUID) => `/collections/detail/${collectionUUID}`,
    collectionAddToLiked: (collectionUUID: UUID) => `/collections/${collectionUUID}/like`,
    collectionAddSong: (collectionUUID: UUID, songUUID: UUID) =>
        `/collections/${collectionUUID}/songs/${songUUID}`,
    collectionRemoveSong: (collectionUUID: UUID, songCollectionSongUUID: UUID) =>
        `/collections/${collectionUUID}/songs/${songCollectionSongUUID}`,
    likedSongsAddSong: (songUUID: UUID) => `/liked-songs/add-song/${songUUID}`,
};
export const NotificationURLs = {
    notificationsSetRead: `/notifications`,
    notificationsList: `/notifications`,
    notificationsDelete: (notificationUUID: UUID) => `/notifications/${notificationUUID}`,
};
export const UserURLs = {
    me: "/users/me",
    meUpdate: "/users/me",
    userDetail: (userUUID: UUID) => `/users/${userUUID}`,
    userFriends: (userUUID: UUID) => `/users/${userUUID}/friends`,
    userFollowers: (userUUID: UUID) => `/users/${userUUID}/followers`,
    userFollowed: (userUUID: UUID) => `/users/${userUUID}/followed`,
    followUser: (userUUID: UUID) => `/users/${userUUID}/followed`,
    unfollowUser: (userUUID: UUID) => `/users/${userUUID}/followed`,
};
export const SearchURLs = {
    searchMain: (query: string) => `/search?q=${query}`,
};
export const FriendActivityURLs = {
    listeningToList: `/friend-activity/active-songs`,
    latestAddedList: `/friend-activity/latest-added`,
};
