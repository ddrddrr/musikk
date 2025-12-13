import { BaseModel } from "@/modules/common/types.ts";
import { IPublication } from "@/modules/publications/types.ts";

interface INotification extends BaseModel {
    is_read: boolean;
}

export interface IReplyNotification extends INotification {
    orig_publication: IPublication;
    reply_publication: IPublication;
}
