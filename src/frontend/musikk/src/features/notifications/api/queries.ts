import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/features/notifications/api/endpoints.ts";
import { notificationKeys } from "@/features/notifications/api/queryKeys.ts";
import {
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
} from "@/features/notifications/types.ts";
import { useQuery } from "@tanstack/react-query";

export interface NotificationListResponse {
    replies: ReplyNotification[];
    followers: FollowerNotification[];
    chat_messages: ChatMessageNotification[];
}

export async function fetchNotificationList(): Promise<NotificationListResponse> {
    const res = await api_client.get<NotificationListResponse>(NotificationURLs.notificationsList);
    return res.data;
}

export function useNotificationsQuery() {
    return useQuery({
        queryKey: notificationKeys.base,
        queryFn: fetchNotificationList,
    });
}
