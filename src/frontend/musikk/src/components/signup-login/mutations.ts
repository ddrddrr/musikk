import { api } from "@/api/axiosConf.ts";
import { UserURLs } from "@/api/endpoints.ts";

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
