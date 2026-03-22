import { isAxiosError } from "axios";

export function getErrorDetail(
    error: unknown,
    defaultMessage = "Something went wrong. Please try again.",
): string {
    if (isAxiosError(error)) {
        const data = error.response?.data;
        if (data && typeof data === "object") {
            // TODO: consolidate on be
            if (typeof data.detail === "string") return data.detail;
            if (typeof data.error === "string") return data.error;
            if (typeof data.message === "string") return data.message;
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return defaultMessage;
}
