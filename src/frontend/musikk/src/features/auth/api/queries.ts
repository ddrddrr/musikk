import { api_client_public } from "@/api/axiosConf.ts";
import { ApiSchemas } from "@/api/types.ts";
import { AuthURLs } from "@/features/auth/api/endpoints.ts";
import { authKeys } from "@/features/auth/api/queryKeys.ts";
import { skipToken, useQuery } from "@tanstack/react-query";

async function verifyEmail(confirmationKey: string): Promise<ApiSchemas["RestAuthDetail"]> {
    const res = await api_client_public.post<ApiSchemas["RestAuthDetail"]>(AuthURLs.verifyEmail, {
        key: confirmationKey,
    });
    return res.data;
}

export function useVerifyEmailQuery(confirmationKey: string | undefined) {
    return useQuery({
        queryKey: authKeys.emailVerification(confirmationKey ?? ""),
        queryFn: confirmationKey ? () => verifyEmail(confirmationKey) : skipToken,
        retry: false,
        staleTime: Infinity,
    });
}
