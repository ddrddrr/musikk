import { api } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
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
