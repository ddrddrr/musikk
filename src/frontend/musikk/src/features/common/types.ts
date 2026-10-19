import { UUID } from "@/api/types.ts";

export type ActionButtonSize = "sm" | "md";

export interface BaseModel {
    uuid: UUID;
    date_added: string;
    date_modified: string;
    repr: string;
}
