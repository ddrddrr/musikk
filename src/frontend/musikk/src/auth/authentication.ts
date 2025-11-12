import { AuthURLs } from "@/config/endpoints.ts";
import { api } from "@/config/axiosConf.ts";
 
export async function initCsrf(): Promise<void> {
    await api.get(AuthURLs.csrf);
}
 
export async function login(email: string, password: string): Promise<void> {
    await initCsrf();
    await api.post(AuthURLs.login, { email, password });
    window.dispatchEvent(new Event("auth-updated"));
}
 
export async function logout(): Promise<void> {
    await api.post(AuthURLs.logout, {});
    window.dispatchEvent(new Event("auth-updated"));
}
