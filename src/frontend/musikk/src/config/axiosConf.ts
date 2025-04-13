import { refreshAccessToken } from "@/auth/login.ts";
import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create();

api.interceptors.request.use((config) => {
    const token = Cookies.get("access");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // TODO: add error handling, if refresh token expires while
            //  we are trying to use it
            await refreshAccessToken();
            const token = Cookies.get("access");
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
        }

        return Promise.reject(error);
    },
);
