import { IComment } from "@/components/comments/types.ts";
import { UUID } from "@/config/types.ts";

interface INotification {
    is_read: boolean;
    date_added: Date;
    date_modified: Date;
}

export interface IReplyNotification extends INotification {
    uuid: UUID;
    orig_comment: IComment;
    reply_comment: IComment;
}

export interface IFriendRequestNotification extends INotification {
    uuid: UUID;
    sender: {
        uuid: UUID;
        display_name: string;
    };
    receiver: {
        uuid: UUID;
        display_name: string;
    };
}
