import { UUID } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { Collection, CollectionSong } from "@/features/song-collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export type AttachmentType = "collection" | "song" | "user";
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
    parent_uuid: UUID | null;
    parent_author: BaseUser | null;
    parent_repr: string | null;
    has_children: boolean;
}

export interface PublicationWChildren extends Publication {
    children: Publication[];
}
