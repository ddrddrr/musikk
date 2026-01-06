import { BaseModel } from "@/features/common/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export interface ISong extends BaseModel {
    title: string;
    authors: BaseUser[];
    mpd: string;
    m3u8: string;
    image?: string;
    is_liked?: boolean;
}
