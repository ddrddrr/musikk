import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export type AttachmentType = "collection" | "song";
export type Attachment = Collection | CollectionSong | BaseUser;
export type PublicationForType = "collection" | "feed";
export interface PublicationForObject {
    type: PublicationForType;
    uuid: UUID;
}

export interface Publication extends BaseModel {
    author: BaseUser;
    root_author_uuid: UUID;
    content: string;
    is_deleted: boolean;
    created_for: PublicationForObject;
    attachment_type: AttachmentType | null;
    attachment: Attachment | null;
    children: Publication[];
    parent_uuid: UUID;
    parent_author: BaseUser;
    parent_repr: string;
}
