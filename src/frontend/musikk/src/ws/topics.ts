import { UUID } from "@/api/types.ts";

// mirrors src/backend/musikk/websockets/topics.py
export function chatTopic(chatUUID: UUID): string {
    return `chat.${chatUUID}`;
}

export function collectionCommentsTopic(collectionUUID: UUID): string {
    return `collection_comments.${collectionUUID}`;
}
