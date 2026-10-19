import { api_client_public } from "@/api/axiosConf.ts";
import { AuthURLs } from "@/api/endpoints.ts";
import { authKeys } from "@/features/auth/queryKeys.ts";
import { skipToken, useQuery } from "@tanstack/react-query";

export async function initCsrf(): Promise<void> {
    await api_client_public.get(AuthURLs.csrf);
}

export async function login(email: string, password: string): Promise<void> {
    await initCsrf();
    await api_client_public.post(AuthURLs.login, { email: email.toLowerCase(), password });
}

export async function logout(): Promise<void> {
    await api_client_public.post(AuthURLs.logout, {});
}

interface registrationParams {
    password1: string;
    password2: string;
    email: string;
    userRole: "StreamingUser" | "Artist";
}

export async function register(payload: registrationParams) {
    const { password1, password2, email, userRole } = payload;
    const is_artist = userRole === "Artist";

    await api_client_public.post(AuthURLs.register, {
        password1,
        password2,
        email: email.toLowerCase(),
        is_artist,
    });
}

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
