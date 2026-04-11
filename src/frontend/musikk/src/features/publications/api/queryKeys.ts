import { UUID } from "@/api/types.ts";

export const publicationKeys = {
    feed: (userUUID: UUID) => ["feed", userUUID, "comments"] as const,
    collectionComments: (collectionUUID: UUID) =>
        ["collection", collectionUUID, "comments"] as const,
    children: (pubUUID: UUID) => ["publication-children", pubUUID] as const,
    userChats: (userUUID: UUID) => ["user-chats", userUUID] as const,
    chatDetail: (chatUUID: UUID) => ["chat-detail", chatUUID] as const,
    chatMessages: (chatUUID: UUID) => ["chat-messages", chatUUID] as const,
    chatAttachments: (chatUUID: UUID) => ["chat-attachments", chatUUID] as const,
};
