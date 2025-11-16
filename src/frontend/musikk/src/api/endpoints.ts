import { UUID } from "@/api/types.ts";
import { PublicationObjectType } from "@/components/publications/types.ts";

export const BaseWSURL = import.meta.env.VITE_WS_BASE_URL;
export const WebsocketURLs = {
    userChannel: BaseWSURL + "/ws/user",
};

export const BaseAPIURL = import.meta.env.VITE_API_BASE_URL + "/api/v1";

export const AuthURLs = {
    login: "/auth/login",
    logout: "/auth/logout",
    csrf: "/csrf",
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
    collectionLatest: `/collections/latest`,
    collectionPersonal: (userUUID: UUID) => `/collections/personal/${userUUID}`,
    collectionRetrieve: (collectionUUID: UUID) => `/collections/${collectionUUID}`,
    collectionDetail: (collectionUUID: UUID) => `/collections/detail/${collectionUUID}`,
    collectionAddToLiked: (collectionUUID: UUID) => `/collections/${collectionUUID}/like`,
    collectionAddSong: (collectionUUID: UUID, songUUID: UUID) => `/collections/${collectionUUID}/songs/${songUUID}`,
    collectionRemoveSong: (collectionUUID: UUID, songCollectionSongUUID: UUID) =>
        `/collections/${collectionUUID}/songs/${songCollectionSongUUID}`,
    likedSongsAddSong: (songUUID: UUID) => `/liked-songs/add-song/${songUUID}`,
};
export const CommentURLs = {
    commentList: (objType: PublicationObjectType, objUUID: UUID) => `/comments/${objType}/${objUUID}`,
    commentCreate: (objType: PublicationObjectType, objUUID: UUID) => `/comments/${objType}/${objUUID}`,
};
export const PostURLs = {
    postCreate: `/posts`,
    userPostList: (userUUID: UUID) => `/posts/users/${userUUID}`,
    postRetrieve: (postUUID: UUID) => `/posts/${postUUID}`,
    postChildrenList: (postUUID: UUID) => `/posts/${postUUID}/children`,
    postLatestList: `/posts/latest`,
};
export const NotificationURLs = {
    notificationsSetRead: `/notifications`,
    notificationsList: `/notifications`,
    friendRequestCreate: (receiverUUID: UUID) => `/notifications/friend-requests/${receiverUUID}`,
    notificationsDelete: (notificationUUID: UUID) => `/notifications/${notificationUUID}`,
};
export const UserURLs = {
    me: "/users/me",
    userDetail: (userUUID: UUID) => `/users/${userUUID}`,
    userCreate: `/users`,
    userFriends: (userUUID: UUID) => `/users/${userUUID}/friends`,
    userFollowed: (userUUID: UUID) => `/users/${userUUID}/followed`,
    userFriendsAccept: (userUUID: UUID, senderUUID: UUID) => `/users/${userUUID}/friends/${senderUUID}`,
    userFriendsDelete: (userUUID: UUID, senderUUID: UUID) => `/users/${userUUID}/friends/${senderUUID}`,
    userUpdate: (userUUID: UUID) => `/users/${userUUID}`,
    artistFollowersList: (artistUUID: UUID) => `/users/artists/${artistUUID}/followers`,
    followArtist: (artistUUID: UUID) => `/users/artists/${artistUUID}/followers`,
    removeFollowedArtist: (artistUUID: UUID) => `/users/artists/${artistUUID}/followers`,
    tokenGet: `/token/`,
    tokenRefresh: `/token/refresh/`,
};
export const SearchURLs = {
    searchMain: (query: string) => `/search?q=${query}`,
};
export const EventURLs = {
    userEvents: `/events/user`,
};
export const PlaybackURLs = {
    retrieve: `/playback`,
    setState: `/playback`,
    registerDevice: `/playback-device`,
    deleteDevice: (deviceUUID: UUID) => `/playback-device/${deviceUUID}/delete`,
    setDeviceActive: (deviceUUID: UUID) => `/playback-device/${deviceUUID}/activate`,
};
export const FriendActivityURLs = {
    listeningToList: `/friend-activity/active-songs`,
    latestAddedList: `/friend-activity/latest-added`,
};
