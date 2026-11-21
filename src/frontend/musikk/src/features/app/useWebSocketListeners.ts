import { useAlbumUploadWsEvents } from "@/features/album-upload/wsEvents.ts";
import { useCollectionWsEvents } from "@/features/collections/wsEvents.ts";
import { useNotificationWsEvents } from "@/features/notifications/wsEvents.ts";
import { useDeviceLifecycle } from "@/features/playback/hooks/useDeviceLifecycle.ts";
import { useUserChatsWsEvents } from "@/features/publications/hooks/useUserChatsWsEvents.ts";
import { useQueueWsEvents } from "@/features/song-queue/wsEvents.ts";
import { useUserWsEvents } from "@/features/user/wsEvents.ts";
import { useConnectionLostToast } from "@/ws/useConnectionLostToast.ts";
import { useErrorEvent } from "@/ws/useErrorEvent.ts";
import { useRefetchAfterReconnect } from "@/ws/useRefetchAfterReconnect.ts";

// TODO: move closer to the providers that use them
export function useWebSocketListeners() {
    useErrorEvent();
    useConnectionLostToast();
    useRefetchAfterReconnect();
    useDeviceLifecycle();
    useUserWsEvents();
    useQueueWsEvents();
    useCollectionWsEvents();
    useAlbumUploadWsEvents();
    useNotificationWsEvents();
    useUserChatsWsEvents();
}
