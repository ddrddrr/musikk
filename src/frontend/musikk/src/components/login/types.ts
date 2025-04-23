import { URL, UUID } from "@/config/types.ts";

export interface IUser {
    uuid: UUID;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar: URL;
}

export interface IJWTPayload {
    uuid: UUID;
    email: string;
    displayName: string;
}
