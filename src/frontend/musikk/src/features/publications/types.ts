import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { IUser } from "@/features/user/types.ts";

export type AttachmentType = "collection" | "song";
export type Attachment = Collection | CollectionSong;

export interface IPublication extends BaseModel {
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
