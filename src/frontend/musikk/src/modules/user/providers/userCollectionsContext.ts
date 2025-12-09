import { ICollection } from "@/modules/song-collections/types.ts";
import { createContext } from "react";

interface UserCollectionsContextType {
    liked_songs: ICollection | null;
    followed_collections: ICollection[] | null;
    history: ICollection | null;
}

export const UserCollectionsContext = createContext<UserCollectionsContextType>({
    liked_songs: null,
    followed_collections: null,
    history: null,
});
