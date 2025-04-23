import { IComment } from "@/components/comments/types.ts";
import { UUID } from "@/config/types.ts";

export interface IReplyNotification {
    uuid: UUID;
    date_added: Date;
    date_modified: Date;
    orig_comment: IComment;
    reply_comment: IComment;
    is_read: boolean;
}
