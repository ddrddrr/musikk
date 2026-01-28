import { UUID } from "@/api/types.ts";

export const UserURLs = {
    me: "/users/me",
    meUpdate: "/users/me",
    userRetrieve: (userUUID: UUID) => `/users/${userUUID}`,
    userFriends: (userUUID: UUID) => `/users/${userUUID}/friends`,
    userFollowers: (userUUID: UUID) => `/users/${userUUID}/followers`,
    userFollowed: (userUUID: UUID) => `/users/${userUUID}/followed`,
    followUser: (userUUID: UUID) => `/users/${userUUID}/followed`,
    unfollowUser: (userUUID: UUID) => `/users/${userUUID}/followed`,
};
