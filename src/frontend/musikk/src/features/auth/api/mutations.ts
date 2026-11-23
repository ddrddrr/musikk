import { api_client_public } from "@/api/axiosConf.ts";
import { ApiSchemas } from "@/api/types.ts";
import { AuthURLs } from "@/features/auth/api/endpoints.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function initCsrf(): Promise<void> {
    await api_client_public.get<void>(AuthURLs.csrf);
}

export async function login(email: string, password: string): Promise<void> {
    await initCsrf();
    await api_client_public.post<void>(AuthURLs.login, {
        email: email.toLowerCase(),
        password,
    });
}

export async function logout(): Promise<void> {
    await api_client_public.post<ApiSchemas["RestAuthDetail"]>(AuthURLs.logout, {});
}

interface RegistrationParams {
    password1: string;
    password2: string;
    email: string;
    userRole: "StreamingUser" | "Artist";
    signupPassword: string;
}

/**
 * Resolves to true when the new account must confirm its email before it can log in. The server
 * answers 201 with a message in that case, and 204 when it has already logged the new user in.
 */
async function register(payload: RegistrationParams): Promise<boolean> {
    const { password1, password2, email, userRole, signupPassword } = payload;
    const is_artist = userRole === "Artist";

    const res = await api_client_public.post<ApiSchemas["RestAuthDetail"]>(AuthURLs.register, {
        password1,
        password2,
        email: email.toLowerCase(),
        is_artist,
        signup_password: signupPassword,
    });
    return res.status === 201;
}

export function useRegister() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: register,
        onSuccess: async (needsEmailConfirmation) => {
            if (!needsEmailConfirmation) {
                // awaited, so the caller navigates only after the current user has loaded
                await queryClient.invalidateQueries({ queryKey: userKeys.me() });
            }
        },
    });
}
