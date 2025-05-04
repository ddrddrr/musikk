import { useDeleteNotificationMutation } from "@/components/notifications/mutations.ts";
import { NotificationListParams } from "@/components/notifications/queries.ts";
import { IFriendRequestNotification } from "@/components/notifications/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { useAddToFriendsMutation } from "@/components/user/mutations.tsx";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

interface NotificationOverlayProps {
    notifications: NotificationListParams;
}

export const NotificationOverlay = memo(function NotificationOverlay({ notifications }: NotificationOverlayProps) {
    const navigate = useNavigate();
    const addToFriendsMutation = useAddToFriendsMutation();
    const deleteNotificationMutation = useDeleteNotificationMutation();

    async function handleAddToFriends(notification: IFriendRequestNotification) {
        try {
            await addToFriendsMutation.mutateAsync(notification.sender.uuid);
            deleteNotificationMutation.mutate(notification.uuid);
        } catch (error) {
            console.error("Failed to add to friends:", error);
        }
    }

    const { replies = [], friend_requests = [] } = notifications;
    const allNotifications = [
        ...replies.map((n) => ({ ...n, _type: "reply" as const })),
        ...friend_requests.map((n) => ({ ...n, _type: "friend_request" as const })),
    ].sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    return (
        <div className="p-4 transition-opacity duration-200 ease-in-out max-h-96 overflow-y-auto">
            {allNotifications.map((notification) => {
                if (notification._type === "reply") {
                    return (
                        <div
                            key={notification.uuid}
                            className={`border border-black rounded-lg p-3 ${notification.is_read ? "bg-gray-50" : "bg-yellow-100"}`}
                        >
                            <div className="font-semibold text-sm">
                                Reply: {notification.reply_comment.username ?? "Anonymous"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{notification.orig_comment.content}</div>
                            <div className="text-sm text-gray-800 mt-2">{notification.reply_comment.content}</div>
                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-gray-600">
                                    {new Date(notification.date_added).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </span>
                                <Button
                                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() =>
                                        navigate(`/collection/${notification.reply_comment.obj_uuid}/comments`)
                                    }
                                >
                                    Go to reply section
                                </Button>
                            </div>
                        </div>
                    );
                }

                if (notification._type === "friend_request") {
                    return (
                        <div
                            key={notification.uuid}
                            className={`border border-black rounded-lg p-3 ${notification.is_read ? "bg-gray-50" : "bg-yellow-100"}`}
                        >
                            <div className="font-semibold text-sm">
                                Friend Request: {notification.sender.display_name}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-600">
                                    {new Date(notification.date_added).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </span>
                                <Button
                                    onClick={() => handleAddToFriends(notification)}
                                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Add to friends
                                </Button>
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
});
