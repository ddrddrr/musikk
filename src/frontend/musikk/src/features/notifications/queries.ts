import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/api/endpoints.ts";
import { notificationKeys } from "@/features/notifications/queryKeys.ts";
import { IFollowerNotification, IReplyNotification } from "@/features/notifications/types.ts";
import { useQuery } from "@tanstack/react-query";

export interface NotificationListParams {
    replies: IReplyNotification[];
    followers: IFollowerNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListParams> {
    const res = await api_client.get(NotificationURLs.notificationsList);
    return res.data;
}

export function useNotificationsQuery() {
    return useQuery({
        queryKey: notificationKeys.base,
        queryFn: fetchNotificationList,
    });
}
