import { BaseModel } from "@/features/common/types.ts";
import { BaseUser } from "@/features/user/types.ts";

export interface Song extends BaseModel {
    kind?: "song";
    title: string;
    authors: BaseUser[];
    mpd: string;
    m3u8: string;
    image?: string;
    is_liked?: boolean;
    loudness_lufs?: number | null;
    true_peak_dbtp?: number | null;
    duration_ms?: number | null;
}
