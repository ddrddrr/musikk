import { authRef } from "@/api/authRef.ts";
import { BaseAPIURL } from "@/api/endpoints.ts";
import axios from "axios";
import Cookies from "js-cookie";

export const api_client = axios.create({
    baseURL: BaseAPIURL,
    withCredentials: true,
});

// TODO: for err notifications do smth like this:
// https://github.com/alan2207/bulletproof-react/blob/master/apps/react-vite/src/lib/api-client.ts

api_client.interceptors.request.use((cfg) => {
    const method = (cfg.method || "get").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
        const csrf = Cookies.get("csrftoken");
        if (csrf) {
            cfg.headers["X-CSRFToken"] = csrf;
        }
    }
    return cfg;
});

api_client.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const url = err?.config?.url as string | undefined;
        // /users/me is the auth probe -- a 401 there means "not logged in",
        // not "session expired", so it must not trigger the logout cascade
        // (doing so loops: logout clears the cache, the probe refires, 401, ...).
        // can't just do
        // window.location.href = "/login";
        // since we need to clear remaining state/queries/etc.
        // and that would just remount the app, losing all refs to local state
        if (status === 401 && url !== "/users/me" && authRef.logout) {
            void authRef.logout();
        }
        return Promise.reject(err);
    },
);
