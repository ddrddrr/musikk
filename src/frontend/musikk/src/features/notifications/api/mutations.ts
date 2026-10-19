import { api_client } from "@/api/axiosConf.ts";
import { getErrorDetail } from "@/api/errorUtils.ts";
import { NotificationURLs } from "@/features/notifications/api/endpoints.ts";
import { notificationKeys } from "@/features/notifications/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function setNotificationsRead() {
    await api_client.patch<void>(NotificationURLs.notificationsSetRead);
}

export function useSetNotificationsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setNotificationsRead,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.base });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to mark notifications as read"));
        },
    });
}
