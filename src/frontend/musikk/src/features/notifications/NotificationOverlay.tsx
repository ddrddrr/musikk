import { EmptyState } from "@/features/common/EmptyState.tsx";
import { NotificationListParams } from "@/features/notifications/queries.ts";
import {
    IChatMessageNotification,
    IFollowerNotification,
    IReplyNotification,
} from "@/features/notifications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { cn } from "@/lib/utils.ts";
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
    const { user } = useAuth();

    function handleNavigateReplyClick(notification: IReplyNotification) {
        if (notification.reply_publication.created_for.type === "feed") {
            void navigate(`/users/${notification.reply_publication.root_author_uuid}`);
        } else {
            void navigate(
                `/collection/${notification.reply_publication.created_for.uuid}/comments`,
            );
        }
    }

    function handleNavigateFollowerClick(notification: IFollowerNotification) {
        void navigate(`/users/${notification.sender.uuid}`);
    }

    function handleNavigateChatClick(notification: IChatMessageNotification) {
        if (!user) return;
        void navigate(`/users/${user.uuid}/chats/${notification.chat_uuid}`);
    }

    const { replies = [], followers = [], chat_messages = [] } = notifications;
    const allNotifications = [
        ...replies.map((n) => ({ ...n, _type: "reply" as const })),
        ...followers.map((n) => ({ ...n, _type: "follower" as const })),
        ...chat_messages.map((n) => ({ ...n, _type: "chat_message" as const })),
    ].sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    if (allNotifications.length === 0) {
        return <EmptyState variant="inline" message="No notifications yet" className="p-6" />;
    }

    return (
        <div className="max-h-96 overflow-y-auto p-4 transition-opacity duration-200 ease-in-out">
            {allNotifications.map((notification) => (
                <div
                    key={notification.uuid}
                    className={cn(
                        "mb-2 rounded-sm border border-foreground p-3",
                        notification.is_read ? "bg-muted" : "bg-highlight",
                    )}
                >
                    {notification._type === "reply" && (
                        <>
                            <div className="text-sm font-semibold">
                                Reply:{" "}
                                {notification.reply_publication.author.display_name ?? "Anonymous"}
                            </div>
                            <div className="mt-1 text-xs break-words text-muted-foreground">
                                {notification.orig_publication.content}
                            </div>
                            <div className="mt-2 text-sm break-words text-foreground">
                                {notification.reply_publication.content}
                            </div>
                            <div className="mt-2 flex justify-between">
                                <span className="text-xs text-muted-foreground">
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
                            <div className="mt-2 text-sm text-foreground">
                                @{notification.sender.display_name} started following you
                            </div>
                            <div className="mt-2 flex justify-between">
                                <span className="text-xs text-muted-foreground">
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
                    {notification._type === "chat_message" && (
                        <>
                            <div className="text-sm font-semibold">
                                New message:{" "}
                                {notification.message.author.display_name ?? "Anonymous"}
                            </div>
                            <div className="mt-1 text-sm break-words text-foreground">
                                {notification.message.content}
                            </div>
                            <div className="mt-2 flex justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {formatDateTime(notification.date_added)}
                                </span>
                                <Button
                                    variant="brand"
                                    className="rounded-sm px-3 py-1 text-xs"
                                    onClick={() => handleNavigateChatClick(notification)}
                                >
                                    Open chat
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
});
