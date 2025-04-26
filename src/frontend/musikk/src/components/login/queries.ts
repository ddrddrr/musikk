import { api } from "@/config/axiosConf.ts";
import { UserUrls } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { IUser } from "@/components/user/types.ts";

export async function fetchUser(userUUID: UUID): Promise<IUser> {
    const res = await api.get(UserUrls.userDetail(userUUID));
    return res.data;
}
