import { EmptyState } from "@/features/common/EmptyState.tsx";
import { NotificationCard } from "@/features/notifications/NotificationCard.tsx";
import {
    ChatMessageNotification,
    FollowerNotification,
    NotificationList,
    ReplyNotification,
} from "@/features/notifications/types.ts";

interface NotificationOverlayProps {
    notifications: NotificationList;
}

type TaggedNotification =
    | (ReplyNotification & { _type: "reply" })
    | (FollowerNotification & { _type: "follower" })
    | (ChatMessageNotification & { _type: "chat_message" });

function replyTarget(notification: ReplyNotification): string {
    const { created_for, root_author_uuid } = notification.reply_publication;
    if (created_for.type === "feed") {
        return `/users/${root_author_uuid}`;
    }
    return `/collection/${created_for.uuid}/comments`;
}

// TODO: rewrite as different sections? replies, friend stuff, new music etc?
export function NotificationOverlay({ notifications }: NotificationOverlayProps) {
    const { replies = [], followers = [], chat_messages = [] } = notifications;
    const allNotifications: TaggedNotification[] = [
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
                <NotificationItem key={notification.uuid} notification={notification} />
            ))}
        </div>
    );
}

function NotificationItem({ notification }: { notification: TaggedNotification }) {
    const common = { isRead: notification.is_read, dateAdded: notification.date_added };

    switch (notification._type) {
        case "reply":
            return (
                <NotificationCard
                    {...common}
                    title={`Reply: ${notification.reply_publication.author.display_name ?? "Anonymous"}`}
                    actionLabel="Open"
                    actionTo={replyTarget(notification)}
                >
                    <div className="mt-1 text-xs break-words text-muted-foreground">
                        {notification.orig_publication.content}
                    </div>
                    <div className="mt-2 text-sm break-words text-foreground">
                        {notification.reply_publication.content}
                    </div>
                </NotificationCard>
            );
        case "follower":
            return (
                <NotificationCard
                    {...common}
                    title={`New Follower: ${notification.sender.display_name ?? "Anonymous"}`}
                    actionLabel="View Profile"
                    actionTo={`/users/${notification.sender.uuid}`}
                >
                    <div className="mt-2 text-sm text-foreground">
                        @{notification.sender.display_name} started following you
                    </div>
                </NotificationCard>
            );
        case "chat_message":
            return (
                <NotificationCard
                    {...common}
                    title={`New message: ${notification.message.author.display_name ?? "Anonymous"}`}
                    actionLabel="Open chat"
                    actionTo={`/chats/${notification.chat_uuid}`}
                >
                    <div className="mt-1 text-sm break-words text-foreground">
                        {notification.message.content}
                    </div>
                </NotificationCard>
            );
    }
}
