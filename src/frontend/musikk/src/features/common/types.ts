import { UUID } from "@/api/types.ts";

export interface BaseModel {
    uuid: UUID;
    date_added: string;
    date_modified: string;
}
