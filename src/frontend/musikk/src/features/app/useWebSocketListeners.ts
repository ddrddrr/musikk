import { useCollectionWsEvents } from "@/features/collections/wsEvents.ts";
import { useNotificationWsEvents } from "@/features/notifications/wsEvents.ts";
import { useDeviceLifecycle } from "@/features/playback/hooks/useDeviceLifecycle.ts";
import { useUserChatsWsEvents } from "@/features/publications/hooks/useUserChatsWsEvents.ts";
import { useQueueWsEvents } from "@/features/song-queue/wsEvents.ts";
import { useUserWsEvents } from "@/features/user/wsEvents.ts";
import { useErrorEvent } from "@/ws/useErrorEvent.ts";

// TODO: move closer to the providers that use them
export function useWebSocketListeners() {
    useErrorEvent();
    useDeviceLifecycle();
    useUserWsEvents();
    useQueueWsEvents();
    useCollectionWsEvents();
    useNotificationWsEvents();
    useUserChatsWsEvents();
}
