import { IPublication } from "@/components/publications/types.ts";
import { UUID } from "@/config/types.ts";

interface INotification {
    is_read: boolean;
    date_added: Date;
    date_modified: Date;
}

export interface IReplyNotification extends INotification {
    uuid: UUID;
    orig_comment: IPublication;
    reply_comment: IPublication;
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
