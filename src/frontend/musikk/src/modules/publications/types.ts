import { UUID } from "@/api/types.ts";
import { IBaseModel } from "@/modules/common/types.ts";
import { ICollection, ICollectionSong } from "@/modules/song-collections/types.ts";
import { IUser } from "@/modules/user/types.ts";

export type AttachmentType = "collection" | "song";
export type Attachment = ICollection | ICollectionSong;

export interface IPublication extends IBaseModel {
    author: IUser;
    root_author_uuid: UUID;
    content: string;
    parent_uuid: UUID;
    is_deleted: boolean;
    obj_type: string;
    obj_uuid: UUID;
    attachment_type: AttachmentType;
    attachment: Attachment | null;
    children: IPublication[];
}

export type PublicationForType = "collection" | "feed";
