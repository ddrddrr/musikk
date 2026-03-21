import { NotificationListParams } from "@/features/notifications/queries.ts";
import { IFollowerNotification, IReplyNotification } from "@/features/notifications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { formatDateTime } from "@/utils/formatDate.ts";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

interface NotificationOverlayProps {
    notifications: NotificationListParams;
}
// TODO: rewrite as different sections? replies, friend stuff, new music etc?
export const NotificationOverlay = memo(function NotificationOverlay({
    notifications,
}: NotificationOverlayProps) {
    const navigate = useNavigate();
    // TODO: fix, can be reply for comments/posts (but not chats)
    function handleNavigateReplyClick(notification: IReplyNotification) {
        // if (notification.reply_publication.created_for.type == "feed") {
        //     navigate(`/users/${notification.reply_publication.root_author_uuid}`);
        // } else {
        //     navigate(`/collection/${notification.reply_publication.created_for.uuid}/comments`);
        // }
    }

    function handleNavigateFollowerClick(notification: IFollowerNotification) {
        void navigate(`/users/${notification.sender.uuid}`);
    }

    const { replies = [], followers = [] } = notifications;
    const allNotifications = [
        ...replies.map((n) => ({ ...n, _type: "reply" as const })),
        ...followers.map((n) => ({ ...n, _type: "follower" as const })),
    ].sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    return (
        <div className="max-h-96 overflow-y-auto p-4 transition-opacity duration-200 ease-in-out">
            {allNotifications.map((notification) => (
                <div
                    key={notification.uuid}
                    className={`mb-2 rounded-sm border border-black p-3 ${notification.is_read ? "bg-gray-50" : "bg-yellow-100"}`}
                >
                    {notification._type === "reply" && (
                        <>
                            <div className="text-sm font-semibold">
                                Reply:{" "}
                                {notification.reply_publication.author.display_name ?? "Anonymous"}
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                                {notification.orig_publication.content}
                            </div>
                            <div className="mt-2 text-sm text-gray-800">
                                {notification.reply_publication.content}
                            </div>
                            <div className="mt-2 flex justify-between">
                                <span className="text-xs text-gray-600">
                                    {formatDateTime(notification.date_added)}
                                </span>
                                <Button
                                    variant="brand"
                                    className="rounded-sm px-3 py-1 text-xs"
                                    onClick={() => handleNavigateReplyClick(notification)}
                                >
                                    Go to reply
                                </Button>
                            </div>
                        </>
                    )}
                    {notification._type === "follower" && (
                        <>
                            <div className="text-sm font-semibold">
                                New Follower: {notification.sender.display_name ?? "Anonymous"}
                            </div>
                            <div className="mt-2 text-sm text-gray-800">
                                @{notification.sender.display_name} started following you
                            </div>
                            <div className="mt-2 flex justify-between">
                                <span className="text-xs text-gray-600">
                                    {formatDateTime(notification.date_added)}
                                </span>
                                <Button
                                    variant="brand"
                                    className="px-3 py-1 text-xs"
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
