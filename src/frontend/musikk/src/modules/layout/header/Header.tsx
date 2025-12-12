import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/modules/layout/header/ProfileDropdown.tsx";
import { NotificationBox } from "@/modules/notifications/NotificationBox";
import { SearchBar } from "@/modules/search/SearchBar.tsx";
import { Button } from "@/modules/ui/button";
import { Cog, Disc3, MessageSquareText, Upload } from "lucide-react";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

export const Header = memo(function Header() {
    const navigate = useNavigate();
    const { user } = useAuth();
    return (
        <div className="flex justify-between items-center p-4 bg-red-600 text-white">
            <div className="flex-none">
                <Button variant="ghost" className="text-white" onClick={() => navigate("/")}>
                    <Disc3 />
                </Button>
                <Button variant="ghost" className="text-white" onClick={() => navigate("/feed")}>
                    <MessageSquareText />
                </Button>
            </div>

            <div className="flex-1 flex justify-center items-center">
                <div className="flex items-center space-x-2">
                    {/*TODO: add onItemSelect*/}
                    <SearchBar />
                    <h1 className="text-xl font-bold">Musikk</h1>
                </div>
            </div>

            <div className="flex-1 flex justify-end items-center gap-4">
                <ProfileDropdown />
                <NotificationBox />
                <Button
                    variant="ghost"
                    className="text-white"
                    onClick={() => navigate("/settings")}
                >
                    <Cog />
                </Button>
                {user?.is_artist && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white text-white bg-transparent hover:bg-red-700"
                        onClick={() => navigate("/upload")}
                    >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload
                    </Button>
                )}
            </div>
        </div>
    );
});
