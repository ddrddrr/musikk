import { UUID } from "@/api/types.ts";

export const PublicationURLs = {
    publicationChildren: (pubUUID: UUID) => `/publications/${pubUUID}/children`,
    globalFeedPosts: () => "/feed/posts",
    feedPosts: (userUUID: UUID) => `/feed/${userUUID}/posts`,
    collectionComments: (collectionUUID: UUID) => `/collections/${collectionUUID}/comments`,
};
export const ChatURLs = {
    userChats: (userUUID: UUID) => `/users/${userUUID}/chats`,
    chatMessages: (userUUID: UUID, chatUUID: UUID) =>
        `/users/${userUUID}/chats/${chatUUID}/messages`,
    chatMembers: (userUUID: UUID, chatUUID: UUID) => `/users/${userUUID}/chats/${chatUUID}/members`,
    chatDetail: (userUUID: UUID, chatUUID: UUID) => `/users/${userUUID}/chats/${chatUUID}`,
    chatAttachments: (userUUID: UUID, chatUUID: UUID) =>
        `/users/${userUUID}/chats/${chatUUID}/attachments`,
};
