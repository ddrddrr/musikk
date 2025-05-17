import { fetchCollectionsPersonal } from "@/components/song-collections/queries.ts";
import { useUserUUID } from "@/hooks/useUserUUID.ts";
import { UserCollectionsContext } from "@/providers/userCollectionsContext.ts";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

interface UserCollectionsProviderProps {
    children: ReactNode;
}

export function UserCollectionsProvider({ children }: UserCollectionsProviderProps) {
    const userUUID = useUserUUID();

    const { data } = useQuery({
        queryKey: ["collectionsPersonal"],
        queryFn: userUUID ? () => fetchCollectionsPersonal(userUUID) : undefined,
        enabled: !!userUUID,
    });
    const contextValue = {
        history: data?.history ?? null,
        liked_songs: data?.liked_songs ?? null,
        followed_collections: data?.followed_collections ?? null,
    };
    return <UserCollectionsContext.Provider value={contextValue}>{children}</UserCollectionsContext.Provider>;
}
