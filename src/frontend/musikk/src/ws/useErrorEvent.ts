import { useWSClient } from "@/hooks/useWSClient.ts";
import { useEffect } from "react";
import { toast } from "sonner";

interface ErrorPayload {
    message: string;
}

export function useErrorEvent() {
    const ws = useWSClient();

    useEffect(() => {
        return ws.subscribe("error", (payload: ErrorPayload) => {
            toast.error(payload.message);
        });
    }, [ws]);
}
