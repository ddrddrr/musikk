import { useInfiniteFlat } from "@/api/hooks";
import { UUID } from "@/api/types.ts";
import {
    useChatMessages,
    useCollectionComments,
    useFeedPosts,
} from "@/features/publications/api/queries.ts";

export function useFeedPostsFlat(
    userUUID: UUID,
    reverse = true,
    connection?: "friends" | "followed",
) {
    const query = useFeedPosts(userUUID, connection);
    const result = useInfiniteFlat(query, reverse);
    return { ...result, publicationsFlat: result.itemsFlat };
}

export function useCollectionCommentsFlat(collectionUUID: UUID, reverse = true) {
    const query = useCollectionComments(collectionUUID);
    const result = useInfiniteFlat(query, reverse);
    return { ...result, publicationsFlat: result.itemsFlat };
}

export function useChatMessagesFlat(userUUID: UUID, chatUUID: UUID, reverse = true) {
    const query = useChatMessages(userUUID, chatUUID);
    const result = useInfiniteFlat(query, reverse);
    return { ...result, publicationsFlat: result.itemsFlat };
}
