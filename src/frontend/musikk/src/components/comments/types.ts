import { UUID } from "@/config/types.ts";

export interface IComment {
    uuid: UUID;
    content: string;
    username: string | null;
    date_added: Date;
    parent: UUID | null;
    is_deleted: boolean;
    obj_type: CommentObjectType | null;
    obj_uuid: UUID | null;
}

export type CommentObjectType = "collection" | "song";
