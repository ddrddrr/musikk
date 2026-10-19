import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/features/notifications/api/endpoints.ts";
import { notificationKeys } from "@/features/notifications/api/queryKeys.ts";
import {
    IChatMessageNotification,
    IFollowerNotification,
    IReplyNotification,
} from "@/features/notifications/types.ts";
import { useQuery } from "@tanstack/react-query";

export interface NotificationListParams {
    replies: IReplyNotification[];
    followers: IFollowerNotification[];
    chat_messages: IChatMessageNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListParams> {
    const res = await api_client.get<NotificationListParams>(NotificationURLs.notificationsList);
    return res.data;
}

export function useNotificationsQuery() {
    return useQuery({
        queryKey: notificationKeys.base,
        queryFn: fetchNotificationList,
    });
}
