import { api_client_public } from "@/api/axiosConf.ts";
import { AuthURLs } from "@/features/auth/api/endpoints.ts";
import { authKeys } from "@/features/auth/api/queryKeys.ts";
import { skipToken, useQuery } from "@tanstack/react-query";

interface VerifyEmailResponse {
    detail: string;
}

async function verifyEmail(confirmationKey: string): Promise<VerifyEmailResponse> {
    const res = await api_client_public.post<VerifyEmailResponse>(AuthURLs.verifyEmail, {
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
