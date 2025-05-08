import { IBaseModel } from "@/components/common/types.ts";
import { IUser } from "@/components/user/types.ts";

export interface ISong extends IBaseModel {
    title: string;
    authors: IUser[];
    mpd: string;
    image?: string;
    is_liked?: boolean;
}
