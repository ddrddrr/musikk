import { useCollectionWsEvents } from "@/features/collections/wsEvents.ts";
import { useFriendActivityWsEvents } from "@/features/friend-activity/wsEvents.ts";
import { useNotificationWsEvents } from "@/features/notifications/wsEvents.ts";
import { useDeviceLifecycle } from "@/features/playback/hooks/useDeviceLifecycle.ts";
import { useDeviceListEvent, usePlaybackChangeEvent } from "@/features/playback/ws/eventHooks.ts";
import { usePublicationWsEvents } from "@/features/publications/wsEvents.ts";
import { useQueueWsEvents } from "@/features/song-queue/wsEvents.ts";
import { useUserWsEvents } from "@/features/user/wsEvents.ts";
import { useErrorEvent } from "@/ws/useErrorEvent.ts";

export function useWebSocketListeners() {
    useErrorEvent();
    useDeviceListEvent();
    usePlaybackChangeEvent();
    useDeviceLifecycle();
    useUserWsEvents();
    useQueueWsEvents();
    useCollectionWsEvents();
    useFriendActivityWsEvents();
    useNotificationWsEvents();
    usePublicationWsEvents();
}
