import { IUser } from "@/components/user/types.ts";

export interface ISong {
    uuid: string;
    title: string;
    authors: IUser[];
    mpd: string;
    image?: string;
    is_liked?: boolean;
}
