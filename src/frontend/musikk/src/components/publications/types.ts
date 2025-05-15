import { IBaseModel } from "@/components/common/types.ts";
import { IUser } from "@/components/user/types.ts";
import { UUID } from "@/config/types.ts";

export type PublicationType = "comment" | "post";

export interface IPublication extends IBaseModel {
    content: string;
    display_name: string | null;
    user: IUser;
    parent: UUID | null;
    is_deleted: boolean;
    obj_type: PublicationObjectType | null;
    obj_uuid: UUID | null;
    type: PublicationType;
    root_user_uuid: UUID | null;
}

export type PublicationObjectType = "collection" | "song" | "user";

export interface IAttachment {
    objType: PublicationObjectType;
    objUUID: UUID;
    repr: string;
    image?: string;
}
