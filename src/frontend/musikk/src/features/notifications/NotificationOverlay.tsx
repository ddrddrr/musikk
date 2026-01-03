import { NotificationListParams } from "@/features/notifications/queries.ts";
import { IFollowerNotification, IReplyNotification } from "@/features/notifications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

interface NotificationOverlayProps {
    notifications: NotificationListParams;
}

export const NotificationOverlay = memo(function NotificationOverlay({
    notifications,
}: NotificationOverlayProps) {
    const navigate = useNavigate();

    function handleNavigateReplyClick(notification: IReplyNotification) {
        if (notification.reply_publication.obj_type == "feed") {
            navigate(`/users/${notification.reply_publication.root_author_uuid}`);
        } else {
            navigate(`/collection/${notification.reply_publication.obj_uuid}/comments`);
        }
    }

    function handleNavigateFollowerClick(notification: IFollowerNotification) {
        navigate(`/users/${notification.sender.uuid}`);
    }

    const { replies = [], followers = [] } = notifications;
    const allNotifications = [
        ...replies.map((n) => ({ ...n, _type: "reply" as const })),
        ...followers.map((n) => ({ ...n, _type: "follower" as const })),
    ].sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    return (
        <div className="p-4 transition-opacity duration-200 ease-in-out max-h-96 overflow-y-auto">
            {allNotifications.map((notification) => (
                <div
                    key={notification.uuid}
                    className={`border border-black rounded-lg p-3 mb-2 ${notification.is_read ? "bg-gray-50" : "bg-yellow-100"}`}
                >
                    {notification._type === "reply" && (
                        <>
                            <div className="font-semibold text-sm">
                                Reply:{" "}
                                {notification.reply_publication.author.display_name ?? "Anonymous"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                {notification.orig_publication.content}
                            </div>
                            <div className="text-sm text-gray-800 mt-2">
                                {notification.reply_publication.content}
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-gray-600">
                                    {new Date(notification.date_added).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </span>
                                <Button
                                    variant="brand"
                                    className="text-xs px-3 py-1 rounded"
                                    onClick={() => handleNavigateReplyClick(notification)}
                                >
                                    Go to reply
                                </Button>
                            </div>
                        </>
                    )}
                    {notification._type === "follower" && (
                        <>
                            <div className="font-semibold text-sm">
                                New Follower: {notification.sender.display_name ?? "Anonymous"}
                            </div>
                            <div className="text-sm text-gray-800 mt-2">
                                @{notification.sender.display_name} started following you
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-gray-600">
                                    {new Date(notification.date_added).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </span>
                                <Button
                                    variant="brand"
                                    className="text-xs px-3 py-1 rounded"
                                    onClick={() => handleNavigateFollowerClick(notification)}
                                >
                                    View Profile
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
});
