import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { fetchCollectionsPersonal } from "@/features/collections/api/queries.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useQuery } from "@tanstack/react-query";

export function usePersonalCollections() {
    const userUUID = useUserUUID();
    return useQuery({
        queryKey: userKeys.collectionsPersonal(userUUID),
        queryFn: () => fetchCollectionsPersonal(userUUID),
    });
}
