import { BaseModel } from "@/modules/common/types.ts";
import { IUser } from "@/modules/user/types.ts";

export interface ISong extends BaseModel {
    title: string;
    authors: IUser[];
    mpd: string;
    m3u8: string;
    image?: string;
    is_liked?: boolean;
}
