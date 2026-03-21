export class ResponseError extends Error {
    override name: "ResponseError" = "ResponseError";
    constructor(
        public response: Response,
        msg?: string,
    ) {
        super(msg);
    }
}

export const getErrorDetail = async (
    error: unknown,
    defaultMessage = "Please try again.",
): Promise<string> => {
    if (error instanceof ResponseError) {
        try {
            const errorData = await error.response.json();
            if (errorData.detail) {
                return errorData.detail;
            }
        } catch {
            // Failed to parse error response, use default message
        }
    }
    return defaultMessage;
};
