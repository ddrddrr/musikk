import { api } from "@/config/axiosConf.ts";
import { UserURLs } from "@/config/endpoints.ts";

interface UserCreateParams {
    password: string;
    email: string;
    userRole: string;
}

export async function userCreate({ password, email, userRole }: UserCreateParams) {
    const data = {
        password,
        email,
        userRole,
    };
    await api.post(UserURLs.userCreate, data);
}
