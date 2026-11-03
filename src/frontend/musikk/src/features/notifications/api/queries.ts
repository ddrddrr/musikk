import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs } from "@/features/notifications/api/endpoints.ts";
import { notificationKeys } from "@/features/notifications/api/queryKeys.ts";
import { NotificationList } from "@/features/notifications/types.ts";
import { useQuery } from "@tanstack/react-query";

async function fetchNotificationList(): Promise<NotificationList> {
    const res = await api_client.get<NotificationList>(NotificationURLs.notificationsList);
    return res.data;
}

export function useNotificationsQuery() {
    return useQuery({
        queryKey: notificationKeys.base,
        queryFn: fetchNotificationList,
    });
}
