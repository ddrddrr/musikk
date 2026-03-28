import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { fetchCollectionsPersonal } from "@/features/collections/api/queries.ts";
import { UserCollectionsContext } from "@/features/user/providers/userCollectionsContext.ts";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

interface UserCollectionsProviderProps {
    children: ReactNode;
}

export function UserCollectionsProvider({ children }: UserCollectionsProviderProps) {
    const userUUID = useUserUUID();

    const { data } = useQuery({
        // TODO: add useruuid in the key
        queryKey: ["collectionsPersonal"],
        queryFn: () => fetchCollectionsPersonal(userUUID),
    });
    const contextValue = {
        history: data?.history ?? null,
        liked_songs: data?.liked_songs ?? null,
        created_collections: data?.created_collections ?? null,
        followed_collections: data?.followed_collections ?? null,
    };
    return (
        <UserCollectionsContext.Provider value={contextValue}>
            {children}
        </UserCollectionsContext.Provider>
    );
}
