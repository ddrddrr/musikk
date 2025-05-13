import { IJWTPayload } from "@/components/signup-login/types.ts";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export function useUserUUID() {
    const token = Cookies.get("access");
    return token ? jwtDecode<IJWTPayload>(token).uuid : undefined;
}
