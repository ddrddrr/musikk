import { UUID } from "@/config/types.ts";

export interface IComment {
    uuid: UUID;
    content: string;
    username: string | null;
    date_added: Date;
    parent: UUID | null;
    is_deleted: boolean;
}

export type CommentObjectType = "collection" | "song";