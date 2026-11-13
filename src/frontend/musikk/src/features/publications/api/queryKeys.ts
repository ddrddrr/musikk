import { UUID } from "@/api/types.ts";
import { CommentableObjectRef, FeedConnection } from "@/features/publications/types.ts";

export const publicationKeys = {
    base: ["publications"] as const,
    globalFeeds: () => [...publicationKeys.base, "global-feed"] as const,
    globalFeed: (connection?: FeedConnection) =>
        [...publicationKeys.globalFeeds(), connection ?? "all"] as const,
    globalFeedPoll: (connection?: FeedConnection) =>
        [...publicationKeys.globalFeed(connection), "poll"] as const,
    feed: (userUUID: UUID) => [...publicationKeys.base, "feed", userUUID] as const,
    feedPoll: (userUUID: UUID) => [...publicationKeys.feed(userUUID), "poll"] as const,
    comments: ({ type, uuid }: CommentableObjectRef) =>
        [...publicationKeys.base, "comments", type, uuid] as const,
    allChildren: () => [...publicationKeys.base, "children"] as const,
    children: (pubUUID: UUID) => [...publicationKeys.allChildren(), pubUUID] as const,
    chats: () => [...publicationKeys.base, "chats"] as const,
    userChats: (userUUID: UUID) => [...publicationKeys.chats(), userUUID] as const,
    chatDetail: (userUUID: UUID, chatUUID: UUID) =>
        [...publicationKeys.base, "chat-detail", userUUID, chatUUID] as const,
    chatMessages: (userUUID: UUID, chatUUID: UUID) =>
        [...publicationKeys.base, "chat-messages", userUUID, chatUUID] as const,
    chatAttachments: (userUUID: UUID, chatUUID: UUID) =>
        [...publicationKeys.base, "chat-attachments", userUUID, chatUUID] as const,
};
