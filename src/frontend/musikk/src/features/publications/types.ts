import { UUID } from "@/api/types.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { BaseUser } from "@/features/user/types.ts";

type PublicationForType = "collection" | "feed" | "chat";
export type FeedConnection = "friends" | "followed" | "mine";

interface PublicationForObject {
    type: PublicationForType;
    uuid: UUID;
}

export type Attachment =
    | { type: "collection"; obj: Collection }
    | { type: "song"; obj: CollectionSong }
    | { type: "user"; obj: BaseUser };
type AttachmentType = Attachment["type"];
export type AttachmentObj = Attachment["obj"];

export interface AttachmentRef {
    type: AttachmentType;
    uuid: UUID;
}

export interface Publication extends BaseModel {
    author: BaseUser;
    root_author_uuid: UUID;
    content: string;
    is_deleted: boolean;
    created_for: PublicationForObject;
    attachment: Attachment | null;
    parent_uuid: UUID | null;
    parent_author: BaseUser | null;
    parent_repr: string | null;
    has_children: boolean;
}

export interface Chat extends BaseModel {
    title: string;
    image: string | null;
    is_direct: boolean;
    last_message: Publication | null;
    is_read: boolean;
    members: BaseUser[];
}
