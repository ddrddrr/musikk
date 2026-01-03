import { BaseModel } from "@/features/common/types.ts";
import { IPublication } from "@/features/publications/types.ts";
import { IUser } from "@/features/user/types.ts";

interface INotification extends BaseModel {
    is_read: boolean;
}

export interface IReplyNotification extends INotification {
    orig_publication: IPublication;
    reply_publication: IPublication;
}

export interface IFollowerNotification extends INotification {
    sender: IUser;
    receiver: IUser;
}
