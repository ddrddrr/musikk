import { EmptyState } from "@/features/common/EmptyState.tsx";
import { NotificationListParams } from "@/features/notifications/api/queries.ts";
import { IReplyNotification } from "@/features/notifications/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { PopoverClose } from "@/features/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import { formatDateTime } from "@/utils/formatDate.ts";
import { memo } from "react";
import { Link } from "react-router-dom";

interface NotificationOverlayProps {
    notifications: NotificationListParams;
}

function replyTarget(notification: IReplyNotification): string {
    const { created_for, root_author_uuid } = notification.reply_publication;
    if (created_for.type === "feed") {
        return `/users/${root_author_uuid}`;
    }
    return `/collection/${created_for.uuid}/comments`;
}

// TODO: rewrite as different sections? replies, friend stuff, new music etc?
export const NotificationOverlay = memo(function NotificationOverlay({
    notifications,
}: NotificationOverlayProps) {
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
                                {/*asChild makes PopoverClose "become" the button (merges with it) */}
                                <PopoverClose asChild>
                                    <Button
                                        variant="brand"
                                        className="rounded-sm px-3 py-1 text-xs"
                                        asChild
                                    >
                                        <Link to={replyTarget(notification)}>Open</Link>
                                    </Button>
                                </PopoverClose>
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
                                <PopoverClose asChild>
                                    <Button variant="brand" className="px-3 py-1 text-xs" asChild>
                                        <Link to={`/users/${notification.sender.uuid}`}>
                                            View Profile
                                        </Link>
                                    </Button>
                                </PopoverClose>
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
                                <PopoverClose asChild>
                                    <Button
                                        variant="brand"
                                        className="rounded-sm px-3 py-1 text-xs"
                                        asChild
                                    >
                                        <Link to={`/chats/${notification.chat_uuid}`}>
                                            Open chat
                                        </Link>
                                    </Button>
                                </PopoverClose>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
});
