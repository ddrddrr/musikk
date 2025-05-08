import { ISongCollection } from "@/components/song-collections/types.ts";
import { createContext } from "react";

interface UserCollectionsContextType {
    liked_songs: ISongCollection | null;
    followed_collections: ISongCollection[] | null;
    history: ISongCollection | null;
}

export const UserCollectionsContext = createContext<UserCollectionsContextType>({
    liked_songs: null,
    followed_collections: null,
    history: null,
});
