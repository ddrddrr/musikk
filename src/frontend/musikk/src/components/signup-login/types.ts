import { UUID } from "@/api/types.ts";

export interface IJWTPayload {
    uuid: UUID;
    email: string;
    displayName: string;
}
