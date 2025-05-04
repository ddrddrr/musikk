import { api } from "@/config/axiosConf.ts";
import { NotificationURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { useMutation } from "@tanstack/react-query";

interface ISetNotificationReadParams {
    notificationUUIDs: string[];
}

export async function setNotificationRead({ notificationUUIDs }: ISetNotificationReadParams) {
    const data = {
        uuids: notificationUUIDs,
    };
    return await api.patch(NotificationURLs.notificationsSetRead, data);
}

export function useDeleteNotificationMutation() {
    return useMutation({
        mutationFn: (notificationUUID: UUID) => api.delete(NotificationURLs.notificationsDelete(notificationUUID)),
    });
}
