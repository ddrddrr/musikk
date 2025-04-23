import { IReplyNotification } from "@/components/notifications/types.ts";
import { api } from "@/config/axiosConf.ts";
import { NotificationURLs } from "@/config/endpoints.ts";

export async function fetchReplyNotificationList(): Promise<IReplyNotification[]> {
    const res = await api.get(NotificationURLs.replyNotificationList);
    return res.data;
}
