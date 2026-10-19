import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/features/notifications/api/endpoints.ts";

export async function setNotificationsRead() {
    await api_client.patch(NotificationURLs.notificationsSetRead);
}
