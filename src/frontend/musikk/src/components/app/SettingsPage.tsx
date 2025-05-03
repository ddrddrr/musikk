import { ProfileForm } from "@/components/user/ProfileForm.tsx";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {
    const navigate = useNavigate();

    function logout() {
        if (Cookies.get("access")) {
            Cookies.remove("access");
        }
        if (Cookies.get("refresh")) {
            Cookies.remove("refresh");
        }
        localStorage.removeItem("user");
        navigate("/login");
    }

    return (
        <>
            <button onClick={logout}>logout</button>
            <ProfileForm />
        </>
    );
}
