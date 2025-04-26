import { UUID } from "@/config/types.ts";

export interface IJWTPayload {
    uuid: UUID;
    email: string;
    displayName: string;
}
