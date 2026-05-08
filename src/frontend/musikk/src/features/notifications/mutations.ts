import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { useMutation } from "@tanstack/react-query";

export async function setNotificationsRead() {
    return await api_client.patch(NotificationURLs.notificationsSetRead);
}

export function useDeleteNotificationMutation() {
    return useMutation({
        mutationFn: (notificationUUID: UUID) =>
            api_client.delete(NotificationURLs.notificationsDelete(notificationUUID)),
    });
}
