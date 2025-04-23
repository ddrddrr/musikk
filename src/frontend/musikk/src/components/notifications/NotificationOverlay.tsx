import { setNotificationRead } from "@/components/notifications/mutations.ts";
import { UUID } from "@/config/types.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IReplyNotification } from "./types";

interface NotificationOverlayProps {
    notifications: IReplyNotification[];
    notReadUUIDs: UUID[];
    setNotReadUUIDs: (uuids: UUID[]) => void;
}

// TODO: close overlay when clicked on "go to reply" button
interface NotificationOverlayProps {
    notifications: IReplyNotification[];
    notReadUUIDs: UUID[];
    setNotReadUUIDs: (uuids: UUID[]) => void;
    isOpen: boolean;
}

export const NotificationOverlay = memo(function NotificationOverlay({
    notifications,
    notReadUUIDs,
    setNotReadUUIDs,
    isOpen,
}: NotificationOverlayProps) {
    const navigate = useNavigate();
    const setNotificationsReadMutation = useMutation({ mutationFn: setNotificationRead });
    const client = useQueryClient();

    useEffect(() => {
        if (!isOpen && notReadUUIDs.length > 0) {
            setNotificationsReadMutation.mutate({ notificationUUIDs: notReadUUIDs });
            setNotReadUUIDs([]);
            client.invalidateQueries({ queryKey: ["replyNotifications"] });
        }
    }, [isOpen, notReadUUIDs]);

    return (
        <div className="p-4 transition-opacity duration-200 ease-in-out max-h-96 overflow-y-auto">
            {notifications?.length === 0 ? (
                <div className="text-sm text-gray-500">No new notifications</div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification: IReplyNotification) => (
                        <div
                            key={notification.uuid}
                            className={`border border-black rounded-lg p-3 ${notification.is_read ? "bg-gray-50" : "bg-yellow-100"}`}
                        >
                            <div className="font-semibold text-sm">
                                Reply from {notification.reply_comment.username ?? "Anonymous"}
                            </div>

                            <div className="text-xs text-gray-600 mt-1">
                                {">>>"} {notification.orig_comment.content}
                            </div>

                            <div className="text-sm text-gray-800 mt-2">{notification.reply_comment.content}</div>

                            <div className="flex justify-between mt-2">
                                <button
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={() =>
                                        navigate(`/collection/${notification.reply_comment.obj_uuid}/comments`)
                                    }
                                >
                                    Go to reply
                                </button>
                                <span className="text-xs text-gray-600">
                                    {new Date(notification.date_added).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
