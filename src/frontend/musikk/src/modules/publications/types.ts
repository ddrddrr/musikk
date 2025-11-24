import { UUID } from "@/api/types.ts";
import { IBaseModel } from "@/modules/common/types.ts";
import { IUserBaseProfile } from "@/modules/user/types.ts";

export type PublicationType = "comment" | "post";

export interface IPublication extends IBaseModel {
    content: string;
    display_name: string | null;
    user: IUserBaseProfile;
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
