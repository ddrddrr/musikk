import { BaseAPIURL } from "@/api/endpoints.ts";
import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create({
    baseURL: BaseAPIURL,
    withCredentials: true,
});

api.interceptors.request.use((cfg) => {
    const method = (cfg.method || "get").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
        const csrf = Cookies.get("csrftoken");
        if (csrf) {
            cfg.headers["X-CSRFToken"] = csrf;
        }
    }
    return cfg;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (status === 401) {
            window.location.href = "/login";
        }
        return Promise.reject(err);
    },
);
