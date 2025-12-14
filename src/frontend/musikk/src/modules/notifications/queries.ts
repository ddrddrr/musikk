import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";
import { IReplyNotification, IFollowerNotification } from "@/modules/notifications/types.ts";

export interface NotificationListParams {
    replies: IReplyNotification[];
    followers: IFollowerNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListParams> {
    const res = await api_client.get(NotificationURLs.notificationsList);
    return res.data;
}
