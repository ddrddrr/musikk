import Cookies from "js-cookie";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {
    const navigate = useNavigate();

    const logout = useCallback(
        function logout() {
            if (Cookies.get("access")) {
                Cookies.remove("access");
            }
            if (Cookies.get("refresh")) {
                Cookies.remove("refresh");
            }
            navigate("/login");
        },
        [navigate],
    );

    return (
        <>
            <button onClick={logout}>logout</button>
        </>
    );
}
