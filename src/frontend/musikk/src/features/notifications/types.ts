import { BaseModel } from "@/features/common/types.ts";
import { Publication } from "@/features/publications/types.ts";
import { BaseUser } from "@/features/user/types.ts";

interface INotification extends BaseModel {
    is_read: boolean;
}

export interface IReplyNotification extends INotification {
    orig_publication: Publication;
    reply_publication: Publication;
}

export interface IFollowerNotification extends INotification {
    sender: BaseUser;
    receiver: BaseUser;
}
