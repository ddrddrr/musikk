import { NotificationListParams } from "@/modules/notifications/queries.ts";
import { IReplyNotification } from "@/modules/notifications/types.ts";
import { Button } from "@/modules/ui/button.tsx";
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
        if (notification.reply_comment.type == "post") {
            navigate(`/users/${notification.reply_comment.root_user_uuid}`);
        } else {
            navigate(`/collection/${notification.reply_comment.obj_uuid}/comments`);
        }
    }

    const { replies = [] } = notifications;
    const allNotifications = replies
        .map((n) => ({ ...n, _type: "reply" as const }))
        .sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    return (
        <div className="p-4 transition-opacity duration-200 ease-in-out max-h-96 overflow-y-auto">
            {allNotifications.map((notification) => (
                <div
                    key={notification.uuid}
                    className={`border border-black rounded-lg p-3 mb-2 ${notification.is_read ? "bg-gray-50" : "bg-yellow-100"}`}
                >
                    <div className="font-semibold text-sm">
                        Reply: {notification.reply_comment.display_name ?? "Anonymous"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        {notification.orig_comment.content}
                    </div>
                    <div className="text-sm text-gray-800 mt-2">
                        {notification.reply_comment.content}
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
                </div>
            ))}
        </div>
    );
});
