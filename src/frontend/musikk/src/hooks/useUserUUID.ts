import { IJWTPayload } from "@/components/signup-login/types.ts";
import { UUID } from "@/config/types.ts";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

export function useUserUUID() {
    const [userUUID, setUserUUID] = useState<UUID | undefined>(() => {
        const token = Cookies.get("refresh");
        return token ? jwtDecode<IJWTPayload>(token).uuid : undefined;
    });

    useEffect(() => {
        function handleTokenChange() {
            const token = Cookies.get("refresh");
            if (token) {
                setUserUUID(jwtDecode<IJWTPayload>(token).uuid);
            }
        }

        window.addEventListener("token-updated", handleTokenChange);
        return () => window.removeEventListener("token-updated", handleTokenChange);
    }, []);
    return userUUID;
}
