import { BaseModel } from "@/features/common/types.ts";
import { Publication } from "@/features/publications/types.ts";
import { BaseUser } from "@/features/user/types.ts";

interface BaseNotification extends BaseModel {
    is_read: boolean;
}

export interface ReplyNotification extends BaseNotification {
    orig_publication: Publication;
    reply_publication: Publication;
}

export interface FollowerNotification extends BaseNotification {
    sender: BaseUser;
    receiver: BaseUser;
}

export interface ChatMessageNotification extends BaseNotification {
    message: Publication;
    chat_uuid: string;
    chat_title: string;
    receiver: BaseUser;
}
