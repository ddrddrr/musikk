import { UUID } from "@/api/types.ts";
import { CommentableObjectRef, CommentableObjectType } from "@/features/publications/types.ts";

const COMMENTS_URL_PREFIX: Record<CommentableObjectType, string> = {
    collection: "collections",
    song: "songs",
};

export const PublicationURLs = {
    publicationChildren: (pubUUID: UUID) => `/publications/${pubUUID}/children`,
    globalFeedPosts: () => "/feed/posts",
    feedPosts: (userUUID: UUID) => `/feed/${userUUID}/posts`,
    comments: ({ type, uuid }: CommentableObjectRef) =>
        `/${COMMENTS_URL_PREFIX[type]}/${uuid}/comments`,
};
export const ChatURLs = {
    userChats: (userUUID: UUID) => `/users/${userUUID}/chats`,
    chatMessages: (userUUID: UUID, chatUUID: UUID) =>
        `/users/${userUUID}/chats/${chatUUID}/messages`,
    chatDetail: (userUUID: UUID, chatUUID: UUID) => `/users/${userUUID}/chats/${chatUUID}`,
    chatAttachments: (userUUID: UUID, chatUUID: UUID) =>
        `/users/${userUUID}/chats/${chatUUID}/attachments`,
};
