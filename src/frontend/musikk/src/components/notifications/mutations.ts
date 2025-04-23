import { api } from "@/config/axiosConf.ts";
import { NotificationURLs } from "@/config/endpoints.ts";

interface ISetNotificationReadParams {
    notificationUUIDs: string[];
}

export async function setNotificationRead({ notificationUUIDs }: ISetNotificationReadParams) {
    const data = {
        uuids: notificationUUIDs,
    };
    await api.patch(NotificationURLs.notificationsSetRead, data);
}
