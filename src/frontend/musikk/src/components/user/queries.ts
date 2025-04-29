import { IUser } from "@/components/user/types.ts";
import { api } from "@/config/axiosConf.ts";
import { UserURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";

export async function fetchUser(userUUID: UUID): Promise<IUser> {
    const res = await api.get(UserURLs.userDetail(userUUID));
    return res.data;
}
//
// export async function fetchUserDetail(userUUID: UUID): Promise<IUser> {
//     const res = await api.get(UserURLs.userDetail(userUUID));
// }