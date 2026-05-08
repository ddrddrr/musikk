import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { fetchUserLibrary } from "@/features/collections/api/queries.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useQuery } from "@tanstack/react-query";

export function useUserLibrary() {
    const userUUID = useUserUUID();
    return useQuery({
        queryKey: userKeys.library(userUUID),
        queryFn: () => fetchUserLibrary(userUUID),
    });
}
