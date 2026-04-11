import { UUID } from "@/api/types.ts";

export const publicationKeys = {
    feed: (userUUID: UUID) => ["feed", userUUID, "comments"] as const,
    collectionComments: (collectionUUID: UUID) =>
        ["collection", collectionUUID, "comments"] as const,
    children: (pubUUID: UUID) => ["publication-children", pubUUID] as const,
    userChats: (userUUID: UUID) => ["user-chats", userUUID] as const,
    chatDetail: (userUUID: UUID, chatUUID: UUID) =>
        ["chat-detail", userUUID, chatUUID] as const,
    chatMessages: (userUUID: UUID, chatUUID: UUID) =>
        ["chat-messages", userUUID, chatUUID] as const,
    chatAttachments: (userUUID: UUID, chatUUID: UUID) =>
        ["chat-attachments", userUUID, chatUUID] as const,
};
