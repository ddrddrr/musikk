import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";
import { IReplyNotification } from "@/modules/notifications/types.ts";

// TODO add follow notifications
export interface NotificationListParams {
    replies: IReplyNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListParams> {
    const res = await api_client.get(NotificationURLs.notificationsList);
    return res.data;
}
