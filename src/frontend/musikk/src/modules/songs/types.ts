import { IBaseModel } from "@/modules/common/types.ts";
import { IUserBaseProfile } from "@/modules/user/types.ts";

export interface ISong extends IBaseModel {
    title: string;
    authors: IUserBaseProfile[];
    mpd: string;
    m3u8: string;
    image?: string;
    is_liked?: boolean;
}
