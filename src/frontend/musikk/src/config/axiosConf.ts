import { refreshAccessToken } from "@/auth/authentication.ts";
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
            await refreshAccessToken();
            const token = Cookies.get("access");
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
        }

        return Promise.reject(error);
    },
);

// let isRefreshing = false;
// let refreshPromise: Promise<void> | null = null;
// let subscribers: ((token: string) => void)[] = [];
//
// function onRefreshed(token: string) {
//     subscribers.forEach((callback) => callback(token));
//     subscribers = [];
// }
//
// function addSubscriber(callback: (token: string) => void) {
//     subscribers.push(callback);
// }
//
// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;
//
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//
//             if (!isRefreshing) {
//                 isRefreshing = true;
//                 refreshPromise = refreshAccessToken()
//                     .then(() => {
//                         const token = Cookies.get("access");
//                         onRefreshed(token);
//                     })
//                     .finally(() => {
//                         isRefreshing = false;
//                         refreshPromise = null;
//                     });
//             }
//
//             return new Promise((resolve, reject) => {
//                 addSubscriber((token) => {
//                     originalRequest.headers.Authorization = `Bearer ${token}`;
//                     resolve(api(originalRequest));
//                 });
//
//                 if (refreshPromise) {
//                     refreshPromise.catch(reject);
//                 }
//             });
//         }
//
//         return Promise.reject(error);
//     }
// );