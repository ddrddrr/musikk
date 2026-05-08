import { authRef } from "@/api/authRef.ts";
import { BaseAPIURL } from "@/api/endpoints.ts";
import axios, { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// TODO: for err notifications do smth like this:
// https://github.com/alan2207/bulletproof-react/blob/master/apps/react-vite/src/lib/api-client.ts

const attachCsrf = (conf: InternalAxiosRequestConfig) => {
    const method = (conf.method || "get").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
        const csrf = Cookies.get("csrftoken");
        if (csrf) {
            conf.headers["X-CSRFToken"] = csrf;
        }
    }
    return conf;
};

// client for pre-auth calls (login, logout, register, verifyEmail, csrf)
export const api_client_public = axios.create({
    baseURL: BaseAPIURL,
    withCredentials: true,
});
api_client_public.interceptors.request.use(attachCsrf);

export const api_client = axios.create({
    baseURL: BaseAPIURL,
    withCredentials: true,
});
api_client.interceptors.request.use(attachCsrf);

api_client.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        // can't just do
        // window.location.href = "/login";
        // since we need to clear remaining state/queries/etc.
        // and that would just remount the app, losing all refs to local state
        if (status === 401 && authRef.logout) {
            void authRef.logout();
        }
        return Promise.reject(err);
    },
);
