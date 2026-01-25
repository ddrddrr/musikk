import { Collection } from "@/features/collections/types.ts";
import { createContext } from "react";

interface UserCollectionsContextType {
    liked_songs: Collection | null;
    followed_collections: Collection[] | null;
    history: Collection | null;
}

export const UserCollectionsContext = createContext<UserCollectionsContextType>({
    liked_songs: null,
    followed_collections: null,
    history: null,
});
