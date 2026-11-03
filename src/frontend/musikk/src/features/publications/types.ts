import { ApiSchemas, UUID } from "@/api/types.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export type FeedConnection = "friends" | "followed" | "mine";

export type Attachment = ApiSchemas["Attachment"];
type AttachmentType = Attachment["type"];

// the object picked in the attachment picker, tagged with `kind` by the search results
export type AttachmentObj = Collection | CollectionSong | BaseUser;

export interface AttachmentRef {
    type: AttachmentType;
    uuid: UUID;
}

export type Publication = ApiSchemas["PublicationRetrieve"];

export type Chat = ApiSchemas["UserChatRetrieve"];
