import { UUID } from "@/api/types.ts";
import { CommentableObjectRef, CommentableObjectType } from "@/features/publications/types.ts";

// mirrors the `ws_topic_prefix` values in src/backend/musikk/social/publication_access_policies.py
export function chatTopic(chatUUID: UUID): string {
    return `chat.${chatUUID}`;
}

const COMMENTS_TOPIC_PREFIX: Record<CommentableObjectType, string> = {
    collection: "collection_comments",
    song: "song_comments",
};

export function commentsTopic({ type, uuid }: CommentableObjectRef): string {
    return `${COMMENTS_TOPIC_PREFIX[type]}.${uuid}`;
}

// the backend names the typing event of every publication topic `<prefix>.typing`
export function commentsTypingEvent({ type }: CommentableObjectRef): string {
    return `${COMMENTS_TOPIC_PREFIX[type]}.typing`;
}
