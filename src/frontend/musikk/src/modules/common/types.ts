import { UUID } from "@/api/types.ts";

export interface IBaseModel {
    uuid: UUID;
    date_added: string;
    date_modified: string;
}
