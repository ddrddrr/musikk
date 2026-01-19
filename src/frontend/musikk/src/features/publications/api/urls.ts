import { UUID } from "@/api/types.ts";

export const PublicationURLs = {
    publicationChildren: (pubUUID: UUID) => `/publications/${pubUUID}/children`,
    feedPosts: (userUUID: UUID) => `/feed/${userUUID}/posts`,
    collectionComments: (collectionUUID: UUID) => `/collections/${collectionUUID}/comments`,
};
export const ChatURLs = {
    userChats: (userUUID: UUID) => `/users/${userUUID}/chats`,
    chatMessages: (chatUUID: UUID) => `/chat/${chatUUID}/messages`,
    chatMembers: (chatUUID: UUID) => `/chat/${chatUUID}/members`,
};
