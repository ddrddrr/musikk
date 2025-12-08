import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { fetchCollectionsPersonal } from "@/modules/song-collections/queries.ts";
import { UserCollectionsContext } from "@/modules/user/providers/userCollectionsContext.ts";
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
    return (
        <UserCollectionsContext.Provider value={contextValue}>
            {children}
        </UserCollectionsContext.Provider>
    );
}
