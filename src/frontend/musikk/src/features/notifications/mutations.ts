import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";

export async function setNotificationsRead() {
    return await api_client.patch(NotificationURLs.notificationsSetRead);
}
