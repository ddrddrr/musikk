import { ProfileDropdown } from "@/features/layout/header/ProfileDropdown.tsx";
import { NotificationBox } from "@/features/notifications/NotificationBox";
import { SearchBar } from "@/features/search/SearchBar.tsx";
import { Button } from "@/features/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Cog, Disc3, MessageSquareText, Upload } from "lucide-react";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

export const Header = memo(function Header() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // using grid here is easier than flexbox due to buttons aligment and spacing issues
    return (
        <header className="grid grid-cols-5 items-center bg-red-600 p-4 text-white">
            <div className="col-span-1 flex justify-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    onClick={() => navigate("/")}
                >
                    <Disc3 />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    onClick={() => navigate("/feed")}
                >
                    <MessageSquareText />
                </Button>
            </div>

            <div className="col-span-3 flex items-center justify-start gap-4">
                <h1 className="text-xl font-bold">Musikk</h1>
                <SearchBar />
            </div>

            <div className="col-span-1 flex items-center justify-end gap-4">
                <ProfileDropdown />
                <NotificationBox />
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    onClick={() => navigate("/settings")}
                >
                    <Cog />
                </Button>

                {user?.is_artist && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white bg-transparent text-white hover:bg-red-700"
                        onClick={() => navigate("/upload")}
                    >
                        <Upload className="mr-1 h-4 w-4" />
                        Upload
                    </Button>
                )}
            </div>
        </header>
    );
});
