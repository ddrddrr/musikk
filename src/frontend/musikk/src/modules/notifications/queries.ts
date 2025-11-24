import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";
import { IFriendRequestNotification, IReplyNotification } from "@/modules/notifications/types.ts";

export interface NotificationListParams {
    replies: IReplyNotification[];
    friend_requests: IFriendRequestNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListParams> {
    const res = await api_client.get(NotificationURLs.notificationsList);
    return res.data;
}
