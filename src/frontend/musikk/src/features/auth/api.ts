import { api_client_public } from "@/api/axiosConf.ts";
import { AuthURLs } from "@/api/endpoints.ts";

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

export async function verifyEmail(confirmationKey: string) {
    await api_client_public.post(AuthURLs.verifyEmail, { key: confirmationKey });
}
