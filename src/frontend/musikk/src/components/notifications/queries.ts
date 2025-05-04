import { IFriendRequestNotification, IReplyNotification } from "@/components/notifications/types.ts";
import { api } from "@/config/axiosConf.ts";
import { NotificationURLs } from "@/config/endpoints.ts";

export interface NotificationListParams {
    replies: IReplyNotification[];
    friend_requests: IFriendRequestNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListParams> {
    const res = await api.get(NotificationURLs.notificationsList);
    return res.data;
}
