import { UserURLs } from "@/config/endpoints.ts";
import axios from "axios";
import Cookies from "js-cookie";

interface FullToken {
    refresh: string;
    access: string;
}

const ACCESS_EXPIRY = 5 * 60 * 1000; // 5 min
const REFRESH_EXPIRY = 24 * 60 * 60 * 1000; // 5 min

const setTokenCookie = (key: string, value: string, expiresInMs: number) => {
    const expiryDate = new Date(Date.now() + expiresInMs);
    Cookies.set(key, value, { path: "/", expires: expiryDate });
};

// TODO: rewrite django views, set refresh with HTTP-Only header
export async function login(email: string, password: string): Promise<undefined> {
    if (Cookies.get("access")) {
        return;
    }
    if (Cookies.get("refresh")) {
        return refreshAccessToken();
    }

    const res = await axios.post<FullToken>(UserURLs.tokenGet, { email, password });
    const { access, refresh } = res.data;
    setTokenCookie("access", access, ACCESS_EXPIRY);
    setTokenCookie("refresh", refresh, REFRESH_EXPIRY);
}

export async function refreshAccessToken(): Promise<undefined> {
    const refreshToken = Cookies.get("refresh");
    if (!refreshToken) {
        console.warn("No refresh token found.");
        return;
    }

    const res = await axios.post<{ access: string }>(UserURLs.tokenRefresh, { refresh: refreshToken });
    setTokenCookie("access", res.data.access, ACCESS_EXPIRY); // 5 minutes
}
